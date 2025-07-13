import express from "express"
import { protectRoute } from "../middlewares/auth.middleware.js"
import authorizeRoles from "../middlewares/authorize.roles.middleware.js"
import { cancelMyOrder, createOrder, deleteOrder, generateOrderInvoice, getAllOrder, getMyOrder, getOrderByCustomerQuery, updateOrderStatus } from "../controllers/order.controller.js"

const router =express.Router()

router.post("/",protectRoute,authorizeRoles("customer"),createOrder);

router.get("/allorders",protectRoute,authorizeRoles("admin"),getAllOrder);

router.get("/getmyorder",protectRoute,getMyOrder);

router.get("/search",protectRoute,authorizeRoles("admin"),getOrderByCustomerQuery);

router.put("/updatestatus/:id",protectRoute,authorizeRoles("admin"),updateOrderStatus);

router.put("/cancel/:orderId",protectRoute,authorizeRoles("customer"),cancelMyOrder);

router.delete("/deleteorder/:id",protectRoute,authorizeRoles("admin"),deleteOrder);

router.get("/invoice/:id",protectRoute,authorizeRoles("admin"),generateOrderInvoice);

export default router