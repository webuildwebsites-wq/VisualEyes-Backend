import { sendSuccessResponse } from '../../../Utils/response/responseHandler.js';

export const isSuperAdminOrAdmin = (req, res, next) => {
  try {
    if (!req.user.UserType) {
      return sendSuccessResponse(res, 'Authentication required', 401);
    }

    const allowedUserTypes = ['SUPERADMIN', 'ADMIN'];
    
    if (!allowedUserTypes.includes(req.user.UserType)) {
      return sendSuccessResponse(res, 'Access denied. Only SUPERADMIN or ADMIN can perform this action', 403);
    }

    next();
  } catch (error) {
    console.error('SuperAdmin middleware error:', error);
    return sendSuccessResponse(res, 'Authorization failed', 500);
  }
};
