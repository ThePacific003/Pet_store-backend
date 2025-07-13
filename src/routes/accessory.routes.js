import express from 'express'
import { protectRoute } from '../middlewares/auth.middleware.js';
import authorizeRoles from '../middlewares/authorize.roles.middleware.js';
import { createAccessory, deleteAccessory, getAccessoryByCategory, getAllAccessories, restockAccessory, searchAccessories, toggleAccessory, updateAccessory } from '../controllers/accessory.controller.js';

const router=express();
 
router.post("/createaccessory",protectRoute,authorizeRoles('admin'),createAccessory)

router.get("/",getAllAccessories);

router.patch("/:id/update",protectRoute,authorizeRoles('admin'),updateAccessory)

router.post("/:id/restock",protectRoute,authorizeRoles("admin"),restockAccessory)

router.delete("/:id/delete",protectRoute,authorizeRoles("admin"),deleteAccessory)

router.get("/:search",searchAccessories)

router.get("/category/:category",getAccessoryByCategory)

router.put("/:id/toggleaccessory",protectRoute,authorizeRoles("admin"),toggleAccessory)


export default router   