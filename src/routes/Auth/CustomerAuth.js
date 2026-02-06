import express from 'express';
import { customerForgotPassword, customerLogin, customerRegister, customerResetPassword, customerUpdatePassword, getCustomerProfile } from '../../core/controllers/Auth/Customers/CustomerAuth.js';
import { protectCustomer } from '../../middlewares/Auth/CustomerMiddleware/customerMiddleware.js';
import { logout, refreshToken } from '../../Utils/Auth/tokenUtils.js';
import { verifyCustomerEmail } from '../../core/controllers/Auth/Customers/VarifyAccount.js';
const customerRouter = express.Router();

customerRouter.post('/login',  customerLogin);
customerRouter.post('/register', customerRegister);

customerRouter.post('/forgot-password',  customerForgotPassword);
customerRouter.put('/reset-password/:resettoken', customerResetPassword);
customerRouter.get('/profile', protectCustomer, getCustomerProfile);
customerRouter.put('/update-password', protectCustomer, customerUpdatePassword);

customerRouter.post('/verify-email', verifyCustomerEmail);

customerRouter.post('/refresh', refreshToken);
customerRouter.post('/logout', protectCustomer, logout);

export default customerRouter;