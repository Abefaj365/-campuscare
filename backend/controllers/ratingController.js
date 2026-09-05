const pool = require('../config/db');

exports.addRating = async (req, res) => {
  try {
    const { id } = req.params;
    const { rating, feedback } = req.body;
    const studentId = req.user.id;

    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ success: false, message: 'Rating must be between 1 and 5' });
    }

    const [complaints] = await pool.query('SELECT * FROM complaints WHERE id = ?', [id]);
    if (complaints.length === 0) {
      return res.status(404).json({ success: false, message: 'Complaint not found' });
    }

    const complaint = complaints[0];

    if (complaint.student_id !== studentId) {
      return res.status(403).json({ success: false, message: 'You can only rate your own complaints' });
    }

    if (complaint.status !== 'resolved') {
      return res.status(400).json({ success: false, message: 'You can only rate a resolved complaint' });
    }

    await pool.query(
      'INSERT INTO ratings (complaint_id, student_id, rating, feedback) VALUES (?, ?, ?, ?)',
      [id, studentId, rating, feedback || null]
    );

    res.status(201).json({ success: true, message: 'Rating submitted successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getRating = async (req, res) => {
  try {
    const { id } = req.params;

    const [ratings] = await pool.query(
      'SELECT * FROM ratings WHERE complaint_id = ?',
      [id]
    );

    res.json({ success: true, data: ratings[0] || null });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};