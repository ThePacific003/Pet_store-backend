import mongoose from "mongoose"

const chatSchema=mongoose.Schema({
    customer:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'User',
        required:true
    },
    vet:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'User',
        required:true
    },
    messages:[{
        sender:{
            type:String,
            enum:['customer','vet'],
            required:true
        },
        content:String,
        timestamp:{
            type:Date,
            default:Date.now

        }
    }]
},
{
    timestamps:true
}
);

const Chat=mongoose.model("Chat",chatSchema)
export default Chat