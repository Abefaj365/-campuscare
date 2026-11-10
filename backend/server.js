const express = require('express');
const cors = require('cors');
require('dotenv').config();

// Fail fast with a clear message instead of printing "Server running"
// and then failing every request, which is what used to happen when
// .env was missing. DB_PASS is intentionally optional: local MySQL
// setups (e.g. XAMPP root) often have no password.
const requiredEnv = ['DB_HOST', 'DB_USER', 'DB_NAME', 'JWT_SECRET'];
const missingEnv = requiredEnv.filter((key) => !process.env[key]);
if (missingEnv.length > 0) {
  console.error(
    `Missing required environment variables: ${missingEnv.join(', ')}. ` +
    'Copy backend/.env.example to backend/.env and fill it in, then start again.'
  );
  process.exit(1);
}

const pool = require('./config/db');
const authRoutes = require('./routes/authRoutes');
const complaintRoutes = require('./routes/complaintRoutes');
const commentRoutes = require('./routes/commentRoutes');
const ratingRoutes = require('./routes/ratingRoutes');

const app = express();
app.disable('x-powered-by');
app.use(cors({ origin: process.env.CORS_ORIGIN || true }));
app.use(express.json());
app.use('/api/auth', authRoutes);
app.use('/api/complaints', complaintRoutes);
app.use('/api/complaints', commentRoutes);
app.use('/api/complaints', ratingRoutes);

app.get('/', (req, res) => {
  res.send('CampusCare backend is running');
});

app.get('/test-db', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT 1 + 1 AS result');
    res.json({ success: true, result: rows[0].result });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Database connection failed' });
  }
});

// JSON 404 instead of Express's default HTML page, so API clients
// (including a frontend) don't have to parse HTML for unknown routes.
app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});

// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ success: false, message: 'Something went wrong' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
