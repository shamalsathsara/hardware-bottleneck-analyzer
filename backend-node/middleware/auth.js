const jwt = require('jsonwebtoken');

const requireAuth = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Access denied. No token provided.' });
    }

    const token = authHeader.split(' ')[1];
    if (!token || token === 'null' || token === 'undefined') {
      return res.status(401).json({ error: 'Access denied. No valid token provided.' });
    }

    const secret = process.env.JWT_SECRET || 'aura_fallback_jwt_development_secret';
    const decoded = jwt.verify(token, secret);

    req.user = decoded;
    next();
  } catch (err) {
    console.error('JWT Verification Error:', err.message);
    res.status(401).json({ error: 'Invalid or expired token.' });
  }
};

module.exports = requireAuth;
