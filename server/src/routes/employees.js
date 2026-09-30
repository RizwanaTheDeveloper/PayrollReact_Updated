// server/src/routes/employees.js

const router = require('express').Router();
const bcrypt = require('bcrypt');
const pool = require('../config/db');
const asyncHandler = require('../utils/asyncHandler');
const {
  authenticate,
  authorize
} = require('../middleware/auth');


// =========================================================
// Authentication
// =========================================================

router.use(
  authenticate,
  authorize('admin')
);


// =========================================================
// Allowed fields
// =========================================================

const TEXT = [
  'emp_code',
  'name',
  'email',
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
  'basic',
  'hra',
  'special_allowance',
  'lta',
  'other_allowances'
];


// =========================================================
// Date validation
// =========================================================

const isDate = (v) =>
  /^\d{4}-\d{2}-\d{2}$/.test(v || '');


// =========================================================
// Fields returned to frontend
// =========================================================

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
  is_active
`;


// =========================================================
// Clean and validate employee data
// =========================================================

function clean(body) {
  const v = {};

  // -------------------------------------------------------
  // Text fields
  // -------------------------------------------------------

  for (const k of TEXT) {
    if (!(k in body)) {
      continue;
    }

    let s =
      body[k] == null
        ? ''
        : String(body[k]).trim();

    // Uppercase fields
    if (
      [
        'emp_code',
        'pan',
        'ifsc_code'
      ].includes(k)
    ) {
      s = s.toUpperCase();
    }

    // Email always lowercase
    if (k === 'email') {
      s = s.toLowerCase();
    }

    v[k] = s || null;
  }


  // -------------------------------------------------------
  // Date fields
  // -------------------------------------------------------

  for (const k of DATES) {
    if (!(k in body)) {
      continue;
    }

    const s =
      body[k] || null;

    if (
      s &&
      !isDate(
        String(s).slice(0, 10)
      )
    ) {
      return {
        error: `Invalid ${k}`
      };
    }

    v[k] = s
      ? String(s).slice(0, 10)
      : null;
  }


  // -------------------------------------------------------
  // Numeric fields
  // -------------------------------------------------------

  for (const k of NUMS) {
    if (!(k in body)) {
      continue;
    }

    const raw = body[k];

    const n =
      raw === '' ||
      raw === null ||
      raw === undefined
        ? 0
        : Number(raw);

    if (!Number.isFinite(n)) {
      return {
        error: `${k} must be a valid number`
      };
    }

    if (n < 0) {
      return {
        error:
          'Salary components must be zero or more'
      };
    }

    v[k] = n;
  }


  // -------------------------------------------------------
  // Tax regime
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

    v.tax_regime =
      body.tax_regime;
  }


  // -------------------------------------------------------
  // Required name
  // -------------------------------------------------------

  if (
    'name' in v &&
    !v.name
  ) {
    return {
      error: 'Name is required'
    };
  }


  // -------------------------------------------------------
  // Email validation
  // -------------------------------------------------------

  if (v.email) {
    const emailRegex =
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(v.email)) {
      return {
        error:
          'Please enter a valid email address'
      };
    }
  }


  // -------------------------------------------------------
  // PAN validation
  // -------------------------------------------------------

  if (
    v.pan &&
    !/^[A-Z]{5}[0-9]{4}[A-Z]$/.test(
      v.pan
    )
  ) {
    return {
      error:
        'PAN must look like ABCDE1234F'
    };
  }


  // -------------------------------------------------------
  // PF UAN validation
  // -------------------------------------------------------

  if (
    v.pf_uan &&
    !/^\d{12}$/.test(
      v.pf_uan
    )
  ) {
    return {
      error:
        'PF UAN must be 12 digits'
    };
  }


  // -------------------------------------------------------
  // Bank account validation
  // -------------------------------------------------------

  if (
    v.account_number &&
    !/^\d{9,18}$/.test(
      v.account_number
    )
  ) {
    return {
      error:
        'Account number must be 9 to 18 digits'
    };
  }


  // -------------------------------------------------------
  // IFSC validation
  // -------------------------------------------------------

  if (
    v.ifsc_code &&
    !/^[A-Z]{4}0[A-Z0-9]{6}$/.test(
      v.ifsc_code
    )
  ) {
    return {
      error:
        'IFSC must look like SBIN0001234'
    };
  }


  // -------------------------------------------------------
  // Joining / resignation validation
  // -------------------------------------------------------

  if (
    v.joining_date &&
    v.resignation_date &&
    v.resignation_date <
      v.joining_date
  ) {
    return {
      error:
        'Resignation date cannot be before joining date'
    };
  }


  return {
    values: v
  };
}


// =========================================================
// Duplicate error message
// =========================================================

const dupMessage = (e) => {
  if (
    e.constraint &&
    e.constraint.includes('emp_code')
  ) {
    return 'Employee ID already exists';
  }

  if (
    e.constraint &&
    e.constraint.includes('email')
  ) {
    return 'Email already exists';
  }

  return 'Employee already exists';
};


// =========================================================
// GET /api/employees/stats
// Admin dashboard statistics
// =========================================================

router.get(
  '/stats',
  asyncHandler(async (req, res) => {
    const { rows } =
      await pool.query(`
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
            WHERE
              role = 'employee'
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
            WHERE
              a.work_date = t.d
              AND a.status = 'present'
          )::int AS "presentToday",

          (
            SELECT COALESCE(
              SUM(net_pay),
              0
            )
            FROM payslips p,
                 today t
            WHERE
              p.month =
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
  })
);


// =========================================================
// GET /api/employees
// Active employees
//
// ?all=1 -> include admins
// =========================================================

router.get(
  '/',
  asyncHandler(async (req, res) => {

    const roleFilter =
      req.query.all
        ? ''
        : "AND role = 'employee'";

    const { rows } =
      await pool.query(
        `
          SELECT ${OUT}
          FROM employees
          WHERE
            is_active
            ${roleFilter}
          ORDER BY name
        `
      );

    res.json(rows);
  })
);


// =========================================================
// POST /api/employees
// Create employee
// =========================================================

router.post(
  '/',
  asyncHandler(async (req, res) => {

    const body =
      req.body || {};


    // -----------------------------------------------------
    // Validate and clean
    // -----------------------------------------------------

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


    // -----------------------------------------------------
    // Required fields
    // -----------------------------------------------------

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

    if (!values.email) {
      return res
        .status(400)
        .json({
          message:
            'Email is required'
        });
    }

    if (!body.password) {
      return res
        .status(400)
        .json({
          message:
            'Password is required'
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


    // -----------------------------------------------------
    // Password hashing
    // -----------------------------------------------------

    const hash =
      await bcrypt.hash(
        body.password,
        10
      );


    // -----------------------------------------------------
    // IMPORTANT:
    //
    // values already contains email.
    //
    // Therefore DO NOT add email separately.
    //
    // Previous code created:
    //
    // email, password_hash, role, ..., email
    //
    // which caused:
    //
    // column "email" specified more than once
    // -----------------------------------------------------

    const keys =
      Object.keys(values);


    const cols = [
      ...keys,
      'password_hash',
      'role'
    ];


    const params = [
      ...keys.map(
        (k) => values[k]
      ),
      hash,
      'employee'
    ];


    const placeholders =
      cols.map(
        (_, i) =>
          `$${i + 1}`
      );


    // -----------------------------------------------------
    // Insert
    // -----------------------------------------------------

    try {

      const { rows } =
        await pool.query(
          `
            INSERT INTO employees (
              ${cols.join(', ')}
            )

            VALUES (
              ${placeholders.join(', ')}
            )

            RETURNING ${OUT}
          `,
          params
        );


      return res
        .status(201)
        .json(rows[0]);

    } catch (e) {

      if (
        e.code === '23505'
      ) {
        return res
          .status(409)
          .json({
            message:
              dupMessage(e)
          });
      }

      throw e;
    }
  })
);


// =========================================================
// PUT /api/employees/:id
// Update employee
//
// Email and password are editable.
// =========================================================

router.put(
  '/:id',
  asyncHandler(async (req, res) => {

    const body =
      req.body || {};


    // -----------------------------------------------------
    // Validate
    // -----------------------------------------------------

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


    // -----------------------------------------------------
    // Build UPDATE fields
    // -----------------------------------------------------

    const keys =
      Object.keys(values);

    const sets =
      keys.map(
        (k, i) =>
          `${k} = $${i + 1}`
      );

    const params =
      keys.map(
        (k) => values[k]
      );


    // -----------------------------------------------------
    // Password update
    // -----------------------------------------------------

    if (
      body.password &&
      String(
        body.password
      ).trim()
    ) {

      const passwordHash =
        await bcrypt.hash(
          String(body.password),
          10
        );

      params.push(
        passwordHash
      );

      sets.push(
        `password_hash = $${params.length}`
      );
    }


    // -----------------------------------------------------
    // Nothing to update
    // -----------------------------------------------------

    if (!sets.length) {
      return res
        .status(400)
        .json({
          message:
            'Nothing to update'
        });
    }


    // -----------------------------------------------------
    // Employee ID
    // -----------------------------------------------------

    params.push(
      req.params.id
    );


    // -----------------------------------------------------
    // Update
    // -----------------------------------------------------

    try {

      const { rows } =
        await pool.query(
          `
            UPDATE employees

            SET
              ${sets.join(', ')}

            WHERE
              id = $${params.length}
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


      return res.json(
        rows[0]
      );

    } catch (e) {

      if (
        e.code === '23505'
      ) {
        return res
          .status(409)
          .json({
            message:
              dupMessage(e)
          });
      }

      throw e;
    }
  })
);


// =========================================================
// DELETE /api/employees/:id
// Soft delete
//
// Keeps payslips, attendance,
// and leave history.
// =========================================================

router.delete(
  '/:id',
  asyncHandler(async (req, res) => {

    const { rowCount } =
      await pool.query(
        `
          UPDATE employees

          SET
            is_active = false

          WHERE
            id = $1
            AND role = 'employee'
        `,
        [
          req.params.id
        ]
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
      message:
        'Employee deactivated successfully'
    });
  })
);


module.exports = router;