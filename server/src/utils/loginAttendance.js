const { LOCK } = require('./loanRecovery');

async function recordEmployeeLogin(pool, employeeId) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query(LOCK);
    // Store local IST in the existing timestamp-without-time-zone columns.
    // Subsequent logins retain the first check-in and any admin attendance mark.
    await client.query(`INSERT INTO attendance (employee_id, work_date, status, day_type, check_in)
      VALUES ($1, (NOW() AT TIME ZONE 'Asia/Kolkata')::date, 'present', 'full', NOW() AT TIME ZONE 'Asia/Kolkata')
      ON CONFLICT (employee_id, work_date) DO UPDATE
      SET check_in = COALESCE(attendance.check_in, EXCLUDED.check_in)`, [employeeId]);
    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally { client.release(); }
}

module.exports = { recordEmployeeLogin };
