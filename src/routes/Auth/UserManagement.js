import express from 'express';
import { ProtectUser } from '../../middlewares/Auth/AdminMiddleware/adminMiddleware.js';
import { createSubAdmin, createSupervisorOrUser, getUsersByHierarchy, updateUser, deactivateUser, getUserDetails } from '../../core/controllers/Auth/User/UserManagement.js';
import { requireSuperAdmin, requireSubAdminOrHigher, canManageUsers, validateDepartmentAccess } from '../../middlewares/Auth/AdminMiddleware/roleMiddleware.js';

const userManagementRouter = express.Router();

userManagementRouter.use(ProtectUser);

userManagementRouter.post('/create-subadmin', requireSuperAdmin, createSubAdmin);
userManagementRouter.post('/create-supervisor-user', requireSubAdminOrHigher, validateDepartmentAccess, createSupervisorOrUser);

userManagementRouter.get('/get-users', canManageUsers, getUsersByHierarchy);
userManagementRouter.get('/get-users/:userId', canManageUsers, getUserDetails);
userManagementRouter.put('/update-users/:userId', canManageUsers, validateDepartmentAccess, updateUser);
userManagementRouter.delete('/delete-users/:userId', canManageUsers, deactivateUser);


export default userManagementRouter;