const mongoose = require('mongoose')

const bookSchema = new mongoose.Schema({
    added_by:    { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    title:       { type: String, required: true, trim: true, maxlength: 100 },
    author:      { type: String, required: true, trim: true, maxlength: 60 },
    publisher:   { type: String, required: true, trim: true, maxlength: 60 },
    category:    { type: String, required: true },
    subcategory: { type: String, trim: true, maxlength: 40, default: '' },
    published:   { type: String, required: true },   
    description: { type: String, required: true, trim: true, maxlength: 300 },
    image:       { type: String, default: '' },     
    status:      { type: String, enum: ['Available', 'Borrowed'], default: 'Available' },
    cover:       { type: [String], default: ['#4a1f1f', '#eea51c'] },
    copies:      { type: Number, default: 1, min: 1, max: 99 }
}, { timestamps: true })

bookSchema.set('toJSON', {
    virtuals: true,
    versionKey: false,
    transform: (_doc, ret) => { delete ret._id; return ret }
})

module.exports = mongoose.model('Book', bookSchema)