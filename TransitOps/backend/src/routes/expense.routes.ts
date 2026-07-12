import { Router } from 'express';
import { getAllExpenses, createExpense, getOperationalCosts } from '../controllers/expense.controller.js';
import { protect } from '../middlewares/auth.middleware.js';
import { restrictTo } from '../middlewares/rbac.middleware.js';
import { Role } from '@prisma/client';

const router = Router();

router.use(protect);

router.get('/stats', restrictTo(Role.FLEET_MANAGER, Role.FINANCIAL_ANALYST), getOperationalCosts);

router.route('/')
  .get(restrictTo(Role.FLEET_MANAGER, Role.FINANCIAL_ANALYST), getAllExpenses)
  .post(restrictTo(Role.FINANCIAL_ANALYST), createExpense);

export default router;
