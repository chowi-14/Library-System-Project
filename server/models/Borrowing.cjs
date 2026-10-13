const mongoose = require('mongoose')

const borrowingSchema = new mongoose.Schema({
    user_id:     { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    book_id:     { type: mongoose.Schema.Types.ObjectId, ref: 'Book', required: true },
    borrow_date: { type: Date, default: null },
    due_date:    { type: Date, default: null },
    return_date: { type: Date, default: null },
    fine_amount: { type: Number, default: 0 },
    fine_paid:   { type: Boolean, default: false },
    overdue_fee: { type: Number, default: 0 },
    // Existing records have no status, so treat them as approved
    status:         { type: String, enum: ['pending', 'approved', 'declined', 'cancelled'], default: 'approved' },
    requested_date: { type: Date, default: null },
    decided_by:     { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    decided_date:   { type: Date, default: null }
})

module.exports = mongoose.model('Borrowing', borrowingSchema)