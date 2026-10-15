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
    phone_number: profile?.phone_number ?? 
    profile?.phone ?? '',
    idNumber: profile?.id_number,
    course: profile?.course,
    yearLevel: profile?.year_level,
    department: profile?.department,
    assignedRole: profile?.assigned_role,
    avatar: user.avatar ?? null,
    mustChangePassword: user.must_change_password ?? false,
    isHead: user.is_head ?? false
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

router.get('/setup-status', async (_req, res) => {
    try {
        const count = await User.countDocuments({ role: 'librarian' })
        res.json({ needsSetup: count === 0 })
    } catch (err) {
        console.error(err)
        res.status(500).json({ error: 'Server error.' })
    }
})

router.post('/setup', async (req, res) => {
    try {
        if (!process.env.SETUP_KEY || req.body.setupKey !== process.env.SETUP_KEY)
            return res.status(401).json({ error: 'Invalid setup key.' })

        const isFirst = (await User.countDocuments({ role: 'librarian' })) === 0

        const { firstName, lastName, email, phone_number, password, idNumber } = req.body
        if (!firstName || !lastName || !email || !password)
            return res.status(400).json({ error: 'Name, email and password are required.' })
        if (password.length < 8)
            return res.status(400).json({ error: 'Password must be at least 8 characters.' })

        const normalized = email.trim().toLowerCase()
        if (await User.findOne({ email: normalized }))
            return res.status(409).json({ error: 'Email is already registered.' })

        const user = await User.create({
            email: normalized,
            password_hash: await bcrypt.hash(password, 10),
            role: 'librarian',
            is_head: isFirst,
        })
        try {
            await Librarian.create({
                user_id: user._id,
                firstname: firstName.trim(),
                lastname: lastName.trim(),
                email: normalized,
                phone_number,
                id_number: idNumber,
                assigned_role: isFirst ? 'Head Librarian' : 'Librarian',
            })
        } catch (err) {
            await User.findByIdAndDelete(user._id)
            throw err
        }
        res.status(201).json({ message: isFirst ? 'Head librarian created.' : 'Librarian created.' })
    } catch (err) {
        console.error(err)
        res.status(500).json({ error: 'Server error.' })
    }
})

router.post('/librarians', auth, async (req, res) => {
    try {
        const caller = await User.findById(req.user.id)
        if (!caller || caller.role !== 'librarian' || !caller.is_head)
            return res.status(403).json({ error: 'Only the head librarian can add librarians.' })

        const { firstName, lastName, email, phone_number, password, idNumber } = req.body
        if (!firstName || !lastName || !email || !password)
            return res.status(400).json({ error: 'Name, email and temporary password are required.' })
        if (password.length < 8)
            return res.status(400).json({ error: 'Password must be at least 8 characters.' })

        const normalized = email.trim().toLowerCase()
        if (await User.findOne({ email: normalized }))
            return res.status(409).json({ error: 'Email is already registered.' })

        const user = await User.create({
            email: normalized,
            password_hash: await bcrypt.hash(password, 10),
            role: 'librarian',
            must_change_password: true,
        })
        try {
            await Librarian.create({
                user_id: user._id,
                firstname: firstName.trim(),
                lastname: lastName.trim(),
                email: normalized,
                phone_number,
                id_number: idNumber,
                assigned_role: 'Librarian',
            })
        } catch (err) {
            await User.findByIdAndDelete(user._id)
            throw err
        }
        res.status(201).json({ message: 'Librarian account created.' })
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
        }

        if (b.avatar !== undefined) {
            if (b.avatar !== null && !String(b.avatar).startsWith('data:image/'))
                return res.status(400).json({ error: 'Invalid image.' })
            user.avatar = b.avatar
        }
        await user.save()

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

router.put('/password', auth, async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body
        if (!currentPassword || !newPassword)
            return res.status(400).json({ error: 'Both passwords are required.' })
        if (newPassword.length < 8)
            return res.status(400).json({ error: 'Password must be at least 8 characters.' })

        const user = await User.findById(req.user.id)
        if (!user) return res.status(404).json({ error: 'User not found.' })
        if (!(await bcrypt.compare(currentPassword, user.password_hash)))
            return res.status(400).json({ error: 'Current password is incorrect.' })

        user.password_hash = await bcrypt.hash(newPassword, 10)
        user.must_change_password = false
        await user.save()
        res.json({ message: 'Password changed.' })
    } catch (err) {
        console.error(err)
        res.status(500).json({ error: 'Server error.' })
    }
})

router.post('/forgot-password', async (req, res) => {
    try {
        const { email, idNumber, newPassword } = req.body
        if (!email || !idNumber || !newPassword)
            return res.status(400).json({ error: 'Email, ID number and new password are required.' })
        if (newPassword.length < 8 || !/[A-Za-z]/.test(newPassword) || !/\d/.test(newPassword))
            return res.status(400).json({ error: 'Password must be 8+ characters with letters and numbers.' })

        const mismatch = { error: 'Email and ID number do not match any account.' }

        const user = await User.findOne({ email: email.trim().toLowerCase() })
        if (!user || !user.is_active) return res.status(400).json(mismatch)

        const profile = await profileModel(user.role).findOne({ user_id: user._id })
        const stored = String(profile?.id_number ?? '').trim().toLowerCase()
        if (!stored || stored !== String(idNumber).trim().toLowerCase())
            return res.status(400).json(mismatch)

        user.password_hash = await bcrypt.hash(newPassword, 10)
        user.must_change_password = false
        await user.save()
        res.json({ message: 'Password reset.' })
    } catch (err) {
        console.error(err)
        res.status(500).json({ error: 'Server error.' })
    }
})

module.exports = router