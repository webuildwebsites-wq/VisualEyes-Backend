import express from 'express';
import {
  login,
  refreshToken,
  logout,
  getMe,
  forgotPassword,
  resetPassword,
  updatePassword,
  registerCustomer
} from '../controllers/Auth/authController.js';
import { protect, authRateLimit } from '../middlewares/Auth/authMiddleware.js';

const router = express.Router();

const loginRateLimit = authRateLimit(5, 15 * 60 * 1000);
const passwordResetRateLimit = authRateLimit(3, 60 * 60 * 1000);
const registrationRateLimit = authRateLimit(3, 60 * 60 * 1000); 

router.post('/login', loginRateLimit, login);
router.post('/refresh', refreshToken);
router.post('/forgot-password', passwordResetRateLimit, forgotPassword);
router.put('/reset-password/:resettoken', resetPassword);
router.post('/register-customer', registrationRateLimit, registerCustomer);

router.post('/logout', protect, logout);
router.get('/me', protect, getMe);
router.put('/update-password', protect, updatePassword);

export default router;