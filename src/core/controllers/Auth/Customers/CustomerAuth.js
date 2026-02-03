import crypto from 'crypto';
import Customer from '../../../../models/Auth/Customer.js';
import User from '../../../../models/Auth/User.js'
import { sendErrorResponse, sendTokenResponse } from '../../../../Utils/response/responseHandler.js';

export const customerLogin = async (req, res) => {
  try {
    const { username, password } = req.body;
    
    if (!username || !password) {
      return sendErrorResponse(res, 400, 'VALIDATION_ERROR', 'Please provide username/email and password');
    }

    const customer = await Customer.findOne({ 
      $or: [
        { username },
        { email: username }
      ],
      'status.isActive': true 
    }).select('+password').populate('assignedSalesHead assignedAccountsHead', 'firstName lastName');

    if (!customer) {
      return sendErrorResponse(res, 401, 'INVALID_CREDENTIALS', 'Invalid credentials');
    }

    if (customer.isLocked) {
      return sendErrorResponse(res, 423, 'ACCOUNT_LOCKED', 'Account is temporarily locked due to too many failed login attempts');
    }

    if (customer.status.isSuspended) {
      return sendErrorResponse(res, 423, 'ACCOUNT_SUSPENDED', `Account is suspended: ${customer.status.suspensionReason}`);
    }

    const isMatch = await customer.comparePassword(password);

    if (!isMatch) {
      if (customer.incLoginAttempts) {
        await customer.incLoginAttempts();
      }
      return sendErrorResponse(res, 401, 'INVALID_CREDENTIALS', 'Invalid credentials');
    }

    if (customer.resetLoginAttempts) {
      await customer.resetLoginAttempts();
    }
    if (customer.updateLastLogin) {
      await customer.updateLastLogin();
    }

    return sendTokenResponse(customer, 200, res, 'customer', generateToken, generateRefreshToken);

  } catch (error) {
    console.error('Customer login error:', error);
    return sendErrorResponse(res, 500, 'INTERNAL_ERROR', 'Internal server error during login');
  }
};

export const customerRegister = async (req, res) => {
  try {
    const {
      email,
      password,
      shopName,
      ownerName,
      phone,
      address,
      gstNumber,
      region
    } = req.body;

    if (!email || !shopName || !ownerName || !phone || !address || !region) {
      return sendErrorResponse(res, 400, 'VALIDATION_ERROR', 'Please provide all required fields');
    }
    
    const existingCustomer = await Customer.findOne({ email });
    if (existingCustomer) {
      return sendErrorResponse(res, 409, 'CUSTOMER_EXISTS', 'Customer with this email already exists');
    }

    const salesHead = await User.findOne({ 
      userType: { $in: ['supervisor', 'user'] },
      department: 'Sales',
      region: region,
      isActive: true 
    });

    if (!salesHead) {
      return sendErrorResponse(res, 400, 'NO_SALES_HEAD', 'No sales representative available for your region');
    }  

    const customer = await Customer.create({
      email,
      password,
      shopName,
      ownerName,
      phone,
      address,
      gstNumber,
      region,
      labMapping: 'Lab', 
      assignedSalesHead: salesHead._id,
      createdBy: salesHead._id 
    }); 

    const customerObj = customer.toObject();
    delete customerObj.password;

    return sendSuccessResponse(res, 201, { customer: customerObj }, 'Customer registration successful. Account pending verification.');

  } catch (error) {
    console.error('Customer registration error:', error);
    return sendErrorResponse(res, 500, 'INTERNAL_ERROR', 'Customer registration failed');
  }
};

export const customerForgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return sendErrorResponse(res, 400, 'VALIDATION_ERROR', 'Please provide email address');
    }

    const customer = await Customer.findOne({ email, 'status.isActive': true });

    if (!customer) {
      return sendErrorResponse(res, 404, 'USER_NOT_FOUND', 'No customer found with that email address');
    }

    const resetToken = crypto.randomBytes(20).toString('hex');  
    customer.passwordResetToken = crypto
      .createHash('sha256')
      .update(resetToken)
      .digest('hex');

    customer.passwordResetExpires = Date.now() + 10 * 60 * 1000; 

    await customer.save({ validateBeforeSave: false });

    const response = {
      message: 'Password reset link sent to email',
      ...(process.env.NODE_ENV === 'development' && { resetToken })
    };

    return sendSuccessResponse(res, 200, null, response.message);
  } catch (error) {
    console.error('Customer forgot password error:', error);
    return sendErrorResponse(res, 500, 'INTERNAL_ERROR', 'Email could not be sent');
  }
};

export const customerResetPassword = async (req, res) => {
  try {
    const { password } = req.body;

    if (!password) {
      return sendErrorResponse(res, 400, 'VALIDATION_ERROR', 'Please provide new password');
    }

    const resetPasswordToken = crypto
      .createHash('sha256')
      .update(req.params.resettoken)
      .digest('hex');

    const customer = await Customer.findOne({
      passwordResetToken: resetPasswordToken,
      passwordResetExpires: { $gt: Date.now() }
    });

    if (!customer) {
      return sendErrorResponse(res, 400, 'INVALID_TOKEN', 'Invalid or expired reset token');
    }

    customer.password = password;
    customer.passwordResetToken = undefined;
    customer.passwordResetExpires = undefined;

    await customer.save();

    return sendTokenResponse(customer, 200, res, 'customer', generateToken, generateRefreshToken);

  } catch (error) {
    console.error('Customer reset password error:', error);
    return sendErrorResponse(res, 500, 'INTERNAL_ERROR', 'Password could not be reset');
  }
};

export const customerUpdatePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    
    if (!currentPassword || !newPassword) {
      return sendErrorResponse(res, 400, 'VALIDATION_ERROR', 'Please provide current password and new password');
    }

    const customer = await Customer.findById(req.user.id).select('+password');
    
    if (!(await customer.comparePassword(currentPassword))) {
      return sendErrorResponse(res, 401, 'INVALID_PASSWORD', 'Current password is incorrect');
    }

    customer.password = newPassword;
    await customer.save();

    return sendTokenResponse(customer, 200, res, 'customer', generateToken, generateRefreshToken);

  } catch (error) {
    console.error('Customer update password error:', error);
    return sendErrorResponse(res, 500, 'INTERNAL_ERROR', 'Password could not be updated');
  }
};

export const getCustomerProfile = async (req, res) => {
  try {
    const customer = await Customer.findById(req.user.id)
      .populate('assignedSalesHead assignedAccountsHead', 'firstName lastName userType');

    if (!customer) {
      return sendErrorResponse(res, 404, 'USER_NOT_FOUND', 'Customer not found');
    }

    const customerData = {
      user: {
        ...customer.toObject(),
        userType: req.user.userType,
        accountType: req.user.accountType
      }
    };

    return sendSuccessResponse(res, 200, customerData);
  } catch (error) {
    console.error('Get customer profile error:', error);
    return sendErrorResponse(res, 500, 'INTERNAL_ERROR', 'Internal server error');
  }
};