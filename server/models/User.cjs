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
    },
    avatar: {
        type: String,
        default: null
    },
    must_change_password: {
        type: Boolean,
        default: false
    },
    is_head: {
        type: Boolean,
        default: false
    },
    favorites: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Book'
    }]
})

module.exports = mongoose.model('User', userSchema)