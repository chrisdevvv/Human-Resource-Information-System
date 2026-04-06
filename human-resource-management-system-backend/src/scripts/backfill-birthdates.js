require("../config/loadEnv");
const pool = require("../config/db");

const APPLY = process.argv.includes("--apply");

const sql = {
  usersFromEmployees: `
    UPDATE users u
    JOIN employees e
      ON LOWER(TRIM(u.email)) = LOWER(TRIM(e.email))
    SET u.birthdate = e.birthdate
    WHERE u.birthdate IS NULL
      AND e.birthdate IS NOT NULL
  `,
  employeesFromUsers: `
    UPDATE employees e
    JOIN users u
      ON LOWER(TRIM(e.email)) = LOWER(TRIM(u.email))
    SET e.birthdate = u.birthdate
    WHERE e.birthdate IS NULL
      AND u.birthdate IS NOT NULL
  `,
  usersFromRegistrations: `
    UPDATE users u
    JOIN (
      SELECT LOWER(TRIM(email)) AS email_key, MAX(birthdate) AS birthdate
      FROM registration_requests
      WHERE birthdate IS NOT NULL
      GROUP BY LOWER(TRIM(email))
    ) rr ON LOWER(TRIM(u.email)) = rr.email_key
    SET u.birthdate = rr.birthdate
    WHERE u.birthdate IS NULL
  `,
  employeesFromRegistrations: `
    UPDATE employees e
    JOIN (
      SELECT LOWER(TRIM(email)) AS email_key, MAX(birthdate) AS birthdate
      FROM registration_requests
      WHERE birthdate IS NOT NULL
      GROUP BY LOWER(TRIM(email))
    ) rr ON LOWER(TRIM(e.email)) = rr.email_key
    SET e.birthdate = rr.birthdate
    WHERE e.birthdate IS NULL
  `,
};

const countQueries = {
  usersMissing: "SELECT COUNT(*) AS total FROM users WHERE birthdate IS NULL",
  employeesMissing:
    "SELECT COUNT(*) AS total FROM employees WHERE birthdate IS NULL",
};

async function getCount(query) {
  const [[row]] = await pool.promise().query(query);
  return Number(row?.total || 0);
}

async function previewImpact() {
  const before = {
    usersMissing: await getCount(countQueries.usersMissing),
    employeesMissing: await getCount(countQueries.employeesMissing),
  };

  console.log("[Birthdate Backfill] Missing before:", before);

  if (!APPLY) {
    console.log(
      "[Birthdate Backfill] Dry-run only. Re-run with --apply to execute updates.",
    );
    return;
  }

  const conn = await pool.promise().getConnection();
  try {
    await conn.beginTransaction();

    const [uFromEmp] = await conn.query(sql.usersFromEmployees);
    const [eFromUsers] = await conn.query(sql.employeesFromUsers);
    const [uFromReg] = await conn.query(sql.usersFromRegistrations);
    const [eFromReg] = await conn.query(sql.employeesFromRegistrations);

    await conn.commit();

    const after = {
      usersMissing: await getCount(countQueries.usersMissing),
      employeesMissing: await getCount(countQueries.employeesMissing),
    };

    console.log("[Birthdate Backfill] Applied updates:");
    console.log("  usersFromEmployees:", uFromEmp.affectedRows || 0);
    console.log("  employeesFromUsers:", eFromUsers.affectedRows || 0);
    console.log("  usersFromRegistrations:", uFromReg.affectedRows || 0);
    console.log("  employeesFromRegistrations:", eFromReg.affectedRows || 0);
    console.log("[Birthdate Backfill] Missing after:", after);
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}

previewImpact()
  .catch((err) => {
    console.error("[Birthdate Backfill] Failed:", err.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    try {
      await pool.end();
    } catch {
      // no-op
    }
  });
