import express from 'express';
import { ProtectUser } from '../../middlewares/Auth/AdminMiddleware/adminMiddleware.js';
import { updateEmployeeDetails, deactivateEmployee, getEmployeeDetails, getSupervisorsByDepartment, getAllEmployees, createEmployee, createDraftEmployee, getAllDraftEmployee, getMyDraftEmployee, getDraftEmployeeDetails } from '../../core/controllers/Auth/Employee/EmployeeManagement.js';
import { requireSubAdminOrHigher, canManageEmployee } from '../../middlewares/Auth/AdminMiddleware/roleMiddleware.js';

const employeeManagementRouter = express.Router();

employeeManagementRouter.use(ProtectUser);

employeeManagementRouter.post('/create-employee', requireSubAdminOrHigher, createEmployee);
employeeManagementRouter.post('/create-draft-employee', requireSubAdminOrHigher, createDraftEmployee);


employeeManagementRouter.get('/get-all-employees', canManageEmployee, getAllEmployees);

employeeManagementRouter.get('/get-all-draft-employee', canManageEmployee, getAllDraftEmployee);
employeeManagementRouter.get('/get-my-draft-employee', ProtectUser, getMyDraftEmployee);

employeeManagementRouter.get('/get-employee/:userId', canManageEmployee, getEmployeeDetails);
employeeManagementRouter.get('/get-draft-employee/:userId',  getDraftEmployeeDetails);

employeeManagementRouter.put('/update-employee/:userId', canManageEmployee, updateEmployeeDetails);
employeeManagementRouter.delete('/delete-employee/:userId', canManageEmployee, deactivateEmployee);

employeeManagementRouter.get('/supervisors', requireSubAdminOrHigher, getSupervisorsByDepartment);

export default employeeManagementRouter;