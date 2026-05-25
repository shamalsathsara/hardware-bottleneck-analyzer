// --------------------------------------------------------------------------
// AUTH ROUTES — PROJECT AURA
// --------------------------------------------------------------------------
// This file handles all the security logic for user registration and login.
// It uses JWT (JSON Web Tokens) to keep users logged in safely.

const express  = require('express');
const bcrypt   = require('bcryptjs');         // Used to encrypt/hash passwords securely
const jwt      = require('jsonwebtoken');     // Used to generate login tokens
const rateLimit = require('express-rate-limit'); // Security tool to prevent brute-force login attacks
const User     = require('../models/User');   // Our MongoDB User database model

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET; // The master key used to sign tokens (from .env)

// Helper function: Generates a JWT token valid for 7 days
function signToken(user) {
  return jwt.sign(
    { id: user._id, username: user.username, email: user.email },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

// --------------------------------------------------------------------------
// REGISTER A NEW USER
// --------------------------------------------------------------------------
/* POST /api/auth/register */
router.post('/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;

    // 1. Basic validation: Make sure they filled out all fields
    if (!username || !email || !password) {
      return res.status(400).json({ error: 'All fields are required.' });
    }
    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters.' });
    }

    // 2. Check if this email is already registered in our database
    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(409).json({ error: 'An account with this email already exists.' });
    }

    // 3. Security: Encrypt the password so we never store raw text passwords
    const passwordHash = await bcrypt.hash(password, 12);
    
    // 4. Save the new user to MongoDB
    const user = await User.create({ username, email, passwordHash });

    // 5. Generate a login token and send it back to React so they auto-login
    const token = signToken(user);
    res.status(201).json({
      token,
      user: { id: user._id, username: user.username, email: user.email },
    });

  } catch (err) {
    console.error('Register error:', err.message);
    res.status(500).json({ error: 'Server error. Please try again.' });
  }
});

// --------------------------------------------------------------------------
// LOG IN AN EXISTING USER
// --------------------------------------------------------------------------

// Security: Prevent hackers from guessing passwords rapidly (max 10 tries per 15 minutes)
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, 
  max: 10, 
  message: { error: 'Too many login attempts, please try again later.' }
});

/* POST /api/auth/login */
router.post('/login', loginLimiter, async (req, res) => {
  try {
    const { email, password } = req.body;

    // 1. Validation
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    // 2. Find the user in the database
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    // 3. Check if the provided password matches the encrypted hash in the database
    const match = await bcrypt.compare(password, user.passwordHash);
    if (!match) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    // 4. Generate the login token and send it to React
    const token = signToken(user);
    res.json({
      token,
      user: { id: user._id, username: user.username, email: user.email },
    });

  } catch (err) {
    console.error('Login error:', err.message);
    res.status(500).json({ error: 'Server error. Please try again.' });
  }
});

module.exports = router;
