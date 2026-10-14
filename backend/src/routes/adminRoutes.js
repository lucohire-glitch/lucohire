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

export default router;
