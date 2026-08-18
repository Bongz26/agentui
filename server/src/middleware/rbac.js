'use strict';

/**
 * Require a specific role (or array of roles).
 * Must be used after authenticateToken middleware.
 */
function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }
    next();
  };
}

/**
 * For application-level access: agents can only see their own,
 * supervisors and admins can see all.
 */
function scopeApplicationAccess(req, res, next) {
  if (['supervisor', 'admin'].includes(req.user.role)) {
    req.applicationScope = 'all';
  } else {
    req.applicationScope = 'own';
  }
  next();
}

module.exports = { requireRole, scopeApplicationAccess };
