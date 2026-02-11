import express from 'express';
import { employeeLogin, getEmployeeProfile, employeeForgotPassword, employeeUpdatePassword, employeeResetPassword } from '../../core/controllers/Auth/Employee/EmployeeAuth.js';
import { logout, refreshToken } from '../../Utils/Auth/tokenUtils.js';
import { ProtectUser } from "../../middlewares/Auth/AdminMiddleware/adminMiddleware.js"
import { verifyUserEmail } from '../../core/controllers/Auth/Employee/VarifyAccount.js';

const employeeRouter = express.Router();

employeeRouter.post('/login', employeeLogin);
employeeRouter.get('/profile', ProtectUser, getEmployeeProfile);

employeeRouter.post('/verify-email', verifyUserEmail);

employeeRouter.post('/forgot-password', employeeForgotPassword);
employeeRouter.put('/update-password', ProtectUser, employeeUpdatePassword);
employeeRouter.put('/reset-password/:resettoken', employeeResetPassword);

employeeRouter.post('/refresh', refreshToken);
employeeRouter.post('/logout', ProtectUser, logout);

export default employeeRouter;