const pool = require('../config/db');

exports.addComment = async (req, res) => {
  try {
    const { id } = req.params;
    const { comment } = req.body;
    const userId = req.user.id;

    if (!comment) {
      return res.status(400).json({ success: false, message: 'Comment cannot be empty' });
    }

    await pool.query(
      'INSERT INTO complaint_comments (complaint_id, user_id, comment) VALUES (?, ?, ?)',
      [id, userId, comment]
    );

    res.status(201).json({ success: true, message: 'Comment added successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getComments = async (req, res) => {
  try {
    const { id } = req.params;

    const [comments] = await pool.query(
      `SELECT cc.*, u.name AS commenter_name, u.role AS commenter_role
       FROM complaint_comments cc
       JOIN users u ON cc.user_id = u.id
       WHERE cc.complaint_id = ?
       ORDER BY cc.created_at ASC`,
      [id]
    );

    res.json({ success: true, data: comments });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};