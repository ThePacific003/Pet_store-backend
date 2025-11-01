import bcrypt from "bcryptjs"
import User from "../Models/user.model.js"
import { generateToken } from "../utils/generatetoken.js"
import cloudinary from "../lib/cloudinary.js"
import crypto from "crypto";
import nodemailer from "nodemailer";
import dotenv from "dotenv";
import dns from "dns"

dotenv.config();

const validateEmailDomain = (email) => {
  return new Promise((resolve) => {
    const domain = email.split("@")[1];
    dns.resolveMx(domain, (err, addresses) => {
      if (err || !addresses || addresses.length === 0) {
        resolve(false);
      } else {
        resolve(true);
      }
    });
  });
};

// Create nodemailer transporter
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

export const signup = async (req, res) => {
    const { fullname, email, password ,role} = req.body
    try {
        if (!fullname || !email || !password) return res.status(400).json({ message: "All fields are required" })
        if (password < 8) {
            return res.status(400).json({ message: "Password must be atleast 8 characters" })
        }

       

        const domainValid = await validateEmailDomain(email);
    if (!domainValid)
      return res.status(400).json({ message: "Invalid or non-existent email domain" });
        // check user is already register
        const user = await User.findOne({ email })
        if (user) {
            return res.status(400).json({ message: "User already Exists" })
        }
        // password hashisng:
        const salt = await bcrypt.genSalt(13);
        const hashedPass = await bcrypt.hash(password, salt)

        // Generate OTP and expiry
    const otp = crypto.randomInt(100000, 999999).toString();
    const otpExpires = Date.now() + 5 * 60 * 1000; // expires in 5 minutes
    

        const newUser = new User({
            fullname,
            email,
            password: hashedPass,
            role:role||'customer',
            isVerified: false,
            otp,
            otpExpires,
        })
        // if (newUser) {
        //     generateToken(newUser._id, res);
        //     await newUser.save();

        //     res.status(201).json({
        //         _id: newUser._id,
        //         fullname: newUser.fullname,
        //         email: newUser.email,
        //         password: newUser.password,
        //         profilePic: newUser.profilePic,
        //         role: newUser.role

        //     })

        // }
        // else {
        //     return res.status(400).json({ message: "Invalid credentials!!" })
        // }

        await newUser.save();

    // Send OTP email
    try {
     const info=  await transporter.sendMail({
        from: process.env.EMAIL_USER,
        to: email,
        subject: "Verify your account - OTP Code",
        text: `Your OTP code is ${otp}. It will expire in 5 minutes.`,
      });
      console.log(info);
      
       if (info.rejected.length > 0) {
      await User.deleteOne({ email });
      return res.status(400).json({
        message: "Email could not be delivered. Please provide a valid email.",
      });
    }

    //   console.log("Email sent:", info.response);

      return res.status(201).json({
        message: "OTP sent to your email. Please verify to continue.",
      });
    } catch (mailError) {
      // Delete the user if email cannot be delivered
      await User.deleteOne({ email });
      console.error("Email sending failed:", mailError.message);

      return res.status(400).json({
        message: "Invalid email address. Please provide a valid email.",
      });
    }
  } catch (error) {
    console.error("Signup error:", error.message);
    res.status(500).json({ message: "Internal Server Error!" });
  }
};

export const verifyOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;

    const user = await User.findOne({email});
    if (!user) return res.status(404).json({ message: "User not found" });

    if (user.isVerified)
      return res.status(400).json({ message: "User already verified" });

    if (user.otp !==String (otp))
      return res.status(400).json({ message: "Invalid OTP" });

    if (user.otpExpires < Date.now())
      return res.status(400).json({ message: "OTP expired" });

    // Mark verified
    user.isVerified = true;
    user.otp = undefined;
    user.otpExpires = undefined;
    await user.save();

    // Now generate token after successful verification
    generateToken(user._id, res);

    res.status(200).json({
      _id: user._id,
      fullname: user.fullname,
      email: user.email,
      role: user.role,
      message: "Email verified successfully!",
    });
  } catch (error) {
    console.error("OTP verification error:", error.message);
    res.status(500).json({ message: "Internal Server Error!" });
  }
};


export const login = async (req, res) => {
    const { email, password  } = req.body
   
    
    
    try {
        if (!email || !password) return res.status(400).json({ message: "All field are required" })
        const user = await User.findOne({ email })
        if (!user)
            return res.status(400).json({ message: "user does not exist, Create an account first" })
        if(user.isVerified===false){
            return res.status(400).json({message:"User is not verified"})
        }
        if (email !== user.email) {
            return res.status(400).json({ message: "Invalid credentials" })
        }

        const isValid = await bcrypt.compare(password, user.password)
        if (!isValid) return res.status(400).json({ message: "Invalid credentials" })
        generateToken(user._id, res)
        res.status(200).json({
            _id: user._id,
            email: user.email,
            role:user.role,
            fullname:user.fullname
        })

    } catch (error) {
        console.log("Error loggingin:", error.message);
        return res.status(500).json({ message: "Server error, please try again" });

    }
}

export const updateProfile = async (req, res) => {
    const { profilePic } = req.body
    try {
        if (!profilePic) {
            return res.status(400).json({ message: "Profile picture required!" })
        }
        const upload = await cloudinary.uploader.upload(profilePic);
        res.status(200).json({ message: "something......", upload })
    } catch (error) {
        console.log("Profile pic update error:", error.message);
        res.status(500).json({ message: "Internal Server Error!!" })
    }
}

export const logout = async (req, res) => {

    try {
        res.cookie("jwt", "", { maxAge: 0 })
        res.status(200).json({ message: "loggedout successfully" })

    } catch (error) {
        res.status(500).json({ message: "Internal error successfully" })
        consolelog("error:logging out", error.message)

    }
}


export const upgradeToPetProvider = async (req, res) => {
    try {
        const userId = req.user._id; // Assuming auth middleware
        const user = await User.findById(userId);

        if (!user) return res.status(404).json({ message: "User not found" });

        user.role = "petProvider";
        console.log(user);
        await user.save();

         res.status(200).json({
      _id: user._id,
      fullname: user.fullname,
      email: user.email,
      role: user.role,
      profilePic: user.profilePic
    });
    } catch (error) {
        res.status(500).json({ message: "Server error", error });
    }
};

export const downgradeProvider = async (req, res) => {
  try {
    // check if user is logged in
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    // only providers can downgrade
    if (req.user.role !== "petProvider") {
      return res.status(403).json({ message: "Only providers can downgrade to customer" });
    }

    // update role
    const updatedUser = await User.findByIdAndUpdate(
      req.user._id,
      { role: "customer" },
      { new: true }
    ).select("-password");

   res.status(200).json({
      _id: updatedUser._id,
      fullname: updatedUser.fullname,
      email: updatedUser.email,
      role: updatedUser.role,
      profilePic: updatedUser.profilePic
    });
  } catch (error) {
    console.error("Downgrade failed:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};