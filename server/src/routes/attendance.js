const router = require('express').Router();
const pool = require('../config/db');
const asyncHandler = require('../utils/asyncHandler');
const { authenticate, authorize } = require('../middleware/auth');

router.use(authenticate);

const STATUSES = ['present', 'absent', 'leave'];
const DAY_TYPES = ['full', 'half'];
const isDate = (v) => /^\d{4}-\d{2}-\d{2}$/.test(v || '');

// GET /api/attendance/my  (employee: only their own records)
router.get('/my', asyncHandler(async (req, res) => {
  const { rows } = await pool.query(
    `SELECT id, work_date::text AS work_date, status, day_type, note, check_in, check_out
     FROM attendance WHERE employee_id = $1 ORDER BY work_date DESC`, [req.user.id]);
  res.json(rows);
}));

// GET /api/attendance/day?date=YYYY-MM-DD   (admin)
// Every active employee, with their status for that date (null = not marked)
router.get('/day', authorize('admin'), asyncHandler(async (req, res) => {
  const { date } = req.query;
  if (!isDate(date)) return res.status(400).json({ message: 'date (YYYY-MM-DD) is required' });
  const { rows } = await pool.query(
    `SELECT e.id AS employee_id, e.name, a.status, a.day_type, a.note
     FROM employees e
     LEFT JOIN attendance a ON a.employee_id = e.id AND a.work_date = $1
     WHERE e.role = 'employee' AND e.is_active
     ORDER BY e.name`, [date]);
  res.json(rows);
}));

// PUT /api/attendance/bulk   (admin)
// { work_date, records: [{ employee_id, status, day_type, note }] }
// status '' / null clears the mark for that employee on that date.
router.put('/bulk', authorize('admin'), asyncHandler(async (req, res) => {
  const { work_date, records } = req.body || {};
  if (!isDate(work_date) || !Array.isArray(records))
    return res.status(400).json({ message: 'work_date and records are required' });

  for (const r of records) {
    if (!r.employee_id) return res.status(400).json({ message: 'employee_id is required' });
    if (r.status && !STATUSES.includes(r.status))
      return res.status(400).json({ message: `status must be one of: ${STATUSES.join(', ')}` });
    if (r.status && !DAY_TYPES.includes(r.day_type || 'full'))
      return res.status(400).json({ message: 'day_type must be full or half' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    for (const r of records) {
      if (!r.status) {
        await client.query('DELETE FROM attendance WHERE employee_id = $1 AND work_date = $2', [r.employee_id, work_date]);
      } else {
        await client.query(
          `INSERT INTO attendance (employee_id, work_date, status, day_type, note)
           VALUES ($1,$2,$3,$4,$5)
           ON CONFLICT (employee_id, work_date)
           DO UPDATE SET status = EXCLUDED.status, day_type = EXCLUDED.day_type, note = EXCLUDED.note`,
          [r.employee_id, work_date, r.status, r.day_type || 'full', (r.note || '').trim() || null]);
      }
    }
    await client.query('COMMIT');
    res.json({ saved: records.length });
  } catch (e) {
    await client.query('ROLLBACK');
    throw e;
  } finally {
    client.release();
  }
}));

// GET /api/attendance?month=1-12&year=YYYY[&employee_id=][&date=]   (admin)
router.get('/', authorize('admin'), asyncHandler(async (req, res) => {
  const { month, year, employee_id, date } = req.query;
  const where = [], vals = [];
  if (date) { vals.push(date); where.push(`a.work_date = $${vals.length}`); }
  if (month && year) {
    vals.push(Number(year), Number(month));
    where.push(`a.work_date >= make_date($${vals.length - 1}, $${vals.length}, 1)
                AND a.work_date < make_date($${vals.length - 1}, $${vals.length}, 1) + interval '1 month'`);
  }
  if (employee_id) { vals.push(employee_id); where.push(`a.employee_id = $${vals.length}`); }
  const { rows } = await pool.query(
    `SELECT a.id, a.employee_id, e.name, a.work_date::text AS work_date,
            a.status, a.day_type, a.note, a.check_in, a.check_out
     FROM attendance a JOIN employees e ON e.id = a.employee_id
     ${where.length ? 'WHERE ' + where.join(' AND ') : ''}
     ORDER BY a.work_date DESC, e.name`, vals);
  res.json(rows);
}));

// DELETE /api/attendance/:id  (admin)
router.delete('/:id', authorize('admin'), asyncHandler(async (req, res) => {
  await pool.query('DELETE FROM attendance WHERE id = $1', [req.params.id]);
  res.json({ message: 'Deleted' });
}));

module.exports = router;