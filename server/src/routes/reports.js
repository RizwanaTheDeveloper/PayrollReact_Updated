const router = require('express').Router();
const pool = require('../config/db');
const asyncHandler = require('../utils/asyncHandler');
const { authenticate, authorize } = require('../middleware/auth');
const { attendanceWithLeavePolicy } = require('../utils/leavePolicy');

router.use(authenticate, authorize('admin'));

// Return only reporting fields, with period-bounded records and one consistent snapshot.
router.get('/', asyncHandler(async (req, res) => {
  const period = String(req.query.period || '');
  if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(period)
      || Number(period.slice(0, 4)) < 2000 || Number(period.slice(0, 4)) > 2100) {
    return res.status(400).json({ message: 'A valid period (YYYY-MM) is required' });
  }
  const start = `${period}-01`;
  const client = await pool.connect();
  try {
    await client.query('BEGIN ISOLATION LEVEL REPEATABLE READ READ ONLY');
    const employees = await client.query(`SELECT id, emp_code, name,
      COALESCE(NULLIF(department, ''), 'Unassigned') AS department,
      designation, is_active, joining_date::text, resignation_date::text
      FROM employees WHERE role = 'employee' ORDER BY name`);
    const payslips = await client.query(`SELECT p.*,
      COALESCE((SELECT SUM(r.amount) FROM advance_recoveries r WHERE r.payslip_id = p.id), 0) AS loan_recovery
      FROM payslips p WHERE make_date(p.year, p.month, 1) >= $1::date - interval '1 month'
        AND make_date(p.year, p.month, 1) < $1::date + interval '1 month'
      ORDER BY p.year, p.month, p.employee_id`, [start]);
    const attendance = await client.query(`${attendanceWithLeavePolicy}
      SELECT id, employee_id, work_date::text, status, recorded_status, day_type, note,
        check_in::text, check_out::text,
        CASE WHEN check_out >= check_in THEN EXTRACT(EPOCH FROM (check_out - check_in)) / 3600
             ELSE NULL END AS worked_hours
      FROM policy_attendance WHERE work_date >= $1::date
        AND work_date < $1::date + interval '1 month' ORDER BY work_date, employee_id`, [start]);
    const leaves = await client.query(`SELECT id, employee_id, leave_type, start_date::text,
      end_date::text, reason, status,
      (LEAST(end_date, ($1::date + interval '1 month' - interval '1 day')::date)
       - GREATEST(start_date, $1::date) + 1) AS period_days
      FROM leaves WHERE start_date < $1::date + interval '1 month' AND end_date >= $1::date
      ORDER BY start_date, employee_id`, [start]);
    const loans = await client.query(`SELECT a.id, a.employee_id, a.amount, a.instalment,
      a.interest_percentage, a.instalment_count, a.status, a.first_recovery::text,
      a.disbursed_on::text, a.created_at::text,
      a.amount + ROUND(a.amount * a.interest_percentage / 100, 2) * COALESCE(a.instalment_count, 1) AS total_repayable,
      COALESCE(SUM(r.amount) FILTER (WHERE make_date(p.year, p.month, 1) < $1::date + interval '1 month'), 0) AS recovered,
      COALESCE(SUM(r.amount) FILTER (WHERE p.year = EXTRACT(YEAR FROM $1::date)
        AND p.month = EXTRACT(MONTH FROM $1::date)), 0) AS period_recovered
      FROM advances a LEFT JOIN advance_recoveries r ON r.advance_id = a.id
      LEFT JOIN payslips p ON p.id = r.payslip_id
      WHERE a.created_at < $1::date + interval '1 month'
      GROUP BY a.id ORDER BY a.employee_id, a.id`, [start]);
    const audit = await client.query(`SELECT v.id, a.employee_id, v.advance_id, v.action, v.note,
      v.created_at::text, COALESCE(actor.name, 'Deleted user') AS actor
      FROM advance_events v JOIN advances a ON a.id = v.advance_id
      LEFT JOIN employees actor ON actor.id = v.actor_id
      WHERE v.created_at >= $1::date AND v.created_at < $1::date + interval '1 month'
      ORDER BY v.created_at DESC`, [start]);
    await client.query('COMMIT');
    res.json({ period, generated_at: new Date().toISOString(), employees: employees.rows,
      payslips: payslips.rows, attendance: attendance.rows, leaves: leaves.rows,
      loans: loans.rows, audit: audit.rows });
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally { client.release(); }
}));

module.exports = router;
