// server/seedDB.js

const mongoose = require('mongoose');
require('dotenv').config(); 

// --- 1. Import Modele & Date ---
const data = require('./data.json'); 
const User = require('./models/user'); 
const DailyLog = require('./models/DailyLog');
const Quote = require('./models/Quote');

const MONGO_URI = process.env.MONGO_URI; 

// --- 2. Funcția Principală de Import ---
const importData = async () => {
    try {
        await mongoose.connect(MONGO_URI);
        console.log('--- Conexiune DB reușită ---');

        // A. Ștergerea Datelor Vechi (pentru rulări repetate)
        await DailyLog.deleteMany();
        await Quote.deleteMany();
        // NOTA: Nu ștergem User-ii de fiecare dată, doar creăm unul de test dacă nu există.

        // B. Crearea/Identificarea Utilizatorului de Test
        // Acesta e vital pentru a avea un 'userID' valid pentru logs
        let testUser = await User.findOne({ email: 'test@moodtracker.com' });

        if (!testUser) {
            // parola trebuie criptată dar pt test folosim un placeholder simplu 
            testUser = await User.create({
                name: 'Tester User',
                email: 'test@moodtracker.com',
                password: 'fakehashedpassword123', 
                avatarURL: 'default.png'
            });
            console.log('Utilizator de test creat.');
        } else {
            console.log('Utilizator de test găsit.');
        }
        
        const testUserID = testUser._id;


        // C. Inserarea Logărilor Zilnice (DailyLog)
        const dailyLogsToInsert = data.moodEntries.map(entry => ({
            userID: testUserID, // Asociază log-ul utilizatorului de test
            date: new Date(entry.createdAt), // Convertește string-ul ISO în obiect Date
            moodScore: entry.mood,
            feelings: entry.feelings,
            journalEntry: entry.journalEntry, 
            sleepHours: entry.sleepHours
        }));

        await DailyLog.insertMany(dailyLogsToInsert);
        console.log(`- ${dailyLogsToInsert.length} logări zilnice inserate.`);
        
        // D. Inserarea Citatelor (Quote)
        const quoteKeys = Object.keys(data.moodQuotes);
        //funct arrow cu implicit return
        const quotesToInsert = quoteKeys.map(key => ({
            moodScore: key, // Cheia (1, 2, 3, etc.)
            quotes: data.moodQuotes[key]
        }));
        
        await Quote.insertMany(quotesToInsert);
        console.log(`- ${quotesToInsert.length} seturi de citate inserate.`);

        // --- Finalizare ---
        console.log('🎉 Popularea bazei de date a fost finalizată cu succes!');
        mongoose.connection.close(); // Închide conexiunea după ce a terminat
        
    } catch (error) {
        console.error('❌ EROARE CRITICĂ la populare:', error);
        // Oprește procesul și închide conexiunea în caz de eșec
        mongoose.connection.close(); 
        process.exit(1);
    }
};

// Rularea funcției de import
importData();