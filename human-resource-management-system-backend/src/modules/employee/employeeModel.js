const pool = require("../../config/db");

const EMPLOYEE_SELECT_WITH_AGE =
  "employees.*, schools.school_name, COALESCE(employees.age, TIMESTAMPDIFF(YEAR, employees.birthdate, CURDATE())) AS age";

const normalizeEmployeeTypeForStorage = (employeeType) => {
  if (typeof employeeType !== "string") return employeeType;
  const normalized = employeeType
    .trim()
    .toLowerCase()
    .replace(/[_\s]+/g, "-");
  if (
    normalized === "teaching" ||
    normalized === "non-teaching" ||
    normalized === "teaching-related"
  ) {
    return normalized;
  }
  return employeeType;
};

const normalizeOptionalText = (value) => {
  if (value === undefined || value === null) return null;
  const normalized = String(value).trim();
  return normalized.length > 0 ? normalized : null;
};

const normalizeOptionalDate = (value) => {
  if (value === undefined || value === null) return null;

  if (value instanceof Date) {
    if (Number.isNaN(value.getTime())) return null;
    return value.toISOString().slice(0, 10);
  }

  const normalized = String(value).trim();
  if (!normalized) return null;

  if (normalized === "0000-00-00") {
    return null;
  }

  if (/^\d{4}-\d{2}-\d{2}$/.test(normalized)) {
    return normalized;
  }

  const parsed = new Date(normalized);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed.toISOString().slice(0, 10);
};

const normalizeOptionalEmail = (value) => {
  if (value === undefined || value === null) return null;
  const normalized = String(value).trim().toLowerCase();
  return normalized.length > 0 ? normalized : null;
};

const EMPLOYEE_UNIQUE_FIELD_DEFINITIONS = [
  { column: "email", key: "personalEmail", label: "personal email" },
  { column: "mobile_number", key: "mobileNumber", label: "mobile number" },
  { column: "employee_no", key: "employeeNo", label: "employee number" },
  { column: "work_email", key: "workEmail", label: "DepEd email" },
  { column: "plantilla_no", key: "plantillaNo", label: "Plantilla Number" },
  { column: "prc_license_no", key: "prcLicenseNo", label: "PRC License No" },
  { column: "tin", key: "tin", label: "TIN" },
  { column: "gsis_bp_no", key: "gsisBpNo", label: "GSIS BP Number" },
  { column: "gsis_crn_no", key: "gsisCrnNo", label: "GSIS CRN Number" },
  { column: "pagibig_no", key: "pagibigNo", label: "PAG-IBIG Number" },
  { column: "philhealth_no", key: "philhealthNo", label: "PhilHealth Number" },
];

const normalizeEmployeeUniqueValues = (data = {}) => ({
  personalEmail:
    normalizeOptionalEmail(data.personal_email) ||
    normalizeOptionalEmail(data.email),
  mobileNumber: normalizeOptionalText(data.mobile_number),
  employeeNo: normalizeOptionalText(data.employee_no),
  workEmail: normalizeOptionalEmail(data.work_email),
  plantillaNo: normalizeOptionalText(data.plantilla_no),
  prcLicenseNo: normalizeOptionalText(data.prc_license_no),
  tin: normalizeOptionalText(data.tin),
  gsisBpNo: normalizeOptionalText(data.gsis_bp_no),
  gsisCrnNo: normalizeOptionalText(data.gsis_crn_no),
  pagibigNo: normalizeOptionalText(data.pagibig_no),
  philhealthNo: normalizeOptionalText(data.philhealth_no),
});

const findEmployeeUniqueConflict = async (uniqueValues, excludeId = null) => {
  for (const field of EMPLOYEE_UNIQUE_FIELD_DEFINITIONS) {
    const value = uniqueValues[field.key];
    if (value === null || value === undefined) {
      continue;
    }

    const params = [value];
    let sql = `SELECT id FROM employees WHERE ${field.column} = ?`;

    if (excludeId !== null && excludeId !== undefined) {
      sql += " AND id <> ?";
      params.push(excludeId);
    }

    sql += " LIMIT 1";

    const [rows] = await pool.promise().query(sql, params);
    if (rows.length > 0) {
      return field;
    }
  }

  return null;
};

const createDuplicateEmployeeError = (label) => {
  const error = new Error(`An employee with this ${label} already exists.`);
  error.statusCode = 409;
  return error;
};

const computeServiceMetrics = (dateOfFirstAppointment) => {
  const normalizedDate = normalizeOptionalDate(dateOfFirstAppointment);
  if (!normalizedDate) {
    return { yearsInService: null, loyaltyBonus: "No" };
  }

  const [y, m, d] = normalizedDate.split("-").map(Number);
  if (!y || !m || !d) {
    return { yearsInService: null, loyaltyBonus: "No" };
  }

  const now = new Date();
  let years = now.getFullYear() - y;
  const hasReachedAnniversary =
    now.getMonth() + 1 > m || (now.getMonth() + 1 === m && now.getDate() >= d);

  if (!hasReachedAnniversary) {
    years -= 1;
  }

  const yearsInService = Math.max(0, years);
  const loyaltyBonus =
    yearsInService > 0 && yearsInService % 5 === 0 ? "Yes" : "No";

  return { yearsInService, loyaltyBonus };
};

const Employee = {
  // Supports optional pagination: if `pagination` omitted, returns full rows for compatibility.
  getAll: async (filters = {}) => {
    const page = Number(filters.page) || null;
    const pageSize = Math.min(Number(filters.pageSize) || 25, 200);
    const includeArchived = Boolean(filters.includeArchived);
    const whereParts = [];
    const params = [];

    const normalizeEmployeeTypeForFilter = (value) => {
      if (typeof value !== "string") return null;
      const normalized = value
        .trim()
        .toLowerCase()
        .replace(/[_\s]+/g, "-");
      return ["teaching", "non-teaching", "teaching-related"].includes(
        normalized,
      )
        ? normalized
        : null;
    };

    const search =
      typeof filters.search === "string" ? filters.search.trim() : "";
    const letter =
      typeof filters.letter === "string"
        ? filters.letter.trim().toUpperCase()
        : "";
    const retirement =
      typeof filters.retirement === "string"
        ? filters.retirement.trim().toLowerCase()
        : "ALL";
    const employeeType = normalizeEmployeeTypeForFilter(filters.employeeType);
    const sortOrder =
      String(filters.sortOrder || "asc").toLowerCase() === "desc"
        ? "DESC"
        : "ASC";

    if (!includeArchived) {
      whereParts.push("employees.is_archived = 0");
    }

    if (filters.onLeave === true) {
      whereParts.push("employees.on_leave = 1");
    } else if (filters.onLeave === false) {
      whereParts.push("employees.on_leave = 0");
    }

    if (filters.schoolId) {
      whereParts.push("employees.school_id = ?");
      params.push(filters.schoolId);
    }

    if (employeeType) {
      whereParts.push(
        "LOWER(REPLACE(REPLACE(employees.employee_type, '_', '-'), ' ', '-')) = ?",
      );
      params.push(employeeType);
    }

    if (search) {
      whereParts.push(
        "(employees.first_name LIKE ? OR employees.middle_name LIKE ? OR employees.last_name LIKE ? OR employees.email LIKE ? OR employees.employee_no LIKE ? OR employees.work_email LIKE ? OR employees.position LIKE ? OR schools.school_name LIKE ?)",
      );
      const like = `%${search}%`;
      params.push(like, like, like, like, like, like, like, like);
    }

    if (letter) {
      whereParts.push("UPPER(LEFT(COALESCE(employees.first_name, ''), 1)) = ?");
      params.push(letter);
    }

    if (retirement === "retirable") {
      whereParts.push(
        "COALESCE(employees.age, TIMESTAMPDIFF(YEAR, employees.birthdate, CURDATE())) >= 60 AND COALESCE(employees.age, TIMESTAMPDIFF(YEAR, employees.birthdate, CURDATE())) < 65",
      );
    } else if (retirement === "mandatory") {
      whereParts.push(
        "COALESCE(employees.age, TIMESTAMPDIFF(YEAR, employees.birthdate, CURDATE())) >= 65",
      );
    }

    const whereClause =
      whereParts.length > 0 ? `WHERE ${whereParts.join(" AND ")}` : "";
    const baseQuery = `FROM employees JOIN schools ON employees.school_id = schools.id ${whereClause}`;
    const orderClause = ` ORDER BY employees.first_name ${sortOrder}, employees.last_name ${sortOrder}, employees.id ASC`;

    if (!page) {
      const [rows] = await pool
        .promise()
        .query(
          `SELECT ${EMPLOYEE_SELECT_WITH_AGE} ${baseQuery}${orderClause}`,
          params,
        );
      return rows;
    }

    const offset = (page - 1) * pageSize;

    const [[{ total }]] = await pool
      .promise()
      .query(`SELECT COUNT(1) as total ${baseQuery}`, params);

    const [rows] = await pool
      .promise()
      .query(
        `SELECT ${EMPLOYEE_SELECT_WITH_AGE} ${baseQuery}${orderClause} LIMIT ? OFFSET ?`,
        [...params, pageSize, offset],
      );

    return { data: rows, total: Number(total), page, pageSize };
  },

  getById: async (id, options = {}) => {
    const includeArchived = Boolean(options.includeArchived);
    const archivedFilter = includeArchived
      ? ""
      : "AND employees.is_archived = 0";
    const [rows] = await pool.promise().query(
      `
            SELECT ${EMPLOYEE_SELECT_WITH_AGE}
            FROM employees
            JOIN schools ON employees.school_id = schools.id
            WHERE employees.id = ?
            ${archivedFilter}
        `,
      [id],
    );
    return rows[0];
  },

  getBySchool: async (school_id, options = {}) => {
    return Employee.getAll({ ...options, schoolId: school_id });
  },

  create: async (data) => {
    const {
      first_name,
      middle_name,
      last_name,
      email,
      personal_email,
      middle_initial,
      mobile_number,
      home_address,
      place_of_birth,
      civil_status,
      civil_status_id,
      sex,
      sex_id,
      employee_type,
      school_id,
      employee_no,
      work_email,
      district,
      work_district,
      position,
      position_id,
      plantilla_no,
      prc_license_no,
      tin,
      gsis_bp_no,
      gsis_crn_no,
      pagibig_no,
      philhealth_no,
      age,
      birthdate,
      date_of_first_appointment,
    } = data;
    const uniqueValues = normalizeEmployeeUniqueValues(data);
    const personalEmail = uniqueValues.personalEmail;
    const middleInitial =
      middle_initial ||
      (middle_name ? String(middle_name).trim().charAt(0) : null);
    const resolvedDistrict = district || work_district || null;
    const normalizedEmployeeType =
      normalizeEmployeeTypeForStorage(employee_type);
    const normalizedMobileNumber = uniqueValues.mobileNumber;
    const normalizedEmployeeNo = uniqueValues.employeeNo;
    const normalizedWorkEmail = uniqueValues.workEmail;
    const normalizedPlantillaNo = uniqueValues.plantillaNo;
    const normalizedPrcLicenseNo = uniqueValues.prcLicenseNo;
    const normalizedTin = uniqueValues.tin;
    const normalizedGsisBpNo = uniqueValues.gsisBpNo;
    const normalizedGsisCrnNo = uniqueValues.gsisCrnNo;
    const normalizedPagibigNo = uniqueValues.pagibigNo;
    const normalizedPhilhealthNo = uniqueValues.philhealthNo;
    const normalizedFirstAppointmentDate = normalizeOptionalDate(
      date_of_first_appointment,
    );
    const { yearsInService, loyaltyBonus } = computeServiceMetrics(
      normalizedFirstAppointmentDate,
    );
    const duplicateField = await findEmployeeUniqueConflict(uniqueValues);
    if (duplicateField) {
      throw createDuplicateEmployeeError(duplicateField.label);
    }
    const [result] = await pool
      .promise()
      .query(
        "INSERT INTO employees (first_name, middle_name, last_name, middle_initial, email, mobile_number, home_address, place_of_birth, civil_status, civil_status_id, sex, sex_id, employee_type, school_id, employee_no, work_email, district, `position`, position_id, plantilla_no, prc_license_no, tin, gsis_bp_no, gsis_crn_no, pagibig_no, philhealth_no, age, birthdate, date_of_first_appointment, years_in_service, loyalty_bonus) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
        [
          first_name,
          middle_name || null,
          last_name,
          middleInitial || null,
          personalEmail,
          normalizedMobileNumber,
          home_address || null,
          place_of_birth || null,
          civil_status || null,
          civil_status_id || null,
          sex || null,
          sex_id || null,
          normalizedEmployeeType,
          school_id,
          normalizedEmployeeNo,
          normalizedWorkEmail,
          resolvedDistrict,
          position || null,
          position_id || null,
          normalizedPlantillaNo,
          normalizedPrcLicenseNo,
          normalizedTin,
          normalizedGsisBpNo,
          normalizedGsisCrnNo,
          normalizedPagibigNo,
          normalizedPhilhealthNo,
          age || null,
          birthdate,
          normalizedFirstAppointmentDate,
          yearsInService,
          loyaltyBonus,
        ],
      );
    return result;
  },

  update: async (id, data) => {
    const {
      first_name,
      middle_name,
      last_name,
      email,
      personal_email,
      middle_initial,
      mobile_number,
      home_address,
      place_of_birth,
      civil_status,
      civil_status_id,
      sex,
      sex_id,
      employee_type,
      school_id,
      employee_no,
      work_email,
      district,
      work_district,
      position,
      position_id,
      plantilla_no,
      prc_license_no,
      tin,
      gsis_bp_no,
      gsis_crn_no,
      pagibig_no,
      philhealth_no,
      age,
      birthdate,
      date_of_first_appointment,
    } = data;
    const uniqueValues = normalizeEmployeeUniqueValues(data);
    const personalEmail = uniqueValues.personalEmail;
    const middleInitial =
      middle_initial ||
      (middle_name ? String(middle_name).trim().charAt(0) : null);
    const resolvedDistrict = district || work_district || null;
    const normalizedEmployeeType =
      normalizeEmployeeTypeForStorage(employee_type);
    const normalizedMobileNumber = uniqueValues.mobileNumber;
    const normalizedEmployeeNo = uniqueValues.employeeNo;
    const normalizedWorkEmail = uniqueValues.workEmail;
    const normalizedPlantillaNo = uniqueValues.plantillaNo;
    const normalizedPrcLicenseNo = uniqueValues.prcLicenseNo;
    const normalizedTin = uniqueValues.tin;
    const normalizedGsisBpNo = uniqueValues.gsisBpNo;
    const normalizedGsisCrnNo = uniqueValues.gsisCrnNo;
    const normalizedPagibigNo = uniqueValues.pagibigNo;
    const normalizedPhilhealthNo = uniqueValues.philhealthNo;
    const normalizedFirstAppointmentDate = normalizeOptionalDate(
      date_of_first_appointment,
    );
    const { yearsInService, loyaltyBonus } = computeServiceMetrics(
      normalizedFirstAppointmentDate,
    );
    const duplicateField = await findEmployeeUniqueConflict(uniqueValues, id);
    if (duplicateField) {
      throw createDuplicateEmployeeError(duplicateField.label);
    }
    const [result] = await pool
      .promise()
      .query(
        "UPDATE employees SET first_name = ?, middle_name = ?, last_name = ?, middle_initial = ?, email = ?, mobile_number = ?, home_address = ?, place_of_birth = ?, civil_status = ?, civil_status_id = ?, sex = ?, sex_id = ?, employee_type = ?, school_id = ?, employee_no = ?, work_email = ?, district = ?, `position` = ?, position_id = ?, plantilla_no = ?, prc_license_no = ?, tin = ?, gsis_bp_no = ?, gsis_crn_no = ?, pagibig_no = ?, philhealth_no = ?, age = ?, birthdate = ?, date_of_first_appointment = ?, years_in_service = ?, loyalty_bonus = ? WHERE id = ? AND is_archived = 0",
        [
          first_name,
          middle_name || null,
          last_name,
          middleInitial || null,
          personalEmail,
          normalizedMobileNumber,
          home_address || null,
          place_of_birth || null,
          civil_status || null,
          civil_status_id || null,
          sex || null,
          sex_id || null,
          normalizedEmployeeType,
          school_id,
          normalizedEmployeeNo,
          normalizedWorkEmail,
          resolvedDistrict,
          position || null,
          position_id || null,
          normalizedPlantillaNo,
          normalizedPrcLicenseNo,
          normalizedTin,
          normalizedGsisBpNo,
          normalizedGsisCrnNo,
          normalizedPagibigNo,
          normalizedPhilhealthNo,
          age || null,
          birthdate || null,
          normalizedFirstAppointmentDate,
          yearsInService,
          loyaltyBonus,
          id,
        ],
      );
    return result;
  },

  archive: async (id, archivedBy, archiveReason) => {
    const [result] = await pool.promise().query(
      `UPDATE employees
       SET is_archived = 1, archived_at = NOW(), archived_by = ?, archived_reason = ?
       WHERE id = ? AND is_archived = 0`,
      [archivedBy || null, archiveReason || null, id],
    );
    return result;
  },

  unarchive: async (id) => {
    const [result] = await pool.promise().query(
      `UPDATE employees
       SET is_archived = 0, archived_at = NULL, archived_by = NULL, archived_reason = NULL
       WHERE id = ? AND is_archived = 1`,
      [id],
    );
    return result;
  },

  markOnLeave: async (id, data = {}) => {
    const { on_leave_from, on_leave_until, reason } = data;
    const [result] = await pool.promise().query(
      `UPDATE employees
       SET on_leave = 1,
           on_leave_from = ?,
           on_leave_until = ?,
           on_leave_reason = ?,
           leave_status_updated_at = NOW()
       WHERE id = ? AND is_archived = 0`,
      [on_leave_from || null, on_leave_until || null, reason || null, id],
    );
    return result;
  },

  markAvailable: async (id) => {
    const [result] = await pool.promise().query(
      `UPDATE employees
       SET on_leave = 0,
           on_leave_from = NULL,
           on_leave_until = NULL,
           on_leave_reason = NULL,
           leave_status_updated_at = NOW()
       WHERE id = ? AND is_archived = 0`,
      [id],
    );
    return result;
  },

  getStatusCounts: async (filters = {}) => {
    const params = [];
    let whereClause = "";

    if (filters.schoolId) {
      whereClause = "WHERE school_id = ?";
      params.push(filters.schoolId);
    }

    const [rows] = await pool.promise().query(
      `SELECT
         COUNT(1) AS total_all,
         SUM(CASE WHEN is_archived = 1 THEN 1 ELSE 0 END) AS archived,
         SUM(CASE WHEN is_archived = 0 THEN 1 ELSE 0 END) AS active_total,
         SUM(CASE WHEN is_archived = 0 AND on_leave = 1 THEN 1 ELSE 0 END) AS on_leave,
         SUM(CASE WHEN is_archived = 0 AND on_leave = 0 THEN 1 ELSE 0 END) AS available
       FROM employees
       ${whereClause}`,
      params,
    );

    return (
      rows[0] || {
        total_all: 0,
        archived: 0,
        active_total: 0,
        on_leave: 0,
        available: 0,
      }
    );
  },

  delete: async (id) => {
    const [result] = await pool
      .promise()
      .query("DELETE FROM employees WHERE id = ?", [id]);
    return result;
  },
};

module.exports = Employee;
