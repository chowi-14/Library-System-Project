const mongoose = require('mongoose')

const professorSchema = new mongoose.Schema(
    {
        user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
        firstname: { type: String, required: true, trim: true },
        lastname: { type: String, required: true, trim: true },
        email: { type: String, required: true, lowercase: true, trim: true },
        phone_number: { type: String, required: true },
        id_number: { type: String, required: true, trim: true },
        department: { type: String, required: true, trim: true }
    },
    { timestamps: true }
)

module.exports = mongoose.model('Professor', professorSchema)