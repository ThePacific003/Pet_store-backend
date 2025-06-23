import jwt from "jsonwebtoken"
import User from "../Models/user.model.js"

export const protectRoute = async (req, res, next) => {
    const token = req.cookies.jwt;
    try {
        if (!token) {
            res.status(400).json({ message: "token not found!" })
        }
        const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY)


        if (!decoded) {
            res.status(400).json({ message: "Unauthorized user" })
        }
        const user = await User.findById(decoded.UserId).select("-password")
        console.log(user);


        if (!user) {
            return res.status(400).json({ message: "User not found" })
        }
        req.user = user

        next()
    } catch (error) {
        console.log("Error in checking in:", error.message);
        res.status(500).json({ message: "Internal server error" })
    }
}