#!/usr/bin/env node
require("../config/loadEnv");
const pool = require("../config/db");

// Usage:
//  node src/scripts/backfill-user-school-ids.js --dry-run
//  node src/scripts/backfill-user-school-ids.js --apply

const args = process.argv.slice(2);
const APPLY = args.includes("--apply");
const DRY = args.includes("--dry-run") || !APPLY;

const normalizeEmail = (s) => (s ? String(s).trim().toLowerCase() : null);

async function resolveSchemaColumns() {
  const [rows] = await pool.promise().query(
    `
      SELECT TABLE_NAME AS table_name, COLUMN_NAME AS column_name
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME IN ('emppersonalinfo', 'employees', 'schools')
        AND COLUMN_NAME IN ('email', 'school_id', 'school', 'schoolName', 'school_name', 'schoolId')
    `,
  );

  const grouped = rows.reduce((acc, row) => {
    if (!acc[row.table_name]) acc[row.table_name] = new Set();
    acc[row.table_name].add(row.column_name);
    return acc;
  }, {});

  const employeeTable = grouped.emppersonalinfo
    ? "emppersonalinfo"
    : grouped.employees
      ? "employees"
      : null;

  const employeeSchoolNameColumn = grouped.emppersonalinfo?.has("school")
    ? "school"
    : grouped.emppersonalinfo?.has("school_name")
      ? "school_name"
      : grouped.employees?.has("school")
        ? "school"
        : grouped.employees?.has("school_name")
          ? "school_name"
          : null;

  const employeeSchoolIdColumn = grouped.emppersonalinfo?.has("school_id")
    ? "school_id"
    : grouped.employees?.has("school_id")
      ? "school_id"
      : null;

  const schoolTableName = grouped.schools?.has("schoolName")
    ? "schoolName"
    : grouped.schools?.has("school_name")
      ? "school_name"
      : null;

  const schoolTableId = grouped.schools?.has("schoolId")
    ? "schoolId"
    : null;

  return {
    employeeTable,
    employeeSchoolNameColumn,
    employeeSchoolIdColumn,
    schoolTableName,
    schoolTableId,
  };
}

async function findEmployeeSchoolIdByEmail(email, schema) {
  if (!email || !schema.employeeTable) return null;
  const norm = normalizeEmail(email);

  const selectColumns = [];
  if (schema.employeeSchoolIdColumn) {
    selectColumns.push(`\`${schema.employeeSchoolIdColumn}\` AS school_id`);
  }
  if (schema.employeeSchoolNameColumn) {
    selectColumns.push(`\`${schema.employeeSchoolNameColumn}\` AS school_name`);
  }

  if (selectColumns.length === 0) {
    return null;
  }

  const [rows] = await pool.promise().query(
    `SELECT ${selectColumns.join(", ")} FROM \`${schema.employeeTable}\` WHERE LOWER(TRIM(email)) = ? LIMIT 1`,
    [norm],
  );

  const employeeRow = rows?.[0];
  if (!employeeRow) return null;

  if (employeeRow.school_id) {
    return employeeRow.school_id;
  }

  const schoolName = normalizeEmail(employeeRow.school_name);
  if (!schoolName || !schema.schoolTableName || !schema.schoolTableId) {
    return null;
  }

  const [schoolRows] = await pool.promise().query(
    `SELECT \`${schema.schoolTableId}\` AS school_id FROM schools WHERE LOWER(TRIM(\`${schema.schoolTableName}\`)) = ? LIMIT 1`,
    [schoolName],
  );

  return schoolRows?.[0]?.school_id || null;
}

async function findEmployeeIdByEmail(email, schema) {
  if (!email || !schema.employeeTable) return null;
  const norm = normalizeEmail(email);
  const [rows] = await pool.promise().query(
    `SELECT id FROM \`${schema.employeeTable}\` WHERE LOWER(TRIM(email)) = ? LIMIT 1`,
    [norm],
  );
  return rows?.[0]?.id || null;
}

async function run() {
  console.log(`[backfill] Starting: dryRun=${DRY} apply=${APPLY}`);

  const schema = await resolveSchemaColumns();
  if (!schema.employeeTable) {
    throw new Error("Could not find an employee table with an email column.");
  }
  if (!schema.schoolTableName || !schema.schoolTableId) {
    throw new Error("Could not resolve schools table columns.");
  }

  const [usersRows] = await pool.promise().query(
    `SELECT id, email, first_name, last_name, school_id FROM users WHERE school_id IS NULL OR school_id = 0`,
  );

  console.log(`[backfill] Found ${usersRows.length} users with null/0 school_id`);

  let candidates = [];

  for (const u of usersRows) {
    const email = normalizeEmail(u.email);
    const found = await findEmployeeSchoolIdByEmail(email, schema);
    if (found) {
      const employeeId = await findEmployeeIdByEmail(u.email, schema);
      candidates.push({ userId: u.id, employeeId, email: u.email, first_name: u.first_name, last_name: u.last_name, foundSchoolId: found });
    }
  }

  console.log(`[backfill] Candidates to update: ${candidates.length}`);
  if (candidates.length > 0) {
    console.log(candidates.slice(0, 20).map(c => `- userId=${c.userId} empId=${c.employeeId} email=${c.email} -> school_id=${c.foundSchoolId}`).join('\n'));
  }

  if (DRY) {
    console.log("[backfill] Dry run complete. To apply these changes run with --apply.");
    await pool.promise().end();
    return;
  }

  // Apply updates
  const conn = await pool.promise().getConnection();
  try {
    await conn.beginTransaction();
    for (const c of candidates) {
      await conn.query(`UPDATE users SET school_id = ? WHERE id = ?`, [c.foundSchoolId, c.userId]);
      if (c.employeeId) {
        await conn.query(`UPDATE \`${schema.employeeTable}\` SET school_id = ? WHERE id = ?`, [c.foundSchoolId, c.employeeId]);
      }
    }
    await conn.commit();
    console.log(`[backfill] Applied ${candidates.length} updates to both users and employees tables.`);
  } catch (err) {
    await conn.rollback();
    console.error("[backfill] Error applying updates:", err);
  } finally {
    conn.release();
    await pool.promise().end();
  }
}

run().catch((err) => {
  console.error("[backfill] Fatal error:", err);
  process.exit(1);
});
