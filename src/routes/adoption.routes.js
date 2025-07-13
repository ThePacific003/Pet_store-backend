import express from "express"
import { protectRoute } from "../middlewares/auth.middleware.js"
import authorizeRoles from "../middlewares/authorize.roles.middleware.js"
import { applyForAdoption, cancelAdoptionRequest, getAdoptionRequestForProvider, getAllAdoptionRequest, getMyAdoptionRequest, updateAdoptionStatus } from "../controllers/adoption.controller.js"

const router=express.Router()

router.post("/apply",protectRoute,authorizeRoles("customer"),applyForAdoption)

router.get("/getmyreq",protectRoute,authorizeRoles("customer"),getMyAdoptionRequest)

router.get("/getadoptrequest",protectRoute,authorizeRoles("petProvider"),getAdoptionRequestForProvider);

router.put("/updatestatus/:id",protectRoute,authorizeRoles("petProvider"),updateAdoptionStatus);

router.put("/canceladoption/:id",protectRoute,authorizeRoles("customer"),cancelAdoptionRequest);

router.get("/alladoptions",protectRoute,authorizeRoles("admin"),getAllAdoptionRequest);

export default router