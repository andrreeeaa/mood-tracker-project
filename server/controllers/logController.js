// aici avem logica pentru stari/moods (logs)
const DailyLog = require('../models/DailyLog');
const User = require('../models/user');

// 1. SALVARE STARE (Create)
const createLog = async (req, res) => {
    try {
        //destructurare
        const { moodScore, feelings, journalEntry, sleepHours } = req.body;

        // TRUC PENTRU TESTARE:
        // Deocamdată nu avem Login funcțional. Așa că vom căuta automat userul de test
        // și îi vom atribui lui această stare.
        const user = await User.findOne({ email: 'test@moodtracker.com' });
        
        if (!user) {
            return res.status(404).json({ error: "Utilizatorul de test nu a fost găsit. Rulează seedDB!" });
        }

        // Creăm log-ul în memorie
        const newLog = await DailyLog.create({
            userID: user._id, // Folosim ID-ul găsit
            date: new Date(), // Punem data/ora curentă
            moodScore,
            feelings,
            journalEntry,
            sleepHours
        });

        // Răspundem cu succes (201 Created)
        res.status(201).json(newLog);

    } catch (error) {
        // Dacă userul a mai logat o dată azi (unique: true la dată), va intra aici
        console.error(error);
        res.status(400).json({ error: 'Nu am putut salva. Posibil ai logat deja azi?' });
    }
};

// 2. OBTINERE DATE GRAFIC (Read Recent)
const getRecentLogs = async (req, res) => {
    try {
        // Căutăm ultimele 11 înregistrări, sortate descrescător după dată
        const logs = await DailyLog.find()
            .sort({ date: -1 }) //-1 returneaza ultimele inreg, cele mai recente
            .limit(11);
        
        res.status(200).json(logs);
    } catch (error) {
        res.status(500).json({ error: 'Eroare server la preluarea datelor.' });
    }
};

// Exportăm funcțiile ca să le vadă Rutele
module.exports = {
    createLog,
    getRecentLogs
};