import crypto from "crypto";
import nodemailer from "nodemailer"
import OTP from "../Models/otp.model"
import User from "../Models/user.model"

export const sendOtp=async(req,res)=>{
    const {email}=req.body;

    const existingUser=await User.findOne({ email });
    if (existingUser) return res.status(400).json({ message: "User already exists" });

     const otpCode = crypto.randomInt(100000, 999999).toString();

     await OTP.create({ email, otp: otpCode });

     // Send OTP via email
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });


}