import { Router } from 'express';
import { analyzeResume, parseResumeAutofill } from '../controllers/resumeAnalysisController.js';
import { optionalAuth } from '../middleware/auth.js';

const router = Router();

router.post('/analyze', optionalAuth, analyzeResume);
router.post('/autofill', optionalAuth, parseResumeAutofill);

export default router;
