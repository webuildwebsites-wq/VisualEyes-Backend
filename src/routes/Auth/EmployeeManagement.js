import express from 'express';
import { ProtectUser } from '../../middlewares/Auth/AdminMiddleware/adminMiddleware.js';
import { updateEmployeeDetails, deactivateEmployee, getEmployeeDetails, getSupervisorsByDepartment, getAllEmployees, createEmployee, createDraftEmployee, getAllDraftEmployee, getMyDraftEmployee, getDraftEmployeeDetails, restoreEmployee, getDeletedEmployees, getEmployeesUnderSupervisor, getEmployeesUnderTeamLead, getDepartmentHierarchy, getMultipleEmployees } from '../../core/controllers/Auth/Employee/EmployeeManagement.js';
import {  deactivateEmployeeDraft, updateDraftEmployee, restoreEmployeeDraft, getDeletedEmployeeDrafts } from '../../core/controllers/Auth/Employee/draft.employee.controller.js';
import { requireSubAdminOrHigher, canManageEmployee } from '../../middlewares/Auth/AdminMiddleware/roleMiddleware.js';

const employeeManagementRouter = express.Router();

employeeManagementRouter.use(ProtectUser);

employeeManagementRouter.post('/create-employee',  createEmployee);
employeeManagementRouter.post('/create-draft-employee',  createDraftEmployee);


employeeManagementRouter.get('/get-all-employees', canManageEmployee, getAllEmployees);

employeeManagementRouter.get('/get-all-draft-employee', canManageEmployee, getAllDraftEmployee);
employeeManagementRouter.get('/get-my-draft-employee', ProtectUser, getMyDraftEmployee);

employeeManagementRouter.get('/get-employee/:userId', canManageEmployee, getEmployeeDetails);
employeeManagementRouter.post('/get-multiple-employees', canManageEmployee, getMultipleEmployees);
employeeManagementRouter.get('/get-draft-employee/:userId',  getDraftEmployeeDetails);

employeeManagementRouter.put('/update-employee/:userId', canManageEmployee, updateEmployeeDetails);
employeeManagementRouter.put('/update-draft-employee/:draftId', canManageEmployee, updateDraftEmployee);

employeeManagementRouter.delete('/deactivate-draft-employee/:draftId',  deactivateEmployeeDraft);
employeeManagementRouter.delete('/delete-employee/:userId',  deactivateEmployee);

// RESTORE EMPLOYEE (RECYCLE BIN)
employeeManagementRouter.put('/restore-employee/:userId', restoreEmployee);
employeeManagementRouter.put('/restore-draft-employee/:draftId', restoreEmployeeDraft);

// GET DELETED EMPLOYEES (RECYCLE BIN)
employeeManagementRouter.get('/get-deleted-employees', getDeletedEmployees);
employeeManagementRouter.get('/get-deleted-draft-employees', getDeletedEmployeeDrafts);

employeeManagementRouter.get('/supervisors', requireSubAdminOrHigher, getSupervisorsByDepartment);

// HIERARCHICAL ROUTES
employeeManagementRouter.get('/supervisor/:supervisorId/employees', canManageEmployee, getEmployeesUnderSupervisor);
employeeManagementRouter.get('/teamlead/:teamLeadId/employees', canManageEmployee, getEmployeesUnderTeamLead);
employeeManagementRouter.get('/department/:departmentId/hierarchy', canManageEmployee, getDepartmentHierarchy);

export default employeeManagementRouter;