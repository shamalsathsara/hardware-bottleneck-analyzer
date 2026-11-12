const crypto = require('crypto');
const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const rateLimit = require('express-rate-limit');
const nodemailer = require('nodemailer');

const User = require('../models/User');
const config = require('../config/env');

const router = express.Router();

const BCRYPT_ROUNDS = 12;
const RESET_CODE_TTL_MS = 15 * 60 * 1000;
const MAX_RESET_ATTEMPTS = 5;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
// Used so unknown-email logins take as long as real ones (no timing oracle).
const DUMMY_HASH = bcrypt.hashSync('aura-dummy-password', BCRYPT_ROUNDS);
const GENERIC_RESET_MESSAGE = 'If an account with that email exists, a reset code has been sent.';

const transporter = config.emailUser && config.emailPass
  ? nodemailer.createTransport({ service: 'gmail', auth: { user: config.emailUser, pass: config.emailPass } })
  : null;

const limiter = (windowMs, limit, error) => rateLimit({
  windowMs,
  limit,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { error },
});

const loginLimiter = limiter(15 * 60 * 1000, 10, 'Too many login attempts, please try again later.');
const registerLimiter = limiter(60 * 60 * 1000, 15, 'Too many accounts created from this IP, please try again later.');
const forgotLimiter = limiter(15 * 60 * 1000, 5, 'Too many password reset requests, please try again later.');
const codeLimiter = limiter(15 * 60 * 1000, 10, 'Too many verification attempts, please try again later.');

/** Returns trimmed string fields, or null if any is missing / not a string. */
function readStrings(body, fields) {
  if (!body || typeof body !== 'object') return null;
  const out = {};
  for (const field of fields) {
    const value = body[field];
    if (typeof value !== 'string' || !value.trim()) return null;
    out[field] = value.trim();
  }
  return out;
}

function validPassword(password) {
  if (password.length < 6) return 'Password must be at least 6 characters.';
  if (password.length > 128) return 'Password cannot exceed 128 characters.';
  return null;
}

const hashCode = (code) => crypto.createHash('sha256').update(code).digest('hex');

function signToken(user) {
  return jwt.sign(
    { id: String(user._id), username: user.username, email: user.email },
    config.jwtSecret,
    { expiresIn: config.jwtExpiresIn, algorithm: 'HS256' }
  );
}

const publicUser = (user) => ({ id: user._id, username: user.username, email: user.email });

/**
 * Finds the user with a live reset code and checks the submitted code.
 * Every wrong guess counts toward a per-account lockout.
 */
async function checkResetCode(email, code) {
  const user = await User.findOne({ email, resetCodeExpires: { $gt: new Date() } });
  if (!user || !user.resetCodeHash || user.resetAttempts >= MAX_RESET_ATTEMPTS) return null;

  const expected = Buffer.from(user.resetCodeHash, 'hex');
  const actual = Buffer.from(hashCode(code), 'hex');
  if (!crypto.timingSafeEqual(expected, actual)) {
    await User.updateOne({ _id: user._id }, { $inc: { resetAttempts: 1 } });
    return null;
  }
  return user;
}

// POST /api/auth/register
router.post('/register', registerLimiter, async (req, res) => {
  try {
    const fields = readStrings(req.body, ['username', 'email', 'password']);
    if (!fields) return res.status(400).json({ error: 'Username, email and password are required.' });

    const username = fields.username;
    const email = fields.email.toLowerCase();
    const password = req.body.password; // not trimmed: spaces are valid password characters

    if (username.length < 2 || username.length > 50) {
      return res.status(400).json({ error: 'Username must be between 2 and 50 characters.' });
    }
    if (!EMAIL_RE.test(email) || email.length > 254) {
      return res.status(400).json({ error: 'Please enter a valid email address.' });
    }
    const passwordError = validPassword(password);
    if (passwordError) return res.status(400).json({ error: passwordError });

    const contact = typeof req.body.contact === 'string' ? req.body.contact.trim().slice(0, 30) : '';

    if (await User.exists({ email })) {
      return res.status(409).json({ error: 'An account with this email already exists.' });
    }

    const user = await User.create({
      username,
      email,
      passwordHash: await bcrypt.hash(password, BCRYPT_ROUNDS),
      ...(contact ? { contact } : {}),
    });

    return res.status(201).json({ token: signToken(user), user: publicUser(user) });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ error: 'An account with this email already exists.' });
    }
    console.error('Register error:', err.message);
    return res.status(500).json({ error: 'Server error. Please try again.' });
  }
});

// POST /api/auth/login
router.post('/login', loginLimiter, async (req, res) => {
  try {
    const fields = readStrings(req.body, ['email', 'password']);
    if (!fields) return res.status(400).json({ error: 'Email and password are required.' });

    const user = await User.findOne({ email: fields.email.toLowerCase() });
    const match = await bcrypt.compare(req.body.password, user ? user.passwordHash : DUMMY_HASH);
    if (!user || !match) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    return res.json({ token: signToken(user), user: publicUser(user) });
  } catch (err) {
    console.error('Login error:', err.message);
    return res.status(500).json({ error: 'Server error. Please try again.' });
  }
});

// POST /api/auth/forgot-password
router.post('/forgot-password', forgotLimiter, async (req, res) => {
  try {
    const fields = readStrings(req.body, ['email']);
    if (!fields) return res.status(400).json({ error: 'Email is required.' });

    const user = await User.findOne({ email: fields.email.toLowerCase() });
    if (!user) return res.json({ message: GENERIC_RESET_MESSAGE });

    const code = crypto.randomInt(100000, 1000000).toString();
    user.resetCodeHash = hashCode(code);
    user.resetCodeExpires = new Date(Date.now() + RESET_CODE_TTL_MS);
    user.resetAttempts = 0;
    await user.save();

    if (!transporter) {
      console.error('Password reset requested but EMAIL_USER / EMAIL_PASS are not configured.');
    } else {
      // Not awaited: response time must not reveal whether the account exists.
      transporter.sendMail({
        from: `"Project Aura" <${config.emailUser}>`,
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
        `,
      }).catch((emailError) => console.error('Reset email failed:', emailError.message));
    }

    return res.json({ message: GENERIC_RESET_MESSAGE });
  } catch (err) {
    console.error('Forgot password error:', err.message);
    return res.status(500).json({ error: 'Server error. Please try again.' });
  }
});

// POST /api/auth/verify-code
router.post('/verify-code', codeLimiter, async (req, res) => {
  try {
    const fields = readStrings(req.body, ['email', 'code']);
    if (!fields) return res.status(400).json({ error: 'Email and code are required.' });

    const user = await checkResetCode(fields.email.toLowerCase(), fields.code);
    if (!user) return res.status(400).json({ error: 'Invalid or expired verification code.' });

    return res.json({ message: 'Code verified successfully.' });
  } catch (err) {
    console.error('Verify code error:', err.message);
    return res.status(500).json({ error: 'Server error. Please try again.' });
  }
});

// POST /api/auth/reset-password
router.post('/reset-password', codeLimiter, async (req, res) => {
  try {
    const fields = readStrings(req.body, ['email', 'code', 'newPassword']);
    if (!fields) return res.status(400).json({ error: 'All fields are required.' });

    const passwordError = validPassword(req.body.newPassword);
    if (passwordError) return res.status(400).json({ error: passwordError });

    const user = await checkResetCode(fields.email.toLowerCase(), fields.code);
    if (!user) return res.status(400).json({ error: 'Invalid or expired verification code.' });

    user.passwordHash = await bcrypt.hash(req.body.newPassword, BCRYPT_ROUNDS);
    user.resetCodeHash = undefined;
    user.resetCodeExpires = undefined;
    user.resetAttempts = 0;
    await user.save();

    return res.json({ message: 'Password has been successfully reset.' });
  } catch (err) {
    console.error('Reset password error:', err.message);
    return res.status(500).json({ error: 'Server error. Please try again.' });
  }
});

module.exports = router;
