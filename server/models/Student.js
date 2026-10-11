const mongoose = require('mongoose')

const studentSchema = new mongoose.Schema({
    user_id: {
        type: mongoose.Schema.Types.ObjectId, ref: 'User', unique: true
    },
    firstname: String,
    lastname: String,
    grade_level: String,
    phone_numer: String,
    email: String
})

module.exports = mongoose.model('Student', studentSchema)