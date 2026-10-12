const express = require('express')
const router = express.Router()
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const User = require('../models/User.cjs')
const Student = require('../models/Student.cjs')
const Librarian = require('../models/Librarian.cjs')
const auth = require('../middleware/auth.cjs')

const Professor = require('../models/Professor.cjs')

const profileModel = (role) =>
    ({ student: Student, professor: Professor, librarian: Librarian })[role]

const signToken = (user) =>
    jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '7d' })

const publicUser = (user, profile) => ({
    id: user._id,
    role: user.role,
    email: user.email,
    firstName: profile?.firstname,
    lastName: profile?.lastname,
    phone_number: profile?.phone_number,
    idNumber: profile?.id_number,
    course: profile?.course,
    yearLevel: profile?.year_level,
    department: profile?.department,
    assignedRole: profile?.assigned_role
})

router.post('/register', async (req, res) => {
    try {
        const { role, firstName, lastName, email, phone_number, password, idNumber, course, yearLevel, department } = req.body

        if (!role || !firstName || !lastName || !email || !phone_number || !password)
            return res.status(400).json({ error: 'All fields are required.' })
        if (!['student', 'professor'].includes(role))
            return res.status(400).json({ error: 'Invalid role.' })
        if (password.length < 8)
            return res.status(400).json({ error: 'Password must be at least 8 characters.' })

        const normalized = email.trim().toLowerCase()
        if (await User.findOne({ email: normalized }))
            return res.status(409).json({ error: 'Email is already registered.' })

        const password_hash = await bcrypt.hash(password, 10)
        const user = await User.create({ email: normalized, password_hash, role })

        try {
            await profileModel(role).create({
                user_id: user._id,
                firstname: firstName.trim(),
                lastname: lastName.trim(),
                phone_number: phone_number,
                email: normalized,
                id_number: idNumber,
                ...(role === 'student' && { course, year_level: yearLevel }),
                ...(role === 'professor' && { department })
            })
        } catch (err) {
            await User.findByIdAndDelete(user._id) 
            throw err
        }

        res.status(201).json({ message: 'Account created.' })
    } catch (err) {
        console.error(err)
        res.status(500).json({ error: 'Server error.' })
    }
})

router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body
        if (!email || !password)
            return res.status(400).json({ error: 'Email and password are required.' })

        const user = await User.findOne({ email: email.trim().toLowerCase() })
        const valid = user && user.is_active && (await bcrypt.compare(password, user.password_hash))
        if (!valid) return res.status(401).json({ error: 'Invalid email or password.' })

        const profile = await profileModel(user.role).findOne({ user_id: user._id })
        res.json({ token: signToken(user), user: publicUser(user, profile) })
    } catch (err) {
        console.error(err)
        res.status(500).json({ error: 'Server error.' })
    }
})

router.get('/me', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user.id)
        if (!user) return res.status(404).json({ error: 'User not found.' })
        const profile = await profileModel(user.role).findOne({ user_id: user._id })
        res.json({ user: publicUser(user, profile) })
    } catch (err) {
        console.error(err)
        res.status(500).json({ error: 'Server error.' })
    }
})

router.put('/me', auth, async (req, res) => {
    try {
        const b = req.body
        const user = await User.findById(req.user.id)
        if (!user) return res.status(404).json({ error: 'User not found.' })

        const email = (b.email ?? user.email).trim().toLowerCase()
        if (email !== user.email) {
            if (await User.findOne({ email, _id: { $ne: user._id } }))
                return res.status(409).json({ error: 'Email is already registered.' })
            user.email = email
            await user.save()
        }

        const updates = {
            firstname: (b.firstName ?? b.firstname)?.trim(),
            lastname: (b.lastName ?? b.lastname)?.trim(),
            email,
            phone_number: (b.phone_number ?? b.phone)?.trim(),
            id_number: (b.id_number ?? b.idNumber)?.trim()
        }
        if (user.role === 'student') {
            updates.course = b.course?.trim()
            updates.year_level = (b.year_level ?? b.yearLevel)?.trim()
        }
        if (user.role === 'professor') updates.department = b.department?.trim()
        if (user.role === 'librarian') updates.assigned_role = (b.assigned_role ?? b.assignedRole)?.trim()

        Object.keys(updates).forEach((k) => updates[k] === undefined && delete updates[k])

        const profile = await profileModel(user.role).findOneAndUpdate(
            { user_id: user._id },
            updates,
            { new: true }
        )
        res.json({ user: publicUser(user, profile) })
    } catch (err) {
        console.error(err)
        res.status(500).json({ error: 'Server error.' })
    }
})

module.exports = router