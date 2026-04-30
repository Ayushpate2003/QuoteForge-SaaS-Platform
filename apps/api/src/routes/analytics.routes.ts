import { Router } from 'express';
import { getDashboardStats, getReportData } from '../controllers/analytics.controller';
import { authenticate } from '../middleware/auth';
import { authorize } from '../middleware/rbac';

const router = Router();

router.get('/stats', authenticate, authorize(['admin']), getDashboardStats);
router.get('/reports', authenticate, authorize(['admin']), getReportData);

export default router;
