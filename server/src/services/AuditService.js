'use strict';
const db = require('../db/database');
const { v4: uuidv4 } = require('uuid');

class AuditService {
  log({ userId, action, entityType, entityId, metadata = {}, ipAddress }) {
    try {
      const now = new Date().toISOString();
      db.run(
        `INSERT INTO audit_log (id, user_id, action, entity_type, entity_id, metadata, ip_address, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [uuidv4(), userId || null, action, entityType || null, entityId || null,
         JSON.stringify(metadata), ipAddress || null, now]
      );
    } catch (err) {
      console.error('[AUDIT] Failed to write audit log:', err.message);
    }
  }

  getRecent({ limit = 100 } = {}) {
    return db.all(`
      SELECT a.*, u.email AS user_email, u.first_name || ' ' || u.last_name AS user_name
      FROM audit_log a
      LEFT JOIN users u ON u.id = a.user_id
      ORDER BY a.created_at DESC
      LIMIT ?
    `, [limit]);
  }
}

module.exports = new AuditService();
