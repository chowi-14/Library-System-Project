const express = require('express')
const mongoose = require('mongoose')
const router = express.Router()
const Book = require('../models/Book.cjs')
const Borrowing = require('../models/Borrowing.cjs')
const User = require('../models/User.cjs')
const auth = require('../middleware/auth.cjs')

const requireLibrarian = (req, res, next) =>
    req.user.role === 'librarian'
        ? next()
        : res.status(403).json({ error: 'Librarians only.' })

const FIELDS = ['title', 'author', 'publisher', 'category', 'subcategory', 'published', 'description', 'image', 'copies']
const pick = (body) =>
    Object.fromEntries(FIELDS.filter((k) => body[k] !== undefined).map((k) => [k, body[k]]))

const checkId = (req, res, next) =>
    mongoose.isValidObjectId(req.params.id)
        ? next()
        : res.status(400).json({ error: 'Invalid book id.' })

router.get('/', auth, async (_req, res) => {
    try {
        res.json(await Book.find().sort({ title: 1 }))
    } catch (err) {
        console.error(err)
        res.status(500).json({ error: 'Server error.' })
    }
})

router.get('/favorites', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user.id).populate('favorites')
        res.json(user?.favorites ?? [])
    } catch (err) {
        console.error(err)
        res.status(500).json({ error: 'Server error.' })
    }
})

router.put('/favorites/:id', auth, checkId, async (req, res) => {
    try {
        if (!(await Book.exists({ _id: req.params.id })))
            return res.status(404).json({ error: 'Book not found.' })
        await User.findByIdAndUpdate(req.user.id, { $addToSet: { favorites: req.params.id } })
        res.json({ message: 'Added to favorites.' })
    } catch (err) {
        console.error(err)
        res.status(500).json({ error: 'Server error.' })
    }
})

router.delete('/favorites/:id', auth, checkId, async (req, res) => {
    try {
        await User.findByIdAndUpdate(req.user.id, { $pull: { favorites: req.params.id } })
        res.json({ message: 'Removed from favorites.' })
    } catch (err) {
        console.error(err)
        res.status(500).json({ error: 'Server error.' })
    }
})

router.post('/', auth, requireLibrarian, async (req, res) => {
    try {
        const book = await Book.create({ ...pick(req.body), added_by: req.user.id })
        res.status(201).json(book)
    } catch (err) {
        if (err.name === 'ValidationError') return res.status(400).json({ error: err.message })
        console.error(err)
        res.status(500).json({ error: 'Server error.' })
    }
})

router.put('/:id', auth, requireLibrarian, checkId, async (req, res) => {
    try {
        const book = await Book.findByIdAndUpdate(req.params.id, pick(req.body), {
            new: true,
            runValidators: true
        })
        if (!book) return res.status(404).json({ error: 'Book not found.' })
        res.json(book)
    } catch (err) {
        if (err.name === 'ValidationError') return res.status(400).json({ error: err.message })
        console.error(err)
        res.status(500).json({ error: 'Server error.' })
    }
})

router.delete('/:id', auth, requireLibrarian, checkId, async (req, res) => {
    try {
        if (await Borrowing.exists({
            book_id: req.params.id,
            return_date: null,
            status: { $nin: ['pending', 'declined', 'cancelled'] }
        }))
            return res.status(409).json({ error: "This book is currently borrowed and can't be deleted." })
        await Borrowing.deleteMany({ book_id: req.params.id, status: 'pending' })
        const book = await Book.findByIdAndDelete(req.params.id)
        if (!book) return res.status(404).json({ error: 'Book not found.' })
        await User.updateMany({ favorites: req.params.id }, { $pull: { favorites: req.params.id } })
        res.json({ message: 'Book deleted.' })
    } catch (err) {
        console.error(err)
        res.status(500).json({ error: 'Server error.' })
    }
})

module.exports = router