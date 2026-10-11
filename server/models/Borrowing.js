const mongoose = require('mongoose')

const borrowingSchema = new mongoose.Schema({
    student_id: { type: mongoose.Schema.Types.ObjectId, ref: "Student"},
    book_id: { type: mongoose.Schema.Types.ObjectId, ref: "Book"},
    borrow_date: Date,
    due_date: Date,
    return_date: Date,
    fine_amount: {type: Number, default: 0},
    overdue_fee: { type: Number, default: 0}
})

module.exports = mongoose.model('Borrowing', borrowingSchema)