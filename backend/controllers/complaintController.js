const pool = require('../config/db');

exports.createComplaint = async (req, res) => {
  try {
    const { category, location, description, priority } = req.body;
    const studentId = req.user.id;

    if (!category || !location || !description) {
      return res.status(400).json({ success: false, message: 'Please fill all required fields' });
    }

    await pool.query(
      'INSERT INTO complaints (student_id, category, location, description, priority) VALUES (?, ?, ?, ?, ?)',
      [studentId, category, location, description, priority || 'medium']
    );

    res.status(201).json({ success: true, message: 'Complaint submitted successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getMyComplaints = async (req, res) => {
  try {
    const studentId = req.user.id;
    const [complaints] = await pool.query(
      'SELECT * FROM complaints WHERE student_id = ? ORDER BY created_at DESC',
      [studentId]
    );
    res.json({ success: true, data: complaints });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getAllComplaints = async (req, res) => {
  try {
    const { status } = req.query;
    let query = 'SELECT c.*, u.name AS student_name FROM complaints c JOIN users u ON c.student_id = u.id';
    const params = [];

    if (status) {
      query += ' WHERE c.status = ?';
      params.push(status);
    }
    query += ' ORDER BY c.created_at DESC';

    const [complaints] = await pool.query(query, params);
    res.json({ success: true, data: complaints });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.updateStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['pending', 'in_progress', 'resolved'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status value' });
    }

    await pool.query('UPDATE complaints SET status = ? WHERE id = ?', [status, id]);
    res.json({ success: true, message: 'Status updated successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getStats = async (req, res) => {
  try {
    const [statusCounts] = await pool.query(
      `SELECT status, COUNT(*) AS count FROM complaints GROUP BY status`
    );

    const [categoryCounts] = await pool.query(
      `SELECT category, COUNT(*) AS count FROM complaints GROUP BY category`
    );

    const [totalRow] = await pool.query(
      `SELECT COUNT(*) AS total FROM complaints`
    );

    res.json({
      success: true,
      data: {
        total: totalRow[0].total,
        byStatus: statusCounts,
        byCategory: categoryCounts
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};