require("./config/loadEnv");
const bcrypt = require("bcryptjs");
const pool = require("./config/db");

const DEFAULT_TEST_PASSWORD = process.env.TEST_ADMIN_PASSWORD || "Admin@1234";
const DEFAULT_ENCODER_PASSWORD =
  process.env.TEST_ENCODER_PASSWORD || "Encoder@1234";

const DEFAULT_TEST_ACCOUNTS = [
  {
    first_name: "Super",
    last_name: "Admin",
    email: "superadmin@deped.gov.ph",
    password: DEFAULT_TEST_PASSWORD,
    role: "SUPER_ADMIN",
    school_id: null,
  },
  {
    first_name: "Test",
    last_name: "Admin",
    email: "testadmin@deped.gov.ph",
    password: DEFAULT_TEST_PASSWORD,
    role: "ADMIN",
    school_id: "__SAMPLE_SCHOOL__",
  },
  {
    first_name: "Test",
    last_name: "Encoder",
    email: "testencoder@deped.gov.ph",
    password: DEFAULT_ENCODER_PASSWORD,
    role: "DATA_ENCODER",
    school_id: "__SAMPLE_SCHOOL__",
  },
];

const resolveSchoolColumns = async () => {
  const db = pool.promise();
  const [rows] = await db.query(
    `SELECT COLUMN_NAME AS column_name
     FROM INFORMATION_SCHEMA.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE()
       AND TABLE_NAME = 'schools'
       AND COLUMN_NAME IN ('schoolId', 'id', 'schoolName', 'school_name')`,
  );

  const columnNames = new Set(rows.map((row) => row.column_name));

  return {
    idColumn: columnNames.has("schoolId")
      ? "schoolId"
      : columnNames.has("id")
        ? "id"
        : null,
    nameColumn: columnNames.has("schoolName")
      ? "schoolName"
      : columnNames.has("school_name")
        ? "school_name"
        : null,
  };
};

// Allow test accounts to be provided via the TEST_ACCOUNTS env var (JSON array).
// Example (in .env):
// TEST_ACCOUNTS='[{"first_name":"Super","last_name":"Admin","email":"superadmin@deped.gov.ph","password":"Admin@1234","role":"SUPER_ADMIN","school_id":null}]'
let testAccounts;
if (process.env.TEST_ACCOUNTS) {
  let raw = process.env.TEST_ACCOUNTS.trim();
  // Robustly remove surrounding single/double/backtick quotes (common in .env files)
  raw = raw.replace(/^['"`]+|['"`]+$/g, "");
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed))
      throw new Error("TEST_ACCOUNTS must be a JSON array");
    testAccounts = parsed;
  } catch (err) {
    console.error("Invalid TEST_ACCOUNTS JSON:", err.message);
    process.exit(1);
  }
} else {
  testAccounts = DEFAULT_TEST_ACCOUNTS;
  console.log("Using built-in default test accounts.");
}

const sampleSchool = {
  school_name: "San Jose Del Monte National High School",
  school_code: "SJDMNHS",
};

const toDbRole = (role) => {
  const normalized = String(role || "")
    .trim()
    .toUpperCase()
    .replace(/\s+/g, "_")
    .replace(/-/g, "_");

  if (normalized === "SUPER_ADMIN") return "super_admin";
  if (normalized === "ADMIN") return "admin";
  if (normalized === "DATA_ENCODER") return "data_encoder";
  return "data_encoder";
};

async function seed() {
  const db = pool.promise();

  try {
    const schoolColumns = await resolveSchoolColumns();
    if (!schoolColumns.idColumn || !schoolColumns.nameColumn) {
      throw new Error("Unable to resolve schools table columns");
    }

    // 1. Ensure the sample school exists and capture its actual id
    let sampleSchoolId;
    const [schoolRows] = await db.query(
      `SELECT ${schoolColumns.idColumn} AS school_id
       FROM schools
       WHERE ${schoolColumns.nameColumn} = ?
       LIMIT 1`,
      [sampleSchool.school_name],
    );
    if (schoolRows.length === 0) {
      const [fallbackSchoolRows] = await db.query(
        `SELECT ${schoolColumns.idColumn} AS school_id
         FROM schools
         ORDER BY ${schoolColumns.idColumn} ASC
         LIMIT 1`,
      );
      sampleSchoolId = fallbackSchoolRows[0]?.school_id || null;
      if (!sampleSchoolId) {
        throw new Error("No school rows found to assign test accounts");
      }
      console.warn(
        `Warning: sample school "${sampleSchool.school_name}" not found; using school_id=${sampleSchoolId} instead.`,
      );
    } else {
      sampleSchoolId = schoolRows[0].school_id;
      console.log(`✔  School already exists (id=${sampleSchoolId}), skipping.`);
    }

    // Resolve placeholder school_id to the actual id
    const resolvedAccounts = testAccounts.map((a) => ({
      ...a,
      school_id:
        typeof a.school_id === "string" && /sample_school/i.test(a.school_id)
          ? sampleSchoolId
          : a.school_id,
    }));

    // Coerce/validate school_id for each account to avoid foreign key errors
    for (const a of resolvedAccounts) {
      if (a.school_id == null) continue;
      // Try to coerce numeric string to number
      const maybeId = Number(a.school_id);
      if (!Number.isNaN(maybeId)) {
        const [rowsCheck] = await db.query(
          `SELECT ${schoolColumns.idColumn} AS school_id
           FROM schools
           WHERE ${schoolColumns.idColumn} = ?
           LIMIT 1`,
          [maybeId],
        );
        if (rowsCheck.length === 0) {
          console.warn(
            `Warning: school_id=${a.school_id} not found in schools table; clearing to NULL for ${a.email}`,
          );
          a.school_id = null;
        } else {
          a.school_id = maybeId;
        }
      } else {
        // Non-numeric school_id (unknown placeholder) -> clear to null
        console.warn(
          `Warning: school_id='${a.school_id}' is not numeric; clearing to NULL for ${a.email}`,
        );
        a.school_id = null;
      }
    }

    // 2. Upsert test user accounts so credentials stay usable on every seed run
    for (const account of resolvedAccounts) {
      const [existing] = await db.query(
        "SELECT id FROM users WHERE email = ? LIMIT 1",
        [account.email],
      );

      const hashedPassword = await bcrypt.hash(account.password, 10);

      if (existing.length > 0) {
        await db.query(
          "UPDATE users SET first_name = ?, last_name = ?, email = ?, password_hash = ?, role = ?, school_id = ?, is_active = 1 WHERE id = ?",
          [
            account.first_name,
            account.last_name,
            account.email,
            hashedPassword,
            toDbRole(account.role),
            account.school_id,
            existing[0].id,
          ],
        );
        console.log(
          `↻  Updated [${account.role}]: ${account.first_name} ${account.last_name} / ${account.email} / password: ${account.password}`,
        );
        continue;
      }

      await db.query(
        "INSERT INTO users (first_name, last_name, email, password_hash, role, school_id, is_active) VALUES (?, ?, ?, ?, ?, ?, 1)",
        [
          account.first_name,
          account.last_name,
          account.email,
          hashedPassword,
          toDbRole(account.role),
          account.school_id,
        ],
      );
      console.log(
        `✔  Created [${account.role}]: ${account.first_name} ${account.last_name} / ${account.email} / password: ${account.password}`,
      );
    }

    console.log("\nSeeding complete.");
  } catch (err) {
    console.error("Seed error:", err.message);
  } finally {
    pool.end();
  }
}

seed();
