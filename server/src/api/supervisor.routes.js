'use strict';
const express = require('express');
const ApplicationService = require('../services/ApplicationService');
const UserRepository = require('../repositories/UserRepository');
const { authenticateToken } = require('../middleware/auth');
const { requireRole } = require('../middleware/rbac');

const router = express.Router();
router.use(authenticateToken);
router.use(requireRole('supervisor', 'admin'));

// GET /api/supervisor/dashboard
router.get('/dashboard', async (req, res, next) => {
  try {
    const data = ApplicationService.getSupervisorDashboard();
    res.json(data);
  } catch (err) { next(err); }
});

// GET /api/supervisor/agents
router.get('/agents', (req, res) => {
  const agents = UserRepository.findAll();
  res.json({ agents });
});

// GET /api/supervisor/stats
router.get('/stats', async (req, res, next) => {
  try {
    const { agentId } = req.query;
    const stats = ApplicationService.getStats(agentId || null);
    res.json({ stats });
  } catch (err) { next(err); }
});

module.exports = router;
