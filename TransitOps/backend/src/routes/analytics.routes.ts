import { Router } from 'express';
import { getDashboardKPIs, getReports, exportCSV } from '../controllers/analytics.controller.js';
import { protect } from '../middlewares/auth.middleware.js';
import { restrictTo } from '../middlewares/rbac.middleware.js';
import { Role } from '@prisma/client';

const router = Router();

router.use(protect);

router.get('/kpis', restrictTo(Role.FLEET_MANAGER, Role.DRIVER, Role.SAFETY_OFFICER, Role.FINANCIAL_ANALYST), getDashboardKPIs);
router.get('/reports', restrictTo(Role.FLEET_MANAGER, Role.DRIVER, Role.SAFETY_OFFICER, Role.FINANCIAL_ANALYST), getReports);
router.get('/export', restrictTo(Role.FLEET_MANAGER, Role.FINANCIAL_ANALYST), exportCSV);

export default router;
