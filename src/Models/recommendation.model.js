import mongoose from "mongoose"

const recommendationSchema=mongoose.Schema(
    {
        user:{
            type:mongoose.Schema.Types.ObjectId,
            ref:'User'
        },
        preferences:{
            lifestyle:String,
            space:String,
            budget:Number,
            allergies:Boolean
        },
        recommmendationBreeds:{
            type:String
        }
    },
    {
        timestamps:true
    }
);

const Recommend=mongoose.model("Recommend",recommendationSchema)
export default Recommend