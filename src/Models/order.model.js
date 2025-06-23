import mongoose from "mongoose"

const orderSchema=mongoose.Schema(
    {
        user:{
            type:mongoose.Schema.Types.ObjectId,
            ref:'User',
            required:true
        },
        items:[
            {
                productId:mongoose.Schema.Types.ObjectId,
                productType:{
                    type:String,
                    enum:['pet','accessory'],
                    required:true
                },
                quantity:{
                    type:Number,
                    default:1
                }
            }
        ],
        totalAmount:{
            type:Number
        },
        paymentMethod:{
            type:String,
            enum:['esewa','khalti','CashOnDelivery']
        },
        status:{
            type:String,
            enum:['pending','confirmed','shipped','delivered'],
            default:'pending'
        }
       
    },
    {
        timestamps:true
    }
);
const Order=mongoose.model("Order", orderSchema)
export default Order