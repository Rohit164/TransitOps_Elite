import { Router } from 'express';
import { getAllMaintenance, createMaintenance, completeMaintenance } from '../controllers/maintenance.controller.js';
import { protect } from '../middlewares/auth.middleware.js';
import { restrictTo } from '../middlewares/rbac.middleware.js';
import { Role } from '@prisma/client';

const router = Router();

router.use(protect);

router.route('/')
  .get(restrictTo(Role.FLEET_MANAGER, Role.DISPATCHER, Role.FINANCIAL_ANALYST), getAllMaintenance)
  .post(restrictTo(Role.FLEET_MANAGER), createMaintenance);

router.post('/:id/complete', restrictTo(Role.FLEET_MANAGER), completeMaintenance);

export default router;
