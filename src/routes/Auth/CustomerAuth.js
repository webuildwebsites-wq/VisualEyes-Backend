import express from 'express';
import { customerForgotPassword, customerLogin,customerResetPassword,customerUpdatePassword, customerBasicRegistration, financeCompleteCustomer } from '../../core/controllers/Auth/Customers/CustomerAuth.js';
import { getAllCustomers, getCustomerById, getCustomerProfile, getFilteredCustomers, getPendingFinanceCustomers } from '../../core/controllers/Auth/Customers/customer.get.controller.js';
import { requireSalesFinanceOrSuperAdmin, attachDepartmentInfo } from '../../middlewares/Auth/AdminMiddleware/departmentMiddleware.js';
import { protectCustomer } from '../../middlewares/Auth/CustomerMiddleware/customerMiddleware.js';
import { verifyCustomerEmail } from '../../core/controllers/Auth/Customers/VarifyAccount.js';
import { ProtectUser } from '../../middlewares/Auth/AdminMiddleware/adminMiddleware.js';
import { logout, refreshToken } from '../../Utils/Auth/tokenUtils.js';

const customerRouter = express.Router();

// Authentication routes
customerRouter.post('/login',  customerLogin);
customerRouter.post('/register', ProtectUser, attachDepartmentInfo, requireSalesFinanceOrSuperAdmin, customerBasicRegistration);
customerRouter.put('/:customerId/finance-update', ProtectUser, attachDepartmentInfo, financeCompleteCustomer);

// FORGOT PASSWORD
customerRouter.post('/forgot-password',  customerForgotPassword);
customerRouter.put('/reset-password/:resettoken', customerResetPassword);
customerRouter.put('/update-password', protectCustomer, customerUpdatePassword);
customerRouter.post('/verify-email', verifyCustomerEmail);

// TOKEN
customerRouter.post('/refresh', refreshToken);
customerRouter.post('/logout', protectCustomer, logout);

// GET ALL THE REQUIRED DETAILS
customerRouter.get('/customer/pending-finance', ProtectUser, getPendingFinanceCustomers);
customerRouter.get('/get-all-customers', ProtectUser, getAllCustomers);
customerRouter.get('/customers-profile', protectCustomer, getCustomerProfile);
customerRouter.get('/get-customer/:customerId', getCustomerById);

export default customerRouter;