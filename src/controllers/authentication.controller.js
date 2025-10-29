import bcrypt from "bcryptjs"
import User from "../Models/user.model.js"
import { generateToken } from "../utils/generatetoken.js"
import cloudinary from "../lib/cloudinary.js"

export const signup = async (req, res) => {
    const { fullname, email, password ,role} = req.body
    try {
        if (!fullname || !email || !password) return res.status(400).json({ message: "All fields are required" })
        if (password < 8) {
            return res.status(400).json({ message: "Password must be atleast 8 characters" })
        }
        // check user is already register
        const user = await User.findOne({ email })
        if (user) {
            return res.status(400).json({ message: "User already Exists" })
        }
        // password hashisng:
        const salt = await bcrypt.genSalt(13);
        const hashedPass = await bcrypt.hash(password, salt)
        const newUser = new User({
            fullname,
            email,
            password: hashedPass,
            role:role||'customer'
        })
        if (newUser) {
            generateToken(newUser._id, res);
            await newUser.save();

            res.status(201).json({
                _id: newUser._id,
                fullname: newUser.fullname,
                email: newUser.email,
                password: newUser.password,
                profilePic: newUser.profilePic,
                role: newUser.role

            })

        }
        else {
            return res.status(400).json({ message: "Invalid credentials!!" })
        }

    }
    catch (error) {
        console.log("signup error:", error.message);
        res.status(500).json({ message: "Internal Server Error!" })
    }
}

export const login = async (req, res) => {
    const { email, password  } = req.body
    try {
        if (!email || !password) return res.status(400).json({ message: "All field are required" })
        const user = await User.findOne({ email })
        if (!user)
            return res.status(400).json({ message: "user does not exist, Create an account first" })
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