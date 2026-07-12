import { Router } from 'express';
import { login, logout, getMe, signup } from '../controllers/auth.controller.js';
import { protect } from '../middlewares/auth.middleware.js';

const router = Router();

router.post('/login', login);
router.post('/signup', signup);
router.post('/logout', protect, logout);
router.get('/me', protect, getMe);

export default router;
