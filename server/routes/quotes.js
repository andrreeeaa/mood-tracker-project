const express = require('express');
const router = express.Router();
const quoteController = require('../controllers/quoteController');

// :moodScore înseamnă că e o variabilă (poate fi 1, 2, 3 etc.)
// semnul ':' semnaleaza ca e o ruta dinamica - moodScore nu va fi mereu acelasi numar
//exemple: Dacă partea aceea din URL reprezintă un ID, un Cod, un Nume de utilizator sau o Categorie dintr-o listă lungă, atunci pui :
router.get('/:moodScore', quoteController.getQuoteByMood);

module.exports = router;