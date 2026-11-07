import express from 'express';
import {
  createOrder,
  verifyPayment,
  getRazorpayKey,
  getUserPayments,
  toggleAutoRenew,
} from '../controllers/paymentController.js';
import { optionalAuth, requireAuth } from '../middleware/auth.js';

const router = express.Router();

router.get('/key', getRazorpayKey);
router.post('/create-order', optionalAuth, createOrder);
router.post('/verify', optionalAuth, verifyPayment);
router.get('/history', optionalAuth, getUserPayments);
router.post('/toggle-auto-renew', optionalAuth, toggleAutoRenew);
router.post('/auto-renew', optionalAuth, toggleAutoRenew);

export default router;

