const express = require('express')
const mongoose = require('mongoose')
const router = express.Router()
const Borrowing = require('../models/Borrowing.cjs')
const Book = require('../models/Book.cjs')
const User = require('../models/User.cjs')
const Student = require('../models/Student.cjs')
const Professor = require('../models/Professor.cjs')
const auth = require('../middleware/auth.cjs')

const LOAN_DAYS = 14
const FINE_PER_DAY = 5
const MAX_ACTIVE = 3
const DAY = 86400000

// A real loan: not a pending, declined or cancelled request (old records have no status)
const LIVE = { status: { $nin: ['pending', 'declined', 'cancelled'] } }

const dayStart = (d) => Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate())
const today = () => new Date(dayStart(new Date()))
const daysLate = (due, end) =>
    Math.max(0, Math.floor((dayStart(new Date(end)) - dayStart(new Date(due))) / DAY))
const iso = (d) => (d ? new Date(d).toISOString().slice(0, 10) : null)

const requireLibrarian = (req, res, next) =>
    req.user.role === 'librarian' ? next() : res.status(403).json({ error: 'Librarians only.' })

const checkId = (req, res, next) =>
    mongoose.isValidObjectId(req.params.id) ? next() : res.status(400).json({ error: 'Invalid id.' })

const profiles = async (userIds) => {
    const [s, p] = await Promise.all([
        Student.find({ user_id: { $in: userIds } }),
        Professor.find({ user_id: { $in: userIds } })
    ])
    return new Map([...s, ...p].map((x) => [String(x.user_id), x]))
}

const shapeAll = async (rows) => {
    const ids = [...new Set(rows.map((r) => String(r.user_id)))]
    const [users, people] = await Promise.all([User.find({ _id: { $in: ids } }), profiles(ids)])
    const um = new Map(users.map((u) => [String(u._id), u]))

    return rows.map((r) => {
        const returned = !!r.return_date
        const pending = r.status === 'pending'
        const late = r.due_date ? daysLate(r.due_date, r.return_date ?? new Date()) : 0
        const p = people.get(String(r.user_id))
        const u = um.get(String(r.user_id))
        const book = r.book_id
        return {
            id: r._id,
            bookId: book?._id,
            title: book?.title ?? '(deleted book)',
            cover: book?.cover ?? [],
            borrower: p ? `${p.firstname} ${p.lastname}` : u?.email ?? 'Unknown',
            borrowerEmail: u?.email ?? '',
            borrowedOn: iso(r.borrow_date),
            requestedOn: iso(r.requested_date),
            requestStatus: r.status ?? 'approved',
            due: iso(r.due_date),
            returned: iso(r.return_date),
            status: pending ? 'Pending' : returned ? 'Returned' : 'Not Returned',
            overdue: !returned && late > 0,
            daysOverdue: late,
            fine: returned ? r.fine_amount : late * FINE_PER_DAY,
            finePaid: !!r.fine_paid
        }
    })
}

// Returns the reason this user can't borrow this book, or null if they can
const eligibility = async (user, book) => {
    const active = await Borrowing.find({ user_id: user._id, return_date: null, ...LIVE })
    if (active.some((b) => daysLate(b.due_date, new Date()) > 0))
        return 'Borrower has overdue books. Return them first.'

    const unpaid = await Borrowing.find({
        user_id: user._id,
        return_date: { $ne: null },
        fine_amount: { $gt: 0 },
        fine_paid: { $ne: true }
    })
    const owed = unpaid.reduce((s, b) => s + b.fine_amount, 0)
    if (owed > 0) return `Borrower has unpaid fines (₱${owed.toFixed(2)}).`

    if (active.length >= MAX_ACTIVE) return `Borrowing limit reached (${MAX_ACTIVE} books).`
    if (active.some((b) => String(b.book_id) === String(book._id)))
        return 'Borrower already has this book.'

    const out = await Borrowing.countDocuments({ book_id: book._id, return_date: null, ...LIVE })
    if (out >= (book.copies ?? 1)) return 'No copies available.'
    return null
}

const syncStatus = async (bookId) => {
    const book = await Book.findById(bookId)
    if (!book) return
    const active = await Borrowing.countDocuments({ book_id: bookId, return_date: null, ...LIVE })
    book.status = active >= (book.copies ?? 1) ? 'Borrowed' : 'Available'
    await book.save()
}

const serverError = (res, err) => {
    console.error(err)
    // Show the real message outside production so it's easy to debug
    res.status(500).json({
        error: process.env.NODE_ENV === 'production' ? 'Server error.' : err.message
    })
}

// Everyone who can borrow (for the librarian's lookup and issue list)
router.get('/borrowers', auth, requireLibrarian, async (_req, res) => {
    try {
        const users = await User.find({ role: { $in: ['student', 'professor'] }, is_active: { $ne: false } })
        const people = await profiles(users.map((u) => u._id))
        res.json(
            users.map((u) => {
                const p = people.get(String(u._id))
                return {
                    id: u._id,
                    role: u.role,
                    email: u.email,
                    firstName: p?.firstname ?? '',
                    lastName: p?.lastname ?? '',
                    phone_number: p?.phone_number ?? '',
                    idNumber: p?.id_number ?? '',
                    course: p?.course ?? '',
                    yearLevel: p?.year_level ?? '',
                    department: p?.department ?? ''
                }
            })
        )
    } catch (err) {
        serverError(res, err)
    }
})

// Librarians see everything; others see their own
router.get('/', auth, async (req, res) => {
    try {
        const filter = req.user.role === 'librarian' ? {} : { user_id: req.user.id }
        const rows = await Borrowing.find(filter).populate('book_id').sort({ borrow_date: -1, _id: -1 })
        res.json(await shapeAll(rows))
    } catch (err) {
        serverError(res, err)
    }
})

// Librarians pass { bookId, email } and the loan starts right away.
// Everyone else sends { bookId } and creates a request a librarian must approve.
router.post('/', auth, async (req, res) => {
    try {
        const { bookId, email } = req.body
        if (!mongoose.isValidObjectId(bookId)) return res.status(400).json({ error: 'Invalid book.' })

        const librarian = req.user.role === 'librarian'
        const user = librarian
            ? await User.findOne({ email: String(email ?? '').trim().toLowerCase() })
            : await User.findById(req.user.id)
        if (!user || user.role === 'librarian') return res.status(400).json({ error: 'Borrower not found.' })

        const book = await Book.findById(bookId)
        if (!book) return res.status(404).json({ error: 'Book not found.' })

        const problem = await eligibility(user, book)
        if (problem) return res.status(400).json({ error: problem })

        let created
        if (librarian) {
            const start = today()
            created = await Borrowing.create({
                user_id: user._id,
                book_id: book._id,
                status: 'approved',
                borrow_date: start,
                due_date: new Date(start.getTime() + LOAN_DAYS * DAY),
                decided_by: req.user.id,
                decided_date: new Date()
            })
            await syncStatus(book._id)
        } else {
            const dup = await Borrowing.exists({ user_id: user._id, book_id: book._id, status: 'pending' })
            if (dup) return res.status(400).json({ error: 'You already requested this book.' })
            created = await Borrowing.create({
                user_id: user._id,
                book_id: book._id,
                status: 'pending',
                requested_date: new Date()
            })
        }

        const row = await Borrowing.findById(created._id).populate('book_id')
        res.status(201).json((await shapeAll([row]))[0])
    } catch (err) {
        serverError(res, err)
    }
})

// Librarian approves: the loan starts today. Everything is re-checked first,
// because things may have changed since the request was made.
router.put('/:id/approve', auth, requireLibrarian, checkId, async (req, res) => {
    try {
        const b = await Borrowing.findById(req.params.id)
        if (!b) return res.status(404).json({ error: 'Request not found.' })
        if (b.status !== 'pending') return res.status(400).json({ error: 'This request was already handled.' })

        const [user, book] = await Promise.all([User.findById(b.user_id), Book.findById(b.book_id)])
        if (!user || !book) return res.status(400).json({ error: 'The borrower or the book no longer exists.' })

        const problem = await eligibility(user, book)
        if (problem) return res.status(400).json({ error: problem })

        const start = today()
        b.status = 'approved'
        b.borrow_date = start
        b.due_date = new Date(start.getTime() + LOAN_DAYS * DAY)
        b.decided_by = req.user.id
        b.decided_date = new Date()
        await b.save()
        await syncStatus(b.book_id)

        const row = await Borrowing.findById(b._id).populate('book_id')
        res.json((await shapeAll([row]))[0])
    } catch (err) {
        serverError(res, err)
    }
})

router.put('/:id/decline', auth, requireLibrarian, checkId, async (req, res) => {
    try {
        const b = await Borrowing.findById(req.params.id)
        if (!b) return res.status(404).json({ error: 'Request not found.' })
        if (b.status !== 'pending') return res.status(400).json({ error: 'This request was already handled.' })

        b.status = 'declined'
        b.decided_by = req.user.id
        b.decided_date = new Date()
        await b.save()

        const row = await Borrowing.findById(b._id).populate('book_id')
        res.json((await shapeAll([row]))[0])
    } catch (err) {
        serverError(res, err)
    }
})

// The borrower withdraws their own pending request
router.put('/:id/cancel', auth, checkId, async (req, res) => {
    try {
        const b = await Borrowing.findById(req.params.id)
        if (!b) return res.status(404).json({ error: 'Request not found.' })
        if (String(b.user_id) !== String(req.user.id)) return res.status(403).json({ error: 'Not your request.' })
        if (b.status !== 'pending') return res.status(400).json({ error: 'This request was already handled.' })

        b.status = 'cancelled'
        await b.save()
        res.json({ message: 'Request cancelled.' })
    } catch (err) {
        serverError(res, err)
    }
})

router.put('/:id/return', auth, checkId, async (req, res) => {
    try {
        const b = await Borrowing.findById(req.params.id)
        if (!b) return res.status(404).json({ error: 'Transaction not found.' })
        if (req.user.role !== 'librarian' && String(b.user_id) !== String(req.user.id))
            return res.status(403).json({ error: 'Not your loan.' })
        if (b.return_date) return res.status(400).json({ error: 'Already returned.' })
        if (b.status && b.status !== 'approved') return res.status(400).json({ error: 'This was never an active loan.' })

        b.return_date = today()
        b.fine_amount = daysLate(b.due_date, b.return_date) * FINE_PER_DAY
        await b.save()
        await syncStatus(b.book_id)

        const row = await Borrowing.findById(b._id).populate('book_id')
        res.json((await shapeAll([row]))[0])
    } catch (err) {
        serverError(res, err)
    }
})

router.put('/:id/pay', auth, requireLibrarian, checkId, async (req, res) => {
    try {
        const b = await Borrowing.findById(req.params.id)
        if (!b) return res.status(404).json({ error: 'Transaction not found.' })
        if (!b.return_date) return res.status(400).json({ error: 'Return the book before paying the fine.' })
        if (!(b.fine_amount > 0)) return res.status(400).json({ error: 'No fine on this record.' })
        if (b.fine_paid) return res.status(400).json({ error: 'Fine already paid.' })

        b.fine_paid = true
        await b.save()

        const row = await Borrowing.findById(b._id).populate('book_id')
        res.json((await shapeAll([row]))[0])
    } catch (err) {
        serverError(res, err)
    }
})

module.exports = router