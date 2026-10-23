import { Router } from 'express';
import { getPublicPlans } from '../controllers/planController.js';
import { asyncHandler } from '../middleware/auth.js';

const router = Router();

// Public endpoint to get active plans for candidates, recruiters, and resume journey
router.get('/', asyncHandler(getPublicPlans));

export default router;
