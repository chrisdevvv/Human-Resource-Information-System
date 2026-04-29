const pool = require("./config/db");

async function updateAdminSchoolId() {
  try {
    console.log("=== Updating Admin User School ID ===\n");

    // Show current admin users
    const [users] = await pool.promise().query(`
      SELECT id, email, role, school_id 
      FROM users 
      WHERE role IN ('admin', 'data_encoder')
    `);

    console.log("Current admin/encoder users:");
    users.forEach((user, index) => {
      console.log(`${index + 1}. ${user.email} - School ID: ${user.school_id}`);
    });

    // Show schools with employee counts
    console.log("\nSchools with employees:");
    const [schools] = await pool.promise().query(`
      SELECT 
        s.schoolId,
        s.schoolName,
        COUNT(e.id) as employee_count
      FROM schools s
      LEFT JOIN emppersonalinfo e ON e.school_id = s.schoolId AND e.is_archived = 0
      GROUP BY s.schoolId, s.schoolName
      HAVING employee_count > 0
      ORDER BY employee_count DESC
      LIMIT 10
    `);

    schools.forEach((school, index) => {
      console.log(`${index + 1}. School ID ${school.schoolId}: ${school.schoolName} (${school.employee_count} employees)`);
    });

    // Update testadmin to School ID 1 (Sto. Cristo Elementary School - has most employees)
    console.log("\nUpdating testadmin@deped.gov.ph to School ID 1...");
    await pool.promise().query(`
      UPDATE users 
      SET school_id = 1 
      WHERE email = 'testadmin@deped.gov.ph'
    `);
    console.log("✓ Updated testadmin@deped.gov.ph");

    // Update testencoder to School ID 1
    console.log("Updating testencoder@deped.gov.ph to School ID 1...");
    await pool.promise().query(`
      UPDATE users 
      SET school_id = 1 
      WHERE email = 'testencoder@deped.gov.ph'
    `);
    console.log("✓ Updated testencoder@deped.gov.ph");

    // Show updated users
    console.log("\nUpdated admin/encoder users:");
    const [updatedUsers] = await pool.promise().query(`
      SELECT id, email, role, school_id 
      FROM users 
      WHERE role IN ('admin', 'data_encoder')
    `);

    updatedUsers.forEach(user => {
      console.log(`- ${user.email} - School ID: ${user.school_id}`);
    });

    console.log("\n=== Update Complete ===");
    process.exit(0);
  } catch (error) {
    console.error("Error:", error);
    process.exit(1);
  }
}

updateAdminSchoolId();
