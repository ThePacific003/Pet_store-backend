

import mongoose  from "mongoose";

const orderItemSchema=mongoose.Schema({
    itemType:{
        type:String,
        enum:["Pet","Accessory"],
        required:true,
    },
    item:{
        type:mongoose.Schema.Types.ObjectId,
        required:true,
        refPath:"orderItems.itemType",
    },
    quantity:{
        type:Number,
        default:1,
        min:1,
    },
    price: {
        type:Number,
        required:true,
    }
},
{
    _id:false
}
);

const orderSchema=mongoose.Schema(
    {
        customer:{
            type:mongoose.Schema.ObjectId,
            ref:"User",
            required:true,
        },
        orderItems:[orderItemSchema],
        
        totalAmount:{
            type:Number,
            required:true,
        },

        shippingAddress:{
            country:{
                type:String,
                required:true,
            },
            city:{
                type:String,
                required:true,
            },
            postalCode:{
                type:String,
                required:true,
            }
        },
        paymentMethod:{
            type:String,
            enum:['esewa','khalti','CashOnDelivery'],
            default:'CashOnDelivery'
        },
        paymentStatus:{
            type:String,
            enum:["Pending","Paid","Failed"],
            default:"Pending"
        },
        orderStatus:{
            type:String,
            enum:["processing","verified","shipped","delivered","cancelled"],
            default:"processing",
        },

        esewa:{
            transaction_uuid:String,
            status:{
                type:String,
                enum:["initiated","complete","failed"],
                default:"initiated",
            },
            ref_id:String,
        },
        cancelledAt: {
      type: Date,
      default: null,
    //   index: { expireAfterSeconds: 60 }, // 10min
    },

    },
    {
        timestamps:true,
    }
);
orderSchema.index({ cancelledAt: 1 }, { expireAfterSeconds: 60 });

const Order=mongoose.model("Order",orderSchema)
export default Order