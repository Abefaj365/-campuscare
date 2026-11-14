// Sends password-reset emails. Only active when SMTP is configured
// (SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS in .env — see .env.example).
// If SMTP is not configured, isEmailConfigured() is false.
const nodemailer = require('nodemailer');

function isEmailConfigured() {
  return Boolean(
    process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS
  );
}

function getTransporter() {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
}

async function sendPasswordResetEmail(toEmail, rawToken) {
  const from = process.env.SMTP_FROM || process.env.SMTP_USER;
  const resetLink = process.env.FRONTEND_URL
    ? `${process.env.FRONTEND_URL.replace(/\/$/, '')}/reset-password?token=${rawToken}`
    : null;

  const text = resetLink
    ? `You requested a CampusCare password reset.\n\nReset your password here (valid for 1 hour):\n${resetLink}\n\nIf you did not request this, you can ignore this email.`
    : `You requested a CampusCare password reset.\n\nYour reset token (valid for 1 hour):\n${rawToken}\n\nPaste it into the reset-password form. If you did not request this, you can ignore this email.`;

  await getTransporter().sendMail({
    from,
    to: toEmail,
    subject: 'CampusCare password reset',
    text,
  });
}

module.exports = { isEmailConfigured, sendPasswordResetEmail };
