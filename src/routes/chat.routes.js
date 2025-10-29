import express from "express"
import { protectRoute } from "../middlewares/auth.middleware.js"
import { deleteMessage, getMessages, getUsersForSiderbar, sendMessage } from "../controllers/chat.controller.js"

const router=express.Router();

router.get("/users", protectRoute, getUsersForSiderbar)

router.get("/:id",protectRoute,getMessages);

router.post("/send/:id",protectRoute,sendMessage);

router.delete("/delete/:id",protectRoute,deleteMessage)

export default router
