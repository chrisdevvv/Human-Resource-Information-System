const pool = require('../config/db');

async function run() {
  try {
    const dryRun = process.argv.includes('--dry-run');
    const apply = process.argv.includes('--apply');

    console.log(`[backfill] Starting: dryRun=${dryRun} apply=${apply}`);

    // Get all employees with school name but no school_id
    const [employees] = await pool.promise().query(`
      SELECT id, school FROM emppersonalinfo 
      WHERE school IS NOT NULL 
      AND school != '' 
      AND (school_id IS NULL OR school_id = 0)
      LIMIT 10000
    `);

    console.log(`[backfill] Found ${employees.length} employees with school name but no school_id`);

    const candidates = [];
    for (const emp of employees) {
      const schoolName = emp.school.trim();
      
      // Find matching school in schools table
      const [schools] = await pool.promise().query(
        `SELECT schoolId FROM schools WHERE LOWER(TRIM(schoolName)) = LOWER(?) LIMIT 1`,
        [schoolName]
      );

      if (schools.length > 0) {
        candidates.push({
          empId: emp.id,
          schoolName: emp.school,
          schoolId: schools[0].schoolId
        });
      } else {
        console.log(`[warn] School not found: "${schoolName}"`);
      }
    }

    console.log(`[backfill] Matched ${candidates.length} employees to schools`);
    if (candidates.length > 0) {
      console.log('Sample matches:');
      candidates.slice(0, 10).forEach(c => {
        console.log(`  - empId=${c.empId} school="${c.schoolName}" -> schoolId=${c.schoolId}`);
      });
    }

    if (dryRun || !apply) {
      console.log(`[backfill] Dry run complete. To apply these changes run with --apply.`);
      process.exit(0);
    }

    if (candidates.length === 0) {
      console.log('[backfill] No candidates to update.');
      process.exit(0);
    }

    // Apply updates in transaction
    const conn = await pool.promise().getConnection();
    try {
      await conn.beginTransaction();
      for (const c of candidates) {
        await conn.query(`UPDATE emppersonalinfo SET school_id = ? WHERE id = ?`, [c.schoolId, c.empId]);
      }
      await conn.commit();
      console.log(`[backfill] ✓ Applied ${candidates.length} updates to emppersonalinfo.school_id`);
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }

    process.exit(0);
  } catch (err) {
    console.error('[backfill] Error:', err.message);
    process.exit(1);
  }
}

run();
