'use strict';
const db = require('../db/database');

class UserRepository {
  findByEmail(email) {
    return db.get('SELECT * FROM users WHERE email = ? AND is_active = 1', [email]);
  }

  findById(id) {
    return db.get(`
      SELECT u.id, u.email, u.first_name, u.last_name, u.role, u.is_active,
             u.branch_id, u.created_at,
             b.name AS branch_name, b.region AS branch_region
      FROM users u
      LEFT JOIN branches b ON b.id = u.branch_id
      WHERE u.id = ?
    `, [id]);
  }

  findAll() {
    return db.all(`
      SELECT u.id, u.email, u.first_name, u.last_name, u.role, u.is_active,
             b.name AS branch_name
      FROM users u
      LEFT JOIN branches b ON b.id = u.branch_id
      WHERE u.is_active = 1 AND u.role = 'field_agent'
      ORDER BY u.first_name
    `);
  }

  saveRefreshToken({ id, userId, tokenHash, expiresAt }) {
    db.run(
      `INSERT INTO refresh_tokens (id, user_id, token_hash, expires_at) VALUES (?, ?, ?, ?)`,
      [id, userId, tokenHash, expiresAt]
    );
    db.persist();
  }

  findRefreshToken(tokenHash) {
    return db.get(
      `SELECT * FROM refresh_tokens WHERE token_hash = ? AND expires_at > datetime('now')`,
      [tokenHash]
    );
  }

  deleteRefreshToken(tokenHash) {
    db.run('DELETE FROM refresh_tokens WHERE token_hash = ?', [tokenHash]);
    db.persist();
  }

  deleteRefreshTokensForUser(userId) {
    db.run('DELETE FROM refresh_tokens WHERE user_id = ?', [userId]);
    db.persist();
  }
}

module.exports = new UserRepository();
