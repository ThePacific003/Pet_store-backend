// controllers/product.controller.js
import Pet from "../Models/pet.model.js";
import Accessory from "../Models/accessories.model.js";
import Order from "../Models/order.model.js";
import { toggleAvailability } from "./pet.controller.js";

// 📌 GET /products/most-bought
export const getMostBought = async (req, res) => {
  try {
    const pipeline = [
      { $unwind: "$orderItems" },
      {
        $group: {
          _id: { item: "$orderItems.item", itemType: "$orderItems.itemType" },
          totalSold: { $sum: "$orderItems.quantity" },
        },
      },
      // Join Pet
      {
        $lookup: {
          from: "pets", // MongoDB collection name for Pet
          localField: "_id.item",
          foreignField: "_id",
          as: "petDetails",
        },
      },
      // Join Accessory
      {
        $lookup: {
          from: "accessories", // MongoDB collection name for Accessory
          localField: "_id.item",
          foreignField: "_id",
          as: "accessoryDetails",
        },
      },
      {
        $addFields: {
          product: {
            $cond: [
              { $eq: ["$_id.itemType", "Pet"] },
              { $arrayElemAt: ["$petDetails", 0] },
              { $arrayElemAt: ["$accessoryDetails", 0] },
            ],
          },
        },
      },
      // Only available products
      {
        $match: {
          $or: [
            { $and: [{ "_id.itemType": "Pet" }, { "product.availability": true }] },
            { $and: [{ "_id.itemType": "Accessory" }, { "product.inStock": { $gt: 0 } }] },
          ],
        },
      },
      { $sort: { totalSold: -1 } },
      { $limit: 6 },
      {
        $project: {
          _id: 0,
          totalSold: 1,
          itemType: "$_id.itemType",

        },
      },
    ];

    const results = await Order.aggregate(pipeline);
    res.json(results);
  } catch (err) {
    console.error("Error in getMostBought:", err);
    res.status(500).json({ message: "Failed to fetch most bought", error: err.message });
  }
};



// 📌 GET /products/relatable
export const getRelatable = async (req, res) => {
  try {
    // Latest available pets
    const pets = await Pet.find({ availability: true,listingType:"sale"  })
      .sort({ createdAt: -1 })
      .limit(3)
      .lean();

    // Latest accessories in stock
    const accessories = await Accessory.find({ inStock: { $gt: 0 } })
      .sort({ createdAt: -1 })
      .limit(3)
      .lean();

    res.json([...pets, ...accessories]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch relatable", error: err.message });
  }
};


// 📌 GET /products?itemType=Pet&category=dog
export const getFilteredProducts = async (req, res) => {
  try {
    const { itemType, category } = req.query;
    
    

    if (!itemType || !category) {

      return res.status(400).json({ message: "itemType and category are required" });
    }    
    let products = [];
    console.log(category.replaceAll("\\s","").toLowerCase());
    if (itemType.toLowerCase() === "pet") {
      products = await Pet.find({ category:category.toLowerCase(),listingType:"sale"});
    } else if (itemType.toLowerCase() === "accessory") {
      products = await Accessory.find({category:category.toLowerCase()});
    } else {
      return res.status(400).json({ message: "Invalid itemType" });
    }

    res.json(products);
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Failed to fetch products", error: err.message });
  }
};
