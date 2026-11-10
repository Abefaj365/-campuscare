const express = require('express');
const router = express.Router();
const { addRating, getRating } = require('../controllers/ratingController');
const { verifyToken } = require('../middleware/authMiddleware');

router.post('/:id/rating', verifyToken, addRating);
router.get('/:id/rating', verifyToken, getRating);

module.exports = router;