import jwt from 'jsonwebtoken';
import { sendErrorResponse, sendLogoutResponse, sendSuccessResponse } from '../response/responseHandler.js';
import dotenv from 'dotenv';
dotenv.config();

export const generateToken = (id, EmployeeType, AccountType = 'EMPLOYEE') => {
  return jwt.sign({ id, EmployeeType, AccountType }, process.env.JWT_SECRET,{ expiresIn: process.env.JWT_EXPIRE || '24h' });
};

export const generateRefreshToken = (id, EmployeeType, AccountType = 'EMPLOYEE') => {
  return jwt.sign(
    { id, EmployeeType, AccountType, type: 'refresh' },
    process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_REFRESH_EXPIRE || '7d' }
  );
};

export const refreshToken = async (req, res) => {
  try {
    const token = req.body.refreshToken || req.cookies?.refreshToken;

    if (!token) {
      return sendErrorResponse(res, 400, 'MISSING_REFRESH_TOKEN', 'Refresh token is required');
    }

    const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET);

    if (decoded.type !== 'refresh') {
      return sendErrorResponse(res, 401, 'INVALID_TOKEN_TYPE', 'Invalid token type');
    }

    const newAccessToken = generateToken(decoded.id, decoded.EmployeeType, decoded.AccountType);
    const newRefreshToken = generateRefreshToken(decoded.id, decoded.EmployeeType, decoded.AccountType);

    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict'
    };

    res.cookie('accessToken', newAccessToken, {
      ...cookieOptions,
      expires: new Date(Date.now() + (process.env.JWT_COOKIE_EXPIRE || 24) * 60 * 60 * 1000) // set JWT_COOKIE_EXPIRE in hours (e.g. 0.0167 for 1 min)
    });

    res.cookie('refreshToken', newRefreshToken, {
      ...cookieOptions,
      expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    });

    return sendSuccessResponse(res, 200, {
      tokens: {
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
        expiresIn: 24 * 60 * 60
      }
    }, 'Token refreshed successfully');

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