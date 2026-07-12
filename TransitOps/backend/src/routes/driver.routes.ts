import { Router } from 'express';
import { getAllDrivers, getDriver, createDriver, updateDriver, deleteDriver } from '../controllers/driver.controller.js';
import { protect } from '../middlewares/auth.middleware.js';
import { restrictTo } from '../middlewares/rbac.middleware.js';
import { Role } from '@prisma/client';

const router = Router();

// Protect all driver routes
router.use(protect);

router.route('/')
  .get(restrictTo(Role.FLEET_MANAGER, Role.DRIVER, Role.SAFETY_OFFICER), getAllDrivers)
  .post(restrictTo(Role.SAFETY_OFFICER), createDriver);

router.route('/:id')
  .get(restrictTo(Role.FLEET_MANAGER, Role.DRIVER, Role.SAFETY_OFFICER), getDriver)
  .put(restrictTo(Role.SAFETY_OFFICER), updateDriver)
  .delete(restrictTo(Role.SAFETY_OFFICER), deleteDriver);

export default router;
