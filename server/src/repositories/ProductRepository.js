'use strict';
const db = require('../db/database');

class ProductRepository {
  findAll() {
    const rows = db.all('SELECT * FROM products WHERE is_active = 1 ORDER BY monthly_premium ASC');
    return rows.map(r => this._parse(r));
  }

  findById(id) {
    const row = db.get('SELECT * FROM products WHERE id = ? AND is_active = 1', [id]);
    return row ? this._parse(row) : null;
  }

  _parse(row) {
    if (!row) return null;
    try { row.benefits = JSON.parse(row.benefits); } catch { row.benefits = []; }
    try { row.required_documents = JSON.parse(row.required_documents); } catch { row.required_documents = []; }
    row.is_active = Boolean(row.is_active);
    return row;
  }
}

module.exports = new ProductRepository();
