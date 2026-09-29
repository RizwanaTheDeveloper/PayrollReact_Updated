const router = require('express').Router();
const pool = require('../config/db');
const asyncHandler = require('../utils/asyncHandler');
const { authenticate, authorize } = require('../middleware/auth');

router.use(authenticate);

const TYPES = ['casual', 'sick', 'paid'];

const isDate = (v) =>
  /^\d{4}-\d{2}-\d{2}$/.test(v || '');

const COLS = `
  l.id,
  l.employee_id,
  l.leave_type,
  l.start_date::text AS start_date,
  l.end_date::text AS end_date,
  l.reason,
  l.status
`;

// GET /api/leaves/my
// Employee: view their own leave requests
router.get(
  '/my',
  asyncHandler(async (req, res) => {
    const { rows } = await pool.query(
      `SELECT ${COLS}
       FROM leaves l
       WHERE l.employee_id = $1
       ORDER BY l.start_date DESC`,
      [req.user.id]
    );

    res.json(rows);
  })
);

// POST /api/leaves
// Employee: create a leave request
// Body:
// {
//   leave_type,
//   start_date,
//   end_date,
//   reason
// }
router.post(
  '/',
  asyncHandler(async (req, res) => {
    const {
      leave_type,
      start_date,
      end_date,
      reason
    } = req.body || {};

    if (!TYPES.includes(leave_type)) {
      return res.status(400).json({
        message: 'Invalid leave type'
      });
    }

    if (
      !isDate(start_date) ||
      !isDate(end_date)
    ) {
      return res.status(400).json({
        message:
          'Valid start and end dates are required'
      });
    }

    if (end_date < start_date) {
      return res.status(400).json({
        message:
          'End date cannot be before start date'
      });
    }

    if (!reason || !reason.trim()) {
      return res.status(400).json({
        message: 'Reason is required'
      });
    }

    // Prevent overlapping pending/approved leave.
    const overlap = await pool.query(
      `SELECT 1
       FROM leaves
       WHERE employee_id = $1
         AND status IN ('pending', 'approved')
         AND start_date <= $3
         AND end_date >= $2
       LIMIT 1`,
      [
        req.user.id,
        start_date,
        end_date
      ]
    );

    if (overlap.rowCount) {
      return res.status(409).json({
        message:
          'You already have a leave request in these dates'
      });
    }

    const { rows } = await pool.query(
      `INSERT INTO leaves (
        employee_id,
        leave_type,
        start_date,
        end_date,
        reason
      )
      VALUES ($1, $2, $3, $4, $5)
      RETURNING
        id,
        employee_id,
        leave_type,
        start_date::text AS start_date,
        end_date::text AS end_date,
        reason,
        status`,
      [
        req.user.id,
        leave_type,
        start_date,
        end_date,
        reason.trim()
      ]
    );

    res.status(201).json(rows[0]);
  })
);

// GET /api/leaves?status=pending
// Admin: view all leave requests
router.get(
  '/',
  authorize('admin'),
  asyncHandler(async (req, res) => {
    const vals = [];
    let where = '';

    if (req.query.status) {
      vals.push(req.query.status);
      where = 'WHERE l.status = $1';
    }

    const { rows } = await pool.query(
      `SELECT
        ${COLS},
        e.name,
        e.name AS employee_name,
        e.emp_code
       FROM leaves l
       JOIN employees e
         ON e.id = l.employee_id
       ${where}
       ORDER BY
         (l.status = 'pending') DESC,
         l.start_date DESC`,
      vals
    );

    res.json(rows);
  })
);

// PATCH /api/leaves/:id/status
// Admin: approve or reject a pending leave request
// Body:
// {
//   status: 'approved' | 'rejected'
// }
router.patch(
  '/:id/status',
  authorize('admin'),
  asyncHandler(async (req, res) => {
    const { status } = req.body || {};

    if (
      !['approved', 'rejected'].includes(status)
    ) {
      return res.status(400).json({
        message:
          'status must be approved or rejected'
      });
    }

    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      const { rows } = await client.query(
        `UPDATE leaves
         SET status = $1
         WHERE id = $2
           AND status = 'pending'
         RETURNING *`,
        [
          status,
          req.params.id
        ]
      );

      const leave = rows[0];

      if (!leave) {
        await client.query('ROLLBACK');

        const exists = await pool.query(
          `SELECT status
           FROM leaves
           WHERE id = $1`,
          [req.params.id]
        );

        if (exists.rowCount) {
          return res.status(409).json({
            message:
              `This request is already ${exists.rows[0].status}`
          });
        }

        return res.status(404).json({
          message: 'Leave not found'
        });
      }

      // If approved, mark all dates as leave
      // in the attendance table.
      if (status === 'approved') {
        await client.query(
          `INSERT INTO attendance (
            employee_id,
            work_date,
            status,
            day_type,
            note
          )
          SELECT
            $1,
            d::date,
            'leave',
            'full',
            $4
          FROM generate_series(
            $2::date,
            $3::date,
            interval '1 day'
          ) d
          ON CONFLICT (
            employee_id,
            work_date
          )
          DO UPDATE SET
            status = 'leave',
            day_type = 'full',
            note = EXCLUDED.note`,
          [
            leave.employee_id,
            leave.start_date,
            leave.end_date,
            `${leave.leave_type} leave (approved)`
          ]
        );
      }

      await client.query('COMMIT');

      res.json({
        id: leave.id,
        status: leave.status
      });
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  })
);

module.exports = router;