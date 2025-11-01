import express from "express";
import { downgradeProvider, login, logout, signup, updateProfile, upgradeToPetProvider, verifyOtp } from "../controllers/authentication.controller.js";
import { protectRoute } from "../middlewares/auth.middleware.js";

const router = express.Router()

router.post("/signup", signup)

router.post("/login", login)

router.post("/logout", logout)

router.put("/updateprofile", protectRoute, updateProfile)

router.post("/upgradeprovider",protectRoute,upgradeToPetProvider);

router.post("/downgrade",protectRoute,downgradeProvider);

router.post("/verify-otp",verifyOtp);





export default router