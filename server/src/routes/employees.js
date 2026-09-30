const router = require('express').Router();
const bcrypt = require('bcrypt');

const pool = require('../config/db');
const asyncHandler = require('../utils/asyncHandler');
const {
  authenticate,
  authorize
} = require('../middleware/auth');

router.use(
  authenticate,
  authorize('admin')
);


// =========================================================
// FIELD DEFINITIONS
// =========================================================

const TEXT = [
  'emp_code',
  'name',
  'designation',
  'department',
  'gender',
  'pan',
  'pf_uan',
  'account_number',
  'ifsc_code'
];

const DATES = [
  'dob',
  'joining_date',
  'resignation_date'
];

const NUMS = [
  'ctc',

  // Earnings
  'basic',
  'hra',
  'special_allowance',
  'lta',
  'other_allowances',

  // Deductions
  'epf',
  'professional_tax'
];


// =========================================================
// HELPERS
// =========================================================

const isDate = (value) =>
  /^\d{4}-\d{2}-\d{2}$/.test(value || '');


const OUT = `
  id,
  emp_code,
  name,
  email,
  role,
  designation,
  department,
  gender,

  dob::text AS dob,

  ctc,

  pan,
  pf_uan,

  account_number,
  ifsc_code,

  tax_regime,

  joining_date::text AS joining_date,
  resignation_date::text AS resignation_date,

  basic,
  hra,
  special_allowance,
  lta,
  other_allowances,

  epf,
  professional_tax,

  is_active
`;


// =========================================================
// CLEAN / VALIDATE INPUT
// =========================================================

function clean(body) {

  const values = {};


  // -------------------------------------------------------
  // TEXT
  // -------------------------------------------------------

  for (const key of TEXT) {

    if (!(key in body)) {
      continue;
    }

    let value =
      body[key] == null
        ? ''
        : String(body[key]).trim();


    if (
      [
        'emp_code',
        'pan',
        'ifsc_code'
      ].includes(key)
    ) {
      value = value.toUpperCase();
    }


    values[key] = value || null;
  }


  // -------------------------------------------------------
  // DATES
  // -------------------------------------------------------

  for (const key of DATES) {

    if (!(key in body)) {
      continue;
    }

    const value = body[key] || null;


    if (
      value &&
      !isDate(
        String(value).slice(0, 10)
      )
    ) {
      return {
        error: `Invalid ${key}`
      };
    }


    values[key] = value
      ? String(value).slice(0, 10)
      : null;
  }


  // -------------------------------------------------------
  // NUMERIC FIELDS
  // -------------------------------------------------------

  for (const key of NUMS) {

    if (!(key in body)) {
      continue;
    }


    const number = Number(body[key]) || 0;


    if (number < 0) {

      return {
        error:
          'Salary components must be zero or more'
      };
    }


    values[key] = number;
  }


  // -------------------------------------------------------
  // TAX REGIME
  // -------------------------------------------------------

  if ('tax_regime' in body) {

    if (
      !['new', 'old'].includes(
        body.tax_regime
      )
    ) {

      return {
        error:
          'tax_regime must be new or old'
      };
    }


    values.tax_regime =
      body.tax_regime;
  }


  // -------------------------------------------------------
  // REQUIRED / FORMAT VALIDATION
  // -------------------------------------------------------

  if (
    'name' in values &&
    !values.name
  ) {

    return {
      error: 'Name is required'
    };
  }


  if (
    values.pan &&
    !/^[A-Z]{5}[0-9]{4}[A-Z]$/.test(
      values.pan
    )
  ) {

    return {
      error:
        'PAN must look like ABCDE1234F'
    };
  }


  if (
    values.pf_uan &&
    !/^\d{12}$/.test(
      values.pf_uan
    )
  ) {

    return {
      error:
        'PF UAN must be 12 digits'
    };
  }


  if (
    values.account_number &&
    !/^\d{9,18}$/.test(
      values.account_number
    )
  ) {

    return {
      error:
        'Account number must be 9 to 18 digits'
    };
  }


  if (
    values.ifsc_code &&
    !/^[A-Z]{4}0[A-Z0-9]{6}$/.test(
      values.ifsc_code
    )
  ) {

    return {
      error:
        'IFSC must look like SBIN0001234'
    };
  }


  if (
    values.joining_date &&
    values.resignation_date &&
    values.resignation_date <
      values.joining_date
  ) {

    return {
      error:
        'Resignation date cannot be before joining date'
    };
  }


  return {
    values
  };
}


// =========================================================
// DUPLICATE ERROR
// =========================================================

const dupMessage = (error) => {

  if (
    error.constraint &&
    error.constraint.includes(
      'emp_code'
    )
  ) {

    return 'Employee ID already exists';
  }


  return 'Email already exists';
};


// =========================================================
// GET EMPLOYEE STATS
// =========================================================

router.get(
  '/stats',
  asyncHandler(
    async (req, res) => {

      const {
        rows
      } = await pool.query(`
        WITH today AS (
          SELECT
            (
              now()
              AT TIME ZONE 'Asia/Kolkata'
            )::date AS d
        )

        SELECT

          (
            SELECT COUNT(*)
            FROM employees
            WHERE role = 'employee'
              AND is_active
          )::int AS "headcount",

          (
            SELECT COUNT(*)
            FROM leaves
            WHERE status = 'pending'
          )::int AS "pendingLeaves",

          (
            SELECT COUNT(*)
            FROM attendance a,
                 today t

            WHERE a.work_date = t.d
              AND a.status = 'present'
          )::int AS "presentToday",

          (
            SELECT COALESCE(
              SUM(net_pay),
              0
            )

            FROM payslips p,
                 today t

            WHERE p.month =
              EXTRACT(
                MONTH FROM t.d
              )

              AND p.year =
              EXTRACT(
                YEAR FROM t.d
              )
          ) AS "monthlyPayroll"
      `);


      res.json(rows[0]);
    }
  )
);


// =========================================================
// GET EMPLOYEES
// =========================================================

router.get(
  '/',
  asyncHandler(
    async (req, res) => {

      const roleFilter =
        req.query.all
          ? ''
          : "AND role = 'employee'";


      const {
        rows
      } = await pool.query(
        `
        SELECT ${OUT}

        FROM employees

        WHERE is_active
        ${roleFilter}

        ORDER BY name
        `
      );


      res.json(rows);
    }
  )
);


// =========================================================
// CREATE EMPLOYEE
// =========================================================

router.post(
  '/',
  asyncHandler(
    async (req, res) => {

      const body =
        req.body || {};


      const {
        values,
        error
      } = clean(body);


      if (error) {

        return res
          .status(400)
          .json({
            message: error
          });
      }


      const email =
        (body.email || '')
          .trim();


      // ---------------------------------------------------
      // REQUIRED FIELDS
      // ---------------------------------------------------

      if (!values.emp_code) {

        return res
          .status(400)
          .json({
            message:
              'Employee ID is required'
          });
      }


      if (!values.name) {

        return res
          .status(400)
          .json({
            message:
              'Name is required'
          });
      }


      if (
        !email ||
        !body.password
      ) {

        return res
          .status(400)
          .json({
            message:
              'Email and password are required'
          });
      }


      if (!values.designation) {

        return res
          .status(400)
          .json({
            message:
              'Designation is required'
          });
      }


      if (!values.gender) {

        return res
          .status(400)
          .json({
            message:
              'Gender is required'
          });
      }


      if (!values.dob) {

        return res
          .status(400)
          .json({
            message:
              'Date of birth is required'
          });
      }


      // ---------------------------------------------------
      // PASSWORD HASH
      // ---------------------------------------------------

      const hash =
        await bcrypt.hash(
          body.password,
          10
        );


      const keys =
        Object.keys(values);


      const cols = [
        'email',
        'password_hash',
        'role',
        ...keys
      ];


      const params = [
        email,
        hash,
        'employee',
        ...keys.map(
          (key) =>
            values[key]
        )
      ];


      try {

        const {
          rows
        } = await pool.query(

          `
          INSERT INTO employees (
            ${cols.join(',')}
          )

          VALUES (
            ${cols
              .map(
                (_, index) =>
                  `$${index + 1}`
              )
              .join(',')}
          )

          RETURNING ${OUT}
          `,

          params
        );


        res
          .status(201)
          .json(rows[0]);

      } catch (error) {

        if (
          error.code === '23505'
        ) {

          return res
            .status(409)
            .json({
              message:
                dupMessage(error)
            });
        }


        throw error;
      }
    }
  )
);


// =========================================================
// UPDATE EMPLOYEE
// =========================================================

router.put(
  '/:id',
  asyncHandler(
    async (req, res) => {

      const body =
        req.body || {};


      const {
        values,
        error
      } = clean(body);


      if (error) {

        return res
          .status(400)
          .json({
            message: error
          });
      }


      const keys =
        Object.keys(values);


      const sets =
        keys.map(
          (key, index) =>
            `${key} = $${index + 1}`
        );


      const params =
        keys.map(
          (key) =>
            values[key]
        );


      // ---------------------------------------------------
      // OPTIONAL PASSWORD
      // ---------------------------------------------------

      if (body.password) {

        params.push(
          await bcrypt.hash(
            body.password,
            10
          )
        );


        sets.push(
          `password_hash = $${params.length}`
        );
      }


      if (!sets.length) {

        return res
          .status(400)
          .json({
            message:
              'Nothing to update'
          });
      }


      params.push(
        req.params.id
      );


      try {

        const {
          rows
        } = await pool.query(

          `
          UPDATE employees

          SET ${sets.join(', ')}

          WHERE id = $${params.length}

            AND role = 'employee'

          RETURNING ${OUT}
          `,

          params
        );


        if (!rows[0]) {

          return res
            .status(404)
            .json({
              message:
                'Employee not found'
            });
        }


        res.json(rows[0]);

      } catch (error) {

        if (
          error.code === '23505'
        ) {

          return res
            .status(409)
            .json({
              message:
                dupMessage(error)
            });
        }


        throw error;
      }
    }
  )
);


// =========================================================
// SOFT DELETE EMPLOYEE
// =========================================================

router.delete(
  '/:id',
  asyncHandler(
    async (req, res) => {

      const {
        rowCount
      } = await pool.query(

        `
        UPDATE employees

        SET is_active = false

        WHERE id = $1

          AND role = 'employee'
        `,

        [req.params.id]
      );


      if (!rowCount) {

        return res
          .status(404)
          .json({
            message:
              'Employee not found'
          });
      }


      res.json({
        message: 'Deleted'
      });
    }
  )
);


module.exports = router;