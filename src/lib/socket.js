import { Server } from "socket.io"
import http from "http"
import express from "express"

const app = express()
const server = http.createServer(app)

const io = new Server(server, {
    cors: {
        origin: ["http://localhost:5173"],
        credentials: true,
    },
})

const userSocketMap = {}

export const getReceiverSocketId = (userId) => {
    return userSocketMap[userId]
}

io.on("connection", (socket) => {
    console.log("✅ User connected:", socket.id)

    // accept auth or query for userId
    const userId = socket.handshake.auth?.userId || socket.handshake.query?.userId
    if (userId) userSocketMap[userId] = socket.id
    else console.log("⚠️ No userId in handshake for socket", socket.id)

    // io.emit("getOnlineUsers", Object.keys(userSocketMap))

    socket.on("disconnect", (reason) => {
        console.log("❌ User disconnected:", socket.id, reason)
        if (userId) delete userSocketMap[userId]
        // io.emit("getOnlineUsers", Object.keys(userSocketMap))
    })
})

export { io, app, server }