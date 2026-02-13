import jwt from 'jsonwebtoken';
import { sendErrorResponse, sendLogoutResponse, sendSuccessResponse } from '../response/responseHandler.js';
import dotenv from 'dotenv';
dotenv.config();

export const generateToken = (id, UserType, AccountType = 'EMPLOYEE') => {
  return jwt.sign({ id, UserType, AccountType }, process.env.JWT_SECRET,{ expiresIn: process.env.JWT_EXPIRE || '24h' });
};

export const generateRefreshToken = (id, UserType, AccountType = 'EMPLOYEE') => {
  return jwt.sign(
    { id, UserType, AccountType, type: 'refresh' },
    process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_REFRESH_EXPIRE || '7d' }
  );
};

export const refreshToken = async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return sendErrorResponse(res, 400, 'MISSING_REFRESH_TOKEN', 'Refresh token is required');
    }

    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET);

    if (decoded.type !== 'refresh') {
      return sendErrorResponse(res, 401, 'INVALID_TOKEN_TYPE', 'Invalid token type');
    }

    const newAccessToken = generateToken(decoded.id, decoded.UserType, decoded.AccountType);

    return sendSuccessResponse(res, 200, {
      accessToken: newAccessToken,
      expiresIn: 24 * 60 * 60
    });

  } catch (error) {
    console.error('Refresh token error:', error);
    return sendErrorResponse(res, 401, 'INVALID_REFRESH_TOKEN', 'Invalid or expired refresh token');
  }
};

export const logout = async (req, res) => {
  try {
    return sendLogoutResponse(res);
  } catch (error) {
    console.error('Logout error:', error);
    return sendErrorResponse(res, 500, 'INTERNAL_ERROR', 'Internal server error during logout');
  }
};