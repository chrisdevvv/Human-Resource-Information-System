require("dotenv").config();
const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const helmet = require("helmet");
const cron = require("node-cron");
const authRoutes = require("./modules/auth/authRoutes");
const leaveRoutes = require("./modules/leave/leaveRoutes");
const employeeRoutes = require("./modules/employee/employeeRoutes");
const schoolRoutes = require("./modules/school/schoolRoutes");
const backlogRoutes = require("./modules/backlog/backlogRoutes");
const registrationRoutes = require("./modules/registration/registrationRoutes");
const userRoutes = require("./modules/user/userRoutes");
const { autoCreditCurrentMonth } = require("./modules/leave/leaveController");
const pool = require("./config/db");

const app = express();
const PORT = process.env.PORT || 3000;
const AUTO_MONTHLY_CREDIT_ENABLED = process.env.AUTO_MONTHLY_CREDIT !== "false";
const MAX_JSON_BODY_SIZE = process.env.MAX_JSON_BODY_SIZE || "100kb";
const MAX_FORM_BODY_SIZE = process.env.MAX_FORM_BODY_SIZE || "100kb";

const DEFAULT_CORS_ALLOWLIST = [
  "http://localhost:3001",
  "http://127.0.0.1:3001",
];

const allowedOrigins = (
  process.env.CORS_ORIGIN_ALLOWLIST || process.env.CORS_ALLOWED_ORIGINS || ""
)
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

const corsAllowlist = allowedOrigins.length > 0 ? allowedOrigins : DEFAULT_CORS_ALLOWLIST;

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
    "Compensatory Paid Leave",
    "Forced Leave (Disapproved)",
    "Forced Leave",
    "Late/Undertime",
    "Leave Credit",
    "Maternity Leave",
    "Monetization",
    "Paternity Leave",
    "Rehabilitation Leave",
    "Special Emergency Leave",
    "Sick Leave",
    "Solo Parent",
    "Special Privilege Leave",
    "Special Leave for Women",
    "Study Leave",
    "Terminal Leave",
    "VAWC Leave",
    "Vacation Leave",
    "Balance Forwarded",
    "Service Credit",
    "Training/Seminar",
    "Brigada Eskwela",
    "Early Registration/Enrollment",
    "Election",
    "Remediation/Enrichment Classes/NLC",
    "Checking of Forms",
    "Wellness Leave",
    "Others",
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
    await pool.promise().query(`CREATE INDEX idx_backlogs_is_archived ON backlogs (is_archived)`);
  } catch (err) {
    if (!/Duplicate|exists/i.test(err.message)) {
      console.warn("Backlog archive index warning:", err.message);
    }
  }
};

const archiveOldBacklogs = async () => {
  const oneMonthAgo = new Date();
  oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
  const cutoffDate = oneMonthAgo.toISOString().slice(0, 19).replace('T', ' ');

  try {
    const [result] = await pool.promise().query(
      `UPDATE backlogs
       SET is_archived = 1
       WHERE is_archived = 0 AND created_at < ?`,
      [cutoffDate]
    );
    
    if (result.changedRows > 0) {
      console.log(`[Backlog Archive] Archived ${result.changedRows} backlogs older than ${cutoffDate}`);
    }
  } catch (err) {
    console.error("[Backlog Archive] Error archiving old backlogs:", err.message);
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

    await ensureBacklogArchiveSchema();
    console.log("✔  Backlog archive schema is ready");

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
