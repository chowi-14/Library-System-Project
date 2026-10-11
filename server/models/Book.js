const mongoose = require('mongoose')

const bookSchema = new mongoose.Schema({
    added_by:{ type: mongoose.Schema.Types.ObjectId, ref: "Librarian"},
    title: String, 
    author: String,
    category: String,
    publisher: String,
    date_published: String,
    cover_image: String
})

module.exports = mongoose.model('Book', bookSchema)