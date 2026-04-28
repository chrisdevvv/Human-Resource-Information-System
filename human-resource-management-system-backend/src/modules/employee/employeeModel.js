const pool = require("../../config/db");

const EMPLOYEE_SELECT_WITH_AGE = `
  employees.*,
  wi.employee_type,
  wi.employee_no,
  wi.work_email,
  wi.district,
  wi.position,
  wi.position_id,
  wi.plantilla_no,
  wi.sg,
  DATE_FORMAT(wi.date_of_first_appointment, '%Y-%m-%d') AS date_of_first_appointment,
  wi.years_in_service,
  wi.loyalty_bonus,
  wi.current_employee_type,
  wi.current_position,
  wi.current_plantilla_no,
  DATE_FORMAT(wi.current_appointment_date, '%Y-%m-%d') AS current_appointment_date,
  wi.current_sg,

  COALESCE(wi.current_employee_type, wi.employee_type) AS resolved_employee_type,
  COALESCE(wi.current_position, wi.position) AS resolved_position,
  COALESCE(wi.current_plantilla_no, wi.plantilla_no) AS resolved_plantilla_no,
  DATE_FORMAT(
    COALESCE(wi.current_appointment_date, wi.date_of_first_appointment),
    '%Y-%m-%d'
  ) AS resolved_appointment_date,
  COALESCE(wi.current_sg, wi.sg) AS resolved_sg,

  wi.prc_license_no,
  wi.tin,
  wi.gsis_bp_no,
  wi.gsis_crn_no,
  wi.pagibig_no,
  wi.philhealth_no,
  DATE_FORMAT(employees.birthdate, '%Y-%m-%d') AS birthdate,
  schools.school_name,
  COALESCE(employees.age, TIMESTAMPDIFF(YEAR, employees.birthdate, CURDATE())) AS age
`;

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

const resolveEmployeeSchemaInfo = async () => {
  const [rows] = await pool.promise().query(
    `SELECT TABLE_NAME AS table_name, COLUMN_NAME AS column_name
     FROM INFORMATION_SCHEMA.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE()
       AND TABLE_NAME IN ('employees', 'emppersonalinfo')
       AND COLUMN_NAME IN (
         'id', 'first_name', 'firstName', 'middle_name', 'middleName',
         'last_name', 'lastName', 'email', 'birthdate', 'age', 'school_id',
         'is_archived', 'on_leave', 'on_leave_from', 'on_leave_until'
       )`,
  );

  const grouped = rows.reduce((acc, row) => {
    if (!acc[row.table_name]) {
      acc[row.table_name] = new Set();
    }
    acc[row.table_name].add(row.column_name);
    return acc;
  }, {});

  const table = grouped.emppersonalinfo ? 'emppersonalinfo' : 'employees';
  const columns = grouped[table] || new Set();

  return {
    table,
    firstName: columns.has('firstName') ? 'firstName' : 'first_name',
    middleName: columns.has('middleName') ? 'middleName' : 'middle_name',
    lastName: columns.has('lastName') ? 'lastName' : 'last_name',
    email: 'email',
    birthdate: 'birthdate',
    age: 'age',
    schoolId: 'school_id',
    isArchived: columns.has('is_archived') ? 'is_archived' : null,
    onLeave: columns.has('on_leave') ? 'on_leave' : null,
    onLeaveFrom: columns.has('on_leave_from') ? 'on_leave_from' : null,
    onLeaveUntil: columns.has('on_leave_until') ? 'on_leave_until' : null,
  };
};

const resolveSchoolSchemaInfo = async () => {
  const [rows] = await pool.promise().query(
    `SELECT COLUMN_NAME AS column_name
     FROM INFORMATION_SCHEMA.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE()
       AND TABLE_NAME = 'schools'
       AND COLUMN_NAME IN ('schoolId', 'id', 'schoolName', 'school_name')`,
  );

  const columns = new Set(rows.map((row) => row.column_name));

  return {
    id: columns.has('schoolId') ? 'schoolId' : 'id',
    name: columns.has('schoolName') ? 'schoolName' : 'school_name',
  };
};

const buildEmployeeSelectWithAge = (employee, school) => `
  employees.*,
  wi.employee_type,
  wi.employee_no,
  wi.work_email,
  wi.district,
  wi.position,
  wi.position_id,
  wi.plantilla_no,
  wi.sg,
  DATE_FORMAT(wi.date_of_first_appointment, '%Y-%m-%d') AS date_of_first_appointment,
  wi.years_in_service,
  wi.loyalty_bonus,
  wi.current_employee_type,
  wi.current_position,
  wi.current_plantilla_no,
  DATE_FORMAT(wi.current_appointment_date, '%Y-%m-%d') AS current_appointment_date,
  wi.current_sg,

  COALESCE(wi.current_employee_type, wi.employee_type) AS resolved_employee_type,
  COALESCE(wi.current_position, wi.position) AS resolved_position,
  COALESCE(wi.current_plantilla_no, wi.plantilla_no) AS resolved_plantilla_no,
  DATE_FORMAT(
    COALESCE(wi.current_appointment_date, wi.date_of_first_appointment),
    '%Y-%m-%d'
  ) AS resolved_appointment_date,
  COALESCE(wi.current_sg, wi.sg) AS resolved_sg,

  wi.prc_license_no,
  wi.tin,
  wi.gsis_bp_no,
  wi.gsis_crn_no,
  wi.pagibig_no,
  wi.philhealth_no,
  DATE_FORMAT(employees.${employee.birthdate}, '%Y-%m-%d') AS birthdate,
  COALESCE(schools.${school.name}, employees.school) AS school_name,
  COALESCE(employees.${employee.age}, TIMESTAMPDIFF(YEAR, employees.${employee.birthdate}, CURDATE())) AS age
`;

const EMPLOYEE_UNIQUE_FIELD_DEFINITIONS = [
  {
    column: "email",
    key: "personalEmail",
    label: "personal email",
    table: "employees",
    idColumn: "id",
  },
  {
    column: "mobile_number",
    key: "mobileNumber",
    label: "mobile number",
    table: "employees",
    idColumn: "id",
  },
  {
    column: "employee_no",
    key: "employeeNo",
    label: "employee number",
    table: "work_information",
    idColumn: "employee_id",
  },
  {
    column: "work_email",
    key: "workEmail",
    label: "DepEd email",
    table: "work_information",
    idColumn: "employee_id",
  },
  {
    column: "plantilla_no",
    key: "plantillaNo",
    label: "Plantilla Number",
    table: "work_information",
    idColumn: "employee_id",
  },
  {
    column: "prc_license_no",
    key: "prcLicenseNo",
    label: "PRC License No",
    table: "work_information",
    idColumn: "employee_id",
  },
  {
    column: "tin",
    key: "tin",
    label: "TIN",
    table: "work_information",
    idColumn: "employee_id",
  },
  {
    column: "gsis_bp_no",
    key: "gsisBpNo",
    label: "GSIS BP Number",
    table: "work_information",
    idColumn: "employee_id",
  },
  {
    column: "gsis_crn_no",
    key: "gsisCrnNo",
    label: "GSIS CRN Number",
    table: "work_information",
    idColumn: "employee_id",
  },
  {
    column: "pagibig_no",
    key: "pagibigNo",
    label: "PAG-IBIG Number",
    table: "work_information",
    idColumn: "employee_id",
  },
  {
    column: "philhealth_no",
    key: "philhealthNo",
    label: "PhilHealth Number",
    table: "work_information",
    idColumn: "employee_id",
  },
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
    let sql = `SELECT ${field.idColumn} FROM ${field.table} WHERE ${field.column} = ?`;

    if (excludeId !== null && excludeId !== undefined) {
      sql += ` AND ${field.idColumn} <> ?`;
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

const computeServiceMetrics = (appointmentDate) => {
  const normalizedDate = normalizeOptionalDate(appointmentDate);
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

const upsertWorkInformation = async (employeeId, payload) => {
  const {
    employee_type,
    employee_no,
    work_email,
    district,
    position,
    position_id,
    plantilla_no,
    sg,
    date_of_first_appointment,
    years_in_service,
    loyalty_bonus,
    current_employee_type,
    current_position,
    current_plantilla_no,
    current_appointment_date,
    current_sg,
    prc_license_no,
    tin,
    gsis_bp_no,
    gsis_crn_no,
    pagibig_no,
    philhealth_no,
  } = payload;

  await pool.promise().query(
    `
      INSERT INTO work_information (
        employee_id,
        employee_type,
        employee_no,
        work_email,
        district,
        position,
        position_id,
        plantilla_no,
        sg,
        date_of_first_appointment,
        years_in_service,
        loyalty_bonus,
        current_employee_type,
        current_position,
        current_plantilla_no,
        current_appointment_date,
        current_sg,
        prc_license_no,
        tin,
        gsis_bp_no,
        gsis_crn_no,
        pagibig_no,
        philhealth_no
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        employee_type = VALUES(employee_type),
        employee_no = VALUES(employee_no),
        work_email = VALUES(work_email),
        district = VALUES(district),
        position = VALUES(position),
        position_id = VALUES(position_id),
        plantilla_no = VALUES(plantilla_no),
        sg = VALUES(sg),
        date_of_first_appointment = VALUES(date_of_first_appointment),
        years_in_service = VALUES(years_in_service),
        loyalty_bonus = VALUES(loyalty_bonus),
        current_employee_type = VALUES(current_employee_type),
        current_position = VALUES(current_position),
        current_plantilla_no = VALUES(current_plantilla_no),
        current_appointment_date = VALUES(current_appointment_date),
        current_sg = VALUES(current_sg),
        prc_license_no = VALUES(prc_license_no),
        tin = VALUES(tin),
        gsis_bp_no = VALUES(gsis_bp_no),
        gsis_crn_no = VALUES(gsis_crn_no),
        pagibig_no = VALUES(pagibig_no),
        philhealth_no = VALUES(philhealth_no),
        updated_at = CURRENT_TIMESTAMP
    `,
    [
      employeeId,
      employee_type,
      employee_no,
      work_email,
      district,
      position,
      position_id,
      plantilla_no,
      sg,
      date_of_first_appointment,
      years_in_service,
      loyalty_bonus,
      current_employee_type,
      current_position,
      current_plantilla_no,
      current_appointment_date,
      current_sg,
      prc_license_no,
      tin,
      gsis_bp_no,
      gsis_crn_no,
      pagibig_no,
      philhealth_no,
    ],
  );
};

const Employee = {
  getAll: async (filters = {}) => {
    const employee = await resolveEmployeeSchemaInfo();
    const school = await resolveSchoolSchemaInfo();
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
      if (employee.onLeave) {
        whereParts.push(`employees.${employee.onLeave} = 1`);
      }
    } else if (filters.onLeave === false) {
      if (employee.onLeave) {
        whereParts.push(`employees.${employee.onLeave} = 0`);
      }
    }

    if (filters.schoolId) {
      whereParts.push("employees.school_id = ?");
      params.push(filters.schoolId);
    }

    if (employeeType) {
      whereParts.push(
        "LOWER(REPLACE(REPLACE(COALESCE(wi.current_employee_type, wi.employee_type), '_', '-'), ' ', '-')) = ?",
      );
      params.push(employeeType);
    }

    if (search) {
      whereParts.push(
        `(
          employees.${employee.firstName} LIKE ?
          OR employees.${employee.middleName} LIKE ?
          OR employees.${employee.lastName} LIKE ?
          OR employees.email LIKE ?
          OR wi.employee_no LIKE ?
          OR wi.work_email LIKE ?
          OR wi.position LIKE ?
          OR wi.current_position LIKE ?
          OR wi.plantilla_no LIKE ?
          OR wi.current_plantilla_no LIKE ?
          OR wi.sg LIKE ?
          OR wi.current_sg LIKE ?
          OR schools.${school.name} LIKE ?
        )`,
      );
      const like = `%${search}%`;
      params.push(
        like,
        like,
        like,
        like,
        like,
        like,
        like,
        like,
        like,
        like,
        like,
        like,
        like,
      );
    }

    if (letter) {
      whereParts.push(
        `UPPER(LEFT(COALESCE(employees.${employee.firstName}, ''), 1)) = ?`,
      );
      params.push(letter);
    }

    if (retirement === "retirable") {
      whereParts.push(
        `COALESCE(employees.${employee.age}, TIMESTAMPDIFF(YEAR, employees.${employee.birthdate}, CURDATE())) >= 60 AND COALESCE(employees.${employee.age}, TIMESTAMPDIFF(YEAR, employees.${employee.birthdate}, CURDATE())) < 65`,
      );
    } else if (retirement === "mandatory") {
      whereParts.push(
        `COALESCE(employees.${employee.age}, TIMESTAMPDIFF(YEAR, employees.${employee.birthdate}, CURDATE())) >= 65`,
      );
    }

    const whereClause =
      whereParts.length > 0 ? `WHERE ${whereParts.join(" AND ")}` : "";
    const baseQuery = `FROM ${employee.table} employees LEFT JOIN schools ON employees.school_id = schools.${school.id} LEFT JOIN work_information wi ON wi.employee_id = employees.id ${whereClause}`;
    const orderClause = ` ORDER BY employees.${employee.firstName} ${sortOrder}, employees.${employee.lastName} ${sortOrder}, employees.id ASC`;

    if (!page) {
      const [rows] = await pool
        .promise()
        .query(
          `SELECT ${buildEmployeeSelectWithAge(employee, school)} ${baseQuery}${orderClause}`,
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
        `SELECT ${buildEmployeeSelectWithAge(employee, school)} ${baseQuery}${orderClause} LIMIT ? OFFSET ?`,
        [...params, pageSize, offset],
      );

    return { data: rows, total: Number(total), page, pageSize };
  },

  getById: async (id, options = {}) => {
    const employee = await resolveEmployeeSchemaInfo();
    const school = await resolveSchoolSchemaInfo();
    const includeArchived = Boolean(options.includeArchived);
    const archivedFilter = includeArchived
      ? ""
      : employee.isArchived
        ? `AND employees.${employee.isArchived} = 0`
        : "";

    const [rows] = await pool.promise().query(
      `
        SELECT ${buildEmployeeSelectWithAge(employee, school)}
        FROM ${employee.table} employees
        LEFT JOIN schools ON employees.school_id = schools.${school.id}
        LEFT JOIN work_information wi ON wi.employee_id = employees.id
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
      sg,
      current_employee_type,
      current_position,
      current_plantilla_no,
      current_appointment_date,
      current_sg,
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
    const normalizedEmployeeType = normalizeEmployeeTypeForStorage(
      employee_type ?? current_employee_type,
    );
    const normalizedMobileNumber = uniqueValues.mobileNumber;
    const normalizedEmployeeNo = uniqueValues.employeeNo;
    const normalizedWorkEmail = uniqueValues.workEmail;
    const normalizedPlantillaNo = uniqueValues.plantillaNo;
    const normalizedSg = normalizeOptionalText(sg);
    const normalizedFirstAppointmentDate = normalizeOptionalDate(
      date_of_first_appointment,
    );

    const normalizedCurrentEmployeeType =
      current_employee_type === undefined ||
      current_employee_type === null ||
      current_employee_type === ""
        ? normalizedEmployeeType
        : normalizeEmployeeTypeForStorage(current_employee_type);

    const normalizedCurrentPosition =
      normalizeOptionalText(current_position) ??
      normalizeOptionalText(position);

    const normalizedCurrentPlantillaNo =
      normalizeOptionalText(current_plantilla_no) ?? normalizedPlantillaNo;

    const normalizedCurrentAppointmentDate =
      normalizeOptionalDate(current_appointment_date) ??
      normalizedFirstAppointmentDate;

    const normalizedCurrentSg =
      normalizeOptionalText(current_sg) ?? normalizedSg;

    const normalizedPrcLicenseNo = uniqueValues.prcLicenseNo;
    const normalizedTin = uniqueValues.tin;
    const normalizedGsisBpNo = uniqueValues.gsisBpNo;
    const normalizedGsisCrnNo = uniqueValues.gsisCrnNo;
    const normalizedPagibigNo = uniqueValues.pagibigNo;
    const normalizedPhilhealthNo = uniqueValues.philhealthNo;

    const serviceMetricBaseDate =
      normalizedCurrentAppointmentDate || normalizedFirstAppointmentDate;

    const { yearsInService, loyaltyBonus } = computeServiceMetrics(
      serviceMetricBaseDate,
    );

    const duplicateField = await findEmployeeUniqueConflict(uniqueValues);
    if (duplicateField) {
      throw createDuplicateEmployeeError(duplicateField.label);
    }

    const [result] = await pool.promise().query(
      `INSERT INTO employees (
        first_name,
        middle_name,
        last_name,
        middle_initial,
        email,
        mobile_number,
        home_address,
        place_of_birth,
        civil_status,
        civil_status_id,
        sex,
        sex_id,
        school_id,
        age,
        birthdate
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
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
        school_id,
        age || null,
        birthdate,
      ],
    );

    await upsertWorkInformation(result.insertId, {
      employee_type: normalizedEmployeeType,
      employee_no: normalizedEmployeeNo,
      work_email: normalizedWorkEmail,
      district: resolvedDistrict,
      position: position || null,
      position_id: position_id || null,
      plantilla_no: normalizedPlantillaNo,
      sg: normalizedSg,
      date_of_first_appointment: normalizedFirstAppointmentDate,
      years_in_service: yearsInService,
      loyalty_bonus: loyaltyBonus,
      current_employee_type: normalizedCurrentEmployeeType,
      current_position: normalizedCurrentPosition,
      current_plantilla_no: normalizedCurrentPlantillaNo,
      current_appointment_date: normalizedCurrentAppointmentDate,
      current_sg: normalizedCurrentSg,
      prc_license_no: normalizedPrcLicenseNo,
      tin: normalizedTin,
      gsis_bp_no: normalizedGsisBpNo,
      gsis_crn_no: normalizedGsisCrnNo,
      pagibig_no: normalizedPagibigNo,
      philhealth_no: normalizedPhilhealthNo,
    });

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
      sg,
      current_employee_type,
      current_position,
      current_plantilla_no,
      current_appointment_date,
      current_sg,
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
    const normalizedEmployeeType = normalizeEmployeeTypeForStorage(
      employee_type ?? current_employee_type,
    );
    const normalizedMobileNumber = uniqueValues.mobileNumber;
    const normalizedEmployeeNo = uniqueValues.employeeNo;
    const normalizedWorkEmail = uniqueValues.workEmail;
    const normalizedPlantillaNo = uniqueValues.plantillaNo;
    const normalizedSg = normalizeOptionalText(sg);
    const normalizedCurrentEmployeeType =
      current_employee_type === undefined || current_employee_type === null
        ? null
        : normalizeEmployeeTypeForStorage(current_employee_type);
    const normalizedCurrentPosition = normalizeOptionalText(current_position);
    const normalizedCurrentPlantillaNo = normalizeOptionalText(
      current_plantilla_no,
    );
    const normalizedCurrentAppointmentDate = normalizeOptionalDate(
      current_appointment_date,
    );
    const normalizedCurrentSg = normalizeOptionalText(current_sg);
    const normalizedPrcLicenseNo = uniqueValues.prcLicenseNo;
    const normalizedTin = uniqueValues.tin;
    const normalizedGsisBpNo = uniqueValues.gsisBpNo;
    const normalizedGsisCrnNo = uniqueValues.gsisCrnNo;
    const normalizedPagibigNo = uniqueValues.pagibigNo;
    const normalizedPhilhealthNo = uniqueValues.philhealthNo;
    const normalizedFirstAppointmentDate = normalizeOptionalDate(
      date_of_first_appointment,
    );

    const serviceMetricBaseDate =
      normalizedCurrentAppointmentDate || normalizedFirstAppointmentDate;

    const { yearsInService, loyaltyBonus } = computeServiceMetrics(
      serviceMetricBaseDate,
    );

    const duplicateField = await findEmployeeUniqueConflict(uniqueValues, id);
    if (duplicateField) {
      throw createDuplicateEmployeeError(duplicateField.label);
    }

    const [result] = await pool.promise().query(
      `UPDATE employees SET
        first_name = ?,
        middle_name = ?,
        last_name = ?,
        middle_initial = ?,
        email = ?,
        mobile_number = ?,
        home_address = ?,
        place_of_birth = ?,
        civil_status = ?,
        civil_status_id = ?,
        sex = ?,
        sex_id = ?,
        school_id = ?,
        age = ?,
        birthdate = ?
      WHERE id = ? AND is_archived = 0`,
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
        school_id,
        age || null,
        birthdate || null,
        id,
      ],
    );

    if (result.affectedRows > 0) {
      await upsertWorkInformation(id, {
        employee_type: normalizedEmployeeType,
        employee_no: normalizedEmployeeNo,
        work_email: normalizedWorkEmail,
        district: resolvedDistrict,
        position: position || null,
        position_id: position_id || null,
        plantilla_no: normalizedPlantillaNo,
        sg: normalizedSg,
        date_of_first_appointment: normalizedFirstAppointmentDate,
        years_in_service: yearsInService,
        loyalty_bonus: loyaltyBonus,
        current_employee_type: normalizedCurrentEmployeeType,
        current_position: normalizedCurrentPosition,
        current_plantilla_no: normalizedCurrentPlantillaNo,
        current_appointment_date: normalizedCurrentAppointmentDate,
        current_sg: normalizedCurrentSg,
        prc_license_no: normalizedPrcLicenseNo,
        tin: normalizedTin,
        gsis_bp_no: normalizedGsisBpNo,
        gsis_crn_no: normalizedGsisCrnNo,
        pagibig_no: normalizedPagibigNo,
        philhealth_no: normalizedPhilhealthNo,
      });
    }

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
    const employee = await resolveEmployeeSchemaInfo();
    const params = [];
    let whereClause = "";

    if (filters.schoolId) {
      whereClause = "WHERE school_id = ?";
      params.push(filters.schoolId);
    }

    const [rows] = await pool.promise().query(
      `SELECT
         COUNT(1) AS total_all,
         SUM(CASE WHEN ${employee.isArchived || '0'} = 1 THEN 1 ELSE 0 END) AS archived,
         SUM(CASE WHEN ${employee.isArchived || '0'} = 0 THEN 1 ELSE 0 END) AS active_total,
         SUM(CASE WHEN ${employee.isArchived || '0'} = 0 AND ${employee.onLeave || '0'} = 1 THEN 1 ELSE 0 END) AS on_leave,
         SUM(CASE WHEN ${employee.isArchived || '0'} = 0 AND ${employee.onLeave || '0'} = 0 THEN 1 ELSE 0 END) AS available
       FROM ${employee.table}
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