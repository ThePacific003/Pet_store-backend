import jwt from "jsonwebtoken"
export const generateToken = (UserId, res) => {
    let token
    try {
        token = jwt.sign({ UserId }, process.env.JWT_SECRET_KEY, {
            expiresIn: "4d",
        });
        res.cookie("jwt", token, {
            maxAge: 4 * 24 * 60 * 60 * 1000,
            httpOnly: true,
            sameSite: 'strict',
            secure: process.env.NODE_ENV !== 'development'
        })
    } catch (error) {
        console.log("Error generating token", error.message);
        res.status(500).json({ message: "Internal server error" })

    }
    return token
} 