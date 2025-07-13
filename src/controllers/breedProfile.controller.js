import BreedProfile from "../Models/breedProfile.model.js";


function normalize(str) {
  return str.trim().toLowerCase().replace(/\s/g, "");
}

export const createSingleBreedProfile = async (req, res) => {
  try {
    if (!req.user || req.user.role !== "admin") {
      return res.status(403).json({ message: "Access denied: Admins only" });
    }

    const { name, category, ...rest } = req.body;

    if (!name || !category) {
      return res.status(400).json({ message: "Name and category are required" });
    }

    // Normalize values for comparison
    const normalizedName = normalize(name);
    

    const normalizedCategory = normalize(category);
    

    // Fetch all breeds and compare normalized values
    const existingBreeds = await BreedProfile.find({});
    const isDuplicate = existingBreeds.some((breed) =>
      normalize(breed.name) === normalizedName &&
      normalize(breed.category) === normalizedCategory
    );

    if (isDuplicate) {
      return res.status(409).json({ message: "Breed already exists with similar name and category" });
    }

    // Save with original formatting (e.g., Persian Cat)
    const newBreed = new BreedProfile({
      name: name.trim(),
      category: category.trim(),
      ...rest
    });

    const savedBreed = await newBreed.save();
    res.status(201).json(savedBreed);

  } catch (error) {
    console.error("Error creating breed:", error.message);
    res.status(500).json({ message: "Server error while creating breed profile" });
  }
};



export const updateBreedProfile=async(req,res)=>{
    try{
        //check admin role
        if(!req.user || req.user.role!=="admin"){
            return res.status(400).json({message:"Access denied: Admins only"})
        }
        const breedId=req.params.id

        const updatedBreed=await BreedProfile.findByIdAndUpdate(
            breedId,
            req.body,
            {new:true,runValidators:true},
        );
        if(!updatedBreed){
            return res.status(400).json({message:"Breed not found"})
        }

        res.status(200).json(updatedBreed)
    }
    catch(error){
        console.error("Error updating breed:",error.message)
        res.status(500).json({message:"Server error while updating breed"})
    }
};

export const deleteBreedProfile = async (req, res) => {
  try {
    // Check admin role
    if (!req.user || req.user.role !== "admin") {
      return res.status(403).json({ message: "Access denied: Admins only" });
    }

    const deletedBreed = await BreedProfile.findByIdAndDelete(req.params.id);

    if (!deletedBreed) {
      return res.status(404).json({ message: "Breed not found" });
    }

    res.status(200).json({ message: "Breed profile deleted successfully" });
  } catch (error) {
    console.error("Error deleting breed profile:", error.message);
    res.status(500).json({ message: "Server error while deleting breed" });
  }
};


export const recommendBreed = async (req, res) => {
  try {
    const {
      category,
      purchaseBudget,
      monthlyBudget,
      experienceLevel,
      livingSpaceNeeds,
      isHypoAllergenic,
      suitableForVegetarians,
      goodWithChildren,
      goodWithOtherPets,
      prefersIndoorPet,
      waterType,
    } = req.body;

    // Validate required field
    if (!category) {
      return res.status(400).json({ message: "Category is required" });
    }

    const normalizedCategory = category.trim().toLowerCase();

    // Find all breeds that match the category
    const matchingBreeds = await BreedProfile.find({
      category: { $regex: new RegExp(`^${normalizedCategory}$`, "i") },
    });

    if (matchingBreeds.length === 0) {
      return res.status(404).json({
        message: `No breeds found in category "${category}"`,
      });
    }

    // Score each matching breed based on optional preferences
    const scoredBreeds = matchingBreeds.map((breed) => {
      let score = 0;

      if (purchaseBudget && breed.purchaseBudget === purchaseBudget.toLowerCase().trim()) score++;
      if (monthlyBudget && breed.monthlyBudget === monthlyBudget.toLowerCase().trim()) score++;
      if (experienceLevel && breed.experienceLevel === experienceLevel.toLowerCase().trim()) score++;
      if (livingSpaceNeeds && breed.livingSpaceNeeds === livingSpaceNeeds.toLowerCase().trim()) score++;
      if (isHypoAllergenic !== undefined && breed.isHypoAllergenic === isHypoAllergenic) score++;
      if (suitableForVegetarians !== undefined && breed.suitableForVegetarians === suitableForVegetarians) score++;
      if (goodWithChildren !== undefined && breed.goodWithChildren === goodWithChildren) score++;
      if (goodWithOtherPets !== undefined && breed.goodWithOtherPets === goodWithOtherPets) score++;
      if (prefersIndoorPet !== undefined && breed.prefersIndoorPet === prefersIndoorPet) score++;
      if (waterType && breed.waterType === waterType.toLowerCase().trim()) score++;

      return {
        breed,
        score,
      };
    });

    // Sort by score descending
    scoredBreeds.sort((a, b) => b.score - a.score);

    const highestScore = scoredBreeds[0]?.score || 0;

    // ❌ No match found based on preferences
    if (highestScore === 0) {
      return res.status(404).json({
        message: "No suitable breed found based on your preferences. Try adjusting your preferences.",
      });
    }

    // ✅ Filter top-scoring breeds only
    const topBreeds = scoredBreeds
      .filter((entry) => entry.score === highestScore)
      .map((entry) => entry.breed);

    res.status(200).json({
      message: `Found ${topBreeds.length} best matching breed(s) in category "${category}" with score ${highestScore}`,
      matches: topBreeds,
    });
  } catch (error) {
    console.error("Error in breed recommendation:", error.message);
    res.status(500).json({ message: "Server error while recommending breeds" });
  }
};

