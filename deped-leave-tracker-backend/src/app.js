require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const cron = require('node-cron');
const authRoutes = require('./modules/auth/authRoutes');
const leaveRoutes = require('./modules/leave/leaveRoutes');
const employeeRoutes = require('./modules/employee/employeeRoutes');
const schoolRoutes = require('./modules/school/schoolRoutes');
const backlogRoutes = require('./modules/backlog/backlogRoutes');
const registrationRoutes = require('./modules/registration/registrationRoutes');
const userRoutes = require('./modules/user/userRoutes');
const { autoCreditCurrentMonth } = require('./modules/leave/leaveController');
const pool = require('./config/db');

const app = express();
const PORT = process.env.PORT || 3000;
const AUTO_MONTHLY_CREDIT_ENABLED = process.env.AUTO_MONTHLY_CREDIT !== 'false';

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

  // Keep the table compact.
  await pool.promise().query('DELETE FROM revoked_tokens WHERE expires_at <= NOW()');
};

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/leave', leaveRoutes);
app.use('/api/employees', employeeRoutes);
app.use('/api/schools', schoolRoutes);
app.use('/api/backlogs', backlogRoutes);
app.use('/api/registrations', registrationRoutes);
app.use('/api/users', userRoutes);

// Start the server
app.listen(PORT, async () => {
  console.log(`Server is running on port ${PORT}`);
  try {
    const conn = await pool.promise().getConnection();
    console.log('✔  MySQL database connected successfully');
    conn.release();

    await ensureSecurityTables();
    console.log('✔  Security tables are ready');

    if (AUTO_MONTHLY_CREDIT_ENABLED) {
      // Catch up on startup (safe because duplicate monthly entries are skipped).
      const startupResult = await autoCreditCurrentMonth();
      console.log(
        `[Auto Credit] Startup run complete for ${startupResult.period}: credited=${startupResult.credited}, skipped=${startupResult.skipped}`,
      );

      // Run every month at 00:00 on day 1 (server local time).
      cron.schedule('0 0 1 * *', async () => {
        try {
          const result = await autoCreditCurrentMonth();
          console.log(
            `[Auto Credit] Scheduled run complete for ${result.period}: credited=${result.credited}, skipped=${result.skipped}`,
          );
        } catch (error) {
          console.error('[Auto Credit] Scheduled run failed:', error.message);
        }
      });

      console.log('[Auto Credit] Scheduler enabled (runs monthly on day 1 at 00:00).');
    } else {
      console.log('[Auto Credit] Scheduler disabled via AUTO_MONTHLY_CREDIT=false.');
    }
  } catch (err) {
    console.error('✘  MySQL connection failed:', err.message);
  }
});
