import express from 'express';
import {
  createOrder,
  verifyPayment,
  getRazorpayKey,
  getUserPayments,
} from '../controllers/paymentController.js';
import { optionalAuth, requireAuth } from '../middleware/auth.js';

const router = express.Router();

router.get('/key', getRazorpayKey);
router.post('/create-order', optionalAuth, createOrder);
router.post('/verify', optionalAuth, verifyPayment);
router.get('/history', requireAuth, getUserPayments);

export default router;

