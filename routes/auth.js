import express from 'express';
import jwt from 'jsonwebtoken';
import { sendSuccessResponse, sendErrorResponse, sendLogoutResponse } from '../Utils/response/responseHandler.js';
import { generateToken } from '../Utils/Auth/tokenUtils.js';
import { protect, authRateLimit } from '../middlewares/Auth/authMiddleware.js';

import { 
  userLogin, 
  userForgotPassword, 
  userResetPassword, 
  userUpdatePassword, 
  getUserProfile 
} from '../controllers/Auth/User/UserAuth.js';

import { 
  customerLogin, 
  customerRegister, 
  customerForgotPassword, 
  customerResetPassword, 
  customerUpdatePassword, 
  getCustomerProfile 
} from '../controllers/Auth/Customers/CustomerAuth.js';

const router = express.Router();

const refreshToken = async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return sendErrorResponse(res, 400, 'MISSING_REFRESH_TOKEN', 'Refresh token is required');
    }

    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET);

    if (decoded.type !== 'refresh') {
      return sendErrorResponse(res, 401, 'INVALID_TOKEN_TYPE', 'Invalid token type');
    }

    const newAccessToken = generateToken(decoded.id, decoded.userType, decoded.accountType);

    return sendSuccessResponse(res, 200, {
      accessToken: newAccessToken,
      expiresIn: 24 * 60 * 60
    });

  } catch (error) {
    console.error('Refresh token error:', error);
    return sendErrorResponse(res, 401, 'INVALID_REFRESH_TOKEN', 'Invalid or expired refresh token');
  }
};

const logout = async (req, res) => {
  try {
    return sendLogoutResponse(res);
  } catch (error) {
    console.error('Logout error:', error);
    return sendErrorResponse(res, 500, 'INTERNAL_ERROR', 'Internal server error during logout');
  }
};

const loginRateLimit = authRateLimit(5, 15 * 60 * 1000);
const passwordResetRateLimit = authRateLimit(3, 60 * 60 * 1000);
const registrationRateLimit = authRateLimit(3, 60 * 60 * 1000);

// USER ROUTES (Admin/Staff)
router.post('/user/login', loginRateLimit, userLogin);
router.get('/user/profile', protect, getUserProfile);
router.put('/user/update-password', protect, userUpdatePassword);
router.post('/user/forgot-password', passwordResetRateLimit, userForgotPassword);
router.put('/user/reset-password/:resettoken', userResetPassword);

// CUSTOMER ROUTES
router.post('/customer/login', loginRateLimit, customerLogin);
router.post('/customer/register', registrationRateLimit, customerRegister);
router.post('/customer/forgot-password', passwordResetRateLimit, customerForgotPassword);
router.put('/customer/reset-password/:resettoken', customerResetPassword);
router.get('/customer/profile', protect, getCustomerProfile);
router.put('/customer/update-password', protect, customerUpdatePassword);

// COMMON ROUTES (shared by both user types)
router.post('/refresh', refreshToken);
router.post('/logout', protect, logout);

export default router;