import mongoose from "mongoose"

const userSchema = mongoose.Schema(
    {
        role: {
            type: String,
            enum: ['customer', 'admin', 'vet', 'petProvider'],
            default: 'customer'
        },

        fullname: {
            type: String,
            required: true
        },
        email: {
            type: String,
            required: true,
            unique: true
        },
        password: {
            type: String,
            required: true,
            minLength: 8
        },
        profilePicture: {
            type: String,
            default: ""
        },
        // isVerfiedVet:{
        //     type:Boolean,
        //     default:false
        // },
        otp:{
            type: String
        },
        isVerified:{
            type:Boolean,
        },
  otpExpires: {
   type: Date
}
    },
    {
        timestamps: true
    }
)

const User = mongoose.model("User", userSchema)
export default User
