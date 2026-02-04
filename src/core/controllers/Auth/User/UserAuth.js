import crypto from 'crypto';
import { sendSuccessResponse, sendErrorResponse, sendTokenResponse } from '../../../../Utils/response/responseHandler.js';
import { generateToken, generateRefreshToken } from '../../../../Utils/Auth/tokenUtils.js';
import User from '../../../../models/Auth/User.js';

export const userLogin = async (req, res) => {
  try {
    const { username, password } = req.body;
    
    if (!username || !password) {
      return sendErrorResponse(res, 400, 'VALIDATION_ERROR', 'Please provide username/email and password');
    }

    const user = await User.findOne({ 
      $or: [{ username }, { email: username }],
      isActive: true 
    }).select('+password').populate('createdBy supervisor', 'firstName lastName userType');

    if (!user) {
      return sendErrorResponse(res, 401, 'INVALID_CREDENTIALS', 'Invalid credentials');
    }

    if (user.isLocked) {
      return sendErrorResponse(res, 423, 'ACCOUNT_LOCKED', 'Account is temporarily locked due to too many failed login attempts');
    }

    const isMatch = await user.comparePassword(password);

    if (!isMatch) {
      return sendErrorResponse(res, 401, 'INVALID_CREDENTIALS', 'Invalid credentials');
    }

    user.lastLogin = new Date();
    await user.save();

    return sendTokenResponse(user, 200, res, 'user', generateToken, generateRefreshToken);

  } catch (error) {
    console.error('User login error:', error);
    return sendErrorResponse(res, 500, 'INTERNAL_ERROR', 'Internal server error during login');
  }
};

export const userForgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return sendErrorResponse(res, 400, 'VALIDATION_ERROR', 'Please provide email address');
    }

    const user = await User.findOne({ email, isActive: true });

    if (!user) {
      return sendErrorResponse(res, 404, 'USER_NOT_FOUND', 'No user found with that email address');
    }

    const resetToken = crypto.randomBytes(20).toString('hex');  
    user.passwordResetToken = crypto
      .createHash('sha256')
      .update(resetToken)
      .digest('hex');

    user.passwordResetExpires = Date.now() + 10 * 60 * 1000; 

    await user.save({ validateBeforeSave: false });

    const response = {
      message: 'Password reset link sent to email',
      ...(process.env.NODE_ENV === 'development' && { resetToken })
    };

    return sendSuccessResponse(res, 200, null, response.message);
  } catch (error) {
    console.error('User forgot password error:', error);
    return sendErrorResponse(res, 500, 'INTERNAL_ERROR', 'Email could not be sent');
  }
};

export const userResetPassword = async (req, res) => {
  try {
    const { password } = req.body;

    if (!password) {
      return sendErrorResponse(res, 400, 'VALIDATION_ERROR', 'Please provide new password');
    }

    const resetPasswordToken = crypto
      .createHash('sha256')
      .update(req.params.resettoken)
      .digest('hex');

    const user = await User.findOne({
      passwordResetToken: resetPasswordToken,
      passwordResetExpires: { $gt: Date.now() }
    });

    if (!user) {
      return sendErrorResponse(res, 400, 'INVALID_TOKEN', 'Invalid or expired reset token');
    }

    // Password will be hashed by the pre-save middleware
    user.password = password;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    user.loginAttempts = undefined;
    user.lockUntil = undefined;

    await user.save();

    return sendTokenResponse(user, 200, res, 'user', generateToken, generateRefreshToken);

  } catch (error) {
    console.error('User reset password error:', error);
    return sendErrorResponse(res, 500, 'INTERNAL_ERROR', 'Password could not be reset');
  }
};

export const userUpdatePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    
    if (!currentPassword || !newPassword) {
      return sendErrorResponse(res, 400, 'VALIDATION_ERROR', 'Please provide current password and new password');
    }

    const user = await User.findById(req.user.id).select('+password');
    
    if (!(await user.comparePassword(currentPassword))) {
      return sendErrorResponse(res, 401, 'INVALID_PASSWORD', 'Current password is incorrect');
    }

    user.password = newPassword;
    await user.save();

    return sendTokenResponse(user, 200, res, 'user', generateToken, generateRefreshToken);

  } catch (error) {
    console.error('User update password error:', error);
    return sendErrorResponse(res, 500, 'INTERNAL_ERROR', 'Password could not be updated');
  }
};

export const getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
      .populate('createdBy supervisor', 'firstName lastName userType');

    if (!user) {
      return sendErrorResponse(res, 404, 'USER_NOT_FOUND', 'User not found');
    }

    const userData = {
      user: {
        ...user.toObject(),
        userType: req.user.userType,
        accountType: req.user.accountType
      }
    };

    return sendSuccessResponse(res, 200, userData);
  } catch (error) {
    console.error('Get user profile error:', error);
    return sendErrorResponse(res, 500, 'INTERNAL_ERROR', 'Internal server error');
  }
};