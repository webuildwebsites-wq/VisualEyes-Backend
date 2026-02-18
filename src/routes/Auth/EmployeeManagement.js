import express from 'express';
import { ProtectUser } from '../../middlewares/Auth/AdminMiddleware/adminMiddleware.js';
import { createSubAdmin,  updateEmployeeDetails, deactivateEmployee, getEmployeeDetails, getSupervisorsByDepartment, createSupervisorOrEmployee, getAllEmployees, getFilteredEmployees } from '../../core/controllers/Auth/Employee/EmployeeManagement.js';
import { requireSuperAdmin, requireSubAdminOrHigher, canManageEmployee } from '../../middlewares/Auth/AdminMiddleware/roleMiddleware.js';

const employeeManagementRouter = express.Router();

employeeManagementRouter.use(ProtectUser);

employeeManagementRouter.post('/create-admin', requireSuperAdmin, createSubAdmin);
employeeManagementRouter.post('/create-supervisor-employee', requireSubAdminOrHigher, createSupervisorOrEmployee);

employeeManagementRouter.get('/get-all-employees', canManageEmployee, getAllEmployees);
employeeManagementRouter.get('/get-filtered-employees', canManageEmployee, getFilteredEmployees);

employeeManagementRouter.get('/get-employee/:userId', canManageEmployee, getEmployeeDetails);
employeeManagementRouter.put('/update-employee/:userId', canManageEmployee, updateEmployeeDetails);
employeeManagementRouter.delete('/delete-employee/:userId', canManageEmployee, deactivateEmployee);

employeeManagementRouter.get('/supervisors', requireSubAdminOrHigher, getSupervisorsByDepartment);

export default employeeManagementRouter;