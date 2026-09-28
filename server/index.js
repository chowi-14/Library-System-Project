import express from "express"
import mongoose from "mongoose"
import cors from "cors"
import "dotenv/config"

const app = express()
app.use(cors())
app.use(express.json())

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

app.listen(process.env.PORT, () => console.log("Server Running"))