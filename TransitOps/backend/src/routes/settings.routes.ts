import { Router } from 'express';
import { getAllUsers, createUser, changePassword, updateUserRole } from '../controllers/settings.controller.js';
import { protect } from '../middlewares/auth.middleware.js';
import { restrictTo } from '../middlewares/rbac.middleware.js';
import { Role } from '@prisma/client';

const router = Router();

router.use(protect);

// Password change endpoint is accessible to any logged-in user
router.post('/change-password', changePassword);

// User and RBAC management is strictly for Fleet Manager
router.use(restrictTo(Role.FLEET_MANAGER));

router.route('/users')
  .get(getAllUsers)
  .post(createUser);

router.patch('/users/:id/role', updateUserRole);

export default router;
