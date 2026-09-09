const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const rateLimit = require('express-rate-limit');
const User = require('../models/User');
const nodemailer = require('nodemailer');

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET;

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

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

function signToken(user) {
  const secret = process.env.JWT_SECRET || 'aura_fallback_jwt_development_secret';
  return jwt.sign(
    { id: user._id, username: user.username, email: user.email },
    secret,
    { expiresIn: '7d' }
  );
}

// POST /api/auth/register
router.post('/register', registerLimiter, async (req, res) => {
  try {
    const { username, email, password, contact } = req.body;

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

    const existing = await User.findOne({ email: cleanEmail });
    if (existing) {
      return res.status(409).json({ error: 'An account with this email already exists.' });
    }

    const passwordHash = await bcrypt.hash(password, 12);
    
    const user = await User.create({
      username: cleanUsername,
      email: cleanEmail,
      passwordHash,
      ...(contact ? { contact: String(contact).trim() } : {})
    });

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

// POST /api/auth/login
router.post('/login', loginLimiter, async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }
    const cleanEmail = email.trim().toLowerCase();

    const user = await User.findOne({ email: cleanEmail });
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const match = await bcrypt.compare(password, user.passwordHash);
    if (!match) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

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

// POST /api/auth/forgot-password
router.post('/forgot-password', resetLimiter, async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'Email is required.' });

    const cleanEmail = email.trim().toLowerCase();
    const user = await User.findOne({ email: cleanEmail });
    
    if (!user) {
      // Return generic message to prevent email enumeration
      return res.json({ message: 'If an account with that email exists, a reset code has been sent.' });
    }

    const code = Math.floor(100000 + Math.random() * 900000).toString();
    
    user.resetCode = code;
    user.resetCodeExpires = Date.now() + 15 * 60 * 1000;
    await user.save();

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
    } catch (emailError) {
      console.error('Email sending failed:', emailError);
    }

    res.json({ message: 'If an account with that email exists, a reset code has been sent.' });
  } catch (err) {
    console.error('Forgot password error:', err.message);
    res.status(500).json({ error: 'Server error. Please try again.' });
  }
});

// POST /api/auth/verify-code
router.post('/verify-code', resetLimiter, async (req, res) => {
  try {
    const { email, code } = req.body;
    if (!email || !code) return res.status(400).json({ error: 'Email and code are required.' });

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

// POST /api/auth/reset-password
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

    user.passwordHash = await bcrypt.hash(newPassword, 12);
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
