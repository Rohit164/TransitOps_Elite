import { Router } from 'express';
import { getAllVehicles, getVehicle, createVehicle, updateVehicle, deleteVehicle } from '../controllers/fleet.controller.js';
import { protect } from '../middlewares/auth.middleware.js';
import { restrictTo } from '../middlewares/rbac.middleware.js';
import { Role } from '@prisma/client';

const router = Router();

// All fleet routes are protected by JWT
router.use(protect);

router.route('/')
  .get(restrictTo(Role.FLEET_MANAGER, Role.DISPATCHER, Role.FINANCIAL_ANALYST), getAllVehicles)
  .post(restrictTo(Role.FLEET_MANAGER), createVehicle);

router.route('/:id')
  .get(restrictTo(Role.FLEET_MANAGER, Role.DISPATCHER, Role.FINANCIAL_ANALYST), getVehicle)
  .put(restrictTo(Role.FLEET_MANAGER), updateVehicle)
  .delete(restrictTo(Role.FLEET_MANAGER), deleteVehicle);

export default router;
