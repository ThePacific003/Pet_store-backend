import mongoose, { trusted } from "mongoose"

const petSchema = mongoose.Schema(
    {
        breed: {
            type: String,
            required: true
        },
        age: {
            type: Number,
            required: true
        },
        gender: {
            type: String,
            enum: ['male', 'female'],
            required: true
        },
        price: {
            type: Number
        },
        description: {
            type: String,
            required: true,
        },
        imageUrl: {
            type: String,
            default: ""
        },
        availability: {
            type: Boolean,
            required: true
        },
        category: {
            type: String,
            enum: ['cat', 'dog', 'fish', 'guinea pig', 'rabbit'],
            required: true
        },
        listed_by: {
            id: {
                type: mongoose.Schema.Types.ObjectId,
                ref: "User",
                required: true
            },
            role: {
                type: String,
                enum: ["admin", "petProvider"],
                required: true
            }
        }
        ,
        listingType: {
            type: String,
            enum: ['adoption', 'sale'],
            required: true
        },
    },
    {
        timestamps: true
    }
)
const Pet = mongoose.model("Pet", petSchema)
export default Pet

