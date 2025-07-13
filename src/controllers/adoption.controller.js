import Adoption from "../Models/adoption.model.js";
import Pet from "../Models/pet.model.js";
import User from "../Models/user.model.js";

export const applyForAdoption=async(req,res)=>{
    try{    
         const { petId, message } = req.body;
        // Ensure only customers can apply
    if (!req.user || req.user.role !== "customer") {
      return res.status(403).json({ message: "Only customers can apply for adoption" });
    }

    //check if pet exists
         const pet = await Pet.findById(petId);
    if (!pet) {
      return res.status(404).json({ message: "Pet not found" });
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
        pet:petId,
        adopter:req.user._id,
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
        },
        provider:{
            id:providerId,
            name:providerDetail.fullname,
        },
        message,
    });

    const savedAdoption=await adoption.save()
    res.status(200).json(savedAdoption);


    }catch(error){
        console.error("Adoption error:",error.message)
        res.status(500).json({message:"Server error while applying for adoption"})
    }
}

export const getMyAdoptionRequest=async(req,res)=>{
    try{
        //ensure user is logged in and is a customer
        if(!req.user || req.user.role!=="customer"){
            return res.status(400).json({message:"Access denied:Customers only"})
        }
        const customerId=req.user.id

        //find all adoption request made by current customer
        const myRequest=await Adoption.find({"adopter.id":customerId}).
        populate("pet","breed age gendercategory imageUrl"). //populate selected pet details
        sort({createdAt:-1}); //most recent first

        res.status(200).json(myRequest)
    }
    catch(error){
        console.error("Error fetching adoption requests:",error.message);
        res.status(500).json({message:"Server error while retrieving your adoption request"})
    }
}

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

        return res.status(200).json({ message: "Adoption approved and pet removed from listing" });
       }

       if(newStatus.toLowerCase()==="rejected" && currentStatus==="pending"){
        //update status to rejected
        adoption.adoptionStatus="rejected"
        await adoption.save();

        //Schedule deletion in 2 days
        setTimeout(async()=>{
            await Adoption.findByIdAndDelete(id);
            
        },2*24*60*60*1000)
    }
    if(newStatus==="delivered" && currentStatus==="approved"){
        // Delete the adoption record
      await Adoption.findByIdAndDelete(id);
      return res.status(200).json({ message: "Adoption marked as delivered and request removed" });
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

export const deleteAdoptionRequestByAdmin=async(req,res)=>{
    try{
        const {id}=req.params

        //admin access check
        if(!req.user && req.user.role!=="admin"){
            return res.status(403).json({message:"Access denied!Admins only"})
        }

        const adoption=await Adoption.findById(id)

        if(!adoption){
            return res.status(404).json({message:"Adoption request not found"})
        }

        const now=new Date()
        const createdAt=new Date(adoption.createdAt)


        //condtion 1: pending for more than 10 days
        if(adoption.adoptionStatus==="pending" && now-createdAt>10*24*60*60*1000){
            await Adoption.findByIdAndDelete(id);
      return res.status(200).json({ message: "Pending request deleted after 10 days." });
        }
        // Condition 2: Approved but not delivered after 15 days
    if (
      adoption.adoptionStatus === "approved" &&
      now - createdAt > 15 * 24 * 60 * 60 * 1000
    ) {
      await Adoption.findByIdAndDelete(id);
      return res.status(200).json({ message: "Approved request deleted after 15 days without delivery." });
    }

    // If none of the conditions match
    return res.status(400).json({
      message:
        "Adoption request cannot be deleted. It doesn't meet the required conditions.",
    });

    }
    catch(error){
        console.error("Error deleting adoption request:",error.message)
        res.status(500).json({message:"Server error while deleting adoption request"})
    }
}