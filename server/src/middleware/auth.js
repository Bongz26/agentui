'use strict';
const jwt = require('jsonwebtoken');
const { get } = require('../db/database');

function authenticateToken(req, res, next) {
  // Support both cookie and Authorization header
  let token = req.cookies?.accessToken;

  if (!token && req.headers.authorization?.startsWith('Bearer ')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    // Confirm user still exists and is active
    const user = get('SELECT id, role, is_active FROM users WHERE id = ?', [payload.sub]);
    if (!user || !user.is_active) {
      return res.status(401).json({ error: 'Account not found or disabled' });
    }
    req.user = { id: payload.sub, role: payload.role, email: payload.email };
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expired', code: 'TOKEN_EXPIRED' });
    }
    return res.status(401).json({ error: 'Invalid token' });
  }
}

module.exports = { authenticateToken };
