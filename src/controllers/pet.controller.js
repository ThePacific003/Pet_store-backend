import Pet from '../Models/pet.model.js'

export const createPet = async (req, res) => {
    try {
        const { breed, age, gender, price, description, imageUrl, availability, category, listingType } = req.body;
        const user = req.user; //user object from auth middleware

        //only allow admin and pet_provider to create pets
        if (user.role !== "admin" && user.role !== "petProvider") {
            return res.status(400).json({ message: "Access denied! Only admin and pet providers can add pets " })
        }

        if (listingType === 'sale' && user.role !== 'admin') {
           return res.status(400).json({ message: "only admin can list pets for sale" })
        }

        if (listingType === 'adoption' && user.role !== 'petProvider') {
            return res.status(400).json({ message: "only pet providers can list pets for adoption" })
        }
        if(listingType==="adoption" && availability===false){
            return res.status(400).json({message:"Invalid listing"})
        }

        const pet = new Pet({
            breed,
            age,
            gender,
            price: listingType == 'sale' ? price : undefined,
            description,
            imageUrl,
            availability,
            category,
            listingType,
            listed_by: {
                id: user._id,
                role: user.role
            }

        })
        const savedPet = await pet.save();
        return res.status(200).json(savedPet);



    }
    catch (error) {
        console.log("error creating pet", error.message);
        return res.status(500).json({ error })
    }
}


export const getAllPets = async (req, res) => {
    try {
        const {
            category,
            breed,
            gender,
            available,
            minPrice,
            maxPrice,
            search
        } = req.query;

        // Build filter object dynamically
        const filter = {};

        if (category) filter.category = category;
        if (breed) filter.breed = { $regex: breed, $options: "i" };
        if (gender) filter.gender = gender;
        if (available !== undefined) filter.availability = available === "true";

        if (minPrice || maxPrice) {
            filter.price = {};
            if (minPrice) filter.price.$gte = Number(minPrice);
            if (maxPrice) filter.price.$lte = Number(maxPrice);
        }

        if (search) {
            filter.$or = [
                { breed: { $regex: search, $options: "i" } },
                { description: { $regex: search, $options: "i" } }
            ];
        }

        const pets = await Pet.find(filter).sort({ createdAt: -1 });

        res.status(200).json(pets);
    } catch (error) {
        console.error("Error fetching pets:", error.message);
        res.status(500).json({ message: "Server error" });
    }
};

export const updatePet = async (req, res) => {
    try {
        const petId = req.params.id;

        const pet = await Pet.findById(petId);
        if (!pet) {
            return res.status(404).json({ message: "Pet not found" });
        }
       
        // Access control check
        if (req.user.role === "admin") {
            // Admin can only update pets listed by 'admin'
            if (pet.listed_by.role !== "admin") {
                return res.status(403).json({ message: "Admins can only update pets listed by admin" });
            }
        } else if (req.user.role === "petProvider") {
            // Provider can only update their own pets
            if (pet.listed_by.id.toString() !== req.user.id.toString()) {
                return res.status(403).json({ message: "You are not provider who listed this pet" });
            }
        } else {
            return res.status(403).json({ message: "Unauthorized role" });
        }

        // Update only the fields provided in req.body
        const {
            breed,
            age,
            gender,
            price,
            description,
            imageUrl,
            availability,
            category,
        } = req.body;

        if (breed && breed.trim() !== "") pet.breed = breed;
        if (age !== undefined && typeof age === "number" && age > 0) pet.age = age;
        if (gender && ["male", "female"].includes(gender)) pet.gender = gender;
        if (typeof price === "number" && price > 0) pet.price = price;
        if (description && description.trim() !== "") pet.description = description;
        if (imageUrl && imageUrl.trim() !== "") pet.imageUrl = imageUrl;
        if (typeof availability === "boolean") pet.availability = availability;
        if (category && category.trim() !== "") pet.category = category;

        const updatedPet = await pet.save();
        res.status(200).json(updatedPet);
    } catch (error) {
        console.error("Error updating pet:", error.message);
        res.status(500).json({ message: "Server error" });
    }
};

export const getPetsByCategory=async(req,res)=>{
    const {category}=req.params
    try{
        const pets=await Pet.find({category:category.toLowerCase(),availability:true})

        if(!pets || pets.length===0){
            return res.status(400).json({message:`No pets found in category ${category}`})
        }
        res.status(200).json(pets)
    }catch(error){
        console.error("Error fetching pets by category",error);
        res.status(500).json({ message: "Server error while retrieving pets" });
    }
}

export const deletePet = async (req, res) => {
  const { id } = req.params;
  console.log(id);
  

  try {
    const pet = await Pet.findById(id);

    if (!pet) {
      return res.status(404).json({ message: "Pet not found" });
    }

    const userRole = req.user.role;
    const userId = req.user.id;

    // Only allow admin or pet provider
    if (userRole !== "admin" && userRole !== "petProvider") {
      return res.status(403).json({ message: "Access denied" });
    }

    // If user is provider, ensure they listed the pet
    if (userRole === "petProvider" && pet.listed_by.toString() !== userId) {
      return res.status(403).json({ message: "You can only delete pets you listed" });
    }

    // Admin can delete any pet
    await Pet.findByIdAndDelete(id);
    res.status(200).json({ message: "Pet deleted successfully" });

  } catch (error) {
    console.error("Error deleting pet:", error.message);
    res.status(500).json({ message: "Server error" });
  }
};

export const filterPets=async(req,res)=>{
    try{
        const{
        minAge,
        maxAge,
        minPrice,
        maxPrice,
        availability,
        category,
        breed,listingType
    }=req.body;

    let filter={};

    //age range filter
    if(minAge||maxAge){
        filter.age={}
         if(minAge) filter.age.$gte=Number(minAge);
         if(maxAge) filter.age.$lte=Number(maxAge);

    }
    //price range filter
    if(minPrice||maxPrice){
        filter.price={}
        if(minPrice) filter.price.$gte=Number(minPrice);
        if(maxPrice) filter.price.$lte=Number(maxPrice)
    }

    //availability filter
    if(availability!==undefined){
        filter.availability=availability==="true";
    }

    //category filter
    if(category){
        filter.category=category;
    }

    //Breed filter
    if(breed){
        filter.breed={$regex:breed,$options:i};
    }

    //listing type filter (sale/adoption)
    if(listingType){
        filter.listingType=listingType;
    }

    const pets=await Pet.find(filter);
    res.status(200).json(pets);
}
catch(error){
        console.error("Error filtering pets:",error.message);
        res.status(500).json({message:"Server error"});

    }
}

export const toggleAvailability=async(req,res)=>{
    const {id}=req.params

    try{
        const pet=await Pet.findById(id);
        if(!pet){
            res.status(404).json({message:"Pet not found"});
        }

        const userRole=req.user.role
        const userId=req.user.id

        //admin can toggle availability for any pet pet provider can toggle only their own listed pet
       
        if(userRole==="admin" || userRole==='petProvider' && pet.listed_by.toString()===userId){
            pet.availability=!pet.availability;

            await pet.save();

            return res.status(200).json({message:`pet availability updated to ${pet.availability}`,pet})
        }
    }
    catch(error){
        console.error("error toggling availability:",error.message);
        res.status(500).json({message:"Server error"})
    }
};

export const restockPet=async(req,res)=>{
    try{
        const id=req.params.id
        const quantityToAdd=Number(req.body.quantityToAdd)


        if(!id||!quantityToAdd||quantityToAdd<=0){
            return res.status(400).json({message:"Quantity must be in positive number"})
        }

        const pet=await Pet.findById(id)
        if(!pet){
            res.status(400).json({message:"pet not found"})
        }

        const userRole=req.user.role
        const userId=req.user.id

        if(userRole!=="admin" && userRole!=="petProvider"){
            return res.status(400).json({message:"Access denied: Unauthorized user"})
        }
        if(userRole==="petProvider" &&pet.listed_by.toString()!==userId){
            return res.status(400).json({message:"You can only restock pet you listed"})
        }

        //increase quantity and update availability

        pet.quantityInStock=pet.quantityInStock+quantityToAdd
        pet.availability=pet.quantityInStock>0;

        const updatedPet=await pet.save();

        res.status(200).json(updatedPet);
    }
    catch(error){
        console.error("error restocking pet:",error.message)
        res.status(500).json({message:"Server error while restocking pet"})
    }
}
