const express = require('express');
const router = express.Router();

const {
  createComplaint,
  getMyComplaints,
  getAllComplaints,
  updateStatus,
  getStats
} = require('../controllers/complaintController');

const { verifyToken, isAdmin } = require('../middleware/authMiddleware');

// Student routes
router.post('/', verifyToken, createComplaint);
router.get('/my', verifyToken, getMyComplaints);

// Admin routes
router.get('/stats', verifyToken, isAdmin, getStats);
router.get('/', verifyToken, isAdmin, getAllComplaints);
router.patch('/:id/status', verifyToken, isAdmin, updateStatus);

module.exports = router;