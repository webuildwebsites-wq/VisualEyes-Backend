import crypto from 'crypto';
import { sendSuccessResponse, sendErrorResponse, sendTokenResponse } from '../../../../Utils/response/responseHandler.js';
import { generateToken, generateRefreshToken } from '../../../../Utils/Auth/tokenUtils.js';
import employeeSchema from '../../../../models/Auth/Employee.js';
import dotenv from 'dotenv';
dotenv.config();

export const employeeLogin = async (req, res) => {
  try {
    const { employeeName, password } = req.body;
    if (!employeeName || !password) {
      return sendErrorResponse(res, 400, 'VALIDATION_ERROR', 'Please provide employee name/email and password');
    }

    const user = await employeeSchema.findOne({ 
      $or: [{ employeeName }, { email: employeeName }],
      isActive: true 
    })
    .select('+password')
    .populate('EmployeeType', 'name')
    .populate('createdBy supervisor', 'employeeName email');

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
    await user.save({ validateModifiedOnly: true });

    return sendTokenResponse(user, 200, res, 'EMPLOYEE', generateToken, generateRefreshToken);

  } catch (error) {
    console.error('Employee login error:', error);
    return sendErrorResponse(res, 500, 'INTERNAL_ERROR', 'Internal server error during login');
  }
};

export const employeeForgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return sendErrorResponse(res, 400, 'VALIDATION_ERROR', 'Please provide email address');
    }

    const user = await employeeSchema.findOne({ email, isActive: true });

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
    console.error('Employee forgot password error:', error);
    return sendErrorResponse(res, 500, 'INTERNAL_ERROR', 'Email could not be sent');
  }
};

export const employeeResetPassword = async (req, res) => {
  try {
    const { password } = req.body;

    if (!password) {
      return sendErrorResponse(res, 400, 'VALIDATION_ERROR', 'Please provide new password');
    }

    const resetPasswordToken = crypto
      .createHash('sha256')
      .update(req.params.resettoken)
      .digest('hex');

    const user = await employeeSchema.findOne({
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
    user.lockUntil = undefined;

    await user.save();

    return sendTokenResponse(user, 200, res, 'EMPLOYEE', generateToken, generateRefreshToken);

  } catch (error) {
    console.error('Employee', error);
    return sendErrorResponse(res, 500, 'INTERNAL_ERROR', 'Password could not be reset');
  }
};

export const employeeUpdatePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    
    if (!currentPassword || !newPassword) {
      return sendErrorResponse(res, 400, 'VALIDATION_ERROR', 'Please provide current password and new password');
    }

    const user = await employeeSchema.findById(req.user.id).select('+password');
    
    if (!(await user.comparePassword(currentPassword))) {
      return sendErrorResponse(res, 401, 'INVALID_PASSWORD', 'Current password is incorrect');
    }

    user.password = newPassword;
    await user.save();

    return sendTokenResponse(user, 200, res, 'EMPLOYEE', generateToken, generateRefreshToken);

  } catch (error) {
    console.error('Employee update password error:', error);
    return sendErrorResponse(res, 500, 'INTERNAL_ERROR', 'Password could not be updated');
  }
};

export const getEmployeeProfile = async (req, res) => {
  try {
    const user = await employeeSchema.findById(req.user.id);

    if (!user) {
      return sendErrorResponse(res, 404, 'USER_NOT_FOUND', 'Employee not found');
    }

    const userData = {
      user: {
        ...user.toObject(),
        EmployeeType: req.user.EmployeeType,
        AccountType: req.user.AccountType
      }
    };

    return sendSuccessResponse(res, 200, userData);
  } catch (error) {
    console.error('Get user profile error:', error);
    return sendErrorResponse(res, 500, 'INTERNAL_ERROR', 'Internal server error');
  }
};