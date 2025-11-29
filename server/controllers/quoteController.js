const Quote = require('../models/Quote');

// Găsește un citat random bazat pe moodScore
const getQuoteByMood = async (req, res) => {
    try {
        // Luăm scorul din URL (ex: /api/quotes/2)
        const { moodScore } = req.params; 

        // Căutăm documentul cu citate pentru acel scor
        const quoteDoc = await Quote.findOne({ moodScore: moodScore });

        if (!quoteDoc) {
            return res.status(404).json({ message: "Nu am citate pentru această stare." });
        }

        // Alegem UN citat random din lista 'quotes'
        //geneream un nr random pe care il vom folosi ca index pentru a extrage citatul
        //quoteDoc.quotes.length = lungimea listei de citate
        const randomIndex = Math.floor(Math.random() * quoteDoc.quotes.length);
        const randomQuote = quoteDoc.quotes[randomIndex];

        res.status(200).json({ quote: randomQuote });

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

module.exports = { getQuoteByMood };