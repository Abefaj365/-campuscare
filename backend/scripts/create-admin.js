// Create an admin account from the command line.
//
//   node scripts/create-admin.js "Admin Name" admin@example.com "a-strong-password"
//
// It needs the same .env as the server (DB_* variables).
const bcrypt = require('bcryptjs');
const pool = require('../config/db');

async function main() {
  const [, , name, email, password] = process.argv;

  if (!name || !email || !password) {
    console.error('Usage: node scripts/create-admin.js "Name" email@example.com "password"');
    process.exitCode = 1;
    return;
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    console.error('Invalid email address.');
    process.exitCode = 1;
    return;
  }
  if (password.length < 8) {
    console.error('Password must be at least 8 characters long.');
    process.exitCode = 1;
    return;
  }

  try {
    const [existing] = await pool.query('SELECT id FROM users WHERE email = ?', [email]);
    if (existing.length > 0) {
      console.error('That email is already registered.');
      process.exitCode = 1;
      return;
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    await pool.query(
      'INSERT INTO users (name, email, password, role, student_id) VALUES (?, ?, ?, ?, ?)',
      [name, email, hashedPassword, 'admin', null]
    );
    console.log(`Admin account created for ${email}.`);
  } finally {
    await pool.end();
  }
}

main().catch((err) => {
  console.error('Failed to create admin account:', err.message);
  process.exitCode = 1;
});
