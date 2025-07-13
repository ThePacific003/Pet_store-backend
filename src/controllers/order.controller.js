import Pet from '../Models/pet.model.js'
import Accessory from '../Models/accessories.model.js'
import Order from '../Models/order.model.js'
import User from '../Models/user.model.js';

export const createOrder=async (req,res)=>{
    const {orderItems,shippingAddress,paymentMethod}=req.body

    try{
    if(!orderItems|| orderItems.length===0){
        return res.status(400).json({message:"No order items provided"})
    }

    let totalAmount=0
    const validatedItems=[]

    for(const a of orderItems){
        const{itemType, item,quantity}=a;

        if(itemType==="Pet"){
            const pet=await Pet.findById(item);

            if(!pet || pet.availability===false|| pet.quantityInStock<quantity){
                return res.status(400).json({message:`Pet wiht id ${item} is not available or out of stock`})
            }

            //deduct stock
            // pet.quantityInStock-=quantity
            if(pet.quantityInStock<0){
                pet.availability=false
            }
            await pet.save()

            validatedItems.push({
                itemType,
                item:pet._id,
                quantity,
                price:pet.price,
            })

        }
        else if(itemType==="Accessory"){
            const accessory=await Accessory.findById(item);

            if(!accessory || !accessory.inStock || accessory.quantityInStock<quantity){
                return res.status(400).json({message:`Accessory with Id {item} is not available or out of stock`})
            }

            //deduct stock
            // accessory.quantityInStock-=quantity
            if(accessory.quantityInStock<0){
                accessory.inStock=false;
            }

            await accessory.save();

            validatedItems.push({
                itemType,
                item:accessory._id,
                quantity,
                price:accessory.price,
            })
        }
        else{
            return res.status(400).json({message:`Invalid itemType:${itemType}`})
        }

    }
    for (const b of validatedItems){
        totalAmount=totalAmount+b.quantity*b.price;
    }


    //create order
    const order=new Order({
        customer:req.user.id,  //from auth middleware
        orderItems:validatedItems,
        shippingAddress,
        paymentMethod,
        orderStatus:'processing',
        totalAmount,
    })

    const createdOrder=await order.save();
    res .status (200).json(createdOrder)
}
catch(error){
    console.error("error creating order",error.message);
    res.status(500).json({message:"Server error"})
}
};

export const getAllOrder=async(req,res)=>{
    try{
        if(!req.user || req.user.role!=="admin"){
            return res.status(400).json({message:"Access denied! Admins only allowed"})
        }
        const {orderStatus, startDate, endDate}=req.body;

        let filter={}
        // Validate against allowed statuses
const allowedStatuses = ["Processing", "Shipped", "Delivered", "Cancelled"];
if (orderStatus) {
  if (!allowedStatuses.includes(orderStatus)) {
    return res.status(400).json({ message: `Invalid order status: ${orderStatus}` });
  }
  filter.orderStatus = orderStatus;
}

        //filter by date range
        if (startDate || endDate){
            filter.createdAt={}

            if(startDate){
                filter.createdAt.$gte=new Date(startDate)
            }
            if(endDate){
                filter.createdAt.$lte=new Date(endDate)
            }
        }
        console.log(filter);
        

        //fetch orders from database
        const orders=await Order.find(filter). //include customer information
        populate("customer","name email"). //include pet/acccessory details
        populate("orderItems.item").   //sort by newest first
        sort({createdAt:-1})

        res.status(200).json(orders);
    }
    catch(error){
        console.error("Error fetching orders:",error.message);
        res.status(500).json({message:"Server error while fetching orders"})
    }
};

export const getMyOrder=async(req,res)=>{
    try{
       const customerId=req.user.id;

        //find orders placed by logged in customers
        const orders= await Order.find({customer:customerId})
        .sort({createdAt:-1})
        .populate("customer","fullname email")
        .populate("orderItems.item")

        if(!orders || orders.length ===0){
            return res.status(404).json({message:"No orders found for this customer"})
        }

        res.status(200).json(orders);
    }
    catch(error){
        console.error("Error fetching customer's order",error.message);
        res.status(500).json({message:"Server error while fetching your orders"})
    }
};

export const getOrderByCustomerQuery=async(req,res)=>{
    try{
        const {search}=req.query;

        //check admin access
        if(!req.user || req.user.role!=="admin"){
            return res.status(400).json({message:"Access denied. Admins only"})
        }

        if(!search){
            return res.status(400).json({message:"Please provide customer name or email to search"})
        }

        //find users by name or email matching the search
        const users=await User.find({
            $or:[
                {fullname:{$regex:search,$options:"i"}},
                {email:{$regex:search,$options:"i"}}
            ],
        });

        if(users.length===0){
            return res.status(400).json({message:"No customer found matching your search"})
        }

        const userIds=users.map((user)=>user._id);

        //Find orders by those user ids
        const orders=await Order.find({customer :{$in:userIds}})
        .populate("orderItems.item")
        .populate("customer","name email")

        if(orders.length===0){
            return res.status(400).json({message:"No orders found for this customer"});
        }

        res.status(200).json(orders)

    }
    catch(error){
        console.error("Error fetching orders by customer:",error.message);
        res.status(500).json({message:"Server error while fetching orders"})
    }
}

export const updateOrderStatus=async(req,res)=>{
    try{
        const{id}=req.params;   //Order Id from URL
        const {orderStatus}=req.body  //New status from request body

        //check if requester is admin
        if(!req.user || req.user.role!=="admin"){
            return res.status(400).json({message:"Access denied: Admins only"})
        }

        //Validate new order status
        const validStatuses=["processing","pending","verified","shipped","delivered","cancelled"];

        if(!validStatuses.includes(orderStatus.toLowerCase())){
            res.status(400).json({message:"Invalid order status value"})
        }

        //find the order
        const order=await Order.findById(id).populate("orderItems.item")

                

        if(!order){
            return res.status(400).json({message:"Order not found"})
        }

        //stock availability check before updating to "verified"
        if(orderStatus.toLowerCase()==="verified"){
            for(const b of order.orderItems){
                const {itemType, item, quantity}=b;                            

                if(itemType==="Pet" ){

                    const pet=await Pet.findById(item._id);

                    

                    if(!pet || pet.quantityInStock<quantity){
                        return res.status(400).json({message:"Insufficient stock for pet"})
                    }
                }

                 if(itemType==="Accessory"){
                    const accessory=await Accessory.findById(item._id);

                    if(!accessory || accessory.quantityInStock<quantity){
                        return res.status(400).json({message:"Insufficient stock for accessory"})
                    }
                }
            }
            await deductStockForOrder(order)
        }
        
        order.orderStatus=orderStatus.toLowerCase()
        //Save changes
        await order.save()

        res.status(200).json(order);
    }
    
    catch(error){
        console.error("Error updating status:",error.message);
        res.status(500).json({message:"Server error while updating orders"})
    }
}

export const cancelMyOrder=async(req,res)=>{
    try{
        const {orderId}=req.params
        
        //find order by id
        const order=await Order.findById(orderId);

        //check if order exists
        if(!order){
           return res.status(400).json({message:"Order not found"})
        }

        //check if logged in user is one who placed the order
        if(!req.user || order.customer.toString()!==req.user._id.toString()){
            return res.status(400).json({message:"Unauthorized: You can only cancel your own orders"})
        }

        //allow cancellation only if order status is processing
        if(order.orderStatus!=="Processing"){
            return res.status(400).json({message:"Order cannot be cancelled as it is already verified and processed for further steps"})
        }

        //update status to cancelled

        order.orderStatus="cancelled";
        await order.save();

        res.status(200).json(order)
    }
    catch(error){
        console.error("Error cancelling order",error.message);
        res.status(500).json({message:"Server error while cancelling order"})
    }
}

export const deleteOrder=async(req,res)=>{
    try{
        const {id}=req.params

        if(!req.user || req.user.role!=="admin"){
            return res.satus(400).json({message:"Access denied. Admins only"})
        }

        //find the order
        const order=await Order.findById(id);

        if(!order){
            return res.status(400).json({message:"Order not found"})
        }

        //Allow deletion only if order is in final stage
        if(order.orderStatus!=="cancelled" && order.orderStatus !=="delivered"){
            return res.status(400).json({message:"Only orders that are cancelled or delivered can be deleted"})
        }

        //Delete the order
        await Order.findByIdAndDelete(id);

        res.status(200).json({message:"Order deleted successfully"})
    }
    catch(error){
        console.error("Error deleting orders:",error.message);
        res.status(500).json({message:"Server error while deleting order"})
    }
}

export const updateStockAfterOrder=async(req,res)=>{
    try{
        const{orderId}=req.params
        
        //find the order
        const order=await Order.findById(orderId).populate("orderItems.item");

        if(!order){
            return res.status(400).json({message:"Order not found"})
        }

        //loop through order items
        for(const orderItem of order.orderItems){
            const {itemType, item, quantity}=orderItem

            if(itemType==="Pet"){
                const pet=await Pet.findById(item._id);
                if(pet){
                    pet.quantityInStock=Math.max(pet.quantityInStock-quantity,0)
                    pet.inStock=pet.quantityInStock>0;
                    await pet.save()
                }
            }
            if(itemType==="Accessory"){
                const accessory=await Accessory.findById(item._id);
                if(accessory){
                    accessory.accessoriesInStock=Math.max(accessory.accessoriesInStock-quantity,0)
                    accessory.inStock=accessory.accessoriesInStock>0
                    await accessory.save()
                }
            }
            res.status(200).json({message:"Stock levels updated successfully"})
        }
    }catch(error){
        console.error("Error updating stock:",error.message)
        res.status(500).json({message:"Server error while updating stock"})
    }
}

const deductStockForOrder=async(order)=>{
    for(const c of order.orderItems){
        const {itemType,item,quantity}=c;

        if(itemType==="Pet"){
            const pet=await Pet.findById(item._id);
            if(pet && pet.quantityInStock>=quantity){
                
                pet.quantityInStock=Math.max(pet.quantityInStock-quantity,0)
                pet.inStock=pet.quantityInStock>0
                await pet.save()
            }
        }
        if(itemType==="Accessory"){
            const accessory=await Accessory.findById(item._id)
            if(accessory && accessory.quantityInStock>quantity){
                accessory.quantityInStock=Math.max(accessory.quantityInStock-quantity,0)
                accessory.inStock=accessory.quantityInStock>0
                await accessory.save()
            }
        }
    }
}

export const generateOrderInvoice = async (req, res) => {
  try {
    const { id } = req.params; // order ID

    // Only admins can generate invoice
    if (!req.user || req.user.role !== "admin") {
      return res.status(403).json({ message: "Access denied: Admins only" });
    }
    // Populate order with items and customer info
    const order = await Order.findById(id)
      .populate("customer", "fullname email")
      .populate("orderItems.item");
    
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    
    // Create invoice object
    const invoice = {
      invoiceNumber: `INV-${order._id}`,
      date: order.createdAt,
      customer: {
        name: order.customer.fullname,
        email: order.customer.email,
      },
      orderStatus: order.orderStatus,
      items: order.orderItems.map((item) => ({
        name: item.item.name || item.item.breed || "Unnamed Item",
        type: item.itemType,
        quantity: item.quantity,
        price: item.item.price,
        total: item.item.price * item.quantity,
      })),
      totalAmount: order.totalAmount,
    };

    res.status(200).json(invoice);
}
catch(error)
{
console.error("Error generating invoice:", error.message);
  res.status(500).json({ message: "Server error while generating invoice" });
}
}


