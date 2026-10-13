import { Router } from 'express';
import { candidateSignup, recruiterSignup, login, me } from '../controllers/authController.js';
import { asyncHandler, requireAuth } from '../middleware/auth.js';

const router = Router();

router.post('/candidate/signup', asyncHandler(candidateSignup));
router.post('/recruiter/signup', asyncHandler(recruiterSignup));
router.post('/login', asyncHandler(login));
router.get('/me', requireAuth, asyncHandler(me));

export default router;
