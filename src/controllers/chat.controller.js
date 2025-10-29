import cloudinary from "../lib/cloudinary.js";
import Chat from "../Models/chat.model.js";
import User from "../Models/user.model.js";
import { getReceiverSocketId, io } from "../lib/socket.js"

export const getUsersForSiderbar = async (req, res) => {
    try {
        if (!req.user) return res.status(401).json({ message: "Unauthorized" });
        const loggerInUserId = req.user._id
        const filteredUsers = await User.find({ _id: { $ne: loggerInUserId } }).select("name email role fullname")

        res.status(200).json(filteredUsers)
    } catch (error) {
        console.log("Error getting Users: ", error.message);
        res.status(500).json({ message: "Internal server error" })

    }
}

export const getMessages = async (req, res) => {
  try {
    const { id: userToChatId } = req.params;
    const currentUserId = req.user._id;

    const messages = await Chat.find({
      $or: [
        { senderId: currentUserId, receiverId: userToChatId },
        { senderId: userToChatId, receiverId: currentUserId },
      ],
    }).sort({ createdAt: 1 });

    res.status(200).json(messages); // ✅ must be an array
  } catch (error) {
    res.status(500).json({ message: "Error fetching messages" });
    console.log(error);
    
  }
};

export const sendMessage = async (req, res) => {
 
    try {
        const { text, image } = req.body
        const {id: receiverId} = req.params
        const senderId = req.user._id

        let imageUrl

        if(image){       
            const uploadResponse = await cloudinary.uploader.upload(image)
            imageUrl = uploadResponse.secure_url
        }

        const newMessage =  new Chat(
            {
                senderId,
                receiverId,
                text,
                image: imageUrl
            }
        )

        await newMessage.save()

        const receiverSocketId = getReceiverSocketId(receiverId)
        if(receiverSocketId) {
            io.to(receiverSocketId).emit("newMessage",newMessage)
        }

        res.status(201).json(newMessage)

    } catch (error) {
        console.log("Error sending messages: ", error.message);
        res.status(500).json({ message: error.message })
    }
}

export const deleteMessage = async(req,res)=>{

    try{
        const userId = req.user._id
        const {id:userToDeleteId} = req.params

        const deletedMessage = await Chat.deleteMany(
            {
                $or: [
                    { senderId: userId, receiverId:userToDeleteId},
                    { senderId: userToDeleteId, receiverId:userId}
                ]
            }
        )
        const count = deletedMessage.deletedCount ?? result.n ?? 0;
        res.status(200).json(
            {
                message:`${count} messages deleted succesfully`
            }
        )

    }
    catch(err){
        console.log("Error deleting messages: ", err.message )
        res.status(500).json({message:"Internal Server Error"})
    }
} 