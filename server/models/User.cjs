const mongoose = require('mongoose')

const userSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
        unique: true
    }, 
    password_hash:{
        type: String, 
        required: true
    },
    role: {
        type: String,
        enum: ['student', 'professor', 'librarian'],
        required: true
    },
    is_active: {
        type: Boolean,
        default: true
    }
})

module.exports = mongoose.model('User', userSchema)