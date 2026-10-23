import { Router } from 'express';
import { getPublicPaths } from '../controllers/careerPathController.js';
import { asyncHandler } from '../middleware/auth.js';

const router = Router();

// Public endpoint to get active career paths for "Choose your path"
router.get('/', asyncHandler(getPublicPaths));

export default router;
