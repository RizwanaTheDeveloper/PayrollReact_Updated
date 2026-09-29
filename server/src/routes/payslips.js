const router = require('express').Router();
const pool = require('../config/db');
const asyncHandler = require('../utils/asyncHandler');
const { authenticate, authorize } = require('../middleware/auth');
const generatePayslipPdf = require('../utils/payslipPdf');

router.use(authenticate);

const num = (v) => Number(v) || 0;

// GET /api/payslips/my
// Employee: only their own payslips
router.get(
  '/my',
  asyncHandler(async (req, res) => {
    const { rows } = await pool.query(
      `SELECT
        id,
        month,
        year,
        basic,
        allowances,
        deductions,
        net_pay
       FROM payslips
       WHERE employee_id = $1
       ORDER BY year DESC, month DESC`,
      [req.user.id]
    );

    res.json(rows);
  })
);

// GET /api/payslips?month=&year=&employee_id=
// Admin: view payslips
router.get(
  '/',
  authorize('admin'),
  asyncHandler(async (req, res) => {
    const { month, year, employee_id } = req.query;

    const where = [];
    const vals = [];

    if (month) {
      vals.push(month);
      where.push(`p.month = $${vals.length}`);
    }

    if (year) {
      vals.push(year);
      where.push(`p.year = $${vals.length}`);
    }

    if (employee_id) {
      vals.push(employee_id);
      where.push(`p.employee_id = $${vals.length}`);
    }

    const { rows } = await pool.query(
      `SELECT
        p.*,
        e.name,
        e.emp_code
       FROM payslips p
       JOIN employees e
         ON e.id = p.employee_id
       ${where.length ? 'WHERE ' + where.join(' AND ') : ''}
       ORDER BY
         p.year DESC,
         p.month DESC,
         e.name`,
      vals
    );

    res.json(rows);
  })
);

// POST /api/payslips/generate
// Admin: generate payslips
//
// Body:
// {
//   month,
//   year,
//   allowances?,
//   deductions?,
//   employee_id?
// }
router.post(
  '/generate',
  authorize('admin'),
  asyncHandler(async (req, res) => {
    const month = Number(req.body?.month);
    const year = Number(req.body?.year);

    const extra = num(req.body?.allowances);
    const ded = num(req.body?.deductions);

    const only = req.body?.employee_id
      ? Number(req.body.employee_id)
      : null;

    if (
      !(month >= 1 && month <= 12) ||
      !(year >= 2000 && year <= 2100)
    ) {
      return res.status(400).json({
        message: 'Valid month (1-12) and year are required'
      });
    }

    if (extra < 0 || ded < 0) {
      return res.status(400).json({
        message: 'Amounts cannot be negative'
      });
    }

    const ELIGIBLE = `
      e.role = 'employee'
      AND e.is_active
      AND ($1::int IS NULL OR e.id = $1::int)
      AND (
        e.joining_date IS NULL
        OR e.joining_date <
          make_date($3::int, $2::int, 1) + interval '1 month'
      )
      AND (
        e.resignation_date IS NULL
        OR e.resignation_date >=
          make_date($3::int, $2::int, 1)
      )
    `;

    const noSalary = await pool.query(
      `SELECT COUNT(*)::int AS n
       FROM employees e
       WHERE ${ELIGIBLE}
         AND e.basic <= 0`,
      [only, month, year]
    );

    const { rowCount } = await pool.query(
      `INSERT INTO payslips (
        employee_id,
        month,
        year,
        basic,
        hra,
        special_allowance,
        lta,
        other_allowances,
        allowances,
        deductions,
        net_pay
      )
      SELECT
        e.id,
        $2::int,
        $3::int,
        e.basic,
        e.hra,
        e.special_allowance,
        e.lta,
        e.other_allowances + $4::numeric,
        e.hra
          + e.special_allowance
          + e.lta
          + e.other_allowances
          + $4::numeric,
        $5::numeric,
        e.basic
          + e.hra
          + e.special_allowance
          + e.lta
          + e.other_allowances
          + $4::numeric
          - $5::numeric
      FROM employees e
      WHERE ${ELIGIBLE}
        AND e.basic > 0
      ON CONFLICT (employee_id, year, month)
      DO NOTHING`,
      [
        only,
        month,
        year,
        extra,
        ded
      ]
    );

    res.status(201).json({
      generated: rowCount,
      skippedNoSalary:
        noSalary.rows[0].n
    });
  })
);

// DELETE /api/payslips/:id
// Admin: remove a payslip so it can be regenerated
router.delete(
  '/:id',
  authorize('admin'),
  asyncHandler(async (req, res) => {
    const { rowCount } = await pool.query(
      `DELETE FROM payslips
       WHERE id = $1`,
      [req.params.id]
    );

    if (!rowCount) {
      return res.status(404).json({
        message: 'Payslip not found'
      });
    }

    res.json({
      message: 'Deleted'
    });
  })
);

// GET /api/payslips/:id/download
// Owner or admin: generate PDF using utils/payslipPdf.js
router.get(
  '/:id/download',
  asyncHandler(async (req, res) => {
    const { rows } = await pool.query(
      `SELECT
        p.*,
        e.name,
        e.email,
        e.designation,
        e.department,
        e.emp_code,
        e.pan,
        e.pf_uan,
        e.account_number,
        e.joining_date::text AS joining_date
      FROM payslips p
      JOIN employees e
        ON e.id = p.employee_id
      WHERE p.id = $1`,
      [req.params.id]
    );

    if (!rows.length) {
      return res.status(404).json({
        message: 'Payslip not found'
      });
    }

    const payslip = rows[0];

    // Make the existing payslipPdf.js compatible with
    // the fields currently available in the database.
    payslip.travel_allowance = 0;
    payslip.leave_allowance = 0;
    payslip.bonus = 0;
    payslip.professional_tax = 0;
    payslip.pf = 0;

    // Existing database fields
    // are used where possible.
    payslip.travel_allowance = Number(payslip.lta || 0);

    payslip.leave_allowance = 0;
    payslip.bonus = 0;

    // If deductions contains the complete deduction amount,
    // use it as the payslip deduction amount.
    payslip.professional_tax = 0;
    payslip.pf = Number(payslip.deductions || 0);

    // Existing account information
    // payslipPdf.js will mask the account number.
    payslip.account_number = payslip.account_number || '';

    // These fields are not currently present in the database.
    payslip.bank_name = '';
    payslip.gender = '';
    payslip.location = '';
    payslip.dob = '';
    payslip.uan = payslip.pf_uan || '';
    payslip.resignation_date = '';
    payslip.month_days = 0;
    payslip.net_paid_days = 0;

    return generatePayslipPdf(res, payslip);
  })
);

module.exports = router;