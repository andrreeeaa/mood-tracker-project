const mongoose = require('mongoose'); //importare librarie mongoose

//definim schema
const dailyLogSchema = new mongoose.Schema({
    //definire cheie straina
    //legatura catre celalalt document se face prin cheia "ref"
    userID: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    date: {
        type: Date,
        required: true,
        unique: true
    },
    moodScore: {
        type: Number,
        required: true,
        min: 1,
        max: 5
    },
    feelings: {type: [String]}, //lista cu diferite stari
    journalEntry: {type: String, default: ''}, //textbox 
    sleepHours: {
        type: Number, 
        required: true, 
        min: 0, 
        max: 24
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('DailyLog', dailyLogSchema);