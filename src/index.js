import express from 'express'
import dotenv from "dotenv"
import { connectDb } from './db/dbConnect.js';
import authRoutes from './routes/auth.routes.js'
import cookieparser from 'cookie-parser'
import Pet from './Models/pet.model.js';
import petRoutes from "./routes/pet.routes.js"
import accessoryRoutes from "./routes/accessory.routes.js"
import orderRoutes from "./routes/order.routes.js"
import adoptionRoutes from "./routes/adoption.routes.js"
import breedProfileRoutes from "./routes/breedProfile.routes.js"
import productRoutes from "./routes/product.routes.js"
import paymentRoutes from "./routes/payment.routes.js"
import chatRoutes from "./routes/chat.routes.js"
import cors from "cors"
import { app, server } from './lib/socket.js';
dotenv.config()

const port = process.env.PORT


// const app = express();
app.use(express.json());
app.use(cookieparser());

app.use(
    cors({
        origin:[/^http:\/\/localhost:\d+$/],
        credentials: true
    })

)


app.use("/api/accessory/",accessoryRoutes)
app.use("/api/pet/",petRoutes)
app.use("/api/auth/", authRoutes)
app.use("/api/order/",orderRoutes)
app.use("/api/adoption/",adoptionRoutes)
app.use("/api/breedprofile",breedProfileRoutes)
app.use("/api/products/",productRoutes)
app.use("/api/payment/",paymentRoutes)
app.use("/api/message",chatRoutes)

server.listen(port, (req, res) => {
    console.log(`Server listening on port ${port}`);
    connectDb()
})