import express from 'express';
import { customerLogin, customerRegister, customerForgotPassword, customerResetPassword, customerUpdatePassword, getCustomerProfile } from '../../controllers/Auth/Customers/CustomerAuth.js';
import { logout, refreshToken } from '../../Utils/Auth/tokenUtils.js';
import { protectCustomer } from '../../middlewares/Auth/CustomerMiddleware/customerMiddleware.js';

const customerRouter = express.Router();

customerRouter.post('/login',  customerLogin);
customerRouter.post('/register', customerRegister);
customerRouter.post('/forgot-password',  customerForgotPassword);
customerRouter.put('/reset-password/:resettoken', customerResetPassword);
customerRouter.get('/profile', protectCustomer, getCustomerProfile);
customerRouter.put('/update-password', protectCustomer, customerUpdatePassword);


customerRouter.post('/refresh', refreshToken);
customerRouter.post('/logout', protectCustomer, logout);

export default customerRouter;