import mongoose from "mongoose"

const adoptionSchema=mongoose.Schema({
    pet:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'Pet',
        required:true
    },
    applicant:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'User',
        required:true
    },
    status:{
        type:String,
        enum:['pending','approved','rejected'],
        default:'pending',
    },
    message:{
        type:String
    }
},
{
    timestamp:true
}
);
const Adopt=mongoose.model("Adopt",adoptionSchema)
export default Adopt