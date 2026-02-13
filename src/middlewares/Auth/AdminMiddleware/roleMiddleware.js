import { sendErrorResponse } from '../../../Utils/response/responseHandler.js';

export const requireSuperAdmin = (req, res, next) => {
  if (req.user.UserType !== 'SUPERADMIN') {
    return sendErrorResponse(res, 403, 'FORBIDDEN', 'Access denied. SuperAdmin privileges required.');
  }
  next();
};

export const requireSubAdminOrHigher = (req, res, next) => {
  if (!['SUPERADMIN', 'ADMIN'].includes(req.user.UserType)) {
    return sendErrorResponse(res, 403, 'FORBIDDEN', 'Access denied. Admin or higher privileges required.');
  }
  next();
};

export const requireSupervisorOrHigher = (req, res, next) => {
  if (!['SUPERADMIN', 'ADMIN', 'SUPERVISOR'].includes(req.user.UserType)) {
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
  const UserType = req.user.UserType;
  
  if (!['SUPERADMIN', 'ADMIN', 'SUPERVISOR'].includes(UserType)) {
    return sendErrorResponse(res, 403, 'FORBIDDEN', 'Access denied. Employee management privileges required.');
  }
  
  if (!req.user.permissions?.CanManageUsers) {
    return sendErrorResponse(res, 403, 'FORBIDDEN', 'Access denied. Employee management permission not granted.');
  }
  next();
};