import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import User from '../../models/Auth/User.js';
import Customer from '../../models/Auth/Customer.js';

const generateToken = (id, userType, accountType = 'user') => {
  return jwt.sign(
    { id, userType, accountType },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRE || '24h' }
  );
};

const generateRefreshToken = (id, userType, accountType = 'user') => {
  return jwt.sign(
    { id, userType, accountType, type: 'refresh' },
    process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_REFRESH_EXPIRE || '7d' }
  );
};

const sendTokenResponse = (user, statusCode, res, accountType = 'user') => {
  const userType = accountType === 'customer' ? 'customer' : user.userType;
  const token = generateToken(user._id, userType, accountType);
  const refreshToken = generateRefreshToken(user._id, userType, accountType);

  const options = {
    expires: new Date(Date.now() + (process.env.JWT_COOKIE_EXPIRE || 24) * 60 * 60 * 1000),
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict'
  };

  
  const userObj = user.toObject();
  delete userObj.password;

  res
    .status(statusCode)
    .cookie('token', token, options)
    .cookie('refreshToken', refreshToken, {
      ...options,
      expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) 
    })
    .json({
      success: true,
      data: {
        user: {
          ...userObj,
          userType,
          accountType
        },
        tokens: {
          accessToken: token,
          refreshToken: refreshToken,
          expiresIn: 24 * 60 * 60 
        }
      }
    });
};

export const login = async (req, res, next) => {
  try {
    const { username, password, accountType = 'user' } = req.body;    
    if (!username || !password) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Please provide username/email and password',
          timestamp: new Date().toISOString()
        }
      });
    }

    let user;
    let Model;

    if (accountType === 'customer') {
      Model = Customer;
      user = await Model.findOne({ 
        $or: [
          { username },
          { email: username }
        ],
        'status.isActive': true 
      }).select('+password').populate('assignedSalesHead assignedAccountsHead', 'firstName lastName');
    } else {
      Model = User;
      
      user = await Model.findOne({ 
        $or: [{ username }, { email: username }],
        isActive: true 
      }).select('+password').populate('createdBy supervisor', 'firstName lastName userType');
    }

    if (!user) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'INVALID_CREDENTIALS',
          message: 'Invalid credentials',
          timestamp: new Date().toISOString()
        }
      });
    }

    if (user.isLocked) {
      return res.status(423).json({
        success: false,
        error: {
          code: 'ACCOUNT_LOCKED',
          message: 'Account is temporarily locked due to too many failed login attempts',
          timestamp: new Date().toISOString()
        }
      });
    }

    if (accountType === 'customer' && user.status.isSuspended) {
      return res.status(423).json({
        success: false,
        error: {
          code: 'ACCOUNT_SUSPENDED',
          message: `Account is suspended: ${user.status.suspensionReason}`,
          timestamp: new Date().toISOString()
        }
      });
    }

    const isMatch = await user.comparePassword(password);

    if (!isMatch) {
      
      await user.incLoginAttempts();
      
      return res.status(401).json({
        success: false,
        error: {
          code: 'INVALID_CREDENTIALS',
          message: 'Invalid credentials',
          timestamp: new Date().toISOString()
        }
      });
    }

    await user.resetLoginAttempts();
    await user.updateLastLogin();

    sendTokenResponse(user, 200, res, accountType);

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Internal server error during login',
        timestamp: new Date().toISOString()
      }
    });
  }
};

export const refreshToken = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'MISSING_REFRESH_TOKEN',
          message: 'Refresh token is required',
          timestamp: new Date().toISOString()
        }
      });
    }

    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET);

    if (decoded.type !== 'refresh') {
      return res.status(401).json({
        success: false,
        error: {
          code: 'INVALID_TOKEN_TYPE',
          message: 'Invalid token type',
          timestamp: new Date().toISOString()
        }
      });
    }

    const newAccessToken = generateToken(decoded.id, decoded.userType, decoded.accountType);

    res.status(200).json({
      success: true,
      data: {
        accessToken: newAccessToken,
        expiresIn: 24 * 60 * 60
      }
    });

  } catch (error) {
    console.error('Refresh token error:', error);
    res.status(401).json({
      success: false,
      error: {
        code: 'INVALID_REFRESH_TOKEN',
        message: 'Invalid or expired refresh token',
        timestamp: new Date().toISOString()
      }
    });
  }
};

export const logout = async (req, res, next) => {
  try {
    res
      .status(200)
      .cookie('token', 'none', {
        expires: new Date(Date.now() + 10 * 1000),
        httpOnly: true
      })
      .cookie('refreshToken', 'none', {
        expires: new Date(Date.now() + 10 * 1000),
        httpOnly: true
      })
      .json({
        success: true,
        message: 'Logged out successfully'
      });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Internal server error during logout',
        timestamp: new Date().toISOString()
      }
    });
  }
};

export const getMe = async (req, res, next) => {
  try {
    let user;
    
    if (req.user.accountType === 'customer') {
      user = await Customer.findById(req.user.id)
        .populate('assignedSalesHead assignedAccountsHead', 'firstName lastName userType');
    } else {
      user = await User.findById(req.user.id)
        .populate('createdBy supervisor', 'firstName lastName userType');
    }

    if (!user) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'USER_NOT_FOUND',
          message: 'User not found',
          timestamp: new Date().toISOString()
        }
      });
    }
    res.status(200).json({
      success: true,
      data: {
        user: {
          ...user.toObject(),
          userType: req.user.userType,
          accountType: req.user.accountType
        }
      }
    });
  } catch (error) {
    console.error('Get me error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Internal server error',
        timestamp: new Date().toISOString()
      }
    });
  }
};

export const forgotPassword = async (req, res, next) => {
  try {
    const { email, accountType = 'user' } = req.body;
    if (!email) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Please provide email address',
          timestamp: new Date().toISOString()
        }
      });
    }

    let user;
    let Model = accountType === 'customer' ? Customer : User;

    if (accountType === 'customer') {
      user = await Model.findOne({ email, 'status.isActive': true });
    } else {
      user = await Model.findOne({ email, isActive: true });
    }

    if (!user) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'USER_NOT_FOUND',
          message: 'No user found with that email address',
          timestamp: new Date().toISOString()
        }
      });
    }
    const resetToken = crypto.randomBytes(20).toString('hex');  
    user.passwordResetToken = crypto
      .createHash('sha256')
      .update(resetToken)
      .digest('hex');

    
    user.passwordResetExpires = Date.now() + 10 * 60 * 1000; 

    await user.save({ validateBeforeSave: false });
    const resetUrl = `${req.protocol}://${req.get('host')}/api/v1/auth/reset-password/${resetToken}`;
    res.status(200).json({
      success: true,
      message: 'Password reset link sent to email',
      
      ...(process.env.NODE_ENV === 'development' && { resetToken })
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Email could not be sent',
        timestamp: new Date().toISOString()
      }
    });
  }
};

export const resetPassword = async (req, res, next) => {
  try {
    const { password, accountType = 'user' } = req.body;

    if (!password) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Please provide new password',
          timestamp: new Date().toISOString()
        }
      });
    }
    const resetPasswordToken = crypto
      .createHash('sha256')
      .update(req.params.resettoken)
      .digest('hex');

    let Model = accountType === 'customer' ? Customer : User;

    const user = await Model.findOne({
      passwordResetToken: resetPasswordToken,
      passwordResetExpires: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_TOKEN',
          message: 'Invalid or expired reset token',
          timestamp: new Date().toISOString()
        }
      });
    }
    user.password = password;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;

    await user.save();

    sendTokenResponse(user, 200, res, accountType);

  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Password could not be reset',
        timestamp: new Date().toISOString()
      }
    });
  }
};

export const updatePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Please provide current password and new password',
          timestamp: new Date().toISOString()
        }
      });
    }
    let Model = req.user.accountType === 'customer' ? Customer : User;
    const user = await Model.findById(req.user.id).select('+password');
    if (!(await user.comparePassword(currentPassword))) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'INVALID_PASSWORD',
          message: 'Current password is incorrect',
          timestamp: new Date().toISOString()
        }
      });
    }

    user.password = newPassword;
    await user.save();

    sendTokenResponse(user, 200, res, req.user.accountType);

  } catch (error) {
    console.error('Update password error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Password could not be updated',
        timestamp: new Date().toISOString()
      }
    });
  }
};

export const registerCustomer = async (req, res, next) => {
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
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Please provide all required fields',
          timestamp: new Date().toISOString()
        }
      });
    }
    
    const existingCustomer = await Customer.findOne({ email });
    if (existingCustomer) {
      return res.status(409).json({
        success: false,
        error: {
          code: 'CUSTOMER_EXISTS',
          message: 'Customer with this email already exists',
          timestamp: new Date().toISOString()
        }
      });
    }
    const salesHead = await User.findOne({ 
      userType: { $in: ['supervisor', 'user'] },
      department: 'Sales',
      region: region,
      isActive: true 
    });

    if (!salesHead) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'NO_SALES_HEAD',
          message: 'No sales representative available for your region',
          timestamp: new Date().toISOString()
        }
      });
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

    res.status(201).json({
      success: true,
      message: 'Customer registration successful. Account pending verification.',
      data: {
        customer: customerObj
      }
    });

  } catch (error) {
    console.error('Customer registration error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Customer registration failed',
        timestamp: new Date().toISOString()
      }
    });
  }
};