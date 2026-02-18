import { sendSuccessResponse } from '../../../Utils/response/responseHandler.js';

export const isSuperAdminOrAdmin = (req, res, next) => {
  try {
    if (!req.user.EmployeeType) {
      return sendSuccessResponse(res, 'Authentication required', 401);
    }

    const allowedEmployeeType = ['SUPERADMIN', 'ADMIN'];
    
    if (!allowedEmployeeType.includes(req.user.EmployeeType)) {
      return sendSuccessResponse(res, 'Access denied. Only SUPERADMIN or ADMIN can perform this action', 403);
    }

    next();
  } catch (error) {
    console.error('SuperAdmin middleware error:', error);
    return sendSuccessResponse(res, 'Authorization failed', 500);
  }
};
