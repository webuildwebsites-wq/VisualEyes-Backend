import express from 'express';
import { customerForgotPassword, customerLogin,customerResetPassword,customerUpdatePassword, customerBasicRegistration, financeCompleteCustomer, updateCustomerProfile } from '../../core/controllers/Auth/Customers/CustomerAuth.js';
import { getAllCustomers, getCustomerById, getCustomerProfile, getDraftCustomers, getPendingFinanceCustomers } from '../../core/controllers/Auth/Customers/customer.get.controller.js';
import { requireSalesFinanceOrSuperAdmin, attachDepartmentInfo } from '../../middlewares/Auth/AdminMiddleware/departmentMiddleware.js';
import { protectCustomer } from '../../middlewares/Auth/CustomerMiddleware/customerMiddleware.js';
import { verifyCustomerEmail } from '../../core/controllers/Auth/Customers/VarifyAccount.js';
import { ProtectUser } from '../../middlewares/Auth/AdminMiddleware/adminMiddleware.js';
import { logout, refreshToken } from '../../Utils/Auth/tokenUtils.js';
import { customerDraftRegistration, getAllDraftCustomers, getMyDraftCustomers, updateDraftCustomer } from '../../core/controllers/Auth/Customers/darft.customers.controller.js';

const customerRouter = express.Router();

// Authentication routes
customerRouter.post('/login',  customerLogin);
customerRouter.post('/register', ProtectUser, attachDepartmentInfo, requireSalesFinanceOrSuperAdmin, customerBasicRegistration);

customerRouter.post('/draft-register', ProtectUser, attachDepartmentInfo, requireSalesFinanceOrSuperAdmin, customerDraftRegistration);

// FINANCE COMPLETE
customerRouter.put('/:customerId/finance-complete', ProtectUser, attachDepartmentInfo, financeCompleteCustomer);

// UPDATE CUSTOMER PROFILE
customerRouter.put('/update-profile/:customerId', ProtectUser, updateCustomerProfile);

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
customerRouter.get('/get-draft-customer/:customerId',  getDraftCustomers);


// GET DRAFT CUSTOMERS
customerRouter.get('/get-all-draft-customers', ProtectUser, attachDepartmentInfo, requireSalesFinanceOrSuperAdmin, getAllDraftCustomers);
customerRouter.get('/get-my-draft-customers', ProtectUser, attachDepartmentInfo, requireSalesFinanceOrSuperAdmin, getMyDraftCustomers);

// UPDATE DRAFT CUSTOMER
customerRouter.put('/update-draft-customer/:draftId', ProtectUser, attachDepartmentInfo, requireSalesFinanceOrSuperAdmin, updateDraftCustomer);

export default customerRouter;