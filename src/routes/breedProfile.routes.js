import express from 'express'
import authorizeRoles from '../middlewares/authorize.roles.middleware.js'
import { protectRoute } from '../middlewares/auth.middleware.js'
import { createSingleBreedProfile, deleteBreedProfile, recommendBreed, updateBreedProfile } from '../controllers/breedProfile.controller.js'

const router=express.Router()

router.post("/createbreed",protectRoute,authorizeRoles("admin"),createSingleBreedProfile)

router.post("/updatebreed/:id",protectRoute,authorizeRoles("admin"),updateBreedProfile);

router.delete("/deletebreed/:id",protectRoute,authorizeRoles("admin"),deleteBreedProfile)

router.get("/recommendation",protectRoute,authorizeRoles("customer"),recommendBreed)



export default router