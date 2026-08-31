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
const nodemailer = require('nodemailer');       // Used to send real emails

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET; // The master key used to sign tokens (from .env)

// Setup Nodemailer transporter using Gmail
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// Security: Rate limiters for auth endpoints
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, 
  max: 10, 
  message: { error: 'Too many login attempts, please try again later.' }
});

const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 15,
  message: { error: 'Too many accounts created from this IP, please try again later.' }
});

const resetLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: { error: 'Too many password reset attempts, please try again later.' }
});

// Helper function: Generates a JWT token valid for 7 days
function signToken(user) {
  const secret = process.env.JWT_SECRET || 'aura_fallback_jwt_development_secret';
  return jwt.sign(
    { id: user._id, username: user.username, email: user.email },
    secret,
    { expiresIn: '7d' }
  );
}

// --------------------------------------------------------------------------
// REGISTER A NEW USER
// --------------------------------------------------------------------------
/* POST /api/auth/register */
router.post('/register', registerLimiter, async (req, res) => {
  try {
    const { username, email, password } = req.body;

    // 1. Basic validation: Make sure they filled out all fields
    if (!username || !email || !password) {
      return res.status(400).json({ error: 'All fields are required.' });
    }
    const cleanUsername = username.trim();
    const cleanEmail = email.trim().toLowerCase();

    if (cleanUsername.length < 2 || cleanUsername.length > 50) {
      return res.status(400).json({ error: 'Username must be between 2 and 50 characters.' });
    }
    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters.' });
    }
    if (password.length > 128) {
      return res.status(400).json({ error: 'Password cannot exceed 128 characters.' });
    }

    // 2. Check if this email is already registered in our database
    const existing = await User.findOne({ email: cleanEmail });
    if (existing) {
      return res.status(409).json({ error: 'An account with this email already exists.' });
    }

    // 3. Security: Encrypt the password so we never store raw text passwords
    const passwordHash = await bcrypt.hash(password, 12);
    
    // 4. Save the new user to MongoDB
    const user = await User.create({ username: cleanUsername, email: cleanEmail, passwordHash });

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
/* POST /api/auth/login */
router.post('/login', loginLimiter, async (req, res) => {
  try {
    const { email, password } = req.body;

    // 1. Validation
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }
    const cleanEmail = email.trim().toLowerCase();

    // 2. Find the user in the database
    const user = await User.findOne({ email: cleanEmail });
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

// --------------------------------------------------------------------------
// PASSWORD RESET WORKFLOW (The 3-Step Process)
// --------------------------------------------------------------------------

/* 
   STEP 1: POST /api/auth/forgot-password 
   Goal: Generate a 6-digit code and "send" it to the user.
*/
router.post('/forgot-password', resetLimiter, async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'Email is required.' });

    // Step 1a: Check if this email actually exists in our database
    const cleanEmail = email.trim().toLowerCase();
    const user = await User.findOne({ email: cleanEmail });
    
    if (!user) {
      // Security trick: Even if the email doesn't exist, we tell the requester
      // "If it exists, we sent it." This prevents users from guessing which 
      // emails are registered on our site.
      return res.json({ message: 'If an account with that email exists, a reset code has been sent.' });
    }

    // Step 1b: Use math to generate a random number between 100000 and 999999
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Step 1c: Save this code to the user's database profile. 
    // We also set an expiration timer for 15 minutes from exactly right now.
    user.resetCode = code;
    user.resetCodeExpires = Date.now() + 15 * 60 * 1000;
    await user.save();

    // Step 1d: Send the email using Nodemailer.
    try {
      await transporter.sendMail({
        from: `"Project Aura" <${process.env.EMAIL_USER}>`,
        to: user.email,
        subject: 'Password Reset Code - Project Aura',
        text: `Your password reset code is: ${code}\n\nThis code will expire in 15 minutes.`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px;">
            <h2 style="color: #333;">Password Reset Request</h2>
            <p style="color: #555; font-size: 16px;">We received a request to reset the password for your Project Aura account.</p>
            <div style="background-color: #f4f4f4; padding: 15px; border-radius: 5px; text-align: center; margin: 20px 0;">
              <span style="font-size: 24px; font-weight: bold; letter-spacing: 5px; color: #000;">${code}</span>
            </div>
            <p style="color: #555; font-size: 14px;">This code will expire in 15 minutes.</p>
            <p style="color: #999; font-size: 12px; margin-top: 30px;">If you didn't request this, you can safely ignore this email.</p>
          </div>
        `
      });
      console.log(`[EMAIL SENT] Password reset code sent to ${user.email}`);
    } catch (emailError) {
      console.error('Email sending failed:', emailError);
      // We still return the generic success message below to prevent email enumeration
    }

    res.json({ message: 'If an account with that email exists, a reset code has been sent.' });
  } catch (err) {
    console.error('Forgot password error:', err.message);
    res.status(500).json({ error: 'Server error. Please try again.' });
  }
});

/* 
   STEP 2: POST /api/auth/verify-code 
   Goal: Check if the code the user typed in is correct and hasn't expired.
*/
router.post('/verify-code', resetLimiter, async (req, res) => {
  try {
    const { email, code } = req.body;
    if (!email || !code) return res.status(400).json({ error: 'Email and code are required.' });

    // Step 2a: Look for a user who matches BOTH the email AND the 6-digit code.
    const cleanEmail = email.trim().toLowerCase();
    const cleanCode = String(code).trim();
    const user = await User.findOne({ 
      email: cleanEmail,
      resetCode: cleanCode,
      resetCodeExpires: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({ error: 'Invalid or expired verification code.' });
    }

    res.json({ message: 'Code verified successfully.' });
  } catch (err) {
    console.error('Verify code error:', err.message);
    res.status(500).json({ error: 'Server error. Please try again.' });
  }
});

/* 
   STEP 3: POST /api/auth/reset-password 
   Goal: Save the brand new password to the database and delete the temporary code.
*/
router.post('/reset-password', resetLimiter, async (req, res) => {
  try {
    const { email, code, newPassword } = req.body;
    if (!email || !code || !newPassword) {
      return res.status(400).json({ error: 'All fields are required.' });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters.' });
    }
    if (newPassword.length > 128) {
      return res.status(400).json({ error: 'Password cannot exceed 128 characters.' });
    }

    // Step 3a: Do one final security check to make sure the code is still valid.
    const cleanEmail = email.trim().toLowerCase();
    const cleanCode = String(code).trim();
    const user = await User.findOne({ 
      email: cleanEmail,
      resetCode: cleanCode,
      resetCodeExpires: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({ error: 'Invalid or expired verification code.' });
    }

    // Step 3b: Encrypt the brand new password so it's safe.
    user.passwordHash = await bcrypt.hash(newPassword, 12);
    
    // Step 3c: Delete the 6-digit code and expiration timer from the database.
    user.resetCode = undefined;
    user.resetCodeExpires = undefined;
    await user.save();

    res.json({ message: 'Password has been successfully reset.' });
  } catch (err) {
    console.error('Reset password error:', err.message);
    res.status(500).json({ error: 'Server error. Please try again.' });
  }
});

module.exports = router;
