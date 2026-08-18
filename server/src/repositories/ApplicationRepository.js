'use strict';
const db = require('../db/database');

class ApplicationRepository {
  findAll({ agentId, status, productId, fromDate, toDate, limit = 50, offset = 0 } = {}) {
    let query = `
      SELECT a.*,
        u.first_name || ' ' || u.last_name AS agent_name,
        p.name AS product_name,
        p.monthly_premium
      FROM applications a
      LEFT JOIN users u ON u.id = a.agent_id
      LEFT JOIN products p ON p.id = a.product_id
      WHERE 1=1
    `;
    const params = [];

    if (agentId)    { query += ' AND a.agent_id = ?';          params.push(agentId); }
    if (status)     { query += ' AND a.status = ?';            params.push(status); }
    if (productId)  { query += ' AND a.product_id = ?';        params.push(productId); }
    if (fromDate)   { query += ' AND DATE(a.created_at) >= ?'; params.push(fromDate); }
    if (toDate)     { query += ' AND DATE(a.created_at) <= ?'; params.push(toDate); }

    query += ' ORDER BY a.updated_at DESC LIMIT ? OFFSET ?';
    params.push(limit, offset);

    const rows = db.all(query, params);
    return rows.map(r => this._parse(r));
  }

  findById(id) {
    const row = db.get(`
      SELECT a.*,
        u.first_name || ' ' || u.last_name AS agent_name,
        u.email AS agent_email,
        p.name AS product_name,
        p.monthly_premium,
        p.benefits AS product_benefits,
        p.required_documents AS product_required_documents
      FROM applications a
      LEFT JOIN users u ON u.id = a.agent_id
      LEFT JOIN products p ON p.id = a.product_id
      WHERE a.id = ?
    `, [id]);
    return row ? this._parse(row) : null;
  }

  create({ id, referenceNumber, agentId, branchId }) {
    const now = new Date().toISOString();
    db.run(
      `INSERT INTO applications (id, reference_number, agent_id, branch_id, status, created_at, updated_at)
       VALUES (?, ?, ?, ?, 'draft', ?, ?)`,
      [id, referenceNumber, agentId, branchId || null, now, now]
    );
    db.persist();
    return this.findById(id);
  }

  update(id, fields) {
    const allowed = [
      'client_first_name', 'client_last_name', 'client_id_number', 'client_dob',
      'client_mobile', 'client_email', 'client_address', 'preferred_language',
      'product_id', 'consent_given', 'consent_timestamp', 'consent_agent_id',
      'status', 'submitted_at', 'attribution_source', 'attribution_campaign',
      'attribution_referral_code'
    ];

    const entries = Object.entries(fields).filter(([k]) => allowed.includes(k));
    if (!entries.length) return this.findById(id);

    const now = new Date().toISOString();
    const setClauses = [...entries.map(([k]) => `${k} = ?`), 'updated_at = ?'].join(', ');
    const values = [...entries.map(([, v]) => v), now, id];

    db.run(`UPDATE applications SET ${setClauses} WHERE id = ?`, values);
    db.persist();
    return this.findById(id);
  }

  countByStatus(agentId = null) {
    let query = 'SELECT status, COUNT(*) as count FROM applications';
    const params = [];
    if (agentId) { query += ' WHERE agent_id = ?'; params.push(agentId); }
    query += ' GROUP BY status';
    const rows = db.all(query, params);
    const result = {};
    rows.forEach(r => { result[r.status] = r.count; });
    return result;
  }

  getStatusHistory(applicationId) {
    return db.all(`
      SELECT h.*, u.first_name || ' ' || u.last_name AS changed_by_name
      FROM application_status_history h
      LEFT JOIN users u ON u.id = h.changed_by
      WHERE h.application_id = ?
      ORDER BY h.changed_at ASC
    `, [applicationId]);
  }

  addStatusHistory({ id, applicationId, fromStatus, toStatus, changedBy, note }) {
    const now = new Date().toISOString();
    db.run(
      `INSERT INTO application_status_history (id, application_id, from_status, to_status, changed_by, note, changed_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [id, applicationId, fromStatus || null, toStatus, changedBy, note || null, now]
    );
    db.persist();
  }

  getAgentStats() {
    return db.all(`
      SELECT
        u.id, u.first_name || ' ' || u.last_name AS agent_name,
        COUNT(a.id) AS total,
        SUM(CASE WHEN a.status = 'submitted' THEN 1 ELSE 0 END) AS submitted,
        SUM(CASE WHEN a.status = 'approved'  THEN 1 ELSE 0 END) AS approved,
        SUM(CASE WHEN a.status = 'draft'     THEN 1 ELSE 0 END) AS drafts,
        MAX(a.created_at) AS last_activity
      FROM users u
      LEFT JOIN applications a ON a.agent_id = u.id
      WHERE u.role = 'field_agent'
      GROUP BY u.id
      ORDER BY total DESC
    `);
  }

  getDailyStats(days = 14) {
    return db.all(`
      SELECT DATE(created_at) AS date, COUNT(*) AS count
      FROM applications
      WHERE created_at >= datetime('now', '-${days} days')
      GROUP BY DATE(created_at)
      ORDER BY date ASC
    `);
  }

  _parse(row) {
    if (!row) return null;
    return {
      ...row,
      client_address: this._j(row.client_address, {}),
      product_benefits: this._j(row.product_benefits, []),
      product_required_documents: this._j(row.product_required_documents, []),
      consent_given: Boolean(row.consent_given),
    };
  }

  _j(val, fallback) {
    try { return val ? JSON.parse(val) : fallback; } catch { return fallback; }
  }
}

module.exports = new ApplicationRepository();
