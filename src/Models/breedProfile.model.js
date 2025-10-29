import mongoose from "mongoose"

const breedProfileSchema=new mongoose.Schema({
    name:{
        type:String,
        required:true,
    },
    category:{
        type:String,
        enum:["dog","cat","rabbit","fish","guinea pig"],
        required:true,
    },
    purchaseBudget:{
        type:String,
        enum:["low","medium","high"],
        required:true,
    },
    monthlyBudget:{
        type:String,
        enum:["low","medium","high"],
        required:true,
    },
    experienceLevel:{
        type:String,
        enum:["beginner","intermediate","expert"],
        required:true,
    },
//common optional traits
    livingSpaceNeeds:{
        type:String,
        enum:["apartment","smallHouse","largeHouse","farm"],
        required:true,
    }  , 
    isHypoAllergenic:{
        type:Boolean,
    },
    suitableForVegetarians:{
        type:Boolean,
    },
    goodWithChildren:{
        type:Boolean,
    },
    goodWithOtherPets:{
        type:Boolean,
    },
    prefersIndoorPet:{
        type:Boolean,
    },
    
    //fish specific fields
    tankSizeRequired:{
        type:String,
    },
    waterType:{
    type:String,
        enum:["freshwater","saltwater",""]
    }
},
{
    timestamps:true,
}
);

const BreedProfile=mongoose.model("BreedProfile",breedProfileSchema)
export default BreedProfile

