import mongoose from "mongoose"

const chatSchema = mongoose.Schema(
    {
        senderId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },
        receiverId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },
        text: {
            type: String
        },
        image: {
            type: String
        }
    },
    {
        timestamps: true
    }
)


const Chat = mongoose.model("Chat", chatSchema)
export default Chat