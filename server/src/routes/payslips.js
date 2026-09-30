const router = require('express').Router();

const pool = require('../config/db');
const asyncHandler = require('../utils/asyncHandler');
const {
  authenticate,
  authorize
} = require('../middleware/auth');

const generatePayslipPdf =
  require('../utils/payslipPdf');


router.use(authenticate);


// =========================================================
// HELPERS
// =========================================================

const num = (value) =>
  Number(value) || 0;


// =========================================================
// EMPLOYEE - MY PAYSLIPS
// =========================================================

router.get(
  '/my',
  asyncHandler(
    async (req, res) => {

      const {
        rows
      } = await pool.query(

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

          -- Extra allowance
          allowances,

          -- Deductions
          epf,
          professional_tax,
          deductions,

          -- Final
          net_pay

        FROM payslips

        WHERE employee_id = $1

        ORDER BY
          year DESC,
          month DESC
        `,

        [req.user.id]
      );


      res.json(rows);
    }
  )
);


// =========================================================
// ADMIN - VIEW PAYSLIPS
// =========================================================

router.get(
  '/',
  authorize('admin'),

  asyncHandler(
    async (req, res) => {

      const {
        month,
        year,
        employee_id
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


      const {
        rows
      } = await pool.query(

        `
        SELECT

          p.*,

          e.name,

          e.emp_code

        FROM payslips p

        JOIN employees e
          ON e.id = p.employee_id

        ${
          where.length
            ? 'WHERE ' +
              where.join(' AND ')
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
    }
  )
);


// =========================================================
// GENERATE PAYSLIPS
// =========================================================
//
// Body:
//
// {
//   month,
//   year,
//   allowances?,
//   deductions?,
//   employee_id?
// }
//
// allowances = additional allowance
// deductions = additional deduction
//
// Employee EPF + Professional Tax are automatically
// taken from the employee salary structure.
// =========================================================

router.post(
  '/generate',
  authorize('admin'),

  asyncHandler(
    async (req, res) => {

      const month =
        Number(req.body?.month);

      const year =
        Number(req.body?.year);


      const extra =
        num(req.body?.allowances);


      const additionalDeduction =
        num(req.body?.deductions);


      const only =
        req.body?.employee_id
          ? Number(
              req.body.employee_id
            )
          : null;


      // ---------------------------------------------------
      // VALIDATION
      // ---------------------------------------------------

      if (
        !(month >= 1 && month <= 12) ||
        !(year >= 2000 && year <= 2100)
      ) {

        return res
          .status(400)
          .json({
            message:
              'Valid month (1-12) and year are required'
          });
      }


      if (
        extra < 0 ||
        additionalDeduction < 0
      ) {

        return res
          .status(400)
          .json({
            message:
              'Amounts cannot be negative'
          });
      }


      // ---------------------------------------------------
      // ELIGIBILITY
      // ---------------------------------------------------

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
            )
            + interval '1 month'
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


      // ---------------------------------------------------
      // EMPLOYEES WITHOUT BASIC SALARY
      // ---------------------------------------------------

      const noSalary =
        await pool.query(

          `
          SELECT
            COUNT(*)::int AS n

          FROM employees e

          WHERE ${ELIGIBLE}

            AND e.basic <= 0
          `,

          [
            only,
            month,
            year
          ]
        );


      // ===================================================
      // CALCULATION
      // ===================================================
      //
      // Earnings:
      //
      // Basic
      // HRA
      // Special Allowance
      // LTA
      // Other Allowances
      // Extra Allowance
      //
      // Deductions:
      //
      // EPF
      // Professional Tax
      // Additional Deduction
      //
      // Net Pay =
      // Gross Earnings - Total Deductions
      // ===================================================

      const {
        rowCount
      } = await pool.query(

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

          -- Additional allowance
          allowances,

          -- Deductions
          epf,
          professional_tax,
          deductions,

          -- Net
          net_pay
        )


        SELECT

          e.id,

          $2::int,

          $3::int,


          -- ==========================================
          -- EARNINGS
          -- ==========================================

          e.basic,

          e.hra,

          e.special_allowance,

          e.lta,

          e.other_allowances,


          -- Additional allowance
          $4::numeric,


          -- ==========================================
          -- EPF
          -- ==========================================

          COALESCE(
            e.epf,
            0
          ),


          -- ==========================================
          -- PROFESSIONAL TAX
          -- ==========================================

          COALESCE(
            e.professional_tax,
            0
          ),


          -- ==========================================
          -- TOTAL ADDITIONAL DEDUCTIONS
          -- ==========================================

          $5::numeric,


          -- ==========================================
          -- NET PAY
          -- ==========================================
          --
          -- Basic
          -- + HRA
          -- + Special
          -- + LTA
          -- + Other Allowances
          -- + Extra Allowance
          --
          -- - EPF
          -- - Professional Tax
          -- - Additional Deduction
          -- ==========================================

          e.basic

          + e.hra

          + e.special_allowance

          + e.lta

          + e.other_allowances

          + $4::numeric

          - COALESCE(e.epf, 0)

          - COALESCE(
              e.professional_tax,
              0
            )

          - $5::numeric


        FROM employees e


        WHERE ${ELIGIBLE}

          AND e.basic > 0


        ON CONFLICT (
          employee_id,
          year,
          month
        )

        DO NOTHING
        `,

        [
          only,
          month,
          year,
          extra,
          additionalDeduction
        ]
      );


      // ---------------------------------------------------
      // RESPONSE
      // ---------------------------------------------------

      res
        .status(201)
        .json({

          generated:
            rowCount,

          skippedNoSalary:
            noSalary.rows[0].n

        });
    }
  )
);


// =========================================================
// DELETE PAYSLIP
// =========================================================

router.delete(
  '/:id',
  authorize('admin'),

  asyncHandler(
    async (req, res) => {

      const {
        rowCount
      } = await pool.query(

        `
        DELETE FROM payslips

        WHERE id = $1
        `,

        [req.params.id]
      );


      if (!rowCount) {

        return res
          .status(404)
          .json({
            message:
              'Payslip not found'
          });
      }


      res.json({
        message: 'Deleted'
      });
    }
  )
);


// =========================================================
// DOWNLOAD PAYSLIP PDF
// =========================================================

router.get(
  '/:id/download',

  asyncHandler(
    async (req, res) => {

      const {
        rows
      } = await pool.query(

        `
        SELECT

          p.*,

          e.name,

          e.email,

          e.designation,

          e.emp_code,

          e.pan,

          e.pf_uan,

          e.account_number,

          e.joining_date::text
            AS joining_date

        FROM payslips p

        JOIN employees e
          ON e.id = p.employee_id

        WHERE p.id = $1
        `,

        [req.params.id]
      );


      if (!rows.length) {

        return res
          .status(404)
          .json({
            message:
              'Payslip not found'
          });
      }


      const payslip =
        rows[0];


      // ---------------------------------------------------
      // COMPATIBILITY FIELDS FOR PDF GENERATOR
      // ---------------------------------------------------

      payslip.account_number =
        payslip.account_number || '';


      payslip.bank_name = '';

      payslip.gender = '';

      payslip.location = '';

      payslip.dob = '';

      payslip.uan =
        payslip.pf_uan || '';

      payslip.resignation_date =
        '';

      payslip.month_days = 0;

      payslip.net_paid_days = 0;


      // ---------------------------------------------------
      // Generate PDF
      // ---------------------------------------------------

      return generatePayslipPdf(
        res,
        payslip
      );
    }
  )
);


module.exports = router;