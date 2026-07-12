import { Router } from 'express';
import { getAllTrips, getTrip, createTrip, dispatchTrip, completeTrip } from '../controllers/trip.controller.js';
import { protect } from '../middlewares/auth.middleware.js';
import { restrictTo } from '../middlewares/rbac.middleware.js';
import { Role } from '@prisma/client';

const router = Router();

router.use(protect);

router.route('/')
  .get(restrictTo(Role.FLEET_MANAGER, Role.DRIVER, Role.SAFETY_OFFICER), getAllTrips)
  .post(restrictTo(Role.DRIVER), createTrip);

router.route('/:id')
  .get(restrictTo(Role.FLEET_MANAGER, Role.DRIVER, Role.SAFETY_OFFICER), getTrip);

router.post('/:id/dispatch', restrictTo(Role.DRIVER), dispatchTrip);
router.post('/:id/complete', restrictTo(Role.DRIVER), completeTrip);

export default router;
