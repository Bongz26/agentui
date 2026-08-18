'use strict';
const express = require('express');
const { body, validationResult } = require('express-validator');
const rateLimit = require('express-rate-limit');
const AuthService = require('../services/AuthService');
const UserRepository = require('../repositories/UserRepository');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { error: 'Too many login attempts. Please try again in 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false,
});

function setCookies(res, accessToken, refreshToken) {
  const isSecure = process.env.COOKIE_SECURE === 'true';
  const sameSite = process.env.COOKIE_SAME_SITE || 'lax';

  res.cookie('accessToken', accessToken, {
    httpOnly: true,
    secure: isSecure,
    sameSite,
    maxAge: 15 * 60 * 1000, // 15 minutes
  });
  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,
    secure: isSecure,
    sameSite,
    path: '/api/auth/refresh',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  });
}

// POST /api/auth/login
router.post('/login', authLimiter, [
  body('email').isEmail().normalizeEmail(),
  body('password').notEmpty().isLength({ min: 6 }),
], async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ error: 'Invalid credentials', details: errors.array() });

  try {
    const result = await AuthService.login({
      email: req.body.email,
      password: req.body.password,
      ipAddress: req.ip,
    });
    setCookies(res, result.accessToken, result.refreshToken);
    res.json({ user: result.user, accessToken: result.accessToken });
  } catch (err) {
    next(err);
  }
});

// POST /api/auth/refresh
router.post('/refresh', async (req, res, next) => {
  const refreshToken = req.cookies?.refreshToken || req.body?.refreshToken;
  if (!refreshToken) return res.status(401).json({ error: 'Refresh token required' });

  try {
    const result = await AuthService.refresh({ refreshToken, ipAddress: req.ip });
    setCookies(res, result.accessToken, result.refreshToken);
    res.json({ accessToken: result.accessToken });
  } catch (err) {
    next(err);
  }
});

// POST /api/auth/logout
router.post('/logout', authenticateToken, (req, res) => {
  const refreshToken = req.cookies?.refreshToken;
  AuthService.logout({ refreshToken, userId: req.user.id });
  res.clearCookie('accessToken');
  res.clearCookie('refreshToken', { path: '/api/auth/refresh' });
  res.json({ message: 'Logged out successfully' });
});

// GET /api/auth/me
router.get('/me', authenticateToken, (req, res) => {
  const user = UserRepository.findById(req.user.id);
  if (!user) return res.status(404).json({ error: 'User not found' });
  const { password_hash, ...safeUser } = user;
  res.json({ user: safeUser });
});

module.exports = router;
