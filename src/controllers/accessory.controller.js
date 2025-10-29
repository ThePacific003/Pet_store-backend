import Accessory from "../Models/accessories.model.js"

export const createAccessory=async (req,res)=>{
    const userRole=req.user.role;

    if(userRole!=="admin"){
        return res.status(400).json({message:"Access denied. Only admins can add accessories"})
    }

    const {name, price, category, description, imageUrl, inStock,quantityInStock}=req.body;

    //basic validation 

    if(!name||!price||!category||!description||!inStock){
        return res.status(400).json({message:"All required fields must be provided"})
    }

    try{
        const accessory=new Accessory({
            name,
            price,
            category,
            description,
            imageUrl,
            inStock,
            quantityInStock
        })
        if(accessory.quantityInStock<=0){
          accessory.inStock=false;
        }

        const savedAccessory=await accessory.save();        
        return res.status(200).json(savedAccessory)
    }
    catch(error){
        console.log("Error creating accessory:",error.message);
        return res.status(500).json({message:"Internal server error"})
        
    }
}

export const getAllAccessories=async(req,res)=>{
    try{
        const accessories= await Accessory.find().sort({createdAt:-1});
        res.status(200).json(accessories)
    }
    catch(error){
        console.log("error fetching accessories:",error.message);
        res.status(500).json({message:"server error while retrieving accessories"})
    }
}

export const updateAccessory = async (req, res) => {
  try {
    const accessoryId = req.params.id;

    // 1. Find the accessory by ID
    const accessory = await Accessory.findById(accessoryId);
    if (!accessory) {
      return res.status(404).json({ message: "Accessory not found" });
    }

    if (!req.user || req.user.role !== "admin") {
      return res.status(403).json({ message: "Access denied: Only admins can update accessories" });
    }
    // 2. Destructure updated fields from request body
    const {
    name,
      price,
      description,
      category,
      brand,
      type,
      imageUrl,
      quantityInStock,
    } = req.body;

    // 3. Conditionally update only the provided fields
    if (name !== undefined) accessory.name = name;
    if (price !== undefined) accessory.price = price;
    if (description !== undefined) accessory.description = description;
    if (category !== undefined) accessory.category = category;
    if (brand !== undefined) accessory.brand = brand;
    if (type !== undefined) accessory.type = type;
    if (imageUrl !== undefined) accessory.imageUrl = imageUrl;
    if (quantityInStock !== undefined) {
      accessory.quantityInStock = quantityInStock;
      // Automatically update stock status
      accessory.inStock = quantityInStock > 0;
    }

    // 4. Save the updated accessory
    const updatedAccessory = await accessory.save();

    res.status(200).json(updatedAccessory);
  } catch (error) {
    console.error("Error updating accessory:", error.message);
    res.status(500).json({ message: "Server error while updating accessory" });
  }
};


export const restockAccessory = async (req, res) => {
  try {
    const accessoryId=req.params.id
    const quantityToAdd=Number(req.body.quantityToAdd)

    if(!req.user||req.user.role!=="admin"){
        return res.status(400).json({message:"Access denied : only admins can restock accessories"})
    }

    // 1. Validate input
    if (!accessoryId||!quantityToAdd || quantityToAdd <= 0) {
      return res.status(400).json({ message: "Invalid accessory Id or quantity to add" });
    }

    // 2. Find the accessory
    const accessory = await Accessory.findById(accessoryId);
    if (!accessory) {
      return res.status(404).json({ message: "Accessory not found" });
    }

    if(!isNaN(quantityToAdd)){
    // 3. Increase quantity and update stock status
    accessory.quantityInStock += quantityToAdd;
    accessory.inStock = accessory.quantityInStock > 0;
    }
    // 4. Save changes
    const updatedAccessory = await accessory.save();

    res.status(200).json(
      updatedAccessory
    );
  } catch (error) {
    console.error("Error restocking accessory:", error.message);
    res.status(500).json({ message: "Server error while restocking" });
  }
};

export const deleteAccessory = async (req, res) => {
  try {
    const accessoryId = req.params.id;

    // Check if user is admin
    if (!req.user || req.user.role !== "admin") {
      return res.status(403).json({ message: "Access denied: Only admins can delete accessories" });
    }

    // Find the accessory by ID
    const accessory = await Accessory.findById(accessoryId);
    if (!accessory) {
      return res.status(404).json({ message: "Accessory not found" });
    }

    // Delete the accessory
    await Accessory.findByIdAndDelete(accessoryId);

    res.status(200).json({ message: "Accessory deleted successfully" });
  } catch (error) {
    console.error("Error deleting accessory:", error.message);
    res.status(500).json({ message: "Server error while deleting accessory" });
  }
};
        
export const searchAccessories = async (req, res) => {
  try {
    const { search } = req.params;

    let filter = {};

    // If search query is provided, search in name and description
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } }
      ];
    }

    const accessories = await Accessory.find(filter);
    res.status(200).json(accessories);
  } catch (error) {
    console.error("Error searching accessories:", error.message);
    res.status(500).json({ message: "Server error while searching accessories" });
  }
};
        
export const getAccessoryByCategory=async(req,res)=>{
    try{
        const{category}=req.params;

        //validate category input

        const allowed=['cat','dog','fish','guinea pig','rabbit']

        if(!allowed.includes(category)){
            return res.status(400).json({message:"invalid category"})
        }

        //find accessories that match the category
        const accessories=await Accessory.find({category})
        res.status(200).json(accessories)
    }
    catch(error){
        console.error("Error fetching accessories by category:",error.message);
        res.status(500).json({message:"Server error while fetching accessories"})
    }
}

export const toggleAccessory=async(req,res)=>{
    try{
        const {id}=req.params;

        //find accessory by id
        const accessory=await Accessory.findById(id);
        if(!accessory){
            return res.status(400).json({message:"Accessory not found"})
        }

        //check if user is admin
        if(!req.user || req.user.role!=="admin"){
            return res.status(400).json({message:"Access denied:only admin can toggle"})
        }

        accessory.inStock=!accessory.inStock;

        const updatedAccessory=await accessory.save();
        res.status(200).json(updatedAccessory)
    }
    catch(error){
        console.error("Error toggling accessory availability",error.message)
        res.status(500).json({message:"Server error while toggling accessory availability"})
    }
}