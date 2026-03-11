require("dotenv").config();
const bcrypt = require("bcryptjs");
const pool = require("./config/db");

const testAccounts = [
  {
    first_name: "Super",
    last_name: "Admin",
    email: "superadmin@deped.gov.ph",
    password: "Admin@1234",
    role: "SUPER_ADMIN",
    school_id: null,
  },
  {
    first_name: "Test",
    last_name: "Admin",
    email: "testadmin@deped.gov.ph",
    password: "Admin@1234",
    role: "ADMIN",
    school_id: "__SAMPLE_SCHOOL__",
  },
  {
    first_name: "Test",
    last_name: "Encoder",
    email: "testencoder@deped.gov.ph",
    password: "Encoder@1234",
    role: "DATA_ENCODER",
    school_id: "__SAMPLE_SCHOOL__",
  },
];

const sampleSchool = {
  school_name: "San Jose Del Monte National High School",
  school_code: "SJDMNHS",
};

async function seed() {
  const db = pool.promise();

  try {
    // 1. Ensure the sample school exists and capture its actual id
    let sampleSchoolId;
    const [schoolRows] = await db.query(
      "SELECT id FROM schools WHERE school_name = ? LIMIT 1",
      [sampleSchool.school_name],
    );
    if (schoolRows.length === 0) {
      const [result] = await db.query(
        "INSERT INTO schools (school_name, school_code) VALUES (?, ?)",
        [sampleSchool.school_name, sampleSchool.school_code],
      );
      sampleSchoolId = result.insertId;
      console.log(
        `✔  School created: "${sampleSchool.school_name}" (id=${sampleSchoolId})`,
      );
    } else {
      sampleSchoolId = schoolRows[0].id;
      console.log(`✔  School already exists (id=${sampleSchoolId}), skipping.`);
    }

    // Resolve placeholder school_id to the actual id
    const resolvedAccounts = testAccounts.map((a) => ({
      ...a,
      school_id: a.school_id === "__SAMPLE_SCHOOL__" ? sampleSchoolId : a.school_id,
    }));

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
            account.role,
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
          account.role,
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
