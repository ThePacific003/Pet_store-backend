import mongoose  from "mongoose";
const accessorySchema= mongoose.Schema(
    {
        name:{
            type:String,
            required:true
        },
        price:{
            type:Number,
            required:true
        },
        category:{
            type:String,
            enum:['cat','dog','fish','guinea pig','rabbit'],
            required:true
        },
        description:{
            type:String,
            required:true,
        },
        imageUrl:{
            type:String,
            default:""
        },
        inStock:{
            type:Boolean,
            required:true
        }
    },
    {
        timestamps:true
    }
)
const Accessory=mongoose.model("Accessory",accessorySchema)
export default Accessory
