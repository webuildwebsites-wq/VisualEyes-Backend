import { sendErrorResponse } from '../../../Utils/response/responseHandler.js';

export const requireSalesDepartment = (req, res, next) => {
  const department =  req.user.Department || req.user.Department?.name;
  
  if (department !== 'SALES') {
    return sendErrorResponse(res, 403, 'FORBIDDEN', 'Access denied. Sales department access required.');
  }
  next();
};

export const requireFinanceDepartment = (req, res, next) => {
  const department = req.user.Department || req.user.Department?.name;
  const employeeType = req.user.EmployeeType;
  
  if (employeeType === 'SUPERADMIN' || ['SALES', 'FINANCE'].includes(department)) {
    return next();
  }
  
  return sendErrorResponse(res, 403, 'FORBIDDEN', 'Access denied. Sales, Finance department or SuperAdmin access required.');
};

export const requireSalesOrFinance = (req, res, next) => {
  const department =  req.user.Department || req.user.Department?.name;
  
  if (!['SALES', 'FINANCE'].includes(department)) {
    return sendErrorResponse(res, 403, 'FORBIDDEN', 'Access denied. Sales or Finance department access required.');
  }
  next();
};

export const requireSalesFinanceOrSuperAdmin = (req, res, next) => {
  const department = req.user.Department || req.user.Department?.name;
  const employeeType = req.user.EmployeeType;
  
  if (employeeType === 'SUPERADMIN' || ['SALES', 'FINANCE'].includes(department)) {
    return next();
  }
  
  return sendErrorResponse(res, 403, 'FORBIDDEN', 'Access denied. Sales, Finance department or SuperAdmin access required.');
};

export const attachDepartmentInfo = (req, res, next) => {
  if (req.user) {
    console.log("req.user  : ",req.user);
    req.userDepartment =  req.user.Department || req.user.Department?.name;
  }
  next();
};
