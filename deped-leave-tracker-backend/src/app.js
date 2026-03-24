require("dotenv").config();
const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
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

  // Keep the table compact.
  await pool
    .promise()
    .query("DELETE FROM revoked_tokens WHERE expires_at <= NOW()");
};

const ensureLeaveLedgerSchema = async () => {
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
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

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

    await ensureIndexes();
    console.log("✔  Database indexes ensured (best-effort)");

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
  } catch (err) {
    console.error("✘  MySQL connection failed:", err.message);
  }
});
