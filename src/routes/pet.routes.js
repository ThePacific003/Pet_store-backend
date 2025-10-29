import express from 'express'
import { createPet, deletePet, filterPets, getAllPets, getPetsByCategory, restockPet, toggleAvailability, updatePet } from '../controllers/pet.controller.js'
import { protectRoute } from '../middlewares/auth.middleware.js'
import authorizeRoles from '../middlewares/authorize.roles.middleware.js';
import { searchAccessories } from '../controllers/accessory.controller.js';

const router=express.Router()

router.post("/create",protectRoute,authorizeRoles("admin","petProvider"),createPet);

router.post("/",protectRoute,getAllPets)

router.put("/update/:id",protectRoute,authorizeRoles("admin","petProvider"),updatePet)

router.get("/category/:category",getPetsByCategory)

router.delete("/delete/:id",protectRoute,authorizeRoles("admin","petProvider"),deletePet);

router.get("/filterpets",filterPets);

router.put("/:id/toggleavailability",protectRoute,authorizeRoles("admin","petProvider"),toggleAvailability)

router.post("/restock/:id",protectRoute,authorizeRoles("admin","petProvider"),restockPet)
export default router