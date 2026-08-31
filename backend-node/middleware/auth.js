const jwt = require('jsonwebtoken');

// --------------------------------------------------------------------------
// AUTHENTICATION MIDDLEWARE
// --------------------------------------------------------------------------
// This acts as a security checkpoint. Any route that uses this middleware 
// requires a valid login token. If the token is missing or invalid, the 
// request is rejected.
const requireAuth = (req, res, next) => {
  try {
    // 1. Get the token from the "Authorization" header
    // The format should be "Bearer <token>"
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Access denied. No token provided.' });
    }

    // 2. Extract just the token part
    const token = authHeader.split(' ')[1];
    
    // Check if token is null or undefined
    if (!token || token === 'null' || token === 'undefined') {
      return res.status(401).json({ error: 'Access denied. No valid token provided.' });
    }

    // 3. Verify the token using our secret key
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // 4. Attach the decoded user information to the request
    // This allows the next function to know EXACTLY who is making the request
    req.user = decoded;

    // 5. Allow the request to proceed to the actual route handler
    next();
  } catch (err) {
    console.error('JWT Verification Error:', err.message);
    res.status(401).json({ error: 'Invalid or expired token.' });
  }
};

module.exports = requireAuth;
