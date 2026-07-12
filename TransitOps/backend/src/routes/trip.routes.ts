import { Router } from 'express';
import { getAllTrips, getTrip, createTrip, dispatchTrip, completeTrip } from '../controllers/trip.controller.js';
import { protect } from '../middlewares/auth.middleware.js';
import { restrictTo } from '../middlewares/rbac.middleware.js';
import { Role } from '@prisma/client';

const router = Router();

router.use(protect);

router.route('/')
  .get(restrictTo(Role.FLEET_MANAGER, Role.DISPATCHER, Role.SAFETY_OFFICER), getAllTrips)
  .post(restrictTo(Role.DISPATCHER), createTrip);

router.route('/:id')
  .get(restrictTo(Role.FLEET_MANAGER, Role.DISPATCHER, Role.SAFETY_OFFICER), getTrip);

router.post('/:id/dispatch', restrictTo(Role.DISPATCHER), dispatchTrip);
router.post('/:id/complete', restrictTo(Role.DISPATCHER), completeTrip);

export default router;
