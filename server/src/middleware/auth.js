const jwt = require('jsonwebtoken');
const pool = require('../config/db');

exports.authenticate = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      message: 'No token'
    });
  }

  const token = authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({
      message: 'No token'
    });
  }

  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
  } catch (error) {
    return res.status(401).json({
      message: 'Invalid token'
    });
  }
  try {
    const { rows } = await pool.query('SELECT role, is_active FROM employees WHERE id = $1', [req.user.id]);
    if (!rows[0]?.is_active || rows[0].role !== req.user.role) {
      return res.status(401).json({ message: 'Your account access has changed. Please sign in again.' });
    }
    next();
  } catch (error) { next(error); }
};

exports.authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        message: 'Authentication required'
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        message: 'Forbidden'
      });
    }

    next();
  };
};
