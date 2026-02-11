import express from 'express';
import { ProtectUser } from '../../middlewares/Auth/AdminMiddleware/adminMiddleware.js';
import { createSubAdmin, getEmployeesByHierarchy, updateEmployeeDetails, deactivateEmployee, getEmployeeDetails, getSupervisorsByDepartment, createSupervisorOrEmployee } from '../../core/controllers/Auth/Employee/EmployeeManagement.js';
import { requireSuperAdmin, requireSubAdminOrHigher, canManageUsers } from '../../middlewares/Auth/AdminMiddleware/roleMiddleware.js';

const employeeManagementRouter = express.Router();

employeeManagementRouter.use(ProtectUser);

employeeManagementRouter.post('/create-subadmin', requireSuperAdmin, createSubAdmin);
employeeManagementRouter.post('/create-supervisor-user', requireSubAdminOrHigher, createSupervisorOrEmployee);

employeeManagementRouter.get('/get-employees', canManageUsers, getEmployeesByHierarchy);
employeeManagementRouter.get('/get-employee/:userId', canManageUsers, getEmployeeDetails);
employeeManagementRouter.put('/update-employee/:userId', canManageUsers, updateEmployeeDetails);
employeeManagementRouter.delete('/delete-employee/:userId', canManageUsers, deactivateEmployee);

employeeManagementRouter.get('/supervisors', requireSubAdminOrHigher, getSupervisorsByDepartment);

export default employeeManagementRouter;