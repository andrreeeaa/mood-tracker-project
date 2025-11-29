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

//obtinere date 
const getStats = async (req, res) => {  
    try{
       // Luăm maxim 10 înregistrări pentru comparația ultimele 5 inregistrari vs anterioarele 5
        const logs = await DailyLog.find().sort({ date: -1 }).limit(10);

        // STAREA 1 & 2: Nu avem destule date pentru prima medie (sub 5)
        // in browser se va afisa "Keep tracking! Log 5 check-ins..."
        if (logs.length < 5) {
            return res.status(200).json({
                hasEnoughData: false, // Flag pentru Frontend: Arată cardul "Keep Tracking"
                currentCount: logs.length,
                remaining: 5 - logs.length
            });
        }

        // STAREA 3: Avem date (minim 5)
        // Împărțim în două seturi
        const recentLogs = logs.slice(0, 5);    // Ultimele 5
        const previousLogs = logs.slice(5, 10); // Anterioarele 5 (poate fi gol dacă avem doar 6-7 logări)

        // Funcție pentru calcularea mediei
        //  variab field primeste textul 'moodScore' si 'sleepHours'
        //  utilizam field ptr ca îi pasăm funcției un Text care reprezintă Numele Cheii din baza de date după care vrem să facă ea căutarea 
        const calculateAvg = (list, field) => {
            if (!list.length) return 0;
            const sum = list.reduce((acc, curr) => acc + curr[field], 0);
            return (sum / list.length).toFixed(1); //toFixed(1) face ca nr sa aiba o singura zecimala
        };

        //calc mediile pentru setul recent de inregistrari
        const recentMoodAvg = calculateAvg(recentLogs, 'moodScore');
        const recentSleepAvg = calculateAvg(recentLogs, 'sleepHours');

        // Calculăm comparația DOAR dacă avem setul anterior complet (adică 10 logări total)
        let comparison = null; // plecam de la premisa ca nu avem ce compara
        
        //calculam mediile pentru setul vechi de inregistrari
        if (previousLogs.length === 5) {
            const prevMoodAvg = calculateAvg(previousLogs, 'moodScore');
            const prevSleepAvg = calculateAvg(previousLogs, 'sleepHours');

            // Generăm textul de comparație
            // Ex: "Same as the previous 5 check-ins"
            
            // Mood
            let moodText = "Same as the previous 5 check-ins";
            //verificam daca exista o imbunatatire a mood-ului sau nu
            //toFixed(1) returneaza string motiv ptr care utilizam Number()
            if (Number(recentMoodAvg) > Number(prevMoodAvg)) moodText = "Improvement from previous 5";
            if (Number(recentMoodAvg) < Number(prevMoodAvg)) moodText = "Decrease from previous 5";

            //Sleep
            let sleepText = "Same as the previous 5 check-ins";
            if (Number(recentSleepAvg) > Number(prevSleepAvg)) sleepText = "Increase from previous 5";
            if (Number(recentSleepAvg) < Number(prevSleepAvg)) sleepText = "Decrease from previous 5";

            //construirea obiectului comparison
            //daca comparison nu e null el va contine tot ce are nevoie frontend-ul să afișeze textul mic de sub medie
            comparison = {
                mood: { 
                    prevAvg: prevMoodAvg, 
                    text: moodText 
                },
                sleep: { 
                    prevAvg: prevSleepAvg, 
                    text: sleepText 
                }
            };
        }

        // Răspuns Final către Frontend
        res.json({
            hasEnoughData: true, // Flag pentru Frontend: Arată cardurile colorate
            recent: {
                mood: recentMoodAvg,
                sleep: recentSleepAvg
            },
            comparison: comparison // Va fi null dacă avem între 5 și 9 logări
        });
    } catch{
        console.error(error);
        res.status(500).json({ error: "Eroare server la statistici." });
    }
}

// Exportăm funcțiile ca să le vadă Rutele
module.exports = {
    createLog,
    getRecentLogs,
    getStats
};