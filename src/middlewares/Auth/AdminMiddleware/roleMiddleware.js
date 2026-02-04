import { sendErrorResponse } from '../../../Utils/response/responseHandler.js';

export const requireSuperAdmin = (req, res, next) => {
  if (req.user.userType !== 'superadmin') {
    return sendErrorResponse(res, 403, 'FORBIDDEN', 'Access denied. SuperAdmin privileges required.');
  }
  next();
};

export const requireSubAdminOrHigher = (req, res, next) => {
  if (!['superadmin', 'subadmin'].includes(req.user.userType)) {
    return sendErrorResponse(res, 403, 'FORBIDDEN', 'Access denied. SubAdmin or higher privileges required.');
  }
  next();
};

export const requireSupervisorOrHigher = (req, res, next) => {
  if (!['superadmin', 'subadmin', 'supervisor'].includes(req.user.userType)) {
    return sendErrorResponse(res, 403, 'FORBIDDEN', 'Access denied. Supervisor or higher privileges required.');
  }
  next();
};

export const requirePermission = (permission) => {
  return (req, res, next) => {
    if (!req.user.permissions || !req.user.permissions[permission]) {
      return sendErrorResponse(res, 403, 'FORBIDDEN', `Access denied. ${permission} permission required.`);
    }
    next();
  };
};

export const canManageUsers = (req, res, next) => {
  const userType = req.user.userType;
  
  if (!['superadmin', 'subadmin', 'supervisor'].includes(userType)) {
    return sendErrorResponse(res, 403, 'FORBIDDEN', 'Access denied. User management privileges required.');
  }
  
  if (!req.user.permissions?.canManageUsers) {
    return sendErrorResponse(res, 403, 'FORBIDDEN', 'Access denied. User management permission not granted.');
  }
  next();
};

export const validateDepartmentAccess = (req, res, next) => {
  
  if (req.user.userType === 'subadmin') {
    const { department, region } = req.body;
    
    if (department && department !== req.user.department) {
      return sendErrorResponse(res, 403, 'FORBIDDEN', 'Access denied. Cannot manage users outside your department.');
    }
    
    if (region && region !== req.user.region) {
      return sendErrorResponse(res, 403, 'FORBIDDEN', 'Access denied. Cannot manage users outside your region.');
    }
  }
  
  next();
};