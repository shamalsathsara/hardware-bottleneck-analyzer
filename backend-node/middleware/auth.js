const jwt = require('jsonwebtoken');
const { jwtSecret } = require('../config/env');

function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization || '';
  const [scheme, token] = authHeader.split(' ');

  if (scheme !== 'Bearer' || !token) {
    return res.status(401).json({ error: 'Access denied. No token provided.' });
  }

  try {
    req.user = jwt.verify(token, jwtSecret, { algorithms: ['HS256'] });
    return next();
  } catch (_) {
    return res.status(401).json({ error: 'Invalid or expired token.' });
  }
}

module.exports = requireAuth;
