import Pet from '../Models/pet.model.js'

export const createPet = async (req, res) => {
    try {
        const { breed, age, gender, price, description, imageUrl, availability, category, listingType } = req.body;
        const user = req.user; //user object from auth middleware

        //only allow admin and pet_provider to create pets
        if (user.role !== "admin" && user.role !== "petProvider") {
            return res.status(400).json({ message: "Access denied! Only admin and pet providers can add pets " })
        }

        if (listingType == 'sale' && user.role !== 'admin') {
            res.status(400).json({ message: "only admin can list pets for sale" })
        }

        if (listingType == 'adoption' && user.role !== 'petProvider') {
            res.status(400).json({ message: "only pet providers can list pets for adoption" })
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
        res.status(200).json(savedPet);



    }
    catch (error) {
        console.log("error creating pet", error.message);
        res.status(500).json({ error })
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
            if (pet.listed_by.id !== req.user.id) {
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

        if (breed !== undefined) pet.breed = breed;
        if (age !== undefined) pet.age = age;
        if (gender !== undefined) pet.gender = gender;
        if (price !== undefined) pet.price = price;
        if (description !== undefined) pet.description = description;
        if (imageUrl !== undefined) pet.imageUrl = imageUrl;
        if (availability !== undefined) pet.availability = availability;
        if (category !== undefined) pet.category = category;

        const updatedPet = await pet.save();
        res.status(200).json(updatedPet);
    } catch (error) {
        console.error("Error updating pet:", error.message);
        res.status(500).json({ message: "Server error" });
    }
};
