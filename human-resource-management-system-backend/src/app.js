require("./config/loadEnv");
const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const helmet = require("helmet");
const cron = require("node-cron");
const authRoutes = require("./modules/auth/authRoutes");
const leaveRoutes = require("./modules/leave/leaveRoutes");
const employeeRoutes = require("./modules/employee/employeeRoutes");
const schoolRoutes = require("./modules/school/schoolRoutes");
const Position = require("./modules/position/positionModel");
const SalaryInformation = require("./modules/employee/salaryInformationModel");
const backlogRoutes = require("./modules/backlog/backlogRoutes");
const registrationRoutes = require("./modules/registration/registrationRoutes");
const userRoutes = require("./modules/user/userRoutes");
const { autoCreditCurrentMonth } = require("./modules/leave/leaveController");
const authMiddleware = require("./middleware/authMiddleware");
const { validateRequest } = require("./middleware/validateRequest");
const { roleAuthMiddleware } = require("./middleware/roleAuthMiddleware");
const pool = require("./config/db");
const {
  idParamSchema,
  civilStatusBodySchema,
  districtBodySchema,
  archivingReasonBodySchema,
  positionBodySchema,
  sexBodySchema,
} = require("./validation/schemas");

const app = express();
const PORT = process.env.PORT || 3000;
const AUTO_MONTHLY_CREDIT_ENABLED = process.env.AUTO_MONTHLY_CREDIT !== "false";
const MAX_JSON_BODY_SIZE = process.env.MAX_JSON_BODY_SIZE || "100kb";
const MAX_FORM_BODY_SIZE = process.env.MAX_FORM_BODY_SIZE || "100kb";
const IS_PRODUCTION = process.env.NODE_ENV === "production";

const LOCALHOST_ORIGIN_PATTERN =
  /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i;

const allowedOrigins = (
  process.env.CORS_ORIGIN_ALLOWLIST ||
  process.env.CORS_ALLOWED_ORIGINS ||
  ""
)
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

const corsAllowlist =
  allowedOrigins.length > 0 ? allowedOrigins : IS_PRODUCTION ? [] : [];

if (IS_PRODUCTION && corsAllowlist.length === 0) {
  console.warn(
    "[CORS] No CORS allowlist configured in production; cross-origin browser requests will be blocked.",
  );
}

const corsOptions = {
  origin: (origin, callback) => {
    // Allow server-to-server calls and local scripts without browser origin.
    if (!origin) {
      return callback(null, true);
    }

    if (corsAllowlist.includes(origin)) {
      return callback(null, true);
    }

    if (!IS_PRODUCTION && LOCALHOST_ORIGIN_PATTERN.test(origin)) {
      return callback(null, true);
    }

    return callback(new Error("CORS blocked: origin not allowed"));
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
};

const ensureSecurityTables = async () => {
  await pool.promise().query(`
    CREATE TABLE IF NOT EXISTS revoked_tokens (
      jti VARCHAR(64) NOT NULL,
      user_id INT NULL,
      expires_at DATETIME NOT NULL,
      revoked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (jti),
      INDEX idx_revoked_tokens_expires_at (expires_at)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);

  await pool.promise().query(`
    CREATE TABLE IF NOT EXISTS user_token_invalidations (
      user_id INT NOT NULL,
      invalid_after DATETIME NOT NULL,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      PRIMARY KEY (user_id),
      INDEX idx_user_token_invalidations_invalid_after (invalid_after)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);

  await pool.promise().query(`
    CREATE TABLE IF NOT EXISTS login_attempts (
      identifier VARCHAR(320) NOT NULL,
      email VARCHAR(255) NOT NULL,
      source_ip VARCHAR(64) NOT NULL,
      failed_attempts INT NOT NULL DEFAULT 0,
      last_failed_at DATETIME NULL,
      locked_until DATETIME NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      PRIMARY KEY (identifier),
      INDEX idx_login_attempts_email (email),
      INDEX idx_login_attempts_locked_until (locked_until)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);

  // Keep the table compact.
  await pool
    .promise()
    .query("DELETE FROM revoked_tokens WHERE expires_at <= NOW()");

  await pool.promise().query(
    `DELETE FROM login_attempts
     WHERE locked_until IS NOT NULL
       AND locked_until <= NOW()
       AND failed_attempts = 0`,
  );
};

const ensureLeaveLedgerSchema = async () => {
  const leaveParticularsDefaults = [
    "Adoption Leave",
    "Balance Forwarded",
    "Brigada Eskwela",
    "Checking of Forms",
    "Compensatory Paid Leave",
    "Early Registration/Enrollment",
    "Election",
    "Forced Leave",
    "Forced Leave (Disapproved)",
    "Late/Undertime",
    "Leave Credit",
    "Maternity Leave",
    "Monetization",
    "Others",
    "Paternity Leave",
    "Rehabilitation Leave",
    "Remediation/Enrichment Classes/NLC",
    "Service Credit",
    "Sick Leave",
    "Solo Parent",
    "Special Emergency Leave",
    "Special Leave for Women",
    "Special Privilege Leave",
    "Study Leave",
    "Terminal Leave",
    "Training/Seminar",
    "VAWC Leave",
    "Vacation Leave",
    "Wellness Leave",
  ];
  const toEnumSql = (values) =>
    values.map((v) => `'${String(v).replace(/'/g, "''")}'`).join(",");

  const parseEnumValues = (columnType) => {
    if (!columnType || !/^enum\(/i.test(columnType)) return [];
    const inner = columnType.slice(
      columnType.indexOf("(") + 1,
      columnType.lastIndexOf(")"),
    );
    const matches = inner.match(/'((?:[^'\\]|\\.)*)'/g) || [];
    return matches.map((token) => token.slice(1, -1).replace(/\\'/g, "'"));
  };

  // Keep leave entry categorization structured and backend-driven.

  await pool.promise().query(`
    UPDATE leaves
    SET entry_kind = 'MANUAL'
    WHERE entry_kind IS NULL OR entry_kind = '';
  `);

  const [typeRows] = await pool.promise().query(
    `SELECT COLUMN_TYPE AS column_type
     FROM INFORMATION_SCHEMA.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE()
       AND TABLE_NAME = 'leaves'
       AND COLUMN_NAME = 'particulars'
     LIMIT 1`,
  );

  const currentEnumValues = parseEnumValues(typeRows?.[0]?.column_type || "");
  const mergedEnumValues = Array.from(
    new Set([...currentEnumValues, ...leaveParticularsDefaults]),
  );
  const enumSql = toEnumSql(
    mergedEnumValues.length > 0 ? mergedEnumValues : leaveParticularsDefaults,
  );

  // Normalize legacy free-text particulars before converting to ENUM.
  await pool.promise().query(`
    UPDATE leaves
    SET particulars = 'Others'
    WHERE particulars IS NOT NULL
      AND particulars <> ''
      AND particulars NOT IN (${enumSql});
  `);

  await pool.promise().query(`
    ALTER TABLE leaves
    MODIFY COLUMN particulars ENUM(${enumSql}) NULL;
  `);
};

const ensureEmployeeArchiveSchema = async () => {

  await pool.promise().query(`
    UPDATE employees
    SET is_archived = 0
    WHERE is_archived IS NULL;
  `);

  const indexStatements = [
    `CREATE INDEX idx_employees_is_archived ON employees (is_archived)`,
    `CREATE INDEX idx_employees_archived_by ON employees (archived_by)`,
  ];

  for (const sql of indexStatements) {
    try {
      await pool.promise().query(sql);
    } catch (err) {
      if (!/Duplicate|exists/i.test(err.message)) {
        console.warn("Employee archive index warning:", err.message);
      }
    }
  }
};

const ensureEmployeeLeaveStatusSchema = async () => {

  await pool.promise().query(`
    UPDATE employees
    SET on_leave = 0
    WHERE on_leave IS NULL;
  `);

  try {
    await pool
      .promise()
      .query(`CREATE INDEX idx_employees_on_leave ON employees (on_leave)`);
  } catch (err) {
    if (!/Duplicate|exists/i.test(err.message)) {
      console.warn("Employee leave status index warning:", err.message);
    }
  }
};

const ensureUniqueIndex = async (tableName, indexName, columns) => {
  const desiredColumnList = columns.join(",");
  const [existingUniqueIndexes] = await pool.promise().query(
    `SELECT INDEX_NAME, GROUP_CONCAT(COLUMN_NAME ORDER BY SEQ_IN_INDEX) AS column_list
     FROM INFORMATION_SCHEMA.STATISTICS
     WHERE TABLE_SCHEMA = DATABASE()
       AND TABLE_NAME = ?
       AND NON_UNIQUE = 0
     GROUP BY INDEX_NAME`,
    [tableName],
  );

  if (
    existingUniqueIndexes.some((row) => row.column_list === desiredColumnList)
  ) {
    return;
  }

  const quotedColumns = columns.map((column) => `\`${column}\``).join(", ");
  await pool
    .promise()
    .query(
      `CREATE UNIQUE INDEX ${indexName} ON ${tableName} (${quotedColumns})`,
    );
};

const ensureBirthdateSchema = async () => {
  await pool.promise().query(`
    ALTER TABLE employees
  `);

  await pool.promise().query(`
    ALTER TABLE users
  `);

  await pool.promise().query(`
    ALTER TABLE registration_requests
  `);
};

const ensureMiddleNameSchema = async () => {
  await pool.promise().query(`
    ALTER TABLE employees
  `);

  await pool.promise().query(`
    ALTER TABLE users
  `);

  await pool.promise().query(`
    ALTER TABLE registration_requests
  `);
};

const ensureEmployeeTypeSchema = async () => {
  const parseEnumValues = (columnType) => {
    if (!columnType || !/^enum\(/i.test(columnType)) return [];
    const inner = columnType.slice(
      columnType.indexOf("(") + 1,
      columnType.lastIndexOf(")"),
    );
    const matches = inner.match(/'((?:[^'\\]|\\.)*)'/g) || [];
    return matches.map((token) => token.slice(1, -1).replace(/\\'/g, "'"));
  };

  const toEnumSql = (values) =>
    values.map((v) => `'${String(v).replace(/'/g, "''")}'`).join(",");

  const [typeRows] = await pool.promise().query(
    `SELECT COLUMN_TYPE AS column_type
     FROM INFORMATION_SCHEMA.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE()
       AND TABLE_NAME = 'employees'
       AND COLUMN_NAME = 'employee_type'
     LIMIT 1`,
  );

  const currentEnumValues = parseEnumValues(typeRows?.[0]?.column_type || "");
  if (currentEnumValues.length === 0) {
    return;
  }

  const mergedValues = Array.from(
    new Set([...currentEnumValues, "teaching-related"]),
  );

  if (mergedValues.length !== currentEnumValues.length) {
    const enumSql = toEnumSql(mergedValues);
    await pool.promise().query(`
      ALTER TABLE employees
      MODIFY COLUMN employee_type ENUM(${enumSql}) NOT NULL;
    `);
  }

  // Canonicalize legacy values so all variants store as teaching-related.
  await pool.promise().query(`
    UPDATE employees
    SET employee_type = 'teaching-related'
    WHERE LOWER(REPLACE(REPLACE(employee_type, '_', '-'), ' ', '-')) = 'teaching-related'
      AND employee_type <> 'teaching-related';
  `);
};

const ensureEmployeeProfileSchema = async () => {
  await pool.promise().query(`
    UPDATE employees
    SET district = work_district
    WHERE district IS NULL
      AND work_district IS NOT NULL
      AND work_district <> '';
  `);

  await pool.promise().query(`
    UPDATE employees
    SET email = NULLIF(TRIM(email), ''),
        mobile_number = NULLIF(TRIM(mobile_number), ''),
        employee_no = NULLIF(TRIM(employee_no), ''),
        work_email = NULLIF(TRIM(work_email), ''),
        plantilla_no = NULLIF(TRIM(plantilla_no), ''),
        prc_license_no = NULLIF(TRIM(prc_license_no), ''),
        tin = NULLIF(TRIM(tin), ''),
        gsis_bp_no = NULLIF(TRIM(gsis_bp_no), ''),
        gsis_crn_no = NULLIF(TRIM(gsis_crn_no), ''),
        pagibig_no = NULLIF(TRIM(pagibig_no), ''),
        philhealth_no = NULLIF(TRIM(philhealth_no), '');
  `);

  const indexStatements = [
    `CREATE INDEX idx_employees_district ON employees (district)`,
    `CREATE INDEX idx_employees_work_district ON employees (work_district)`,
  ];

  for (const sql of indexStatements) {
    try {
      await pool.promise().query(sql);
    } catch (err) {
      if (!/Duplicate|exists/i.test(err.message)) {
        console.warn("Employee profile index warning:", err.message);
      }
    }
  }

  const uniqueIndexStatements = [
    ["uk_employees_email", ["email"]],
    ["uk_employees_mobile_number", ["mobile_number"]],
    ["uk_employees_employee_no", ["employee_no"]],
    ["uk_employees_work_email", ["work_email"]],
    ["uk_employees_plantilla_no", ["plantilla_no"]],
    ["uk_employees_prc_license_no", ["prc_license_no"]],
    ["uk_employees_tin", ["tin"]],
    ["uk_employees_gsis_bp_no", ["gsis_bp_no"]],
    ["uk_employees_gsis_crn_no", ["gsis_crn_no"]],
    ["uk_employees_pagibig_no", ["pagibig_no"]],
    ["uk_employees_philhealth_no", ["philhealth_no"]],
  ];

  for (const [indexName, columns] of uniqueIndexStatements) {
    try {
      await ensureUniqueIndex("employees", indexName, columns);
    } catch (err) {
      if (!/Duplicate|exists/i.test(err.message)) {
        console.warn("Employee profile unique index warning:", err.message);
      }
    }
  }
};

const syncEmployeeServiceMetrics = async () => {
  await pool.promise().query(`
    UPDATE employees
    SET date_of_first_appointment = NULL
    WHERE date_of_first_appointment IS NULL;
  `);

  await pool.promise().query(`
    UPDATE employees
    SET years_in_service = CASE
          WHEN date_of_first_appointment IS NULL THEN NULL
          WHEN date_of_first_appointment > CURDATE() THEN 0
          ELSE TIMESTAMPDIFF(YEAR, date_of_first_appointment, CURDATE())
        END,
        loyalty_bonus = CASE
          WHEN date_of_first_appointment IS NULL THEN 'No'
          WHEN date_of_first_appointment > CURDATE() THEN 'No'
          WHEN TIMESTAMPDIFF(YEAR, date_of_first_appointment, CURDATE()) > 0
               AND MOD(TIMESTAMPDIFF(YEAR, date_of_first_appointment, CURDATE()), 5) = 0
            THEN 'Yes'
          ELSE 'No'
        END;
  `);
};

const ensureBacklogArchiveSchema = async () => {

  await pool.promise().query(`
    UPDATE backlogs
    SET is_archived = 0
    WHERE is_archived IS NULL;
  `);

  try {
    await pool
      .promise()
      .query(`CREATE INDEX idx_backlogs_is_archived ON backlogs (is_archived)`);
  } catch (err) {
    if (!/Duplicate|exists/i.test(err.message)) {
      console.warn("Backlog archive index warning:", err.message);
    }
  }
};

const archiveOldBacklogs = async () => {
  // Archive logs older than 1 month
  const oneMonthAgo = new Date();
  oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
  const cutoffDate = oneMonthAgo.toISOString().slice(0, 19).replace("T", " ");

  try {
    const [result] = await pool.promise().query(
      `UPDATE backlogs
       SET is_archived = 1
       WHERE is_archived = 0 AND created_at < ?`,
      [cutoffDate],
    );

    if (result.changedRows > 0) {
      console.log(
        `[Backlog Archive] Archived ${result.changedRows} backlogs older than ${cutoffDate}`,
      );
    }
  } catch (err) {
    console.error(
      "[Backlog Archive] Error archiving old backlogs:",
      err.message,
    );
  }
};

const ensurePositionsTable = async () => {
  await pool.promise().query(`
    CREATE TABLE IF NOT EXISTS positions (
      id INT AUTO_INCREMENT PRIMARY KEY,
      position_name VARCHAR(255) NOT NULL UNIQUE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
  `);

  try {
    await pool
      .promise()
      .query(`CREATE INDEX idx_positions_name ON positions (position_name)`);
  } catch (err) {
    if (!/Duplicate|exists/i.test(err.message)) {
      console.warn("Positions index warning:", err.message);
    }
  }
};

const ensureCivilStatusesTable = async () => {
  await pool.promise().query(`
    CREATE TABLE IF NOT EXISTS civil_statuses (
      id INT AUTO_INCREMENT PRIMARY KEY,
      civil_status_name VARCHAR(50) NOT NULL UNIQUE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
  `);

  const civilStatuses = ["Single", "Married", "Separated", "Widowed"];
  await pool
    .promise()
    .query(
      `INSERT IGNORE INTO civil_statuses (civil_status_name) VALUES ${civilStatuses
        .map(() => "(?)")
        .join(",")}`,
      civilStatuses,
    );

  try {
    await pool
      .promise()
      .query(
        `CREATE INDEX idx_civil_statuses_name ON civil_statuses (civil_status_name)`,
      );
  } catch (err) {
    if (!/Duplicate|exists/i.test(err.message)) {
      console.warn("Civil statuses index warning:", err.message);
    }
  }
};

const ensureSexesTable = async () => {
  await pool.promise().query(`
    CREATE TABLE IF NOT EXISTS sexes (
      id INT AUTO_INCREMENT PRIMARY KEY,
      sex_name VARCHAR(20) NOT NULL UNIQUE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
  `);

  const sexes = ["M", "F"];
  await pool
    .promise()
    .query(
      `INSERT IGNORE INTO sexes (sex_name) VALUES ${sexes
        .map(() => "(?)")
        .join(",")}`,
      sexes,
    );

  try {
    await pool
      .promise()
      .query(`CREATE INDEX idx_sexes_name ON sexes (sex_name)`);
  } catch (err) {
    if (!/Duplicate|exists/i.test(err.message)) {
      console.warn("Sexes index warning:", err.message);
    }
  }
};

const ensureDistrictsTable = async () => {
  await pool.promise().query(`
    CREATE TABLE IF NOT EXISTS districts (
      id INT AUTO_INCREMENT PRIMARY KEY,
      district_name VARCHAR(50) NOT NULL UNIQUE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
  `);

  const districts = Array.from({ length: 10 }, (_, index) => [
    `District ${index + 1}`,
  ]);

  await pool
    .promise()
    .query(
      `INSERT IGNORE INTO districts (district_name) VALUES ${districts
        .map(() => "(?)")
        .join(",")}`,
      districts,
    );

  try {
    await pool
      .promise()
      .query(`CREATE INDEX idx_districts_name ON districts (district_name)`);
  } catch (err) {
    if (!/Duplicate|exists/i.test(err.message)) {
      console.warn("Districts index warning:", err.message);
    }
  }
};

const ensureArchivingReasonsTable = async () => {
  await pool.promise().query(`
    CREATE TABLE IF NOT EXISTS archiving_reasons (
      id INT AUTO_INCREMENT PRIMARY KEY,
      reason_name VARCHAR(255) NOT NULL UNIQUE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
  `);

  const archivingReasons = [
    "Resignation",
    "Retirement",
    "Employment Termination",
    "Deceased",
    "Transfer to Another Agency",
    "Absent Without Official Leave",
    "Others",
  ];

  await pool
    .promise()
    .query(
      `INSERT IGNORE INTO archiving_reasons (reason_name) VALUES ${archivingReasons
        .map(() => "(?)")
        .join(",")}`,
      archivingReasons,
    );

  try {
    await pool
      .promise()
      .query(
        `CREATE INDEX idx_archiving_reasons_name ON archiving_reasons (reason_name)`,
      );
  } catch (err) {
    if (!/Duplicate|exists/i.test(err.message)) {
      console.warn("Archiving reasons index warning:", err.message);
    }
  }
};
const ensureEmployeePositionFK = async () => {
  // Check if position_id column exists
  const [columns] = await pool.promise().query(`
    SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_NAME = 'employees' AND COLUMN_NAME = 'position_id'
  `);

  if (columns.length === 0) {
    // Add position_id column
    await pool.promise().query(`
      ALTER TABLE employees
      ADD COLUMN position_id INT NULL AFTER \`position\`,
      ADD CONSTRAINT fk_employees_position_id FOREIGN KEY (position_id) REFERENCES positions(id) ON DELETE SET NULL;
    `);
  }
};

const ensureEmployeeCivilStatusSexFK = async () => {
  const [civilStatusColumns] = await pool.promise().query(`
    SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_NAME = 'employees' AND COLUMN_NAME = 'civil_status_id'
  `);

  if (civilStatusColumns.length === 0) {
    await pool.promise().query(`
      ALTER TABLE employees
      ADD COLUMN civil_status_id INT NULL AFTER civil_status,
      ADD CONSTRAINT fk_employees_civil_status_id FOREIGN KEY (civil_status_id) REFERENCES civil_statuses(id) ON DELETE SET NULL;
    `);
  }

  const [sexColumns] = await pool.promise().query(`
    SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_NAME = 'employees' AND COLUMN_NAME = 'sex_id'
  `);

  if (sexColumns.length === 0) {
    await pool.promise().query(`
      ALTER TABLE employees
      ADD COLUMN sex_id INT NULL AFTER sex,
      ADD CONSTRAINT fk_employees_sex_id FOREIGN KEY (sex_id) REFERENCES sexes(id) ON DELETE SET NULL;
    `);
  }
};

const ensureSalaryInformationTable = async () => {
  const salaryInformationRemarkValues = [
    "Step Increment",
    "Promotion",
    "Step Increment Increase",
  ];
  const salaryInformationRemarksSql = salaryInformationRemarkValues
    .map((value) => `'${String(value).replace(/'/g, "''")}'`)
    .join(",");

  await pool.promise().query(`
    CREATE TABLE IF NOT EXISTS salary_information (
      id INT AUTO_INCREMENT PRIMARY KEY,
      employee_id INT NOT NULL,
      salary_date DATE NOT NULL,
      plantilla VARCHAR(100) NULL,
      sg VARCHAR(20) NULL,
      step VARCHAR(20) NULL,
      salary DECIMAL(12,2) NOT NULL DEFAULT 0.00,
      increment_amount DECIMAL(12,2) NULL,
      increment_mode ENUM('AUTO', 'MANUAL') NOT NULL DEFAULT 'AUTO',
      remarks ENUM(${salaryInformationRemarksSql}) NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      CONSTRAINT fk_salary_information_employee_id
        FOREIGN KEY (employee_id)
        REFERENCES employees(id)
        ON DELETE CASCADE,
      INDEX idx_salary_information_employee_id (employee_id),
      INDEX idx_salary_information_employee_date (employee_id, salary_date)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
  `);


  await pool.promise().query(`
    UPDATE salary_information
    SET increment_mode = 'AUTO'
    WHERE increment_mode IS NULL;
  `);

  await pool.promise().query(`
    UPDATE salary_information
    SET remarks = NULL
    WHERE remarks IS NOT NULL
      AND TRIM(remarks) <> ''
      AND remarks NOT IN (${salaryInformationRemarksSql});
  `);

  await pool.promise().query(`
    ALTER TABLE salary_information
    MODIFY COLUMN remarks ENUM(${salaryInformationRemarksSql}) NULL;
  `);
};

const syncEmployeeSgFromSalaryInformation = async () => {
  await pool.promise().query(`
    UPDATE employees e
    SET e.sg = (
      SELECT si.sg
      FROM salary_information si
      WHERE si.employee_id = e.id
        AND si.sg IS NOT NULL
        AND TRIM(si.sg) <> ''
      ORDER BY si.salary_date DESC, si.id DESC
      LIMIT 1
    )
    WHERE (e.sg IS NULL OR TRIM(e.sg) = '')
      AND EXISTS (
        SELECT 1
        FROM salary_information sx
        WHERE sx.employee_id = e.id
          AND sx.sg IS NOT NULL
          AND TRIM(sx.sg) <> ''
      );
  `);
};

const ensureSalaryIncrementNoticesTable = async () => {
  const stepIncrementRemarkValues = ["Step Increment", "Step Increment Increase"];
  const stepIncrementRemarksSql = stepIncrementRemarkValues
    .map((value) => `'${String(value).replace(/'/g, "''")}'`)
    .join(",");

  await pool.promise().query(`
    CREATE TABLE IF NOT EXISTS salary_increment_notices (
      id INT AUTO_INCREMENT PRIMARY KEY,
      employee_id INT NOT NULL,
      salary_information_id INT NOT NULL,
      notice_reference VARCHAR(80) NOT NULL,
      effective_date DATE NOT NULL,
      previous_salary DECIMAL(12,2) NOT NULL DEFAULT 0.00,
      new_salary DECIMAL(12,2) NOT NULL DEFAULT 0.00,
      increment_amount DECIMAL(12,2) NOT NULL DEFAULT 0.00,
      remarks ENUM(${stepIncrementRemarksSql}) NOT NULL DEFAULT 'Step Increment',
      generated_by_user_id INT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      CONSTRAINT fk_salary_increment_notices_employee_id
        FOREIGN KEY (employee_id)
        REFERENCES employees(id)
        ON DELETE CASCADE,
      CONSTRAINT fk_salary_increment_notices_salary_info_id
        FOREIGN KEY (salary_information_id)
        REFERENCES salary_information(id)
        ON DELETE CASCADE,
      UNIQUE KEY uk_salary_increment_notices_salary_info_id (salary_information_id),
      INDEX idx_salary_increment_notices_employee_id (employee_id),
      INDEX idx_salary_increment_notices_effective_date (effective_date)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
  `);


  await pool.promise().query(`
    UPDATE salary_increment_notices
    SET remarks = 'Step Increment'
    WHERE remarks IS NULL
       OR TRIM(remarks) = ''
       OR remarks NOT IN (${stepIncrementRemarksSql});
  `);

  await pool.promise().query(`
    ALTER TABLE salary_increment_notices
    MODIFY COLUMN remarks ENUM(${stepIncrementRemarksSql}) NOT NULL DEFAULT 'Step Increment';
  `);
};

const ensureIndexes = async () => {
  // Create helpful indexes for common filters/sorts. Errors ignored if index already exists.
  const stmts = [
    `CREATE INDEX idx_leaves_employee_id ON leaves (employee_id)`,
    `CREATE INDEX idx_leaves_date_of_action ON leaves (date_of_action)`,
    `CREATE INDEX idx_users_first_last_email ON users (first_name, last_name, email)`,
    `CREATE INDEX idx_users_email ON users (email)`,
    `CREATE INDEX idx_employees_school_id ON employees (school_id)`,
    `CREATE INDEX idx_employees_position_id ON employees (position_id)`,
    `CREATE INDEX idx_employees_civil_status_id ON employees (civil_status_id)`,
    `CREATE INDEX idx_employees_sex_id ON employees (sex_id)`,
    // Optimized backlogs indexes for performance
    `CREATE INDEX idx_backlogs_is_archived_created_at ON backlogs (is_archived, created_at DESC)`,
    `CREATE INDEX idx_backlogs_user_id ON backlogs (user_id)`,
    `CREATE INDEX idx_backlogs_school_id ON backlogs (school_id)`,
    `CREATE INDEX idx_backlogs_created_at ON backlogs (created_at)`,
  ];

  for (const sql of stmts) {
    try {
      await pool.promise().query(sql);
    } catch (err) {
      // Ignore duplicate index errors and log others
      if (!/Duplicate|exists/i.test(err.message)) {
        console.warn("Index creation warning:", err.message);
      }
    }
  }
};

// Middleware
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
  }),
);
app.use(cors(corsOptions));
app.options("*", cors(corsOptions));
app.use(bodyParser.json({ limit: MAX_JSON_BODY_SIZE }));
app.use(bodyParser.urlencoded({ extended: true, limit: MAX_FORM_BODY_SIZE }));

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/leave", leaveRoutes);
app.use("/api/employees", employeeRoutes);
app.use("/api/schools", schoolRoutes);
app.use("/api/backlogs", backlogRoutes);
app.use("/api/registrations", registrationRoutes);
app.use("/api/users", userRoutes);

app.get(
  "/api/districts",
  authMiddleware,
  roleAuthMiddleware(["data-encoder", "admin", "super-admin"]),
  async (req, res) => {
    try {
      const [rows] = await pool
        .promise()
        .query("SELECT id, district_name FROM districts ORDER BY id ASC");
      return res.status(200).json({ data: rows });
    } catch (err) {
      return res.status(500).json({
        message: "Error retrieving districts",
        error: err.message,
      });
    }
  },
);

app.post(
  "/api/districts",
  authMiddleware,
  roleAuthMiddleware(["super-admin"]),
  validateRequest({ body: districtBodySchema }),
  async (req, res) => {
    try {
      const districtName = req.body.district_name.trim();
      const [existingRows] = await pool
        .promise()
        .query("SELECT id FROM districts WHERE district_name = ? LIMIT 1", [
          districtName,
        ]);

      if (existingRows.length > 0) {
        return res.status(409).json({ message: "District already exists" });
      }

      const [result] = await pool
        .promise()
        .query("INSERT INTO districts (district_name) VALUES (?)", [
          districtName,
        ]);

      return res.status(201).json({
        message: "District created successfully",
        data: { id: result.insertId, district_name: districtName },
      });
    } catch (err) {
      return res.status(500).json({
        message: "Error creating district",
        error: err.message,
      });
    }
  },
);

app.delete(
  "/api/districts/:id",
  authMiddleware,
  roleAuthMiddleware(["super-admin"]),
  validateRequest({ params: idParamSchema }),
  async (req, res) => {
    try {
      const [existingRows] = await pool
        .promise()
        .query("SELECT id, district_name FROM districts WHERE id = ? LIMIT 1", [
          req.params.id,
        ]);

      if (existingRows.length === 0) {
        return res.status(404).json({ message: "District not found" });
      }

      const districtName = String(existingRows[0].district_name || "").trim();
      const [[usageRow]] = await pool.promise().query(
        `SELECT COUNT(*) AS total
         FROM employees
         WHERE LOWER(TRIM(COALESCE(district, ''))) = LOWER(TRIM(?))
            OR LOWER(TRIM(COALESCE(work_district, ''))) = LOWER(TRIM(?))`,
        [districtName, districtName],
      );

      const assignedEmployees = Number(usageRow?.total || 0);
      if (assignedEmployees > 0) {
        return res.status(409).json({
          message: `Cannot delete district. ${assignedEmployees} employee record(s) are still assigned to it. Reassign employees first.`,
          data: { assignedEmployees },
        });
      }

      await pool
        .promise()
        .query("DELETE FROM districts WHERE id = ?", [req.params.id]);

      return res.status(200).json({
        message: "District deleted successfully",
        data: { id: Number(req.params.id) },
      });
    } catch (err) {
      return res.status(500).json({
        message: "Error deleting district",
        error: err.message,
      });
    }
  },
);

app.get(
  "/api/archiving-reasons",
  authMiddleware,
  roleAuthMiddleware(["super-admin"]),
  async (_req, res) => {
    try {
      const [rows] = await pool
        .promise()
        .query("SELECT id, reason_name FROM archiving_reasons ORDER BY id ASC");
      return res.status(200).json({ data: rows });
    } catch (err) {
      return res.status(500).json({
        message: "Error retrieving archiving reasons",
        error: err.message,
      });
    }
  },
);

app.post(
  "/api/archiving-reasons",
  authMiddleware,
  roleAuthMiddleware(["super-admin"]),
  validateRequest({ body: archivingReasonBodySchema }),
  async (req, res) => {
    try {
      const reasonName = req.body.reason_name.trim();
      const [existingRows] = await pool
        .promise()
        .query(
          "SELECT id FROM archiving_reasons WHERE reason_name = ? LIMIT 1",
          [reasonName],
        );

      if (existingRows.length > 0) {
        return res
          .status(409)
          .json({ message: "Archiving reason already exists" });
      }

      const [result] = await pool
        .promise()
        .query("INSERT INTO archiving_reasons (reason_name) VALUES (?)", [
          reasonName,
        ]);

      return res.status(201).json({
        message: "Archiving reason created successfully",
        data: { id: result.insertId, reason_name: reasonName },
      });
    } catch (err) {
      return res.status(500).json({
        message: "Error creating archiving reason",
        error: err.message,
      });
    }
  },
);

app.delete(
  "/api/archiving-reasons/:id",
  authMiddleware,
  roleAuthMiddleware(["super-admin"]),
  validateRequest({ params: idParamSchema }),
  async (req, res) => {
    try {
      const [existingRows] = await pool
        .promise()
        .query(
          "SELECT id, reason_name FROM archiving_reasons WHERE id = ? LIMIT 1",
          [req.params.id],
        );

      if (existingRows.length === 0) {
        return res.status(404).json({ message: "Archiving reason not found" });
      }

      await pool
        .promise()
        .query("DELETE FROM archiving_reasons WHERE id = ?", [req.params.id]);

      return res.status(200).json({
        message: "Archiving reason deleted successfully",
        data: { id: Number(req.params.id) },
      });
    } catch (err) {
      return res.status(500).json({
        message: "Error deleting archiving reason",
        error: err.message,
      });
    }
  },
);

app.get(
  "/api/positions",
  authMiddleware,
  roleAuthMiddleware(["data-encoder", "admin", "super-admin"]),
  async (req, res) => {
    try {
      const positions = await Position.getAll();
      return res.status(200).json({ data: positions });
    } catch (err) {
      return res.status(500).json({
        message: "Error retrieving positions",
        error: err.message,
      });
    }
  },
);

app.get(
  "/api/civil-statuses",
  authMiddleware,
  roleAuthMiddleware(["data-encoder", "admin", "super-admin"]),
  async (_req, res) => {
    try {
      const [rows] = await pool
        .promise()
        .query(
          "SELECT id, civil_status_name FROM civil_statuses ORDER BY id ASC",
        );
      return res.status(200).json({ data: rows });
    } catch (err) {
      return res.status(500).json({
        message: "Error retrieving civil statuses",
        error: err.message,
      });
    }
  },
);

app.post(
  "/api/civil-statuses",
  authMiddleware,
  roleAuthMiddleware(["super-admin"]),
  validateRequest({ body: civilStatusBodySchema }),
  async (req, res) => {
    try {
      const civilStatusName = req.body.civil_status_name.trim();
      const [existingRows] = await pool
        .promise()
        .query(
          "SELECT id FROM civil_statuses WHERE civil_status_name = ? LIMIT 1",
          [civilStatusName],
        );

      if (existingRows.length > 0) {
        return res.status(409).json({
          message: "Civil status already exists",
        });
      }

      const [result] = await pool
        .promise()
        .query("INSERT INTO civil_statuses (civil_status_name) VALUES (?)", [
          civilStatusName,
        ]);

      return res.status(201).json({
        message: "Civil status created successfully",
        data: {
          id: result.insertId,
          civil_status_name: civilStatusName,
        },
      });
    } catch (err) {
      return res.status(500).json({
        message: "Error creating civil status",
        error: err.message,
      });
    }
  },
);

app.delete(
  "/api/civil-statuses/:id",
  authMiddleware,
  roleAuthMiddleware(["super-admin"]),
  validateRequest({ params: idParamSchema }),
  async (req, res) => {
    try {
      const [existingRows] = await pool
        .promise()
        .query(
          "SELECT id, civil_status_name FROM civil_statuses WHERE id = ? LIMIT 1",
          [req.params.id],
        );

      if (existingRows.length === 0) {
        return res.status(404).json({ message: "Civil status not found" });
      }

      await pool
        .promise()
        .query("DELETE FROM civil_statuses WHERE id = ?", [req.params.id]);

      return res.status(200).json({
        message: "Civil status deleted successfully",
        data: { id: Number(req.params.id) },
      });
    } catch (err) {
      return res.status(500).json({
        message: "Error deleting civil status",
        error: err.message,
      });
    }
  },
);

app.get(
  "/api/sexes",
  authMiddleware,
  roleAuthMiddleware(["data-encoder", "admin", "super-admin"]),
  async (_req, res) => {
    try {
      const [rows] = await pool
        .promise()
        .query("SELECT id, sex_name FROM sexes ORDER BY id ASC");
      return res.status(200).json({ data: rows });
    } catch (err) {
      return res.status(500).json({
        message: "Error retrieving sexes",
        error: err.message,
      });
    }
  },
);

app.post(
  "/api/sexes",
  authMiddleware,
  roleAuthMiddleware(["super-admin"]),
  validateRequest({ body: sexBodySchema }),
  async (req, res) => {
    try {
      const sexName = req.body.sex_name.trim();
      const [existingRows] = await pool
        .promise()
        .query("SELECT id FROM sexes WHERE sex_name = ? LIMIT 1", [sexName]);

      if (existingRows.length > 0) {
        return res.status(409).json({ message: "Sex already exists" });
      }

      const [result] = await pool
        .promise()
        .query("INSERT INTO sexes (sex_name) VALUES (?)", [sexName]);

      return res.status(201).json({
        message: "Sex created successfully",
        data: { id: result.insertId, sex_name: sexName },
      });
    } catch (err) {
      return res.status(500).json({
        message: "Error creating sex",
        error: err.message,
      });
    }
  },
);

app.delete(
  "/api/sexes/:id",
  authMiddleware,
  roleAuthMiddleware(["super-admin"]),
  validateRequest({ params: idParamSchema }),
  async (req, res) => {
    try {
      const [existingRows] = await pool
        .promise()
        .query("SELECT id, sex_name FROM sexes WHERE id = ? LIMIT 1", [
          req.params.id,
        ]);

      if (existingRows.length === 0) {
        return res.status(404).json({ message: "Sex not found" });
      }

      await pool
        .promise()
        .query("DELETE FROM sexes WHERE id = ?", [req.params.id]);

      return res.status(200).json({
        message: "Sex deleted successfully",
        data: { id: Number(req.params.id) },
      });
    } catch (err) {
      return res.status(500).json({
        message: "Error deleting sex",
        error: err.message,
      });
    }
  },
);

app.post(
  "/api/positions",
  authMiddleware,
  roleAuthMiddleware(["super-admin"]),
  validateRequest({ body: positionBodySchema }),
  async (req, res) => {
    try {
      const positionName = req.body.position_name.trim();
      const [existingRows] = await pool
        .promise()
        .query("SELECT id FROM positions WHERE position_name = ? LIMIT 1", [
          positionName,
        ]);

      if (existingRows.length > 0) {
        return res.status(409).json({
          message: "Position already exists",
        });
      }

      const [result] = await pool
        .promise()
        .query("INSERT INTO positions (position_name) VALUES (?)", [
          positionName,
        ]);

      return res.status(201).json({
        message: "Position created successfully",
        data: { id: result.insertId, position_name: positionName },
      });
    } catch (err) {
      return res.status(500).json({
        message: "Error creating position",
        error: err.message,
      });
    }
  },
);

app.delete(
  "/api/positions/:id",
  authMiddleware,
  roleAuthMiddleware(["super-admin"]),
  validateRequest({ params: idParamSchema }),
  async (req, res) => {
    try {
      const [existingRows] = await pool
        .promise()
        .query("SELECT id, position_name FROM positions WHERE id = ? LIMIT 1", [
          req.params.id,
        ]);

      if (existingRows.length === 0) {
        return res.status(404).json({ message: "Position not found" });
      }

      await pool
        .promise()
        .query("DELETE FROM positions WHERE id = ?", [req.params.id]);

      return res.status(200).json({
        message: "Position deleted successfully",
        data: { id: Number(req.params.id) },
      });
    } catch (err) {
      return res.status(500).json({
        message: "Error deleting position",
        error: err.message,
      });
    }
  },
);

// Start the server
app.listen(PORT, async () => {
  console.log(`Server is running on port ${PORT}`);
  try {
    const conn = await pool.promise().getConnection();
    console.log("✔  MySQL database connected successfully");
    conn.release();

    await ensureSecurityTables();
    console.log("✔  Security tables are ready");

    await ensureLeaveLedgerSchema();
    console.log("✔  Leave ledger schema is ready");

    await ensureEmployeeArchiveSchema();
    console.log("✔  Employee archive schema is ready");

    await ensureEmployeeLeaveStatusSchema();
    console.log("✔  Employee leave status schema is ready");

    await ensureBirthdateSchema();
    console.log("✔  Birthdate schema is ready");

    await ensureMiddleNameSchema();
    console.log("✔  Middle name schema is ready");

    await ensureEmployeeTypeSchema();
    console.log("✔  Employee type schema is ready");

    await ensureEmployeeProfileSchema();
    console.log("✔  Employee profile schema is ready");

    await syncEmployeeServiceMetrics();
    console.log("✔  Employee service metrics are synced");

    await ensureBacklogArchiveSchema();
    console.log("✔  Backlog archive schema is ready");

    await ensurePositionsTable();
    console.log("✔  Positions table is ready");

    await ensureCivilStatusesTable();
    console.log("✔  Civil statuses table is ready");

    await ensureSexesTable();
    console.log("✔  Sexes table is ready");

    await ensureDistrictsTable();
    console.log("✔  Districts table is ready");

    await ensureArchivingReasonsTable();
    console.log("✔  Archiving reasons table is ready");

    await ensureEmployeePositionFK();
    console.log("✔  Employee position foreign key is ready");

    await ensureEmployeeCivilStatusSexFK();
    console.log("✔  Employee civil status and sex foreign keys are ready");

    await ensureSalaryInformationTable();
    console.log("✔  Salary information table is ready");

    await ensureSalaryIncrementNoticesTable();
    console.log("✔  Salary increment notices table is ready");

    const salaryDateSyncStartupResult =
      await SalaryInformation.syncThreeYearSalaryDateEntries();
    console.log(
      `[Salary Information] 3-year date sync on startup: employees=${salaryDateSyncStartupResult.employeesChecked}, generated=${salaryDateSyncStartupResult.generated}, as_of=${salaryDateSyncStartupResult.asOfDate}`,
    );

    await ensureIndexes();
    console.log("✔  Database indexes ensured (best-effort)");

    // Archive old backlogs on startup
    await archiveOldBacklogs();

    if (AUTO_MONTHLY_CREDIT_ENABLED) {
      // Catch up on startup (safe because duplicate monthly entries are skipped).
      const startupResult = await autoCreditCurrentMonth();
      console.log(
        `[Auto Credit] Startup run complete for ${startupResult.period}: credited=${startupResult.credited}, skipped=${startupResult.skipped}`,
      );

      // Run every month at 00:00 on day 1 (server local time).
      cron.schedule("0 0 1 * *", async () => {
        try {
          const result = await autoCreditCurrentMonth();
          console.log(
            `[Auto Credit] Scheduled run complete for ${result.period}: credited=${result.credited}, skipped=${result.skipped}`,
          );
        } catch (error) {
          console.error("[Auto Credit] Scheduled run failed:", error.message);
        }
      });

      console.log(
        "[Auto Credit] Scheduler enabled (runs monthly on day 1 at 00:00).",
      );
    } else {
      console.log(
        "[Auto Credit] Scheduler disabled via AUTO_MONTHLY_CREDIT=false.",
      );
    }

    // Run backlog archiving, service metrics sync, and salary-date sync daily at 01:00 AM.
    cron.schedule("0 1 * * *", async () => {
      try {
        await archiveOldBacklogs();
        await syncEmployeeServiceMetrics();

        const salaryDateSyncResult =
          await SalaryInformation.syncThreeYearSalaryDateEntries();
        if (salaryDateSyncResult.generated > 0) {
          console.log(
            `[Salary Information] 3-year date sync scheduled run: employees=${salaryDateSyncResult.employeesChecked}, generated=${salaryDateSyncResult.generated}, as_of=${salaryDateSyncResult.asOfDate}`,
          );
        }
      } catch (error) {
        console.error("[Backlog Archive] Scheduled run failed:", error.message);
      }
    });

    console.log(
      "[Backlog Archive] Scheduler enabled (runs daily at 01:00 AM).",
    );
  } catch (err) {
    console.error("✘  MySQL connection failed:", err.message);
  }
});
