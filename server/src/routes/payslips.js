const router = require('express').Router();
const pool = require('../config/db');
const asyncHandler = require('../utils/asyncHandler');
const { authenticate, authorize } = require('../middleware/auth');
const generatePayslipPdf = require('../utils/payslipPdf');

router.use(authenticate);

const num = (v) => Number(v) || 0;

/* =========================================================
   GET /api/payslips/my
   Employee: view their own payslips
   ========================================================= */

router.get(
  '/my',
  asyncHandler(async (req, res) => {
    const { rows } = await pool.query(
      `SELECT
        p.*,

        e.name,
        e.email,
        e.emp_code,
        e.designation,
        e.gender,
        e.dob,
        e.pan,
        e.pf_uan,
        e.account_number,
        e.ifsc_code,
        e.tax_regime,
        e.joining_date::text AS joining_date,
        e.resignation_date::text AS resignation_date,

        e.ctc,
        e.basic,
        e.hra,
        e.special_allowance,
        e.lta,
        e.other_allowances,

        e.is_active

       FROM payslips p

       JOIN employees e
         ON e.id = p.employee_id

       WHERE p.employee_id = $1

       ORDER BY
         p.year DESC,
         p.month DESC`,
      [req.user.id]
    );

    res.json(rows);
  })
);


/* =========================================================
   GET /api/payslips?month=&year=&employee_id=
   Admin: view payslips
   ========================================================= */

router.get(
  '/',
  authorize('admin'),
  asyncHandler(async (req, res) => {
    const {
      month,
      year,
      employee_id
    } = req.query;

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
        e.email,
        e.emp_code,
        e.designation

       FROM payslips p

       JOIN employees e
         ON e.id = p.employee_id

       ${where.length
         ? 'WHERE ' + where.join(' AND ')
         : ''}

       ORDER BY
         p.year DESC,
         p.month DESC,
         e.name`,
      vals
    );

    res.json(rows);
  })
);


/* =========================================================
   POST /api/payslips/generate
   Admin: generate payslips
   ========================================================= */

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

    /* ---------- Validation ---------- */

    if (
      !(month >= 1 && month <= 12) ||
      !(year >= 2000 && year <= 2100)
    ) {
      return res.status(400).json({
        message:
          'Valid month (1-12) and year are required'
      });
    }

    if (extra < 0 || ded < 0) {
      return res.status(400).json({
        message:
          'Amounts cannot be negative'
      });
    }

    /* ---------- Eligible employees ---------- */

    const ELIGIBLE = `
      e.role = 'employee'

      AND e.is_active

      AND (
        $1::int IS NULL
        OR e.id = $1::int
      )

      AND (
        e.joining_date IS NULL
        OR e.joining_date <
          make_date(
            $3::int,
            $2::int,
            1
          ) + interval '1 month'
      )

      AND (
        e.resignation_date IS NULL
        OR e.resignation_date >=
          make_date(
            $3::int,
            $2::int,
            1
          )
      )
    `;

    /* ---------- Employees without salary ---------- */

    const noSalary = await pool.query(
      `SELECT
        COUNT(*)::int AS n

       FROM employees e

       WHERE ${ELIGIBLE}

       AND e.basic <= 0`,
      [
        only,
        month,
        year
      ]
    );


    /* ---------- Generate payslips ---------- */

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

        e.other_allowances
          + $4::numeric,

        (
          e.hra
          + e.special_allowance
          + e.lta
          + e.other_allowances
          + $4::numeric
        ),

        $5::numeric,

        (
          e.basic
          + e.hra
          + e.special_allowance
          + e.lta
          + e.other_allowances
          + $4::numeric
          - $5::numeric
        )

      FROM employees e

      WHERE ${ELIGIBLE}

      AND e.basic > 0

      ON CONFLICT (
        employee_id,
        year,
        month
      )

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


/* =========================================================
   DELETE /api/payslips/:id
   Admin: delete payslip
   ========================================================= */

router.delete(
  '/:id',
  authorize('admin'),
  asyncHandler(async (req, res) => {
    const { rowCount } =
      await pool.query(
        `DELETE FROM payslips
         WHERE id = $1`,
        [req.params.id]
      );

    if (!rowCount) {
      return res.status(404).json({
        message:
          'Payslip not found'
      });
    }

    res.json({
      message:
        'Payslip deleted successfully'
    });
  })
);


/* =========================================================
   GET /api/payslips/:id/download
   Owner or Admin: download PDF
   ========================================================= */

router.get(
  '/:id/download',
  asyncHandler(async (req, res) => {

    const { rows } =
      await pool.query(
        `SELECT
          p.*,

          e.name,
          e.email,
          e.emp_code,

          e.designation,
          e.gender,

          e.dob,
          e.pan,
          e.pf_uan,

          e.account_number,
          e.ifsc_code,

          e.tax_regime,

          e.joining_date::text
            AS joining_date,

          e.resignation_date::text
            AS resignation_date,

          e.ctc,

          e.basic,
          e.hra,
          e.special_allowance,
          e.lta,
          e.other_allowances,

          e.is_active

         FROM payslips p

         JOIN employees e
           ON e.id = p.employee_id

         WHERE p.id = $1`,
        [req.params.id]
      );


    /* ---------- Payslip not found ---------- */

    if (!rows.length) {
      return res.status(404).json({
        message:
          'Payslip not found'
      });
    }


    const payslip = rows[0];


    /* =====================================================
       Authorization

       Admin can download any payslip.

       Employee can download only
       their own payslip.
       ===================================================== */

    if (
      req.user.role !== 'admin' &&
      Number(payslip.employee_id) !==
        Number(req.user.id)
    ) {
      return res.status(403).json({
        message:
          'You are not authorized to download this payslip'
      });
    }


    /* =====================================================
       Generate PDF
       ===================================================== */

    return generatePayslipPdf(
      res,
      payslip
    );
  })
);


module.exports = router;