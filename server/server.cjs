const express = require('express')
const cors = require('cors')
const mongoose = require('mongoose')

require('dotenv').config()

const app = express()

app.use(cors())
app.use(express.json())

mongoose.connect(process.env.MONGODB_URI)
    .then(() => console.log('Connected to MongoDB Atlas'))
    .catch((error) => console.error('MongoDB connection error: ', error))

app.get("/", (req, res) => {
    res.send("API is running")
})

app.listen(5000, () => {
    console.log(`Server running on port 5000`)
})