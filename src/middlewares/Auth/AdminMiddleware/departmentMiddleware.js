import { sendErrorResponse } from '../../../Utils/response/responseHandler.js';

export const requireSalesDepartment = (req, res, next) => {
  const department = req.user.Department?.name || req.user.Department;
  
  if (department !== 'SALES') {
    return sendErrorResponse(res, 403, 'FORBIDDEN', 'Access denied. Sales department access required.');
  }
  next();
};

export const requireFinanceDepartment = (req, res, next) => {
  const department = req.user.Department?.name || req.user.Department;
  
  if (department !== 'FINANCE') {
    return sendErrorResponse(res, 403, 'FORBIDDEN', 'Access denied. Finance department access required.');
  }
  next();
};

export const requireSalesOrFinance = (req, res, next) => {
  const department = req.user.Department?.name || req.user.Department;
  
  if (!['SALES', 'FINANCE'].includes(department)) {
    return sendErrorResponse(res, 403, 'FORBIDDEN', 'Access denied. Sales or Finance department access required.');
  }
  next();
};

export const attachDepartmentInfo = (req, res, next) => {
  if (req.user) {
    req.userDepartment = req.user.Department?.name || req.user.Department;
  }
  next();
};
