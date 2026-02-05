import express from 'express';
import { ProtectUser } from '../../middlewares/Auth/AdminMiddleware/adminMiddleware.js';
import { createSubAdmin, createSupervisorOrUser, getUsersByHierarchy, updateUser, deactivateUser, getUserDetails,getDepartmentStatistics,getSupervisorsByDepartment } from '../../core/controllers/Auth/User/UserManagement.js';
import { requireSuperAdmin, requireSubAdminOrHigher, canManageUsers } from '../../middlewares/Auth/AdminMiddleware/roleMiddleware.js';

const userManagementRouter = express.Router();

userManagementRouter.use(ProtectUser);

userManagementRouter.post('/create-subadmin', requireSuperAdmin, createSubAdmin);
userManagementRouter.post('/create-supervisor-user', requireSubAdminOrHigher, createSupervisorOrUser);

userManagementRouter.get('/get-users', canManageUsers, getUsersByHierarchy);
userManagementRouter.get('/get-user/:userId', canManageUsers, getUserDetails);
userManagementRouter.put('/update-user/:userId', canManageUsers, updateUser);
userManagementRouter.delete('/delete-user/:userId', canManageUsers, deactivateUser);

userManagementRouter.get('/supervisors', requireSubAdminOrHigher, getSupervisorsByDepartment);

export default userManagementRouter;