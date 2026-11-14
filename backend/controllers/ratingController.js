const pool = require('../config/db');

exports.addRating = async (req, res) => {
  try {
    const { id } = req.params;
    const { rating, feedback } = req.body;
    const studentId = req.user.id;

    // Rating must be a whole number between 1 and 5.
    const ratingValue = Number(rating);
    if (!Number.isInteger(ratingValue) || ratingValue < 1 || ratingValue > 5) {
      return res.status(400).json({ success: false, message: 'Rating must be a whole number between 1 and 5' });
    }

    const [complaints] = await pool.query('SELECT * FROM complaints WHERE id = ?', [id]);
    if (complaints.length === 0) {
      return res.status(404).json({ success: false, message: 'Complaint not found' });
    }

    const complaint = complaints[0];

    if (String(complaint.student_id) !== String(studentId)) {
      return res.status(403).json({ success: false, message: 'You can only rate your own complaints' });
    }

    if (complaint.status !== 'resolved') {
      return res.status(400).json({ success: false, message: 'You can only rate a resolved complaint' });
    }

    // One rating per student per complaint. The schema also enforces
    // this with a UNIQUE key, so a race between two requests still
    // cannot create duplicates.
    const [existing] = await pool.query(
      'SELECT id FROM ratings WHERE complaint_id = ? AND student_id = ?',
      [id, studentId]
    );
    if (existing.length > 0) {
      return res.status(409).json({ success: false, message: 'You have already rated this complaint' });
    }

    await pool.query(
      'INSERT INTO ratings (complaint_id, student_id, rating, feedback) VALUES (?, ?, ?, ?)',
      [id, studentId, ratingValue, feedback || null]
    );

    res.status(201).json({ success: true, message: 'Rating submitted successfully' });
  } catch (err) {
    // Duplicate-key fallback for the race case above.
    if (err && err.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ success: false, message: 'You have already rated this complaint' });
    }
    res.status(500).json({ success: false, message: 'Failed to submit rating' });
  }
};

exports.getRating = async (req, res) => {
  try {
    const { id } = req.params;

    const [complaints] = await pool.query('SELECT id, student_id FROM complaints WHERE id = ?', [id]);
    if (complaints.length === 0) {
      return res.status(404).json({ success: false, message: 'Complaint not found' });
    }
    if (req.user.role !== 'admin' && String(complaints[0].student_id) !== String(req.user.id)) {
      return res.status(403).json({ success: false, message: 'You can only view the rating of your own complaints' });
    }

    const [ratings] = await pool.query(
      'SELECT * FROM ratings WHERE complaint_id = ?',
      [id]
    );

    res.json({ success: true, data: ratings[0] || null });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch rating' });
  }
};
