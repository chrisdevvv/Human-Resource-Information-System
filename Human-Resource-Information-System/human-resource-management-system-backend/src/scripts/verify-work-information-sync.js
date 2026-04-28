require("../config/loadEnv");
const pool = require("../config/db");

const SHOW_DETAILS = process.argv.includes("--details");
const SAMPLE_SIZE = (() => {
  const index = process.argv.findIndex((arg) => arg === "--sample");
  if (index < 0) return 20;
  const raw = Number(process.argv[index + 1]);
  if (!Number.isFinite(raw) || raw <= 0) return 20;
  return Math.min(Math.floor(raw), 200);
})();

const fieldsToCompare = [
  "employee_type",
  "employee_no",
  "work_email",
  "district",
  "position",
  "position_id",
  "plantilla_no",
  "sg",
  "date_of_first_appointment",
  "years_in_service",
  "loyalty_bonus",
  "current_employee_type",
  "current_position",
  "current_plantilla_no",
  "current_appointment_date",
  "current_sg",
  "prc_license_no",
  "tin",
  "gsis_bp_no",
  "gsis_crn_no",
  "pagibig_no",
  "philhealth_no",
];

const normalizeSql = (alias, field) => {
  if (
    field === "position_id" ||
    field === "years_in_service" ||
    field === "date_of_first_appointment" ||
    field === "current_appointment_date"
  ) {
    return `CAST(${alias}.${field} AS CHAR)`;
  }

  if (field === "loyalty_bonus") {
    return `LOWER(TRIM(COALESCE(${alias}.${field}, ''))) `;
  }

  return `LOWER(TRIM(COALESCE(${alias}.${field}, ''))) `;
};

const buildMismatchPredicate = (field) => {
  const left = normalizeSql("e", field);
  const right = normalizeSql("wi", field);
  return `${left} <> ${right}`;
};

async function run() {
  const [[employeesCountRow]] = await pool
    .promise()
    .query("SELECT COUNT(*) AS total FROM employees");
  const [[workInfoCountRow]] = await pool
    .promise()
    .query("SELECT COUNT(*) AS total FROM work_information");
  const [[missingRows]] = await pool.promise().query(`
    SELECT COUNT(*) AS total
    FROM employees e
    LEFT JOIN work_information wi ON wi.employee_id = e.id
    WHERE wi.employee_id IS NULL
  `);

  const mismatchCounts = {};
  for (const field of fieldsToCompare) {
    const [[row]] = await pool.promise().query(`
      SELECT COUNT(*) AS total
      FROM employees e
      JOIN work_information wi ON wi.employee_id = e.id
      WHERE ${buildMismatchPredicate(field)}
    `);
    mismatchCounts[field] = Number(row?.total || 0);
  }

  const totalFieldMismatches = Object.values(mismatchCounts).reduce(
    (sum, value) => sum + Number(value || 0),
    0,
  );

  console.log("[Work Information Sync] Summary");
  console.log("  employees:", Number(employeesCountRow?.total || 0));
  console.log("  work_information:", Number(workInfoCountRow?.total || 0));
  console.log("  missing work_information rows:", Number(missingRows?.total || 0));
  console.log("  total field mismatches:", totalFieldMismatches);

  for (const field of fieldsToCompare) {
    console.log(`  ${field}:`, mismatchCounts[field]);
  }

  if (!SHOW_DETAILS) return;

  const mismatchPredicate = fieldsToCompare.map(buildMismatchPredicate).join(" OR ");
  const [rows] = await pool.promise().query(
    `
      SELECT
        e.id,
        e.first_name,
        e.last_name,
        ${fieldsToCompare
          .map((field) => `e.${field} AS employee_${field}, wi.${field} AS work_${field}`)
          .join(",\n        ")}
      FROM employees e
      JOIN work_information wi ON wi.employee_id = e.id
      WHERE ${mismatchPredicate}
      ORDER BY e.id ASC
      LIMIT ?
    `,
    [SAMPLE_SIZE],
  );

  console.log(`\n[Work Information Sync] Mismatch samples (limit ${SAMPLE_SIZE})`);
  for (const row of rows) {
    const header = `${row.id} - ${row.first_name || ""} ${row.last_name || ""}`.trim();
    const diffs = fieldsToCompare.filter((field) => {
      const left = row[`employee_${field}`];
      const right = row[`work_${field}`];
      const leftNorm = left === null || left === undefined ? "" : String(left).trim().toLowerCase();
      const rightNorm = right === null || right === undefined ? "" : String(right).trim().toLowerCase();
      return leftNorm !== rightNorm;
    });

    if (diffs.length === 0) continue;
    console.log(`- Employee ${header}`);
    for (const field of diffs) {
      console.log(`    ${field}: employees='${row[`employee_${field}`]}' | work_information='${row[`work_${field}`]}'`);
    }
  }
}

run()
  .catch((err) => {
    console.error("[Work Information Sync] Verification failed:", err.message || err);
    process.exitCode = 1;
  })
  .finally(async () => {
    try {
      await pool.end();
    } catch {
      // no-op
    }
  });
