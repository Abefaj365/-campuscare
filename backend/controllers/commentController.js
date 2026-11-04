const pool = require('../config/db');

// Only the complaint's owner or an admin may see or discuss it.
// Previously any logged-in user could comment on / read anyone's
// complaint, and comments could be inserted for a complaint that
// did not exist at all.
async function getComplaintOrNull(id) {
  const [rows] = await pool.query('SELECT id, student_id FROM complaints WHERE id = ?', [id]);
  return rows[0] || null;
}

function canAccessComplaint(req, complaint) {
  return req.user.role === 'admin' || String(complaint.student_id) === String(req.user.id);
}

exports.addComment = async (req, res) => {
  try {
    const { id } = req.params;
    const { comment } = req.body;
    const userId = req.user.id;

    if (!comment) {
      return res.status(400).json({ success: false, message: 'Comment cannot be empty' });
    }

    const complaint = await getComplaintOrNull(id);
    if (!complaint) {
      return res.status(404).json({ success: false, message: 'Complaint not found' });
    }
    if (!canAccessComplaint(req, complaint)) {
      return res.status(403).json({ success: false, message: 'You can only comment on your own complaints' });
    }

    await pool.query(
      'INSERT INTO complaint_comments (complaint_id, user_id, comment) VALUES (?, ?, ?)',
      [id, userId, comment]
    );

    res.status(201).json({ success: true, message: 'Comment added successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to add comment' });
  }
};

exports.getComments = async (req, res) => {
  try {
    const { id } = req.params;

    const complaint = await getComplaintOrNull(id);
    if (!complaint) {
      return res.status(404).json({ success: false, message: 'Complaint not found' });
    }
    if (!canAccessComplaint(req, complaint)) {
      return res.status(403).json({ success: false, message: 'You can only view comments on your own complaints' });
    }

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
    res.status(500).json({ success: false, message: 'Failed to fetch comments' });
  }
};
