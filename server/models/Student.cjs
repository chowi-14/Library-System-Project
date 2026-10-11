const mongoose = require('mongoose')

const studentSchema = new mongoose.Schema({
    user_id: {
        type: mongoose.Schema.Types.ObjectId, ref: 'User', unique: true
    },
    firstname: {type: String, required: true},
    lastname:  {type: String, required: true},
    grade_level: String,
    phone_number: String,
    email: String
})

module.exports = mongoose.model('Student', studentSchema)