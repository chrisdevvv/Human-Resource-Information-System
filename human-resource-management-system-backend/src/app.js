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
  positionBodySchema,
  sexBodySchema,
} = require("./validation/schemas");

const app = express();
const PORT = process.env.PORT || 3000;
const AUTO_MONTHLY_CREDIT_ENABLED = process.env.AUTO_MONTHLY_CREDIT !== "false";
const MAX_JSON_BODY_SIZE = process.env.MAX_JSON_BODY_SIZE || "100kb";
const MAX_FORM_BODY_SIZE = process.env.MAX_FORM_BODY_SIZE || "100kb";

const DEFAULT_CORS_ALLOWLIST = [
  "http://localhost:3000",
  "http://127.0.0.1:3000",
  "http://localhost:3001",
  "http://127.0.0.1:3001",
];

const allowedOrigins = (
  process.env.CORS_ORIGIN_ALLOWLIST ||
  process.env.CORS_ALLOWED_ORIGINS ||
  ""
)
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

const corsAllowlist =
  allowedOrigins.length > 0 ? allowedOrigins : DEFAULT_CORS_ALLOWLIST;

const corsOptions = {
  origin: (origin, callback) => {
    // Allow server-to-server calls and local scripts without browser origin.
    if (!origin) {
      return callback(null, true);
    }

    if (corsAllowlist.includes(origin)) {
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
    ALTER TABLE leaves
    ADD COLUMN IF NOT EXISTS entry_kind ENUM('MANUAL','MONTHLY_CREDIT') NOT NULL DEFAULT 'MANUAL' AFTER period_of_leave;
  `);

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
    ALTER TABLE employees
    ADD COLUMN IF NOT EXISTS is_archived TINYINT(1) NOT NULL DEFAULT 0 AFTER school_id,
    ADD COLUMN IF NOT EXISTS archived_at DATETIME NULL AFTER is_archived,
    ADD COLUMN IF NOT EXISTS archived_by INT NULL AFTER archived_at;
  `);

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
    ALTER TABLE employees
    ADD COLUMN IF NOT EXISTS on_leave TINYINT(1) NOT NULL DEFAULT 0 AFTER archived_by,
    ADD COLUMN IF NOT EXISTS on_leave_from DATE NULL AFTER on_leave,
    ADD COLUMN IF NOT EXISTS on_leave_until DATE NULL AFTER on_leave_from,
    ADD COLUMN IF NOT EXISTS on_leave_reason VARCHAR(500) NULL AFTER on_leave_until,
    ADD COLUMN IF NOT EXISTS leave_status_updated_at DATETIME NULL AFTER on_leave_reason;
  `);

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

const ensureBirthdateSchema = async () => {
  await pool.promise().query(`
    ALTER TABLE employees
    ADD COLUMN IF NOT EXISTS birthdate DATE NULL AFTER email;
  `);

  await pool.promise().query(`
    ALTER TABLE users
    ADD COLUMN IF NOT EXISTS birthdate DATE NULL AFTER email;
  `);

  await pool.promise().query(`
    ALTER TABLE registration_requests
    ADD COLUMN IF NOT EXISTS birthdate DATE NULL AFTER email;
  `);
};

const ensureMiddleNameSchema = async () => {
  await pool.promise().query(`
    ALTER TABLE employees
    ADD COLUMN IF NOT EXISTS middle_name VARCHAR(75) NULL AFTER first_name;
  `);

  await pool.promise().query(`
    ALTER TABLE users
    ADD COLUMN IF NOT EXISTS middle_name VARCHAR(75) NULL AFTER first_name;
  `);

  await pool.promise().query(`
    ALTER TABLE registration_requests
    ADD COLUMN IF NOT EXISTS middle_name VARCHAR(75) NULL AFTER first_name;
  `);
};

const ensureEmployeeProfileSchema = async () => {
  await pool.promise().query(`
    ALTER TABLE employees
    ADD COLUMN IF NOT EXISTS middle_initial VARCHAR(10) NULL AFTER middle_name,
    ADD COLUMN IF NOT EXISTS mobile_number VARCHAR(30) NULL AFTER email,
    ADD COLUMN IF NOT EXISTS home_address VARCHAR(255) NULL AFTER mobile_number,
    ADD COLUMN IF NOT EXISTS place_of_birth VARCHAR(255) NULL AFTER home_address,
    ADD COLUMN IF NOT EXISTS civil_status VARCHAR(50) NULL AFTER place_of_birth,
    ADD COLUMN IF NOT EXISTS sex VARCHAR(20) NULL AFTER civil_status,
    ADD COLUMN IF NOT EXISTS employee_no VARCHAR(100) NULL AFTER school_id,
    ADD COLUMN IF NOT EXISTS work_email VARCHAR(255) NULL AFTER employee_no,
    ADD COLUMN IF NOT EXISTS district VARCHAR(255) NULL AFTER work_email,
    ADD COLUMN IF NOT EXISTS work_district VARCHAR(255) NULL AFTER work_email,
    ADD COLUMN IF NOT EXISTS \`position\` VARCHAR(255) NULL AFTER district,
    ADD COLUMN IF NOT EXISTS plantilla_no VARCHAR(100) NULL AFTER \`position\`,
    ADD COLUMN IF NOT EXISTS prc_license_no VARCHAR(100) NULL AFTER plantilla_no,
    ADD COLUMN IF NOT EXISTS age INT NULL AFTER prc_license_no;
  `);

  await pool.promise().query(`
    UPDATE employees
    SET district = work_district
    WHERE district IS NULL
      AND work_district IS NOT NULL
      AND work_district <> '';
  `);

  const indexStatements = [
    `CREATE INDEX idx_employees_employee_no ON employees (employee_no)`,
    `CREATE INDEX idx_employees_work_email ON employees (work_email)`,
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
};

const ensureBacklogArchiveSchema = async () => {
  await pool.promise().query(`
    ALTER TABLE backlogs
    ADD COLUMN IF NOT EXISTS is_archived TINYINT(1) NOT NULL DEFAULT 0 AFTER details;
  `);

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

    await ensureEmployeeProfileSchema();
    console.log("✔  Employee profile schema is ready");

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

    await ensureEmployeePositionFK();
    console.log("✔  Employee position foreign key is ready");

    await ensureEmployeeCivilStatusSexFK();
    console.log("✔  Employee civil status and sex foreign keys are ready");

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

    // Run backlog archiving daily at 01:00 AM
    cron.schedule("0 1 * * *", async () => {
      try {
        await archiveOldBacklogs();
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
