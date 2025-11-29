// Aici conectăm adresele URL la funcțiile din Controllers
const express = require('express');
const router = express.Router();
// Importăm controller-ul făcut la Pasul 1
const logController = require('../controllers/logController');

// Când cineva trimite date (POST) la /api/logs
//Salvează o nouă stare
router.post('/', logController.createLog);

// Când cineva cere date (GET) la /api/logs/recent
//Aduce ultimele 11 stări
router.get('/recent', logController.getRecentLogs);

router.get('/stats', logController.getStats);

module.exports = router;