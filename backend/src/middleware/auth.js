import { verifyToken } from '../utils/token.js';

export const requireAuth = (req, res, next) => {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return res.status(401).json({ error: 'Not authenticated.' });
  try {
    req.user = verifyToken(token);
    next();
  } catch {
    res.status(401).json({ error: 'Invalid or expired token.' });
  }
};

export const optionalAuth = (req, _res, next) => {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (token) {
    try {
      req.user = verifyToken(token);
    } catch {
      req.user = null;
    }
  }
  next();
};

export const requireAdmin = (req, res, next) => {
  requireAuth(req, res, () => {
    if (req.user?.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied. Administrator privileges required.' });
    }
    next();
  });
};

export const asyncHandler = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

export const errorHandler = (err, _req, res, _next) => {
  if (err.code === '23505') {
    const detail = err.detail || '';
    if (detail.includes('mobile')) {
      return res.status(409).json({ error: 'This mobile number is already registered. Please use another mobile number.' });
    }
    return res.status(409).json({ error: 'This email is already registered. Please sign in instead.' });
  }
  console.error('[SERVER ERROR]:', err);
  res.status(500).json({ error: err.message || 'Server error.' });
};
