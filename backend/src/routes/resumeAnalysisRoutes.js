import { Router } from 'express';
import { analyzeResume } from '../controllers/resumeAnalysisController.js';
import { optionalAuth } from '../middleware/auth.js';

const router = Router();

router.post('/analyze', optionalAuth, analyzeResume);

export default router;
