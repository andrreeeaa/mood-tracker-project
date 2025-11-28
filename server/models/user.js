const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    name:{
        type: String,
        required: true
    },
    email:{
        type: String,
        required: true,
        unique: true 
    },
    password:{
        type: String,
        required: true
    },
    avatarURL:{
        type: String,
        default: 'default_avatar.png'
    }
}, {
    timestamps: true //adauga automat createdAt si updatedAt
});

module.exports = mongoose.model('User', userSchema);