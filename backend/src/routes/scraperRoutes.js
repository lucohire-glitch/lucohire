import { Router } from 'express';
import { ScraperController } from '../controllers/scraperController.js';
import { asyncHandler, requireAdmin } from '../middleware/auth.js';

const router = Router();

// Public routes for candidates on LucoHire website
router.get('/public-jobs', asyncHandler(ScraperController.getPublicJobs));

// Admin & internal management routes
router.post('/companies', requireAdmin, asyncHandler(ScraperController.addCompany));
router.post('/companies/import-csv', requireAdmin, asyncHandler(ScraperController.importCsv));
router.get('/companies', requireAdmin, asyncHandler(ScraperController.getCompanies));
router.get('/companies/:id', requireAdmin, asyncHandler(ScraperController.getCompanyById));
router.put('/companies/:id', requireAdmin, asyncHandler(ScraperController.updateCompany));
router.post('/companies/:id/scan', requireAdmin, asyncHandler(ScraperController.scanCompany));
router.post('/scan-all', requireAdmin, asyncHandler(ScraperController.scanAll));

// Scan runs & debugging panel
router.get('/scans', requireAdmin, asyncHandler(ScraperController.getScanRuns));
router.get('/scans/:id', requireAdmin, asyncHandler(ScraperController.getScanRunById));
router.post('/scans/:id/retry-pending', requireAdmin, asyncHandler(ScraperController.retryPending));

// Job management
router.get('/jobs', requireAdmin, asyncHandler(ScraperController.getJobs));
router.put('/jobs/:id/publish', requireAdmin, asyncHandler(ScraperController.toggleJobPublish));

export default router;
