const pool = require('./src/config/db');

(async () => {
  try {
    const [r1] = await pool.promise().query('SELECT COUNT(*) as cnt FROM users');
    const [r2] = await pool.promise().query('SELECT COUNT(*) as cnt FROM emppersonalinfo');
    const [r3] = await pool.promise().query('SELECT COUNT(*) as cnt FROM users WHERE school_id IS NOT NULL AND school_id > 0');
    const [r4] = await pool.promise().query('SELECT COUNT(*) as cnt FROM emppersonalinfo WHERE school IS NOT NULL AND school != \'\'');
    
    console.log('Total users:', r1[0].cnt);
    console.log('Total employees:', r2[0].cnt);
    console.log('Users with school_id:', r3[0].cnt);
    console.log('Employees with school name:', r4[0].cnt);
    process.exit(0);
  } catch(e) {
    console.error(e.message);
    process.exit(1);
  }
})();
