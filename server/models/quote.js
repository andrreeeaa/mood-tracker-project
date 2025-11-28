const mongoose = require('mongoose');

const quoteSchema = new mongoose.Schema({
    moodScore:{
        type: String,
        required: true,
        unique: true 
    },
    quotes:{
        type: [String], //lista de texte
        required: true
    }
});

module.exports = mongoose.model('Quote', quoteSchema);