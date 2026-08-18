'use strict';
const express = require('express');
const { body, query, validationResult } = require('express-validator');
const ApplicationService = require('../services/ApplicationService');
const DocumentService = require('../services/DocumentService');
const { authenticateToken } = require('../middleware/auth');
const { requireRole } = require('../middleware/rbac');
const multer = require('multer');
const path = require('path');
const os = require('os');

const router = express.Router();
router.use(authenticateToken);

const upload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => cb(null, os.tmpdir()),
    filename: (req, file, cb) => cb(null, `upload_${Date.now()}_${file.originalname}`),
  }),
  limits: { fileSize: (parseInt(process.env.MAX_FILE_SIZE_MB) || 10) * 1024 * 1024 },
});

// GET /api/applications
router.get('/', async (req, res, next) => {
  try {
    const { status, productId, agentId, fromDate, toDate, limit, offset } = req.query;
    const apps = ApplicationService.getAll({
      requestingUser: req.user,
      filters: { status, productId, fromDate, toDate, limit: parseInt(limit) || 50, offset: parseInt(offset) || 0,
        agentId: ['supervisor','admin'].includes(req.user.role) ? agentId : undefined
      },
    });
    res.json({ applications: apps, total: apps.length });
  } catch (err) { next(err); }
});

// POST /api/applications
router.post('/', async (req, res, next) => {
  try {
    const app = ApplicationService.create({
      agentId: req.user.id,
      attributionSource: req.body.attributionSource || 'field_agent',
    });
    res.status(201).json({ application: app });
  } catch (err) { next(err); }
});

// GET /api/applications/:id
router.get('/:id', async (req, res, next) => {
  try {
    const app = ApplicationService.getById(req.params.id, req.user.id);
    const dependants = ApplicationService.getDependants(req.params.id, req.user);
    const documents = DocumentService.getForApplication(req.params.id, req.user);
    res.json({ application: app, dependants, documents });
  } catch (err) { next(err); }
});

// PATCH /api/applications/:id
router.patch('/:id', async (req, res, next) => {
  try {
    const updated = ApplicationService.update(req.params.id, req.body, req.user);
    res.json({ application: updated });
  } catch (err) { next(err); }
});

// POST /api/applications/:id/submit
router.post('/:id/submit', async (req, res, next) => {
  try {
    const app = ApplicationService.submit(req.params.id, req.user);
    res.json({ application: app, message: 'Application submitted successfully' });
  } catch (err) { next(err); }
});

// PATCH /api/applications/:id/status (supervisor/admin only)
router.patch('/:id/status', requireRole('supervisor', 'admin'), async (req, res, next) => {
  try {
    const { status, note } = req.body;
    const app = ApplicationService.updateStatus(req.params.id, { toStatus: status, note }, req.user);
    res.json({ application: app });
  } catch (err) { next(err); }
});

// GET /api/applications/:id/status-history
router.get('/:id/status-history', async (req, res, next) => {
  try {
    ApplicationService.getById(req.params.id, req.user.id);
    const history = require('../repositories/ApplicationRepository').getStatusHistory(req.params.id);
    res.json({ history });
  } catch (err) { next(err); }
});

// --- Dependants ---
// GET /api/applications/:id/dependants
router.get('/:id/dependants', async (req, res, next) => {
  try {
    const deps = ApplicationService.getDependants(req.params.id, req.user);
    res.json({ dependants: deps });
  } catch (err) { next(err); }
});

// POST /api/applications/:id/dependants
router.post('/:id/dependants', [
  body('firstName').notEmpty().trim(),
  body('lastName').notEmpty().trim(),
  body('relationship').notEmpty().trim(),
], async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ error: 'Validation failed', details: errors.array() });
  try {
    const dep = ApplicationService.addDependant(req.params.id, req.body, req.user);
    res.status(201).json({ dependant: dep });
  } catch (err) { next(err); }
});

// PATCH /api/applications/:id/dependants/:depId
router.patch('/:id/dependants/:depId', async (req, res, next) => {
  try {
    const dep = ApplicationService.updateDependant(req.params.id, req.params.depId, req.body, req.user);
    res.json({ dependant: dep });
  } catch (err) { next(err); }
});

// DELETE /api/applications/:id/dependants/:depId
router.delete('/:id/dependants/:depId', async (req, res, next) => {
  try {
    ApplicationService.removeDependant(req.params.id, req.params.depId, req.user);
    res.json({ message: 'Dependant removed' });
  } catch (err) { next(err); }
});

// --- Documents ---
// GET /api/applications/:id/documents
router.get('/:id/documents', async (req, res, next) => {
  try {
    const docs = DocumentService.getForApplication(req.params.id, req.user);
    res.json({ documents: docs });
  } catch (err) { next(err); }
});

// POST /api/applications/:id/documents
router.post('/:id/documents', upload.single('file'), async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
    const doc = DocumentService.upload({
      applicationId: req.params.id,
      documentType: req.body.documentType,
      file: req.file,
      requestingUser: req.user,
    });
    res.status(201).json({ document: doc });
  } catch (err) { next(err); }
});

// DELETE /api/applications/:id/documents/:docId
router.delete('/:id/documents/:docId', async (req, res, next) => {
  try {
    DocumentService.delete(req.params.docId, req.user);
    res.json({ message: 'Document removed' });
  } catch (err) { next(err); }
});

// GET /api/documents/:docId/download (auth'd)
router.get('/documents/:docId/download', async (req, res, next) => {
  try {
    const { buffer, mimeType, filename } = DocumentService.download(req.params.docId, req.user);
    res.setHeader('Content-Type', mimeType);
    res.setHeader('Content-Disposition', `inline; filename="${filename}"`);
    res.send(buffer);
  } catch (err) { next(err); }
});

module.exports = router;
