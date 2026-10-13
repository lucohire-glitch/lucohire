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

export const asyncHandler = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

export const errorHandler = (err, _req, res, _next) => {
  if (err.code === '23505') return res.status(409).json({ error: 'Email already registered.' });
  console.error(err);
  res.status(500).json({ error: 'Server error.' });
};
