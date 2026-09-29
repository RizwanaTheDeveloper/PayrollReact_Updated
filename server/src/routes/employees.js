const router = require('express').Router();
const bcrypt = require('bcrypt');
const pool = require('../config/db');
const asyncHandler = require('../utils/asyncHandler');
const { authenticate, authorize } = require('../middleware/auth');

router.use(authenticate, authorize('admin'));

const TEXT  = ['emp_code', 'name', 'designation', 'department', 'gender', 'pan', 'pf_uan', 'account_number', 'ifsc_code'];
const DATES = ['dob', 'joining_date', 'resignation_date'];
const NUMS  = ['ctc', 'basic', 'hra', 'special_allowance', 'lta', 'other_allowances'];

const isDate = (v) => /^\d{4}-\d{2}-\d{2}$/.test(v || '');

const OUT = `id, emp_code, name, email, role, designation, department, gender,
  dob::text AS dob, ctc, pan, pf_uan, account_number, ifsc_code, tax_regime,
  joining_date::text AS joining_date, resignation_date::text AS resignation_date,
  basic, hra, special_allowance, lta, other_allowances, is_active`;

// Validates and normalises only the fields present in the body.
function clean(body) {
  const v = {};
  for (const k of TEXT) {
    if (!(k in body)) continue;
    let s = body[k] == null ? '' : String(body[k]).trim();
    if (['emp_code', 'pan', 'ifsc_code'].includes(k)) s = s.toUpperCase();
    v[k] = s || null;
  }
  for (const k of DATES) {
    if (!(k in body)) continue;
    const s = body[k] || null;
    if (s && !isDate(String(s).slice(0, 10))) return { error: `Invalid ${k}` };
    v[k] = s ? String(s).slice(0, 10) : null;
  }
  for (const k of NUMS) {
    if (!(k in body)) continue;
    const n = Number(body[k]) || 0;
    if (n < 0) return { error: 'Salary components must be zero or more' };
    v[k] = n;
  }
  if ('tax_regime' in body) {
    if (!['new', 'old'].includes(body.tax_regime)) return { error: 'tax_regime must be new or old' };
    v.tax_regime = body.tax_regime;
  }

  if ('name' in v && !v.name) return { error: 'Name is required' };
  if (v.pan && !/^[A-Z]{5}[0-9]{4}[A-Z]$/.test(v.pan)) return { error: 'PAN must look like ABCDE1234F' };
  if (v.pf_uan && !/^\d{12}$/.test(v.pf_uan)) return { error: 'PF UAN must be 12 digits' };
  if (v.account_number && !/^\d{9,18}$/.test(v.account_number)) return { error: 'Account number must be 9 to 18 digits' };
  if (v.ifsc_code && !/^[A-Z]{4}0[A-Z0-9]{6}$/.test(v.ifsc_code)) return { error: 'IFSC must look like SBIN0001234' };
  if (v.joining_date && v.resignation_date && v.resignation_date < v.joining_date)
    return { error: 'Resignation date cannot be before joining date' };
  return { values: v };
}

const dupMessage = (e) =>
  e.constraint && e.constraint.includes('emp_code') ? 'Employee ID already exists' : 'Email already exists';

// GET /api/employees/stats  (admin dashboard)
router.get('/stats', asyncHandler(async (req, res) => {
  const { rows } = await pool.query(`
    WITH today AS (SELECT (now() AT TIME ZONE 'Asia/Kolkata')::date AS d)
    SELECT
      (SELECT COUNT(*) FROM employees WHERE role = 'employee' AND is_active)::int AS "headcount",
      (SELECT COUNT(*) FROM leaves WHERE status = 'pending')::int AS "pendingLeaves",
      (SELECT COUNT(*) FROM attendance a, today t
         WHERE a.work_date = t.d AND a.status = 'present')::int AS "presentToday",
      (SELECT COALESCE(SUM(net_pay), 0) FROM payslips p, today t
         WHERE p.month = EXTRACT(MONTH FROM t.d) AND p.year = EXTRACT(YEAR FROM t.d)) AS "monthlyPayroll"
  `);
  res.json(rows[0]);
}));

// GET /api/employees  (active employees; add ?all=1 to include admins)
router.get('/', asyncHandler(async (req, res) => {
  const roleFilter = req.query.all ? '' : "AND role = 'employee'";
  const { rows } = await pool.query(
    `SELECT ${OUT} FROM employees WHERE is_active ${roleFilter} ORDER BY name`);
  res.json(rows);
}));

// POST /api/employees
router.post('/', asyncHandler(async (req, res) => {
  const body = req.body || {};
  const { values, error } = clean(body);
  if (error) return res.status(400).json({ message: error });

  const email = (body.email || '').trim();
  if (!values.emp_code) return res.status(400).json({ message: 'Employee ID is required' });
  if (!values.name) return res.status(400).json({ message: 'Name is required' });
  if (!email || !body.password) return res.status(400).json({ message: 'Email and password are required' });
  if (!values.designation) return res.status(400).json({ message: 'Designation is required' });
  if (!values.gender) return res.status(400).json({ message: 'Gender is required' });
  if (!values.dob) return res.status(400).json({ message: 'Date of birth is required' });

  const hash = await bcrypt.hash(body.password, 10);
  const keys = Object.keys(values);
  const cols = ['email', 'password_hash', 'role', ...keys];
  const params = [email, hash, 'employee', ...keys.map((k) => values[k])];
  try {
    const { rows } = await pool.query(
      `INSERT INTO employees (${cols.join(',')})
       VALUES (${cols.map((_, i) => `$${i + 1}`).join(',')}) RETURNING ${OUT}`, params);
    res.status(201).json(rows[0]);
  } catch (e) {
    if (e.code === '23505') return res.status(409).json({ message: dupMessage(e) });
    throw e;
  }
}));

// PUT /api/employees/:id  (email is not editable; password is optional)
router.put('/:id', asyncHandler(async (req, res) => {
  const body = req.body || {};
  const { values, error } = clean(body);
  if (error) return res.status(400).json({ message: error });

  const keys = Object.keys(values);
  const sets = keys.map((k, i) => `${k} = $${i + 1}`);
  const params = keys.map((k) => values[k]);
  if (body.password) {
    params.push(await bcrypt.hash(body.password, 10));
    sets.push(`password_hash = $${params.length}`);
  }
  if (!sets.length) return res.status(400).json({ message: 'Nothing to update' });

  params.push(req.params.id);
  try {
    const { rows } = await pool.query(
      `UPDATE employees SET ${sets.join(', ')}
       WHERE id = $${params.length} AND role = 'employee' RETURNING ${OUT}`, params);
    if (!rows[0]) return res.status(404).json({ message: 'Employee not found' });
    res.json(rows[0]);
  } catch (e) {
    if (e.code === '23505') return res.status(409).json({ message: dupMessage(e) });
    throw e;
  }
}));

// DELETE /api/employees/:id  -> soft delete (keeps their payslips/attendance/leave history)
router.delete('/:id', asyncHandler(async (req, res) => {
  const { rowCount } = await pool.query(
    `UPDATE employees SET is_active = false WHERE id = $1 AND role = 'employee'`, [req.params.id]);
  if (!rowCount) return res.status(404).json({ message: 'Employee not found' });
  res.json({ message: 'Deleted' });
}));

module.exports = router;