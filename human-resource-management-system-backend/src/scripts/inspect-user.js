const pool = require("../config/db");

async function inspectUser(email) {
  if (!email) {
    console.error("Usage: node inspect-user.js <email>");
    process.exit(1);
  }
  try {
    const [rows] = await pool
      .promise()
      .query(
        "SELECT id, first_name, last_name, email, role, is_active, password_hash, created_at FROM users WHERE email = ? LIMIT 1",
        [email],
      );
    if (!rows || rows.length === 0) {
      console.log("No user found with email", email);
      process.exit(0);
    }
    console.log(JSON.stringify(rows[0], null, 2));
    process.exit(0);
  } catch (err) {
    console.error("Error querying DB:", err.message);
    process.exit(2);
  }
}

inspectUser(process.argv[2]);
