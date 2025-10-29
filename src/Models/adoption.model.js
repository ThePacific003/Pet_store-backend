import mongoose from "mongoose"

const adoptionSchema=mongoose.Schema({
    pet:{
        id:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'Pet',
        required:true
    },
    breed:{
        type:String,
        required:true,
    }
},
     provider: {
      id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
      },
      name: {
        type: String,
        required: true,
      },
      email:{
        type:String,
        required:true,
      }
    },
    adopter: {
      id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
      },
      name: {
        type: String,
        required: true,
      },
      email:{
        type:String,
        required:true,
      }
    },
    adoptionStatus:{
        type:String,
        enum:['pending','approved','rejected','delivered'],
        default:'pending',
    },
    message:{
        type:String,
        default:"",
    },
    createdAt:{
        type:Date,
        default:Date.now,
    }
},
{
    timestamps:true
}
);
adoptionSchema.index(
  { "pet.id": 1, "adopter.id": 1 },
  { unique: true }
);
const Adoption=mongoose.model("Adoption",adoptionSchema)
export default Adoption



    