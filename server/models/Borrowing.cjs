const mongoose = require('mongoose')

const borrowingSchema = new mongoose.Schema({
    user_id:     { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    book_id:     { type: mongoose.Schema.Types.ObjectId, ref: 'Book', required: true },
    borrow_date: { type: Date, required: true },
    due_date:    { type: Date, required: true },
    return_date: { type: Date, default: null },
    fine_amount: { type: Number, default: 0 },
    fine_paid:   { type: Boolean, default: false },
    overdue_fee: { type: Number, default: 0 }
})

module.exports = mongoose.model('Borrowing', borrowingSchema)