const express = require('express');
const router = express.Router();
const quoteController = require('../controllers/quoteController');

// :moodScore înseamnă că e o variabilă (poate fi 1, 2, 3 etc.)
router.get('/:moodScore', quoteController.getQuoteByMood);

module.exports = router;