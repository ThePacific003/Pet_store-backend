import express from "express";
import { login, logout, signup, updateProfile } from "../controllers/authentication.controller.js";
import { protectRoute } from "../middlewares/auth.middleware.js";

const router = express.Router()

router.post("/signup", signup)

router.post("/login", login)

router.post("/logout", logout)

router.put("/updateprofile", protectRoute, updateProfile)





export default router