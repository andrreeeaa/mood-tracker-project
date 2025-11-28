require('dotenv').config(); //incarca variabilele din .env
const express = require('express');
const mongoose = require('mongoose');
const path = require('path');

// --- IMPORT RUTE ---
//spunem serverului principal să folosească aceste rute
const logsRouter = require('./routes/logs');
const quotesRouter = require('./routes/quotes'); 

const app = express();
const PORT = process.env.PORT || 5000;

//-----Middleware-uri express-----
//Permite Express să parseze JSON din corpul cererilor (POST/PUT)
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, 'public')));

// Conexiune baza de date
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log('MongoDB conectat cu succes'))
    .catch(err => console.error('Eroare conexiune MongoDB:', err));

// --- ACTIVARE RUTE (NOU) ---
app.use('/api/logs', logsRouter);     // Rutele pentru logs
app.use('/api/quotes', quotesRouter); // Rutele pentru quotes

// Ruta Fallback pentru Frontend
//Simbolul * înseamnă "ORICE ALTCEVA".
// Acțiunea: "Dacă userul nu a cerut date (API), înseamnă că vrea să vadă site-ul. Trimite-i fișierul index.html."
app.get(/.*/, (req, res) => {
    res.sendFile(path.join(__dirname, '../public/index.html'));
});

// Rute de test
// app.get('/', (req, res) => {
//     res.send('Serverul functioneaza!');
// });

// Pornire server
app.listen(PORT, () => {
    console.log(`Serverul a pornit pe portul: ${PORT}`);
});