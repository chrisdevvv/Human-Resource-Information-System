require('dotenv').config();
const bcrypt = require('bcryptjs');
const pool = require('./config/db');

const testAccounts = [
  {
    username: 'superadmin',
    email: process.env.DEFAULT_ADMIN_EMAIL || 'admin@deped.com',
    password: process.env.DEFAULT_ADMIN_PASSWORD || 'Admin@1234',
    role: 'SUPER_ADMIN',
    school_id: null,
  },
  {
    username: 'test.admin',
    email: 'testadmin@deped.gov.ph',
    password: 'Admin@1234',
    role: 'ADMIN',
    school_id: 1,
  },
  {
    username: 'test.encoder',
    email: 'testencoder@deped.gov.ph',
    password: 'Encoder@1234',
    role: 'DATA_ENCODER',
    school_id: 1,
  },
];

const sampleSchool = {
  school_name: 'San Jose Del Monte National High School',
  school_code: 'SJDMNHS',
};

async function seed() {
  const db = pool.promise();

  try {
    // 1. Ensure at least one school exists (id=1)
    const [schools] = await db.query('SELECT id FROM schools LIMIT 1');
    if (schools.length === 0) {
      const [result] = await db.query(
        'INSERT INTO schools (school_name, school_code) VALUES (?, ?)',
        [sampleSchool.school_name, sampleSchool.school_code]
      );
      console.log(`✔  School created: "${sampleSchool.school_name}" (id=${result.insertId})`);
    } else {
      console.log(`✔  School already exists (id=${schools[0].id}), skipping.`);
    }

    // 2. Insert test user accounts
    for (const account of testAccounts) {
      const [existing] = await db.query(
        'SELECT id FROM users WHERE email = ? OR username = ?',
        [account.email, account.username]
      );

      if (existing.length > 0) {
        console.log(`–  Skipped: ${account.username} (${account.email}) already exists.`);
        continue;
      }

      const hashedPassword = await bcrypt.hash(account.password, 10);
      await db.query(
        'INSERT INTO users (username, email, password_hash, role, school_id, is_active) VALUES (?, ?, ?, ?, ?, 1)',
        [account.username, account.email, hashedPassword, account.role, account.school_id]
      );
      console.log(`✔  Created [${account.role}]: ${account.username} / ${account.email} / password: ${account.password}`);
    }

    console.log('\nSeeding complete.');
  } catch (err) {
    console.error('Seed error:', err.message);
  } finally {
    pool.end();
  }
}

seed();
