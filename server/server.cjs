const express = require('express')
const cors = require('cors')
const mongoose = require('mongoose')

require('dotenv').config()

const app = express()

app.use(cors())
app.use(express.json({ limit: '5mb' })) 
app.use('/api/auth', require('./routes/auth.cjs'))
app.use('/api/books', require('./routes/bookRoutes.cjs'))
app.use('/api/borrowings', require('./routes/borrowingRoutes.cjs'))

app.use((err, _req, res, _next) => {
    console.error(err)
    if (err.type === 'entity.too.large')
        return res.status(413).json({ error: 'Image is too large.' })
    res.status(err.status || 500).json({ error: err.message || 'Server error.' })
})


mongoose.connect(process.env.MONGODB_URI)
    .then(() => console.log('Connected to MongoDB Atlas'))
    .catch((error) => console.error('MongoDB connection error: ', error))

app.get("/", (req, res) => {
    res.send("API is running")
})

app.listen(5000, () => {
    console.log(`Server running on port 5000`)
})