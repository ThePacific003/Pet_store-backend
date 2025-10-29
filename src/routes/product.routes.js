// routes/product.routes.js
import express from "express";
import {
  getMostBought,
  getRelatable,
  getFilteredProducts,
} from "../controllers/product.controller.js";

const router = express.Router();

router.get("/most-bought", getMostBought);
router.get("/relatable", getRelatable);
router.get("/", getFilteredProducts);

export default router;
