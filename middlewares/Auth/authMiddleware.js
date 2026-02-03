import jwt from 'jsonwebtoken';
import User from '../../models/Auth/User.js';
import Customer from '../../models/Auth/Customer.js';

export const protect = async (req, res, next) => {
  try {
    let token;

    // Check for token in headers
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }
    // Check for token in cookies
    else if (req.cookies.token) {
      token = req.cookies.token;
    }

    // Make sure token exists
    if (!token) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'NO_TOKEN',
          message: 'Not authorized to access this route',
          timestamp: new Date().toISOString()
        }
      });
    }

    try {
      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      let user;
      let Model;

      // Determine which model to use based on account type
      if (decoded.accountType === 'customer') {
        Model = Customer;
        user = await Model.findById(decoded.id).populate('assignedSalesHead', 'firstName lastName');
        
        // Check if customer is active and not suspended
        if (!user || !user.status.isActive || user.status.isSuspended) {
          return res.status(401).json({
            success: false,
            error: {
              code: 'ACCOUNT_INACTIVE',
              message: 'Customer account is inactive or suspended',
              timestamp: new Date().toISOString()
            }
          });
        }
      } else {
        Model = User;
        user = await Model.findById(decoded.id).populate('createdBy supervisor', 'firstName lastName userType');
        
        // Check if user is active
        if (!user || !user.isActive) {
          return res.status(401).json({
            success: false,
            error: {
              code: 'USER_NOT_FOUND',
              message: 'User no longer exists or is inactive',
              timestamp: new Date().toISOString()
            }
          });
        }
      }

      // Check if account is locked
      if (user.isLocked) {
        return res.status(423).json({
          success: false,
          error: {
            code: 'ACCOUNT_LOCKED',
            message: 'Account is temporarily locked',
            timestamp: new Date().toISOString()
          }
        });
      }

      // Add user to request object
      req.user = {
        id: user._id,
        userType: decoded.userType,
        accountType: decoded.accountType || 'user',
        ...user.toObject()
      };

      next();
    } catch (error) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'INVALID_TOKEN',
          message: 'Not authorized to access this route',
          timestamp: new Date().toISOString()
        }
      });
    }
  } catch (error) {
    console.error('Auth middleware error:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Authentication error',
        timestamp: new Date().toISOString()
      }
    });
  }
};

export const authorize = (...userTypes) => {
  return (req, res, next) => {
    if (!userTypes.includes(req.user.userType)) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'INSUFFICIENT_PERMISSIONS',
          message: `User type ${req.user.userType} is not authorized to access this route`,
          timestamp: new Date().toISOString()
        }
      });
    }
    next();
  };
};

export const authorizeAccountType = (...accountTypes) => {
  return (req, res, next) => {
    if (!accountTypes.includes(req.user.accountType)) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'INSUFFICIENT_PERMISSIONS',
          message: `Account type ${req.user.accountType} is not authorized to access this route`,
          timestamp: new Date().toISOString()
        }
      });
    }
    next();
  };
};

export const checkPermission = (permission) => {
  return (req, res, next) => {
    if (req.user.accountType === 'customer') {
      return res.status(403).json({
        success: false,
        error: {
          code: 'INSUFFICIENT_PERMISSIONS',
          message: 'Customers are not authorized for this action',
          timestamp: new Date().toISOString()
        }
      });
    }

    if (req.user.userType === 'superadmin') {
      return next();
    }

    if (!req.user.permissions || !req.user.permissions[permission]) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'INSUFFICIENT_PERMISSIONS',
          message: `Permission '${permission}' is required to access this route`,
          timestamp: new Date().toISOString()
        }
      });
    }

    next();
  };
};

export const checkDepartmentAccess = (req, res, next) => {
  if (req.user.accountType === 'customer') {
    return next();
  }

  if (['superadmin', 'subadmin'].includes(req.user.userType)) {
    return next();
  }

  const requestedDepartment = req.params.departmentId || req.body.department || req.query.department;
  
  if (requestedDepartment && requestedDepartment !== req.user.department) {
    return res.status(403).json({
      success: false,
      error: {
        code: 'DEPARTMENT_ACCESS_DENIED',
        message: 'Access denied to this department',
        timestamp: new Date().toISOString()
      }
    });
  }

  next();
};

export const checkRegionAccess = (req, res, next) => {
  if (req.user.accountType === 'user' && ['superadmin', 'subadmin'].includes(req.user.userType)) {
    return next();
  }

  const requestedRegion = req.params.regionId || req.body.region || req.query.region;
  
  if (requestedRegion && requestedRegion !== req.user.region) {
    return res.status(403).json({
      success: false,
      error: {
        code: 'REGION_ACCESS_DENIED',
        message: 'Access denied to this region',
        timestamp: new Date().toISOString()
      }
    });
  }

  next();
};

export const checkUserManagementAccess = async (req, res, next) => {
  try {
    if (req.user.accountType === 'customer') {
      return res.status(403).json({
        success: false,
        error: {
          code: 'INSUFFICIENT_PERMISSIONS',
          message: 'Customers cannot manage users',
          timestamp: new Date().toISOString()
        }
      });
    }

    const targetUserId = req.params.userId || req.body.userId;
    
    if (!targetUserId) {
      return next(); 
    }

    if (req.user.userType === 'superadmin') {
      return next();
    }

    if (req.user.userType === 'subadmin') {
      const targetUser = await User.findById(targetUserId);
      if (!targetUser) {
        return res.status(404).json({
          success: false,
          error: {
            code: 'USER_NOT_FOUND',
            message: 'Target user not found',
            timestamp: new Date().toISOString()
          }
        });
      }

      if (['subadmin', 'superadmin'].includes(targetUser.userType)) {
        return res.status(403).json({
          success: false,
          error: {
            code: 'INSUFFICIENT_PERMISSIONS',
            message: 'Cannot manage users of equal or higher privilege',
            timestamp: new Date().toISOString()
          }
        });
      }

      return next();
    }

    if (req.user.userType === 'supervisor') {
      const targetUser = await User.findById(targetUserId);
      if (!targetUser) {
        return res.status(404).json({
          success: false,
          error: {
            code: 'USER_NOT_FOUND',
            message: 'Target user not found',
            timestamp: new Date().toISOString()
          }
        });
      }

      if (targetUser.department !== req.user.department ||
          targetUser.region !== req.user.region) {
        return res.status(403).json({
          success: false,
          error: {
            code: 'INSUFFICIENT_PERMISSIONS',
            message: 'Can only manage users in your department and region',
            timestamp: new Date().toISOString()
          }
        });
      }

      return next();
    }

    return res.status(403).json({
      success: false,
      error: {
        code: 'INSUFFICIENT_PERMISSIONS',
        message: 'Not authorized to manage users',
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('User management access check error:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Error checking user management permissions',
        timestamp: new Date().toISOString()
      }
    });
  }
};

export const checkCustomerManagementAccess = (req, res, next) => {
  if (req.user.accountType === 'customer') {
    return res.status(403).json({
      success: false,
      error: {
        code: 'INSUFFICIENT_PERMISSIONS',
        message: 'Customers cannot manage other customers',
        timestamp: new Date().toISOString()
      }
    });
  }

  if (['superadmin', 'subadmin'].includes(req.user.userType)) {
    return next();
  }

  if (['supervisor', 'user'].includes(req.user.userType) && 
      ['Sales', 'Finance', 'Customer Support'].includes(req.user.department)) {
    return next();
  }

  return res.status(403).json({
    success: false,
    error: {
      code: 'INSUFFICIENT_PERMISSIONS',
      message: 'Not authorized to manage customers',
      timestamp: new Date().toISOString()
    }
  });
};

export const authRateLimit = (maxAttempts = 5, windowMs = 15 * 60 * 1000) => {
  const attempts = new Map();

  return (req, res, next) => {
    const key = req.ip + (req.body.username || req.body.email || '');
    const now = Date.now();
    
    for (const [k, v] of attempts.entries()) {
      if (now - v.firstAttempt > windowMs) {
        attempts.delete(k);
      }
    }

    const userAttempts = attempts.get(key);
    
    if (!userAttempts) {
      attempts.set(key, { count: 1, firstAttempt: now });
      return next();
    }

    if (userAttempts.count >= maxAttempts) {
      return res.status(429).json({
        success: false,
        error: {
          code: 'RATE_LIMIT_EXCEEDED',
          message: 'Too many authentication attempts. Please try again later.',
          timestamp: new Date().toISOString(),
          retryAfter: Math.ceil((windowMs - (now - userAttempts.firstAttempt)) / 1000)
        }
      });
    }

    userAttempts.count++;
    next();
  };
};

export const auditLog = (action) => {
  return async (req, res, next) => {
    try {
      req.auditInfo = {
        user: req.user.id,
        userType: req.user.userType,
        accountType: req.user.accountType,
        action: action,
        resource: req.originalUrl,
        method: req.method,
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
        timestamp: new Date()
      };

      next();
    } catch (error) {
      console.error('Audit log middleware error:', error);
      next();
    }
  };
};