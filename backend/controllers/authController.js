const pool = require('../config/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { sendPasswordResetEmail, isEmailConfigured } = require('../utils/mailer');

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

exports.register = async (req, res) => {
  try {
    // Public registration always creates a student account. Admins are
    // created with `node scripts/create-admin.js` (see backend/README.md),
    // never through this endpoint.
    const { name, email, password, student_id } = req.body;

    if (!name || !email || !password || !student_id) {
      return res.status(400).json({ success: false, message: 'Please fill all fields, including Student ID' });
    }

    if (!EMAIL_RE.test(email)) {
      return res.status(400).json({ success: false, message: 'Please provide a valid email address' });
    }

    if (password.length < 8) {
      return res.status(400).json({ success: false, message: 'Password must be at least 8 characters long' });
    }

    const [existingEmail] = await pool.query('SELECT id FROM users WHERE email = ?', [email]);
    if (existingEmail.length > 0) {
      return res.status(400).json({ success: false, message: 'Email already registered' });
    }

    const [existingId] = await pool.query('SELECT id FROM users WHERE student_id = ?', [student_id]);
    if (existingId.length > 0) {
      return res.status(400).json({ success: false, message: 'This Student ID is already registered' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await pool.query(
      'INSERT INTO users (name, email, password, role, student_id) VALUES (?, ?, ?, ?, ?)',
      [name, email, hashedPassword, 'student', student_id]
    );

    res.status(201).json({ success: true, message: 'User registered successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Registration failed' });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required' });
    }

    const [users] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
    if (users.length === 0) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    const user = users[0];
    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    const token = jwt.sign(
      { id: user.id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '1d' }
    );

    res.json({
      success: true,
      token,
      user: { id: user.id, name: user.name, role: user.role, student_id: user.student_id }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Login failed' });
  }
};

exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    // Same generic response whether or not the email exists — avoids
    // leaking who has an account.
    const generic = { success: true, message: 'If that email is registered, a password reset link has been sent' };

    if (!email) {
      return res.json(generic);
    }

    const [users] = await pool.query('SELECT id FROM users WHERE email = ?', [email]);
    if (users.length === 0) {
      return res.json(generic);
    }

    const rawToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(rawToken).digest('hex');
    const expires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour from now

    await pool.query(
      'UPDATE users SET reset_token = ?, reset_token_expires = ? WHERE email = ?',
      [hashedToken, expires, email]
    );

    // The raw reset token is never returned in an API response; it only
    // goes to the account holder by email. See utils/mailer.js and README.md.
    if (isEmailConfigured()) {
      try {
        await sendPasswordResetEmail(email, rawToken);
      } catch (mailErr) {
        // Don't leave a usable token lying around if the email never went out.
        await pool.query(
          'UPDATE users SET reset_token = NULL, reset_token_expires = NULL WHERE email = ?',
          [email]
        );
        return res.status(500).json({ success: false, message: 'Could not send the reset email. Please try again later.' });
      }
    } else if (process.env.NODE_ENV !== 'production') {
      // Development only: the token is printed in the server log, so the
      // reset flow can be tested without an SMTP server. In production,
      // configure SMTP (see .env.example).
      console.warn(
        '[dev only] SMTP is not configured, so no reset email was sent. ' +
        `Reset token for ${email} (paste it into the reset form): ${rawToken}`
      );
    } else {
      console.warn(`SMTP is not configured: password reset requested for ${email} but no email could be sent.`);
    }

    res.json(generic);
  } catch (err) {
    res.status(500).json({ success: false, message: 'Password reset request failed' });
  }
};

exports.resetPassword = async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      return res.status(400).json({ success: false, message: 'Token and new password are required' });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({ success: false, message: 'Password must be at least 8 characters long' });
    }

    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    const [users] = await pool.query(
      'SELECT * FROM users WHERE reset_token = ? AND reset_token_expires > NOW()',
      [hashedToken]
    );

    if (users.length === 0) {
      return res.status(400).json({ success: false, message: 'Invalid or expired reset token' });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await pool.query(
      'UPDATE users SET password = ?, reset_token = NULL, reset_token_expires = NULL WHERE id = ?',
      [hashedPassword, users[0].id]
    );

    res.json({ success: true, message: 'Password reset successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Password reset failed' });
  }
};
