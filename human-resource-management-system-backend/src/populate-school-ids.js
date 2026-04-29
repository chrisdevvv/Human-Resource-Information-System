const pool = require("./config/db");

async function populateSchoolIds() {
  try {
    console.log("=== Populating school_id in emppersonalinfo ===\n");

    // Get all employees with null school_id but have school name
    const [employees] = await pool.promise().query(`
      SELECT id, firstName, lastName, school, school_id 
      FROM emppersonalinfo 
      WHERE school_id IS NULL AND school IS NOT NULL
      LIMIT 5000
    `);

    console.log(`Found ${employees.length} employees with school name but no school_id\n`);

    let updated = 0;
    let notFound = 0;

    for (const emp of employees) {
      // Try to find matching school
      const [schools] = await pool.promise().query(`
        SELECT schoolId 
        FROM schools 
        WHERE LOWER(TRIM(schoolName)) = LOWER(TRIM(?))
        LIMIT 1
      `, [emp.school]);

      if (schools.length > 0) {
        // Update employee with school_id
        await pool.promise().query(`
          UPDATE emppersonalinfo 
          SET school_id = ? 
          WHERE id = ?
        `, [schools[0].schoolId, emp.id]);
        
        console.log(`✓ Updated ${emp.firstName} ${emp.lastName} - School: ${emp.school} → ID: ${schools[0].schoolId}`);
        updated++;
      } else {
        console.log(`✗ No match found for: ${emp.school}`);
        notFound++;
      }
    }

    console.log(`\n=== Summary ===`);
    console.log(`Updated: ${updated}`);
    console.log(`Not found: ${notFound}`);
    console.log(`Total processed: ${employees.length}`);

    // Show updated counts
    const [counts] = await pool.promise().query(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN school_id IS NOT NULL THEN 1 ELSE 0 END) as with_school_id,
        SUM(CASE WHEN school_id IS NULL THEN 1 ELSE 0 END) as without_school_id
      FROM emppersonalinfo
    `);
    
    console.log(`\n=== Current Status ===`);
    console.log(`Total employees: ${counts[0].total}`);
    console.log(`With school_id: ${counts[0].with_school_id}`);
    console.log(`Without school_id: ${counts[0].without_school_id}`);

    process.exit(0);
  } catch (error) {
    console.error("Error:", error);
    process.exit(1);
  }
}

populateSchoolIds();
