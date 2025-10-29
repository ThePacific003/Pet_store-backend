import Adoption from "../Models/adoption.model.js";
import Pet from "../Models/pet.model.js";
import User from "../Models/user.model.js";

export const applyForAdoption=async(req,res)=>{
    try{    
         const { petId, message } = req.body;
        

                console.log(petId);
                
             
        // Ensure only customers can apply
    if (!req.user || req.user.role !== "customer") {
      return res.status(403).json({ message: "Only customers can apply for adoption" });
    }

    //check if pet exists
         const pet = await Pet.findById(petId);
         
    if (!pet) {
      return res.status(404).json({ message: "Pet not found" });
    }
    if(pet.listingType!=="adoption"){
        return res.status(400).json({message:"This pet is not for adoption"})
    }


     const providerId = pet.listed_by.id;
    //  console.log(providerId);
     
    const providerDetail=await User.findById(providerId);
    // console.log(providerDetail);
    
    
    
     //prevent customer from adopting their own listed pet
    if(req.user._id.toString()===providerId.toString()){
        return res.status(400).json({message:"You cannot adopt your own pet"})
    }

    //check if already applied
    const alreadyRequested=await Adoption.findOne({
        "pet.id":petId,
        "adopter.id":req.user._id,
    });
    if(alreadyRequested){
        return res.status(400).json({message:"You have already applied for this pet"})
    }

    const adoption=new Adoption({
        pet:{
            id:petId,
            breed:pet.breed,
        },
        adopter:{
            id:req.user._id,
            name:req.user.fullname,
            email: req.user.email,
        },
        provider:{
            id:providerId,
            name:providerDetail.fullname,
            email: providerDetail.email,
        },
        message,
    });

    const savedAdoption=await adoption.save()
    res.status(200).json(savedAdoption);


    }catch(error){
      if (error.code === 11000) {
        return res.status(400).json({ message: "You have already applied for this pet" });
    }
        console.error("Adoption error:",error.message)
        res.status(500).json({message:"Server error while applying for adoption"})
    }
}

export const getMyAdoptionRequest = async (req, res) => {
  try {
    if (!req.user || req.user.role !== "customer") {
      return res.status(400).json({ message: "Access denied: Customers only" });
    }

    const myRequests = await Adoption.find({ "adopter.id": req.user._id })
      .populate("pet", "breed age gender category imageUrl") // works now
      .sort({ createdAt: -1 });

    res.status(200).json(myRequests);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error while retrieving your adoption request" });
  }
};


export const getAdoptionRequestForProvider = async (req, res) => {
  try {
    // Ensure requester is a pet provider
    if (!req.user || req.user.role !== "petProvider") {
      return res.status(403).json({ message: "Access denied: Pet providers only" });
    }

    const providerId = req.user.id;

    // Find all adoption requests for pets listed by this provider
    const requests = await Adoption.find({ "provider.id": providerId })
      .sort({ createdAt: -1 });

    res.status(200).json(requests);
  } catch (error) {
    console.error("Error fetching provider's adoption requests:", error.message);
    res.status(500).json({ message: "Server error while fetching requests" });
  }
}

export const updateAdoptionStatus=async(req,res)=>{
    try{
       const {id}=req.params
       const {newStatus}=req.body

       //ensure requester is pet provider
       if(!req.user || req.user.role!=="petProvider"){
        return res.status(400).json({message:"Access denied:Pet providers only"})
       }

       //find adoption request
       const adoption=await Adoption.findById(id)
       if(!adoption){
        res.status(400).json({message:"Adoption request not found"})
       }

       //ensure thr provider owns the listing
       if(adoption.provider.id.toString()!==req.user.id){
        return res.status(400).json({message:"You can only update your own adoption listing"})
       }

       const currentStatus=adoption.adoptionStatus
       const validStatuses=["approved","rejected","delivered"]

       if(!validStatuses.includes(newStatus)){
        return res.status(400).json({ message: "Invalid status update" });
       }

       //status update logic
       if(newStatus.toLowerCase()==="approved" && currentStatus==="pending"){
        adoption.adoptionStatus="approved"

        await adoption.save();

        //delete pet from pet collection
        await Pet.findByIdAndDelete(adoption.pet.id)

        return res.status(200).json(adoption);
       }

       if(newStatus.toLowerCase()==="rejected" && currentStatus==="pending"){
        //update status to rejected
        adoption.adoptionStatus="rejected"
        await adoption.save();

        //Schedule deletion in 2 days
        setTimeout(async()=>{
            await Adoption.findByIdAndDelete(id);
            
        },2*24*60*60*1000);
        return res.status(200).json(adoption);
    }
    if(newStatus==="delivered" && currentStatus==="approved"){
      const deliveredAdoption = adoption.toObject();
        // Delete the adoption record
      await Adoption.findByIdAndDelete(id);
      return res.status(200).json({
        ...deliveredAdoption,
        adoptionStatus: "delivered",
      });
    }
return res.status(400).json({ message: `Cannot update status from ${currentStatus} to ${newStatus}` });
    }
    catch(error){
        console.error("Error updating adoption status",error.message)
        res.status(500).json({ message: "Server error while updating adoption status" });
    }
}

export const cancelAdoptionRequest=async(req,res)=>{
    try{
        const{id}=req.params

        //check if user is logged in and has a customer role
        if(!req.user || req.user.role!=="customer"){
            return res.status(400).json({message:"Access denied:Customers only"})
        }
        //find adoption
        const adoption=await Adoption.findById(id)
        
        if(!adoption){
            return res.status(400).json({message:"Adoption request not found"})
        }

        //check if logged in customer is the one who created the request
        if(adoption.adopter.id.toString()!==req.user._id.toString()){
            return res.status(400).json({message:"You can only cancel your own adoption request"})
        }

        //check if status is still pending
        if(adoption.adoptionStatus!=="pending"){
            return res.status(400).json({message:"Only pending requests can be cancelled"})
        }

        await Adoption.findByIdAndDelete(id);
        return res.status(200).json({message:"Adoption request cancelled by customer and removed from request list"})
    }
    catch(error){
        console.error("Error cancelling adoption request:",error.message)
        res.status(500).json({message:"Server error while cancelling request"})
    }
}

export const getAllAdoptionRequest=async(req,res)=>{
    try{
        //check if requester is admin
        if(!req.user ||req.user.role!=="admin"){
            return res.status(400).json({message:"Access denied:Admins only"})
        }
        //fetch all adoption request with related pet ,adopter and provider info
        const adoptionRequests=await Adoption.find()
        .sort({createdAt:-1}) //newest first
        .populate("pet","breed age")
        .populate("adopter","id name ")
        .populate("provider","id name ")

        res.status(200).json(adoptionRequests)


    }catch(error){
        console.error("Error fetching adoption requests:", error.message);
    res.status(500).json({ message: "Server error while retrieving adoption requests" });
    }
}

export const deleteAdoptionRequestByPp = async (req, res) => {
  try {
    const { id } = req.params;

    if (!req.user || req.user.role !== "petProvider") {
      return res.status(403).json({ message: "Access denied! Pet Providers only." });
    }

    const adoption = await Adoption.findById(id);
    if (!adoption) {
      return res.status(404).json({ message: "Adoption request not found." });
    }

    if (adoption.provider.id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "You can only delete requests related to your own pets." });
    }

    if (
      adoption.adoptionStatus === "delivered" ||
      adoption.adoptionStatus === "rejected"
    ) {
      await Adoption.findByIdAndDelete(id);
      return res.status(200).json({ message: `Adoption request (${adoption.adoptionStatus}) deleted successfully.` });
    }

    return res.status(400).json({
      message: "Only delivered or rejected adoption requests can be deleted.",
    });

  } catch (error) {
    console.error("Error deleting adoption request:", error.message);
    res.status(500).json({ message: "Server error while deleting adoption request." });
  }
};

export const getAdoptablePets = async (req, res) => {
  try {
    const pets = await Pet.find({ listingType: "adoption" });
    res.status(200).json(pets);
  } catch (err) {
    console.error("Error fetching adoptable pets:", err.message);
    res.status(500).json({ message: "Failed to fetch adoptable pets" });
  }
};
