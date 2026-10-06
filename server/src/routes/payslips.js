const router = require('express').Router();

const pool = require('../config/db');
const { LOCK, planRecoveries, saveRecoveries } = require('../utils/loanRecovery');
const { calcPayDays } = require('../utils/payDays');

const asyncHandler = require('../utils/asyncHandler');

const {
  authenticate,
  authorize,
} = require('../middleware/auth');

const generatePayslipPdf =
  require('../utils/payslipPdf');

router.use(authenticate);

// =========================================================
// HELPERS
// =========================================================

const num = (value) => {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
};

// =========================================================
// EMPLOYEE - MY PAYSLIPS
// =========================================================

router.get(
  '/my',
  asyncHandler(async (req, res) => {
    const { rows } = await pool.query(
      `
      SELECT
        id,
        month,
        year,

        -- Earnings
        basic,
        hra,
        special_allowance,
        lta,
        other_allowances,
        allowances,

        -- Deductions
        epf,
        professional_tax,
        advance,
        deductions,

        -- Final
        net_pay,
        COALESCE((SELECT json_agg(json_build_object('advance_id', r.advance_id, 'amount', r.amount, 'record_type', a.record_type) ORDER BY r.advance_id)
          FROM advance_recoveries r JOIN advances a ON a.id = r.advance_id WHERE r.payslip_id = p.id), '[]'::json) AS advance_recoveries

      FROM payslips p

      WHERE employee_id = $1

      ORDER BY
        year DESC,
        month DESC
      `,
      [req.user.id]
    );

    res.json(rows);
  })
);

// =========================================================
// ADMIN - VIEW PAYSLIPS
// =========================================================

router.get(
  '/',
  authorize('admin'),
  asyncHandler(async (req, res) => {
    const {
      month,
      year,
      employee_id,
    } = req.query;

    const where = [];
    const vals = [];

    if (month) {
      vals.push(month);

      where.push(
        `p.month = $${vals.length}`
      );
    }

    if (year) {
      vals.push(year);

      where.push(
        `p.year = $${vals.length}`
      );
    }

    if (employee_id) {
      vals.push(employee_id);

      where.push(
        `p.employee_id = $${vals.length}`
      );
    }

    const { rows } =
      await pool.query(
        `
        SELECT
          p.*,
          e.name,
          e.emp_code,
          COALESCE((SELECT json_agg(json_build_object('advance_id', r.advance_id, 'amount', r.amount, 'record_type', a.record_type))
            FROM advance_recoveries r JOIN advances a ON a.id = r.advance_id WHERE r.payslip_id = p.id), '[]'::json) AS advance_recoveries

        FROM payslips p

        JOIN employees e
          ON e.id = p.employee_id

        ${
          where.length
            ? 'WHERE ' + where.join(' AND ')
            : ''
        }

        ORDER BY
          p.year DESC,
          p.month DESC,
          e.name
        `,
        vals
      );

    res.json(rows);
  })
);

// =========================================================
// GENERATE / UPDATE PAYSLIPS
// =========================================================
//
// Body:
//
// {
//   month,
//   year,
//   employee_id,
//   allowances,
//   deductions,
//   epf,
//   professional_tax
// }
//
// allowances          = additional allowance
// deductions          = additional deduction
// epf                 = payslip-specific EPF
// professional_tax    = payslip-specific Professional Tax
//
// If epf/professional_tax are not supplied,
// employee master values are used.
//
// If payslip already exists for the same
// employee/month/year, it is UPDATED.
// =========================================================

router.post(
  '/generate',
  authorize('admin'),
  asyncHandler(async (req, res) => {
    const month = Number(
      req.body?.month
    );

    const year = Number(
      req.body?.year
    );

    // const extra = num(
    //   req.body?.allowances
    // );

    // const additionalDeduction = 0;

    const extra = num(req.body?.allowances);
    const advance = num(req.body?.advance);
    const additionalDeduction = num(req.body?.deductions);

    const mode = String(
      req.body?.mode || 'generate'
    ).toLowerCase();

    const isUpdateMode =
      mode === 'update';

    const only =
      req.body?.employee_id !== undefined &&
      req.body?.employee_id !== null &&
      req.body?.employee_id !== ''
        ? Number(req.body.employee_id)
        : null;

    // -----------------------------------------------------
    // IMPORTANT:
    // null means "use employee master value"
    // otherwise use the value supplied by Payroll page.
    // -----------------------------------------------------

    const epfOverride =
      req.body?.epf !== undefined &&
      req.body?.epf !== null &&
      req.body?.epf !== ''
        ? num(req.body.epf)
        : null;

    const professionalTaxOverride =
      req.body?.professional_tax !== undefined &&
      req.body?.professional_tax !== null &&
      req.body?.professional_tax !== ''
        ? num(req.body.professional_tax)
        : null;

    // -----------------------------------------------------
    // VALIDATION
    // -----------------------------------------------------

    if (
      !(month >= 1 && month <= 12) ||
      !(year >= 2000 && year <= 2100)
    ) {
      return res.status(400).json({
        message:
          'Valid month (1-12) and year are required',
      });
    }

    if (
      only !== null &&
      (!Number.isInteger(only) || only <= 0)
    ) {
      return res.status(400).json({
        message:
          'A valid employee is required',
      });
    }

    if (
      !['generate', 'update'].includes(
        mode
      )
    ) {
      return res.status(400).json({
        message:
          'Invalid action mode',
      });
    }

    if (
      extra < 0 ||  advance < 0 ||
      additionalDeduction < 0 ||
      (epfOverride !== null &&
        epfOverride < 0) ||
      (professionalTaxOverride !== null &&
        professionalTaxOverride < 0)
    ) {
      return res.status(400).json({
        message:
          'Amounts cannot be negative',
      });
    }

    // -----------------------------------------------------
    // ELIGIBILITY
    // -----------------------------------------------------

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

    const existingCheck = isUpdateMode
      ? ''
      : `
        AND NOT EXISTS (
          SELECT 1
          FROM payslips p2
          WHERE p2.employee_id = e.id
            AND p2.year = $3::int
            AND p2.month = $2::int
        )
      `;

    // -----------------------------------------------------
    // CHECK EMPLOYEES WITHOUT BASIC SALARY
    // -----------------------------------------------------

    const noSalary =
      await pool.query(
        `
        SELECT
          COUNT(*)::int AS n

        FROM employees e

        WHERE ${ELIGIBLE}

          AND COALESCE(e.basic, 0) <= 0
        `,
        [
          only,
          month,
          year,
        ]
      );

    // -----------------------------------------------------
    // GENERATE / UPDATE PAYSLIP
    // -----------------------------------------------------

    const client = await pool.connect();
    let rowCount;
    try {
      await client.query('BEGIN');
      await client.query(LOCK);
      await planRecoveries(client, only, month, year);
      await client.query(`CREATE TEMP TABLE payroll_leave_plan (
        employee_id integer PRIMARY KEY, amount numeric NOT NULL
      ) ON COMMIT DROP`);
      const { rows: employees } = await client.query(
        `SELECT e.id,
          COALESCE(e.basic, 0) + COALESCE(e.hra, 0)
          + COALESCE(e.special_allowance, 0) + COALESCE(e.lta, 0)
          + COALESCE(e.other_allowances, 0) AS monthly_salary
         FROM employees e WHERE ${ELIGIBLE} ${existingCheck}
           AND COALESCE(e.basic, 0) > 0`, [only, month, year]);
      for (const employee of employees) {
        const days = await calcPayDays(employee.id, month, year, client);
        const amount = Math.round(num(employee.monthly_salary)
          * (days.employedDays - days.netPaidDays) / days.monthDays * 100) / 100;
        await client.query('INSERT INTO payroll_leave_plan (employee_id, amount) VALUES ($1, $2)',
          [employee.id, amount]);
      }
      const result = await client.query(
        `
        INSERT INTO payslips (
          employee_id,
          month,
          year,

          -- Earnings
          basic,
          hra,
          special_allowance,
          lta,
          other_allowances,
          allowances,

          -- Deductions
          epf,
          professional_tax,
          advance,
          deductions,

          -- Final
          net_pay
        )

        SELECT

          e.id,

          $2::int,
          $3::int,

          -- ---------------------------------------------
          -- EARNINGS
          -- ---------------------------------------------

          COALESCE(e.basic, 0),

          COALESCE(e.hra, 0),

          COALESCE(
            e.special_allowance,
            0
          ),

          COALESCE(e.lta, 0),

          COALESCE(
            e.other_allowances,
            0
          ),

          -- Additional allowance
          $4::numeric,

          -- ---------------------------------------------
          -- DEDUCTIONS
          -- ---------------------------------------------

          -- EPF
          CASE
            WHEN $6::numeric IS NULL
              THEN COALESCE(e.epf, 0)
            ELSE $6::numeric
          END,

          -- Professional Tax
          CASE
            WHEN $7::numeric IS NULL
              THEN COALESCE(
                e.professional_tax,
                0
              )
            ELSE $7::numeric
          END,

          -- Advance deducted only in the joining month
          CASE
            WHEN e.joining_date >= make_date(
                $3::int,
                $2::int,
                1
              )
              AND e.joining_date < (
                make_date($3::int, $2::int, 1)
                + INTERVAL '1 month'
              )::date
              THEN COALESCE(e.advance, 0)
            ELSE 0
          END + COALESCE((SELECT SUM(plan.amount) FROM payroll_loan_plan plan WHERE plan.employee_id = e.id), 0),

          -- Additional deduction
          $5::numeric + COALESCE(leave_plan.amount, 0),

          -- ---------------------------------------------
          -- NET PAY
          -- ---------------------------------------------

          (
            COALESCE(e.basic, 0)
            + COALESCE(e.hra, 0)
            + COALESCE(
                e.special_allowance,
                0
              )
            + COALESCE(e.lta, 0)
            + COALESCE(
                e.other_allowances,
                0
              )
            + $4::numeric

            -

            CASE
              WHEN $6::numeric IS NULL
                THEN COALESCE(e.epf, 0)
              ELSE $6::numeric
            END

            -

            CASE
              WHEN $7::numeric IS NULL
                THEN COALESCE(
                  e.professional_tax,
                  0
                )
              ELSE $7::numeric
            END

            - CASE
              WHEN e.joining_date >= make_date(
                  $3::int,
                  $2::int,
                  1
                )
                AND e.joining_date < (
                  make_date($3::int, $2::int, 1)
                  + INTERVAL '1 month'
                )::date
                THEN COALESCE(e.advance, 0)
              ELSE 0
            END

            - COALESCE((SELECT SUM(plan.amount) FROM payroll_loan_plan plan WHERE plan.employee_id = e.id), 0)
            - $5::numeric
            - COALESCE(leave_plan.amount, 0)
          )

        FROM employees e
        LEFT JOIN payroll_leave_plan leave_plan ON leave_plan.employee_id = e.id

        WHERE ${ELIGIBLE}

          ${existingCheck}

          AND COALESCE(e.basic, 0) > 0

        ON CONFLICT (
          employee_id,
          year,
          month
        )

        ${
          isUpdateMode
            ? `DO UPDATE SET
              basic = EXCLUDED.basic,
              hra = EXCLUDED.hra,
              special_allowance = EXCLUDED.special_allowance,
              lta = EXCLUDED.lta,
              other_allowances = EXCLUDED.other_allowances,
              allowances = EXCLUDED.allowances,
              epf = EXCLUDED.epf,
              professional_tax = EXCLUDED.professional_tax,
              advance = EXCLUDED.advance,
              deductions = EXCLUDED.deductions,
              net_pay = EXCLUDED.net_pay`
            : 'DO NOTHING'
        }
        RETURNING id
        `,
        [
          only,
          month,
          year,
          extra,
          additionalDeduction,
          epfOverride,
          professionalTaxOverride,
        ]
      );
      rowCount = result.rowCount;
      await saveRecoveries(client, result.rows.map((row) => row.id));
      await client.query('COMMIT');
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally { client.release(); }

    // -----------------------------------------------------
    // RESPONSE
    // -----------------------------------------------------

    const message = isUpdateMode
      ? 'Payslip updated successfully.'
      : rowCount
        ? only !== null
          ? 'Payslip generated successfully.'
          : 'Payslips generated successfully.'
        : only !== null
          ? 'Payslip already exists. Use Update Payslip to modify it.'
          : 'No new payslips were generated. Existing payslips were left unchanged.';

    res.status(201).json({
      generated: rowCount,

      skippedNoSalary:
        noSalary.rows[0].n,

      message,
    });
  })
);

// =========================================================
// DELETE PAYSLIP
// =========================================================

router.delete(
  '/:id',
  authorize('admin'),
  asyncHandler(async (req, res) => {
    const client = await pool.connect();
    let rowCount;
    try {
      await client.query('BEGIN');
      await client.query(LOCK);
      const result = await client.query('DELETE FROM payslips WHERE id = $1', [req.params.id]);
      rowCount = result.rowCount;
      await client.query('COMMIT');
    } catch (err) { await client.query('ROLLBACK'); throw err; }
    finally { client.release(); }

    if (!rowCount) {
      return res.status(404).json({
        message:
          'Payslip not found',
      });
    }

    res.json({
      message: 'Deleted',
    });
  })
);

// =========================================================
// DOWNLOAD PAYSLIP PDF
// =========================================================
//
// Admin:
//   Can download any payslip.
//
// Employee:
//   Can download only their own payslip.
// =========================================================

router.get(
  '/:id/download',
  asyncHandler(async (req, res) => {
    const isAdmin =
      req.user?.role === 'admin';

    const queryValues = isAdmin
      ? [req.params.id]
      : [
          req.params.id,
          req.user.id,
        ];

    const whereClause = isAdmin
      ? 'p.id = $1'
      : `
        p.id = $1
        AND p.employee_id = $2
      `;

    const { rows } =
      await pool.query(
        `
        SELECT
          p.*,

          -- Employee information
          COALESCE((SELECT json_agg(json_build_object('advance_id', r.advance_id, 'amount', r.amount, 'record_type', a.record_type) ORDER BY r.advance_id)
            FROM advance_recoveries r JOIN advances a ON a.id = r.advance_id WHERE r.payslip_id = p.id), '[]'::json) AS advance_recoveries,
          e.name,
          e.email,
          e.designation,
          e.emp_code,
          e.gender,
          e.dob::text AS dob,
          e.pan,
          e.pf_uan,
          e.account_number,
          e.ifsc_code,
          e.tax_regime,
          e.joining_date::text AS joining_date,
          e.resignation_date,
          e.is_active

        FROM payslips p

        JOIN employees e
          ON e.id = p.employee_id

        WHERE ${whereClause}
        `,
        queryValues
      );

    if (!rows.length) {
      return res.status(404).json({
        message:
          'Payslip not found',
      });
    }

    const payslip = rows[0];

    // ---------------------------------------------------
    // NORMALIZE DATE VALUES
    // ---------------------------------------------------

    payslip.dob =
      payslip.dob
        ? String(payslip.dob).slice(0, 10)
        : '';

    payslip.joining_date =
      payslip.joining_date
        ? String(
            payslip.joining_date
          ).slice(0, 10)
        : '';

    payslip.resignation_date =
      payslip.resignation_date
        ? String(
            payslip.resignation_date
          ).slice(0, 10)
        : '';

    // ---------------------------------------------------
    // COMPATIBILITY FIELDS FOR PDF GENERATOR
    // ---------------------------------------------------

    payslip.account_number =
      payslip.account_number || '';

    payslip.bank_name = '';

    payslip.uan =
      payslip.pf_uan || '';

    payslip.month_days = 0;

    payslip.net_paid_days = 0;

    // ---------------------------------------------------
    // GENERATE PDF
    // ---------------------------------------------------

    return generatePayslipPdf(
      res,
      payslip
    );
  })
);

module.exports = router;
