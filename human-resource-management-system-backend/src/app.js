require("./config/loadEnv");

const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
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
    .query(`CREATE UNIQUE INDEX ${indexName} ON ${tableName} (${quotedColumns})`);
};

const ensureBirthdateSchema = async () => {
  const targets = [
    { table: "employees", column: "birthdate", definition: "DATE NULL" },
    { table: "users", column: "birthdate", definition: "DATE NULL" },
    {
      table: "registration_requests",
      column: "birthdate",
      definition: "DATE NULL",
    },
  ];

  for (const target of targets) {
    const [rows] = await pool.promise().query(
      `SELECT COLUMN_NAME
       FROM INFORMATION_SCHEMA.COLUMNS
       WHERE TABLE_SCHEMA = DATABASE()
         AND TABLE_NAME = ?
         AND COLUMN_NAME = ?
       LIMIT 1`,
      [target.table, target.column],
    );

    if (rows.length === 0) {
      await pool.promise().query(`
        ALTER TABLE ${target.table}
        ADD COLUMN ${target.column} ${target.definition};
      `);
    }
  }
};

const ensureMiddleNameSchema = async () => {
  const targets = [
    { table: "employees", column: "middle_name", definition: "VARCHAR(255) NULL" },
    { table: "users", column: "middle_name", definition: "VARCHAR(255) NULL" },
    {
      table: "registration_requests",
      column: "middle_name",
      definition: "VARCHAR(255) NULL",
    },
  ];

  for (const target of targets) {
    const [rows] = await pool.promise().query(
      `SELECT COLUMN_NAME
       FROM INFORMATION_SCHEMA.COLUMNS
       WHERE TABLE_SCHEMA = DATABASE()
         AND TABLE_NAME = ?
         AND COLUMN_NAME = ?
       LIMIT 1`,
      [target.table, target.column],
    );

    if (rows.length === 0) {
      await pool.promise().query(`
        ALTER TABLE ${target.table}
        ADD COLUMN ${target.column} ${target.definition};
      `);
    }
  }
};

const ensureWorkInformationTable = async () => {
  await pool.promise().query(`
    CREATE TABLE IF NOT EXISTS work_information (
      id INT AUTO_INCREMENT PRIMARY KEY,
      employee_id INT NOT NULL,
      employee_type VARCHAR(32) NULL,
      employee_no VARCHAR(100) NULL,
      work_email VARCHAR(255) NULL,
      district VARCHAR(255) NULL,
      position VARCHAR(255) NULL,
      position_id INT NULL,
      plantilla_no VARCHAR(100) NULL,
      sg VARCHAR(20) NULL,
      date_of_first_appointment DATE NULL,
      years_in_service INT NULL,
      loyalty_bonus ENUM('Yes', 'No') NOT NULL DEFAULT 'No',
      current_employee_type VARCHAR(32) NULL,
      current_position VARCHAR(255) NULL,
      current_plantilla_no VARCHAR(100) NULL,
      current_appointment_date DATE NULL,
      current_sg VARCHAR(20) NULL,
      prc_license_no VARCHAR(100) NULL,
      tin VARCHAR(50) NULL,
      gsis_bp_no VARCHAR(50) NULL,
      gsis_crn_no VARCHAR(50) NULL,
      pagibig_no VARCHAR(50) NULL,
      philhealth_no VARCHAR(50) NULL,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      UNIQUE KEY uk_work_information_employee_id (employee_id),
      UNIQUE KEY uk_work_information_employee_no (employee_no),
      UNIQUE KEY uk_work_information_work_email (work_email),
      UNIQUE KEY uk_work_information_plantilla_no (plantilla_no),
      UNIQUE KEY uk_work_information_prc_license_no (prc_license_no),
      UNIQUE KEY uk_work_information_tin (tin),
      UNIQUE KEY uk_work_information_gsis_bp_no (gsis_bp_no),
      UNIQUE KEY uk_work_information_gsis_crn_no (gsis_crn_no),
      UNIQUE KEY uk_work_information_pagibig_no (pagibig_no),
      UNIQUE KEY uk_work_information_philhealth_no (philhealth_no),
      KEY idx_work_information_position_id (position_id),
      CONSTRAINT fk_work_information_employee_id FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE ON UPDATE CASCADE,
      CONSTRAINT fk_work_information_position_id FOREIGN KEY (position_id) REFERENCES positions(id) ON DELETE SET NULL
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
  `);

  await pool.promise().query(`
    UPDATE work_information
    SET employee_no = NULLIF(TRIM(employee_no), ''),
        work_email = NULLIF(TRIM(work_email), ''),
        district = NULLIF(TRIM(district), ''),
        position = NULLIF(TRIM(position), ''),
        plantilla_no = NULLIF(TRIM(plantilla_no), ''),
        sg = NULLIF(TRIM(sg), ''),
        current_employee_type = NULLIF(TRIM(current_employee_type), ''),
        current_position = NULLIF(TRIM(current_position), ''),
        current_plantilla_no = NULLIF(TRIM(current_plantilla_no), ''),
        current_sg = NULLIF(TRIM(current_sg), ''),
        prc_license_no = NULLIF(TRIM(prc_license_no), ''),
        tin = NULLIF(TRIM(tin), ''),
        gsis_bp_no = NULLIF(TRIM(gsis_bp_no), ''),
        gsis_crn_no = NULLIF(TRIM(gsis_crn_no), ''),
        pagibig_no = NULLIF(TRIM(pagibig_no), ''),
        philhealth_no = NULLIF(TRIM(philhealth_no), '');
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
       AND TABLE_NAME = 'work_information'
       AND COLUMN_NAME = 'employee_type'
     LIMIT 1`,
  );

  const currentType = typeRows?.[0]?.column_type || "";
  if (!/^enum\(/i.test(currentType)) {
    await pool.promise().query(`
      ALTER TABLE work_information
      MODIFY COLUMN employee_type ENUM('teaching','non-teaching','teaching-related') NULL;
    `);
    return;
  }

  const currentEnumValues = parseEnumValues(currentType);
  const mergedValues = Array.from(
    new Set([...currentEnumValues, "teaching-related"]),
  );

  if (mergedValues.length !== currentEnumValues.length) {
    const enumSql = toEnumSql(mergedValues);
    await pool.promise().query(`
      ALTER TABLE work_information
      MODIFY COLUMN employee_type ENUM(${enumSql}) NULL;
    `);
  }

  await pool.promise().query(`
    UPDATE work_information
    SET employee_type = 'teaching-related'
    WHERE LOWER(REPLACE(REPLACE(employee_type, '_', '-'), ' ', '-')) = 'teaching-related'
      AND employee_type <> 'teaching-related';
  `);

  await pool.promise().query(`
    UPDATE work_information
    SET current_employee_type = 'teaching-related'
    WHERE LOWER(REPLACE(REPLACE(current_employee_type, '_', '-'), ' ', '-')) = 'teaching-related'
      AND current_employee_type <> 'teaching-related';
  `);
};

const ensureEmployeeProfileSchema = async () => {
  const addColumnIfMissing = async (columnName, definition) => {
    const [rows] = await pool.promise().query(
      `SELECT COLUMN_NAME
       FROM INFORMATION_SCHEMA.COLUMNS
       WHERE TABLE_SCHEMA = DATABASE()
         AND TABLE_NAME = 'work_information'
         AND COLUMN_NAME = ?
       LIMIT 1`,
      [columnName],
    );

    if (rows.length === 0) {
      await pool.promise().query(`ALTER TABLE work_information ADD COLUMN ${definition};`);
    }
  };

  await addColumnIfMissing(
    "current_employee_type",
    "current_employee_type VARCHAR(32) NULL AFTER loyalty_bonus",
  );
  await addColumnIfMissing(
    "current_position",
    "current_position VARCHAR(255) NULL AFTER current_employee_type",
  );
  await addColumnIfMissing(
    "current_plantilla_no",
    "current_plantilla_no VARCHAR(100) NULL AFTER current_position",
  );
  await addColumnIfMissing(
    "current_appointment_date",
    "current_appointment_date DATE NULL AFTER current_plantilla_no",
  );
  await addColumnIfMissing(
    "current_sg",
    "current_sg VARCHAR(20) NULL AFTER current_appointment_date",
  );
  await addColumnIfMissing("sg", "sg VARCHAR(20) NULL AFTER plantilla_no");
  await addColumnIfMissing(
    "district",
    "district VARCHAR(255) NULL AFTER work_email",
  );
  await addColumnIfMissing(
    "position",
    "position VARCHAR(255) NULL AFTER district",
  );
  await addColumnIfMissing(
    "position_id",
    "position_id INT NULL AFTER position",
  );
  await addColumnIfMissing(
    "employee_no",
    "employee_no VARCHAR(100) NULL AFTER employee_type",
  );
  await addColumnIfMissing(
    "work_email",
    "work_email VARCHAR(255) NULL AFTER employee_no",
  );
  await addColumnIfMissing(
    "plantilla_no",
    "plantilla_no VARCHAR(100) NULL AFTER position_id",
  );
  await addColumnIfMissing(
    "date_of_first_appointment",
    "date_of_first_appointment DATE NULL AFTER sg",
  );
  await addColumnIfMissing(
    "years_in_service",
    "years_in_service INT NULL AFTER date_of_first_appointment",
  );
  await addColumnIfMissing(
    "loyalty_bonus",
    "loyalty_bonus ENUM('Yes', 'No') NOT NULL DEFAULT 'No' AFTER years_in_service",
  );
  await addColumnIfMissing(
    "prc_license_no",
    "prc_license_no VARCHAR(100) NULL AFTER current_sg",
  );
  await addColumnIfMissing("tin", "tin VARCHAR(50) NULL AFTER prc_license_no");
  await addColumnIfMissing(
    "gsis_bp_no",
    "gsis_bp_no VARCHAR(50) NULL AFTER tin",
  );
  await addColumnIfMissing(
    "gsis_crn_no",
    "gsis_crn_no VARCHAR(50) NULL AFTER gsis_bp_no",
  );
  await addColumnIfMissing(
    "pagibig_no",
    "pagibig_no VARCHAR(50) NULL AFTER gsis_crn_no",
  );
  await addColumnIfMissing(
    "philhealth_no",
    "philhealth_no VARCHAR(50) NULL AFTER pagibig_no",
  );

  await pool.promise().query(`
    UPDATE work_information
    SET employee_no = NULLIF(TRIM(employee_no), ''),
        work_email = NULLIF(TRIM(work_email), ''),
        district = NULLIF(TRIM(district), ''),
        position = NULLIF(TRIM(position), ''),
        plantilla_no = NULLIF(TRIM(plantilla_no), ''),
        sg = NULLIF(TRIM(sg), ''),
        current_employee_type = NULLIF(TRIM(current_employee_type), ''),
        current_position = NULLIF(TRIM(current_position), ''),
        current_plantilla_no = NULLIF(TRIM(current_plantilla_no), ''),
        current_sg = NULLIF(TRIM(current_sg), ''),
        prc_license_no = NULLIF(TRIM(prc_license_no), ''),
        tin = NULLIF(TRIM(tin), ''),
        gsis_bp_no = NULLIF(TRIM(gsis_bp_no), ''),
        gsis_crn_no = NULLIF(TRIM(gsis_crn_no), ''),
        pagibig_no = NULLIF(TRIM(pagibig_no), ''),
        philhealth_no = NULLIF(TRIM(philhealth_no), '');
  `);

  const indexStatements = [
    `CREATE INDEX idx_work_information_district ON work_information (district)`,
    `CREATE INDEX idx_work_information_position_id ON work_information (position_id)`,
  ];

  for (const sql of indexStatements) {
    try {
      await pool.promise().query(sql);
    } catch (err) {
      if (!/Duplicate|exists/i.test(err.message)) {
        console.warn("Work information index warning:", err.message);
      }
    }
  }

  const uniqueIndexStatements = [
    ["uk_work_information_employee_no", ["employee_no"]],
    ["uk_work_information_work_email", ["work_email"]],
    ["uk_work_information_plantilla_no", ["plantilla_no"]],
    ["uk_work_information_prc_license_no", ["prc_license_no"]],
    ["uk_work_information_tin", ["tin"]],
    ["uk_work_information_gsis_bp_no", ["gsis_bp_no"]],
    ["uk_work_information_gsis_crn_no", ["gsis_crn_no"]],
    ["uk_work_information_pagibig_no", ["pagibig_no"]],
    ["uk_work_information_philhealth_no", ["philhealth_no"]],
  ];

  for (const [indexName, columns] of uniqueIndexStatements) {
    try {
      await ensureUniqueIndex("work_information", indexName, columns);
    } catch (err) {
      if (!/Duplicate|exists/i.test(err.message)) {
        console.warn("Work information unique index warning:", err.message);
      }
    }
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
  const [columns] = await pool.promise().query(`
    SELECT COLUMN_NAME
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'work_information'
      AND COLUMN_NAME = 'position_id'
    LIMIT 1
  `);

  if (columns.length === 0) {
    await pool.promise().query(`
      ALTER TABLE work_information
      ADD COLUMN position_id INT NULL AFTER position;
    `);
  }

  await ensureIndexedColumn(
    "work_information",
    "position_id",
    "idx_work_information_position_id",
  );

  await ensureForeignKeyConstraint({
    tableName: "work_information",
    constraintName: "fk_work_information_position_id",
    columnName: "position_id",
    referencedTable: "positions",
    referencedColumn: "id",
    onDelete: "SET NULL",
  });
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

const getColumnTypeSql = async (
  tableName,
  columnName,
  fallbackType = "INT",
) => {
  const [rows] = await pool.promise().query(
    `SELECT COLUMN_TYPE AS column_type
     FROM INFORMATION_SCHEMA.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE()
       AND TABLE_NAME = ?
       AND COLUMN_NAME = ?
     LIMIT 1`,
    [tableName, columnName],
  );

  return rows?.[0]?.column_type || fallbackType;
};

const ensureTableEngineInnoDb = async (tableName) => {
  const [rows] = await pool.promise().query(
    `SELECT ENGINE AS engine
     FROM INFORMATION_SCHEMA.TABLES
     WHERE TABLE_SCHEMA = DATABASE()
       AND TABLE_NAME = ?
     LIMIT 1`,
    [tableName],
  );

  const currentEngine = String(rows?.[0]?.engine || "").toUpperCase();
  if (currentEngine && currentEngine !== "INNODB") {
    await pool.promise().query(`ALTER TABLE \`${tableName}\` ENGINE=InnoDB`);
  }
};

const ensureIndexedColumn = async (tableName, columnName, indexName) => {
  const [rows] = await pool.promise().query(
    `SELECT 1
     FROM INFORMATION_SCHEMA.STATISTICS
     WHERE TABLE_SCHEMA = DATABASE()
       AND TABLE_NAME = ?
       AND COLUMN_NAME = ?
     LIMIT 1`,
    [tableName, columnName],
  );

  if (rows.length > 0) {
    return;
  }

  try {
    await pool
      .promise()
      .query(
        `CREATE INDEX \`${indexName}\` ON \`${tableName}\` (\`${columnName}\`)`,
      );
  } catch (err) {
    if (!/Duplicate|exists/i.test(err.message)) {
      throw err;
    }
  }
};

const ensureForeignKeyConstraint = async ({
  tableName,
  constraintName,
  columnName,
  referencedTable,
  referencedColumn,
  onDelete,
  onUpdate,
}) => {
  const [rows] = await pool.promise().query(
    `SELECT 1
     FROM INFORMATION_SCHEMA.REFERENTIAL_CONSTRAINTS
     WHERE CONSTRAINT_SCHEMA = DATABASE()
       AND TABLE_NAME = ?
       AND CONSTRAINT_NAME = ?
     LIMIT 1`,
    [tableName, constraintName],
  );

  if (rows.length > 0) {
    return;
  }

  const deleteClause = onDelete ? ` ON DELETE ${onDelete}` : "";
  const updateClause = onUpdate ? ` ON UPDATE ${onUpdate}` : "";

  await pool.promise().query(`
    ALTER TABLE \`${tableName}\`
    ADD CONSTRAINT \`${constraintName}\`
      FOREIGN KEY (\`${columnName}\`)
      REFERENCES \`${referencedTable}\`(\`${referencedColumn}\`)${deleteClause}${updateClause};
  `);
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

  const employeeIdColumnType = await getColumnTypeSql("employees", "id", "INT");

  await ensureTableEngineInnoDb("employees");
  await ensureIndexedColumn("employees", "id", "idx_employees_id_fk");

  await pool.promise().query(`
    CREATE TABLE IF NOT EXISTS salary_information (
      id INT AUTO_INCREMENT PRIMARY KEY,
      employee_id ${employeeIdColumnType} NOT NULL,
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
      INDEX idx_salary_information_employee_id (employee_id),
      INDEX idx_salary_information_employee_date (employee_id, salary_date)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
  `);

  await pool.promise().query(`
    ALTER TABLE salary_information
    MODIFY COLUMN employee_id ${employeeIdColumnType} NOT NULL;
  `);

  await ensureForeignKeyConstraint({
    tableName: "salary_information",
    constraintName: "fk_salary_information_employee_id",
    columnName: "employee_id",
    referencedTable: "employees",
    referencedColumn: "id",
    onDelete: "CASCADE",
    onUpdate: "CASCADE",
  });

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
    UPDATE work_information wi
    SET wi.sg = (
      SELECT si.sg
      FROM salary_information si
      WHERE si.employee_id = wi.employee_id
        AND si.sg IS NOT NULL
        AND TRIM(si.sg) <> ''
      ORDER BY si.salary_date DESC, si.id DESC
      LIMIT 1
    )
    WHERE (wi.sg IS NULL OR TRIM(wi.sg) = '')
      AND EXISTS (
        SELECT 1
        FROM salary_information sx
        WHERE sx.employee_id = wi.employee_id
          AND sx.sg IS NOT NULL
          AND TRIM(sx.sg) <> ''
      );
  `);
};

const syncEmployeeServiceMetrics = async () => {
  await pool.promise().query(`
    UPDATE work_information
    SET date_of_first_appointment = NULL
    WHERE date_of_first_appointment IS NULL;
  `);

  await pool.promise().query(`
    UPDATE work_information
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

const ensureSalaryIncrementNoticesTable = async () => {
  const stepIncrementRemarkValues = [
    "Step Increment",
    "Step Increment Increase",
  ];
  const stepIncrementRemarksSql = stepIncrementRemarkValues
    .map((value) => `'${String(value).replace(/'/g, "''")}'`)
    .join(",");

  const employeeIdColumnType = await getColumnTypeSql("employees", "id", "INT");
  const salaryInformationIdColumnType = await getColumnTypeSql(
    "salary_information",
    "id",
    "INT",
  );

  await ensureTableEngineInnoDb("employees");
  await ensureTableEngineInnoDb("salary_information");
  await ensureIndexedColumn("employees", "id", "idx_employees_id_fk");
  await ensureIndexedColumn(
    "salary_information",
    "id",
    "idx_salary_information_id_fk",
  );

  await pool.promise().query(`
    CREATE TABLE IF NOT EXISTS salary_increment_notices (
      id INT AUTO_INCREMENT PRIMARY KEY,
      employee_id ${employeeIdColumnType} NOT NULL,
      salary_information_id ${salaryInformationIdColumnType} NOT NULL,
      notice_reference VARCHAR(80) NOT NULL,
      effective_date DATE NOT NULL,
      previous_salary DECIMAL(12,2) NOT NULL DEFAULT 0.00,
      new_salary DECIMAL(12,2) NOT NULL DEFAULT 0.00,
      increment_amount DECIMAL(12,2) NOT NULL DEFAULT 0.00,
      remarks ENUM(${stepIncrementRemarksSql}) NOT NULL DEFAULT 'Step Increment',
      generated_by_user_id INT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      UNIQUE KEY uk_salary_increment_notices_salary_info_id (salary_information_id),
      INDEX idx_salary_increment_notices_employee_id (employee_id),
      INDEX idx_salary_increment_notices_effective_date (effective_date)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
  `);

  await pool.promise().query(`
    ALTER TABLE salary_increment_notices
    MODIFY COLUMN employee_id ${employeeIdColumnType} NOT NULL,
    MODIFY COLUMN salary_information_id ${salaryInformationIdColumnType} NOT NULL;
  `);

  await ensureForeignKeyConstraint({
    tableName: "salary_increment_notices",
    constraintName: "fk_salary_increment_notices_employee_id",
    columnName: "employee_id",
    referencedTable: "employees",
    referencedColumn: "id",
    onDelete: "CASCADE",
    onUpdate: "CASCADE",
  });

  await ensureForeignKeyConstraint({
    tableName: "salary_increment_notices",
    constraintName: "fk_salary_increment_notices_salary_info_id",
    columnName: "salary_information_id",
    referencedTable: "salary_information",
    referencedColumn: "id",
    onDelete: "CASCADE",
    onUpdate: "CASCADE",
  });

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

const ensureIndexes = async () => {
  const stmts = [
    `CREATE INDEX idx_leaves_employee_id ON leaves (employee_id)`,
    `CREATE INDEX idx_leaves_date_of_action ON leaves (date_of_action)`,
    `CREATE INDEX idx_users_first_last_email ON users (first_name, last_name, email)`,
    `CREATE INDEX idx_users_email ON users (email)`,
    `CREATE INDEX idx_employees_school_id ON employees (school_id)`,
    `CREATE INDEX idx_employees_civil_status_id ON employees (civil_status_id)`,
    `CREATE INDEX idx_employees_sex_id ON employees (sex_id)`,
    `CREATE INDEX idx_backlogs_is_archived_created_at ON backlogs (is_archived, created_at DESC)`,
    `CREATE INDEX idx_backlogs_user_id ON backlogs (user_id)`,
    `CREATE INDEX idx_backlogs_school_id ON backlogs (school_id)`,
    `CREATE INDEX idx_backlogs_created_at ON backlogs (created_at)`,
  ];

  for (const sql of stmts) {
    try {
      await pool.promise().query(sql);
    } catch (err) {
      if (!/Duplicate|exists/i.test(err.message)) {
        console.warn("Index creation warning:", err.message);
      }
    }
  }
};

const securityHeader = (req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "SAMEORIGIN");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  res.setHeader("Permissions-Policy", "geolocation=(), camera=(), microphone=()");
  res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");
  next();
};

app.use(securityHeader);
app.use(cors(corsOptions));
app.options("*", cors(corsOptions));
app.use(bodyParser.json({ limit: MAX_JSON_BODY_SIZE }));
app.use(bodyParser.urlencoded({ extended: true, limit: MAX_FORM_BODY_SIZE }));

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
         FROM work_information
         WHERE LOWER(TRIM(COALESCE(district, ''))) = LOWER(TRIM(?))`,
        [districtName],
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

const ensureAutoIncrementPrimaryKeyId = async (tableName) => {
  const [columnRows] = await pool.promise().query(
    `SELECT COLUMN_NAME, COLUMN_TYPE, COLUMN_KEY, EXTRA
     FROM INFORMATION_SCHEMA.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE()
       AND TABLE_NAME = ?
       AND COLUMN_NAME = 'id'
     LIMIT 1`,
    [tableName],
  );

  if (columnRows.length === 0) {
    console.warn(`[Schema] Table ${tableName} has no id column; skipping.`);
    return;
  }

  const idColumn = columnRows[0];
  const hasPrimaryKey = String(idColumn.COLUMN_KEY || "").toUpperCase() === "PRI";
  const isAutoIncrement = String(idColumn.EXTRA || "")
    .toLowerCase()
    .includes("auto_increment");

  if (!hasPrimaryKey) {
    try {
      await pool
        .promise()
        .query(`ALTER TABLE \`${tableName}\` ADD PRIMARY KEY (\`id\`)`);
      console.log(`✔  Added PRIMARY KEY(id) on ${tableName}`);
    } catch (err) {
      if (!/multiple primary key defined/i.test(err.message)) {
        throw err;
      }
    }
  }

  if (!isAutoIncrement) {
    await pool.promise().query(
      `ALTER TABLE \`${tableName}\` MODIFY COLUMN \`id\` INT NOT NULL AUTO_INCREMENT`,
    );
    console.log(`✔  Enabled AUTO_INCREMENT on ${tableName}.id`);
  }
};

const ensureRegistrationAndSchoolSchema = async () => {
  await ensureAutoIncrementPrimaryKeyId("schools");
  await ensureAutoIncrementPrimaryKeyId("registration_requests");
};

app.listen(PORT, async () => {
  console.log(`Server is running on port ${PORT}`);
  try {
    const conn = await pool.promise().getConnection();
    console.log("✔  MySQL database connected successfully");
    conn.release();

    await ensureRegistrationAndSchoolSchema();
    console.log("✔  Registration and school schema are ready");

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

    await ensureEmployeeCivilStatusSexFK();
    console.log("✔  Employee civil status and sex foreign keys are ready");

    await ensureWorkInformationTable();
    console.log("✔  Work information table is ready and backfilled");

    await ensureEmployeeTypeSchema();
    console.log("✔  Work information employee type schema is ready");

    await ensureEmployeeProfileSchema();
    console.log("✔  Work information profile schema is ready");

    await ensureEmployeePositionFK();
    console.log("✔  Work information position foreign key is ready");

    await syncEmployeeServiceMetrics();
    console.log("✔  Work information service metrics are synced");

    await ensureBacklogArchiveSchema();
    console.log("✔  Backlog archive schema is ready");

    await ensureSalaryInformationTable();
    console.log("✔  Salary information table is ready");

    await syncEmployeeSgFromSalaryInformation();
    console.log("✔  Work information SG values are synced from salary information");

    await ensureSalaryIncrementNoticesTable();
    console.log("✔  Salary increment notices table is ready");

    const salaryDateSyncStartupResult =
      await SalaryInformation.syncThreeYearSalaryDateEntries();
    console.log(
      `[Salary Information] 3-year date sync on startup: employees=${salaryDateSyncStartupResult.employeesChecked}, generated=${salaryDateSyncStartupResult.generated}, as_of=${salaryDateSyncStartupResult.asOfDate}`,
    );

    await ensureIndexes();
    console.log("✔  Database indexes ensured (best-effort)");

    await archiveOldBacklogs();

    if (AUTO_MONTHLY_CREDIT_ENABLED) {
      const startupResult = await autoCreditCurrentMonth();
      console.log(
        `[Auto Credit] Startup run complete for ${startupResult.period}: credited=${startupResult.credited}, skipped=${startupResult.skipped}`,
      );

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
