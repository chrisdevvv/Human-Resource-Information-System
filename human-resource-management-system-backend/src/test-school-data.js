const pool = require("./config/db");

async function testSchoolData() {
  try {
    console.log("=== Testing School Data ===\n");

    // Check users table
    console.log("1. Checking users with admin/data_encoder role:");
    const [users] = await pool.promise().query(`
      SELECT id, first_name, last_name, email, role, school_id, is_active 
      FROM users 
      WHERE role IN ('admin', 'data_encoder') 
      ORDER BY id
    `);
    console.log("Users found:", users.length);
    users.forEach(user => {
      console.log(`  - ID: ${user.id}, Email: ${user.email}, Role: ${user.role}, School ID: ${user.school_id}`);
    });

    // Check emppersonalinfo table
    console.log("\n2. Checking emppersonalinfo table:");
    const [employees] = await pool.promise().query(`
      SELECT id, firstName, lastName, school_id, is_archived 
      FROM emppersonalinfo 
      WHERE is_archived = 0
      ORDER BY school_id, id
      LIMIT 20
    `);
    console.log("Active employees found:", employees.length);
    const schoolGroups = {};
    employees.forEach(emp => {
      if (!schoolGroups[emp.school_id]) {
        schoolGroups[emp.school_id] = 0;
      }
      schoolGroups[emp.school_id]++;
    });
    console.log("Employees grouped by school_id:");
    Object.keys(schoolGroups).forEach(schoolId => {
      console.log(`  - School ID ${schoolId}: ${schoolGroups[schoolId]} employees`);
    });

    // Check matching
    console.log("\n3. Checking matches between users and employees:");
    for (const user of users) {
      const [matchingEmployees] = await pool.promise().query(`
        SELECT COUNT(*) as count 
        FROM emppersonalinfo 
        WHERE school_id = ? AND is_archived = 0
      `, [user.school_id]);
      console.log(`  - User ${user.email} (School ID: ${user.school_id}) has ${matchingEmployees[0].count} employees`);
    }

    // Check schools table
    console.log("\n4. Checking schools table:");
    const [schools] = await pool.promise().query(`
      SELECT * FROM schools ORDER BY schoolId LIMIT 10
    `);
    console.log("Schools found:", schools.length);
    schools.forEach(school => {
      console.log(`  - ID: ${school.schoolId}, Name: ${school.schoolName || school.school_name}`);
    });

    // Test the actual query that would be used
    console.log("\n5. Testing actual query for admin user:");
    if (users.length > 0) {
      const testUser = users[0];
      console.log(`Testing with user: ${testUser.email}, School ID: ${testUser.school_id}`);
      
      const [testResults] = await pool.promise().query(`
        SELECT 
          employees.id,
          employees.firstName AS first_name,
          employees.lastName AS last_name,
          employees.school_id,
          schools.schoolName AS school_name
        FROM emppersonalinfo employees
        LEFT JOIN schools ON employees.school_id = schools.schoolId
        WHERE employees.is_archived = 0 AND employees.school_id = ?
        LIMIT 10
      `, [testUser.school_id]);
      
      console.log(`Query returned ${testResults.length} results`);
      testResults.forEach(emp => {
        console.log(`  - Employee ID: ${emp.id}, Name: ${emp.first_name} ${emp.last_name}, School: ${emp.school_name}`);
      });
    }

    console.log("\n=== Test Complete ===");
    process.exit(0);
  } catch (error) {
    console.error("Error:", error);
    process.exit(1);
  }
}

testSchoolData();
