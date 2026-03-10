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
    school_id: 1,
  },
  {
    first_name: "Test",
    last_name: "Encoder",
    email: "testencoder@deped.gov.ph",
    password: "Encoder@1234",
    role: "DATA_ENCODER",
    school_id: 1,
  },
];

const sampleSchool = {
  school_name: "San Jose Del Monte National High School",
  school_code: "SJDMNHS",
};

async function seed() {
  const db = pool.promise();

  try {
    // 1. Ensure at least one school exists (id=1)
    const [schools] = await db.query("SELECT id FROM schools LIMIT 1");
    if (schools.length === 0) {
      const [result] = await db.query(
        "INSERT INTO schools (school_name, school_code) VALUES (?, ?)",
        [sampleSchool.school_name, sampleSchool.school_code],
      );
      console.log(
        `✔  School created: "${sampleSchool.school_name}" (id=${result.insertId})`,
      );
    } else {
      console.log(`✔  School already exists (id=${schools[0].id}), skipping.`);
    }

    // 2. Upsert test user accounts so credentials stay usable on every seed run
    for (const account of testAccounts) {
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
