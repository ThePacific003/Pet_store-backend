import express from 'express'
import dotenv from "dotenv"
import { connectDb } from './db/dbConnect.js';
import authRoutes from './routes/auth.routes.js'
import cookieparser from 'cookie-parser'
import Pet from './Models/pet.model.js';
import petRoutes from "./routes/pet.routes.js"


dotenv.config()

const port = process.env.PORT


const app = express();
app.use(express.json())
app.use(cookieparser())

app.use("/api/pet/",petRoutes)
app.use("/api/auth/", authRoutes)


app.listen(port, (req, res) => {
    console.log(`Server listening on port ${port}`);
    connectDb()
})