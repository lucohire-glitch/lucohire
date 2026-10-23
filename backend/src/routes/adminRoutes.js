import { Router } from 'express';
import {
  getSetupStatus,
  registerAdmin,
  loginAdmin,
  getAdminProfile,
  getAllUsers,
  deleteUser,
  getStats,
} from '../controllers/adminController.js';
import {
  getAllPlans,
  createPlan,
  updatePlan,
  deletePlan,
} from '../controllers/planController.js';
import {
  getAllPaths,
  createPath,
  updatePath,
  deletePath,
} from '../controllers/careerPathController.js';
import {
  getAdminSkills,
  createSkill,
  updateSkill,
  deleteSkill,
} from '../controllers/resumeSkillController.js';
import { asyncHandler, requireAdmin } from '../middleware/auth.js';

const router = Router();

// Public routes for initial setup and login
router.get('/status', asyncHandler(getSetupStatus));
router.post('/register', asyncHandler(registerAdmin));
router.post('/login', asyncHandler(loginAdmin));

// Protected admin routes
router.get('/me', requireAdmin, asyncHandler(getAdminProfile));
router.get('/stats', requireAdmin, asyncHandler(getStats));
router.get('/users', requireAdmin, asyncHandler(getAllUsers));
router.delete('/users/:role/:id', requireAdmin, asyncHandler(deleteUser));

// Admin Plan Management (Add, Edit, Delete, View)
router.get('/plans', requireAdmin, asyncHandler(getAllPlans));
router.post('/plans', requireAdmin, asyncHandler(createPlan));
router.put('/plans/:id', requireAdmin, asyncHandler(updatePlan));
router.delete('/plans/:id', requireAdmin, asyncHandler(deletePlan));

// Admin Career Path Management (Choose Your Path CRUD)
router.get('/paths', requireAdmin, asyncHandler(getAllPaths));
router.post('/paths', requireAdmin, asyncHandler(createPath));
router.put('/paths/:id', requireAdmin, asyncHandler(updatePath));
router.delete('/paths/:id', requireAdmin, asyncHandler(deletePath));

// Admin Resume Skills & JD Keywords Management CRUD
router.get('/skills', requireAdmin, asyncHandler(getAdminSkills));
router.post('/skills', requireAdmin, asyncHandler(createSkill));
router.put('/skills/:id', requireAdmin, asyncHandler(updateSkill));
router.delete('/skills/:id', requireAdmin, asyncHandler(deleteSkill));

export default router;


