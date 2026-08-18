'use strict';
require('dotenv').config();
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const rateLimit = require('express-rate-limit');

const authRoutes = require('./api/auth.routes');
const applicationRoutes = require('./api/applications.routes');
const productRoutes = require('./api/products.routes');
const supervisorRoutes = require('./api/supervisor.routes');
const { errorHandler } = require('./middleware/errorHandler');
const { authenticateToken } = require('./middleware/auth');
const DocumentService = require('./services/DocumentService');

const app = express();

// ─── Security Headers ───────────────────────────────────────────────────────
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  contentSecurityPolicy: false,
}));

// ─── CORS ────────────────────────────────────────────────────────────────────
const allowedOrigins = (process.env.CLIENT_URL || 'http://localhost:5173').split(',');
app.use(cors({
  origin: (origin, cb) => {
    // Allow if no origin (same-origin, Postman, etc.) or if origin is in allowedOrigins
    if (!origin || allowedOrigins.includes(origin)) return cb(null, true);
    // Auto-allow the Render domain if it's the origin making the request to itself
    if (origin.endsWith('.onrender.com')) return cb(null, true);
    cb(new Error('Not allowed by CORS'));
  },
  credentials: true,
}));

// ─── Rate Limiting ───────────────────────────────────────────────────────────
app.use('/api/', rateLimit({
  windowMs: 60 * 1000,
  max: 120,
  standardHeaders: true,
  legacyHeaders: false,
}));

// ─── Body Parsing ────────────────────────────────────────────────────────────
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// ─── Health Check ────────────────────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString(), env: process.env.NODE_ENV });
});

// ─── Routes ──────────────────────────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/applications', applicationRoutes);
app.use('/api/supervisor', supervisorRoutes);

// Document download (separate path for clarity)
app.get('/api/documents/:docId/download', authenticateToken, async (req, res, next) => {
  try {
    const { buffer, mimeType, filename } = DocumentService.download(req.params.docId, req.user);
    res.setHeader('Content-Type', mimeType);
    res.setHeader('Content-Disposition', `inline; filename="${filename}"`);
    res.send(buffer);
  } catch (err) { next(err); }
});

// ─── Serve Frontend in Production ──────────────────────────────────────────────
if (process.env.NODE_ENV === 'production') {
  const path = require('path');
  app.use(express.static(path.join(__dirname, '../../client/dist')));
  app.get('*', (req, res) => {
    res.sendFile(path.resolve(__dirname, '../../client/dist', 'index.html'));
  });
} else {
  // ─── 404 handler for development ───────────────────────────────────────────
  app.use((req, res) => {
    res.status(404).json({ error: `Route not found: ${req.method} ${req.path}` });
  });
}

// ─── Error Handler ───────────────────────────────────────────────────────────
app.use(errorHandler);

module.exports = app;
