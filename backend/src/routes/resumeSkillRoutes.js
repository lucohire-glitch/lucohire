import express from 'express';
import { getPublicSkills } from '../controllers/resumeSkillController.js';

const router = express.Router();

router.get('/', getPublicSkills);

export default router;
