import { Router } from 'express';
import { candidateSignup, recruiterSignup, login, me, sendOtp, verifyOtp, updateCandidatePathAndPlan } from '../controllers/authController.js';
import { asyncHandler, requireAuth } from '../middleware/auth.js';

const router = Router();

router.post('/send-otp', asyncHandler(sendOtp));
router.post('/verify-otp', asyncHandler(verifyOtp));
router.post('/candidate/signup', asyncHandler(candidateSignup));
router.post('/recruiter/signup', asyncHandler(recruiterSignup));
router.post('/login', asyncHandler(login));
router.get('/me', requireAuth, asyncHandler(me));
router.put('/candidate/path-and-plan', requireAuth, asyncHandler(updateCandidatePathAndPlan));

export default router;

