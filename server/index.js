import express from "express"
import mongoose from "mongoose"
import cors from "cors"
import "dotenv/config"
import authRoutes from "./routes/auth.cjs"
import bookRoutes from "./routes/bookRoutes.cjs"
import borrowingRoutes from "./routes/borrowingRoutes.cjs"

const app = express()
app.use(cors({
    origin: /^http:\/\/localhost:\d+$/,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}))
app.use(express.json({ limit: '5mb' }))
app.use("/api/auth", authRoutes)
app.use("/api/books", bookRoutes)
app.use("/api/borrowings", borrowingRoutes)

app.use((err, _req, res, _next) => {
    console.error(err)
    if (err.type === 'entity.too.large')
        return res.status(413).json({ error: 'Image is too large.' })
    res.status(err.status || 500).json({ error: err.message || 'Server error.' })
})


mongoose.connect(process.env.MONGODB_URI)
    .then(() => console.log("MongoDB connected"))
    .catch((err) => console.error(err))

const Item = mongoose.model("Item", new mongoose.Schema({ name: String}))

app.get("/api/items", async (req, res) => {
    res.json(await Item.find())
})

app.post("/api/items", async(req, res) => {
    res.status(201).json(await Item.create(req.body))
})

app.listen(process.env.PORT, () => console.log(`Server Running on port ${process.env.PORT}`))