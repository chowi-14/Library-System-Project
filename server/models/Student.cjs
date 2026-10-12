const mongoose = require('mongoose')

const studentSchema = new mongoose.Schema({
    user_id: {
        type: mongoose.Schema.Types.ObjectId, ref: 'User', unique: true
    },
    firstname: {type: String, required: true},
    lastname:  {type: String, required: true},
    id_number: { type: String, required: true, trim: true },
    course: { type: String, required: true, trim: true },
    year_level: { type: String, required: true, trim: true },
    grade_level: String,
    phone_number: String,
    email: String
})

module.exports = mongoose.model('Student', studentSchema)