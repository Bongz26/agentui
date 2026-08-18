'use strict';
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { v4: uuidv4 } = require('uuid');
const UserRepository = require('../repositories/UserRepository');
const AuditService = require('./AuditService');

class AuthService {
  async login({ email, password, ipAddress }) {
    const user = UserRepository.findByEmail(email.toLowerCase().trim());
    if (!user) throw Object.assign(new Error('Invalid email or password'), { status: 401 });

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) throw Object.assign(new Error('Invalid email or password'), { status: 401 });

    const accessToken = this._generateAccessToken(user);
    const { refreshToken, tokenHash, expiresAt } = this._generateRefreshToken();

    UserRepository.saveRefreshToken({
      id: uuidv4(),
      userId: user.id,
      tokenHash,
      expiresAt,
    });

    AuditService.log({ userId: user.id, action: 'LOGIN', entityType: 'user', entityId: user.id, ipAddress });

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        role: user.role,
      },
    };
  }

  async refresh({ refreshToken, ipAddress }) {
    const tokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');
    const stored = UserRepository.findRefreshToken(tokenHash);
    if (!stored) throw Object.assign(new Error('Invalid or expired refresh token'), { status: 401 });

    const { get } = require('../db/database');
    const userRow = get('SELECT email FROM users WHERE id = ?', [stored.user_id]);
    const user = userRow ? UserRepository.findByEmail(userRow.email) : null;
    if (!user) throw Object.assign(new Error('User not found'), { status: 401 });

    // Rotate refresh token
    UserRepository.deleteRefreshToken(tokenHash);
    const accessToken = this._generateAccessToken(user);
    const { refreshToken: newRefreshToken, tokenHash: newHash, expiresAt } = this._generateRefreshToken();
    UserRepository.saveRefreshToken({ id: uuidv4(), userId: user.id, tokenHash: newHash, expiresAt });

    return { accessToken, refreshToken: newRefreshToken };
  }

  logout({ refreshToken, userId }) {
    if (refreshToken) {
      const tokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');
      UserRepository.deleteRefreshToken(tokenHash);
    }
    AuditService.log({ userId, action: 'LOGOUT', entityType: 'user', entityId: userId });
  }

  _generateAccessToken(user) {
    return jwt.sign(
      { sub: user.id, role: user.role, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '15m' }
    );
  }

  _generateRefreshToken() {
    const refreshToken = crypto.randomBytes(64).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
    return { refreshToken, tokenHash, expiresAt };
  }
}

module.exports = new AuthService();
