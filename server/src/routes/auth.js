const router = require('express').Router();

const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const pool = require('../config/db');
const { recordEmployeeLogin } = require('../utils/loginAttendance');

router.post('/login', async (req, res) => {
  try {
    const rawEmail = req.body?.email;
    const password = req.body?.password;

    const email =
      typeof rawEmail === 'string'
        ? rawEmail.trim().toLowerCase()
        : '';

    if (!email || !password) {
      return res.status(400).json({
        message: 'Email and password are required'
      });
    }

    const { rows } = await pool.query(
      `
        SELECT *
        FROM employees
        WHERE LOWER(email) = $1
          AND is_active = TRUE
        LIMIT 1
      `,
      [email]
    );

    const user = rows[0];

    if (!user) {
      return res.status(401).json({
        message: 'Invalid email or password'
      });
    }

    const passwordMatch = await bcrypt.compare(
      String(password),
      user.password_hash
    );

    if (!passwordMatch) {
      return res.status(401).json({
        message: 'Invalid email or password'
      });
    }

    const token = jwt.sign(
      {
        id: user.id,
        role: user.role
      },
      process.env.JWT_SECRET,
      {
        expiresIn: '8h'
      }
    );

    if (user.role === 'employee') await recordEmployeeLogin(pool, user.id);

    return res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        role: user.role
      }
    });

  } catch (error) {
    console.error('LOGIN ERROR:', error);

    return res.status(500).json({
      message: 'Login failed'
    });
  }
});

module.exports = router;
