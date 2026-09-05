const express = require('express');
const router = express.Router();
const { addComment, getComments } = require('../controllers/commentController');
const { verifyToken } = require('../middleware/authMiddleware');

router.post('/:id/comments', verifyToken, addComment);
router.get('/:id/comments', verifyToken, getComments);

module.exports = router;