import express from 'express'
import { createPet, getAllPets, updatePet } from '../controllers/pet.controller.js'
import { protectRoute } from '../middlewares/auth.middleware.js'
import authorizeRoles from '../middlewares/authorize.roles.middleware.js';

const router=express.Router()

router.post("/create",protectRoute,authorizeRoles("admin","petProvider"),createPet);

router.post("/",protectRoute,getAllPets)

router.put("/:id",protectRoute,authorizeRoles("admin","petProvider"),updatePet)

export default router