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
  const normalized = String(value).trim();
  return normalized.length > 0 ? normalized : null;
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
    now.getMonth() + 1 > m ||
    (now.getMonth() + 1 === m && now.getDate() >= d);

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
    }

    const params = [];
    if (filters.schoolId) {
      params.push(filters.schoolId);
    }

    const whereClause =
      whereParts.length > 0 ? `WHERE ${whereParts.join(" AND ")}` : "";
    const baseQuery = `FROM employees JOIN schools ON employees.school_id = schools.id ${whereClause}`;

    if (!page) {
      const [rows] = await pool
        .promise()
        .query(
          `SELECT ${EMPLOYEE_SELECT_WITH_AGE} ${baseQuery} ORDER BY employees.id ASC`,
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
        `SELECT ${EMPLOYEE_SELECT_WITH_AGE} ${baseQuery} ORDER BY employees.id ASC LIMIT ? OFFSET ?`,
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
    const includeArchived = Boolean(options.includeArchived);
    const whereParts = ["employees.school_id = ?"];

    if (!includeArchived) {
      whereParts.push("employees.is_archived = 0");
    }

    if (options.onLeave === true) {
      whereParts.push("employees.on_leave = 1");
    } else if (options.onLeave === false) {
      whereParts.push("employees.on_leave = 0");
    }

    const whereClause = whereParts.join(" AND ");
    const [rows] = await pool.promise().query(
      `SELECT ${EMPLOYEE_SELECT_WITH_AGE}
       FROM employees
       JOIN schools ON employees.school_id = schools.id
       WHERE ${whereClause}`,
      [school_id],
    );
    return rows;
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
    const personalEmail = personal_email || email || null;
    const middleInitial =
      middle_initial ||
      (middle_name ? String(middle_name).trim().charAt(0) : null);
    const resolvedDistrict = district || work_district || null;
    const normalizedEmployeeType =
      normalizeEmployeeTypeForStorage(employee_type);
    const normalizedTin = normalizeOptionalText(tin);
    const normalizedGsisBpNo = normalizeOptionalText(gsis_bp_no);
    const normalizedGsisCrnNo = normalizeOptionalText(gsis_crn_no);
    const normalizedPagibigNo = normalizeOptionalText(pagibig_no);
    const normalizedPhilhealthNo = normalizeOptionalText(philhealth_no);
    const normalizedFirstAppointmentDate = normalizeOptionalDate(
      date_of_first_appointment,
    );
    const { yearsInService, loyaltyBonus } = computeServiceMetrics(
      normalizedFirstAppointmentDate,
    );
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
          mobile_number || null,
          home_address || null,
          place_of_birth || null,
          civil_status || null,
          civil_status_id || null,
          sex || null,
          sex_id || null,
          normalizedEmployeeType,
          school_id,
          employee_no || null,
          work_email || null,
          resolvedDistrict,
          position || null,
          position_id || null,
          plantilla_no || null,
          prc_license_no || null,
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
    const personalEmail = personal_email || email || null;
    const middleInitial =
      middle_initial ||
      (middle_name ? String(middle_name).trim().charAt(0) : null);
    const resolvedDistrict = district || work_district || null;
    const normalizedEmployeeType =
      normalizeEmployeeTypeForStorage(employee_type);
    const normalizedTin = normalizeOptionalText(tin);
    const normalizedGsisBpNo = normalizeOptionalText(gsis_bp_no);
    const normalizedGsisCrnNo = normalizeOptionalText(gsis_crn_no);
    const normalizedPagibigNo = normalizeOptionalText(pagibig_no);
    const normalizedPhilhealthNo = normalizeOptionalText(philhealth_no);
    const normalizedFirstAppointmentDate = normalizeOptionalDate(
      date_of_first_appointment,
    );
    const { yearsInService, loyaltyBonus } = computeServiceMetrics(
      normalizedFirstAppointmentDate,
    );
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
          mobile_number || null,
          home_address || null,
          place_of_birth || null,
          civil_status || null,
          civil_status_id || null,
          sex || null,
          sex_id || null,
          normalizedEmployeeType,
          school_id,
          employee_no || null,
          work_email || null,
          resolvedDistrict,
          position || null,
          position_id || null,
          plantilla_no || null,
          prc_license_no || null,
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
