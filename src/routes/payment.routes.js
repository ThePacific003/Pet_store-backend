import express from 'express';
import { esewaComplete, esewaFailed, initiateEsewa } from '../controllers/esewa.controller.js';
import { protectRoute } from '../middlewares/auth.middleware.js';

const router=express.Router();
router.post('/esewa/initiate',initiateEsewa);
router.get('/esewa/complete',esewaComplete);
router.get('/esewa/failed',esewaFailed);

export default router