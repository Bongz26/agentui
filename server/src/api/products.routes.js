'use strict';
const express = require('express');
const ProductRepository = require('../repositories/ProductRepository');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();
router.use(authenticateToken);

// GET /api/products
router.get('/', (req, res) => {
  const products = ProductRepository.findAll();
  res.json({ products });
});

// GET /api/products/:id
router.get('/:id', (req, res) => {
  const product = ProductRepository.findById(req.params.id);
  if (!product) return res.status(404).json({ error: 'Product not found' });
  res.json({ product });
});

module.exports = router;
