import express from 'express';
import { customerForgotPassword, customerLogin,customerResetPassword,customerUpdatePassword, customerBasicRegistration, financeCompleteCustomer, updateCustomerProfile, resetCustomerCredit, sendCustomerForCorrection, resubmitCorrectedCustomer, updateCustomerShipToDetails } from '../../core/controllers/Auth/Customers/CustomerAuth.js';
import { getAllCustomers, getCustomerById, getCustomerProfile, getDraftCustomers, getPendingFinanceCustomers, getCorrectionRequiredCustomers } from '../../core/controllers/Auth/Customers/customer.get.controller.js';
import { requireSalesFinanceOrSuperAdmin, attachDepartmentInfo } from '../../middlewares/Auth/AdminMiddleware/departmentMiddleware.js';
import { protectCustomer } from '../../middlewares/Auth/CustomerMiddleware/customerMiddleware.js';
import { verifyCustomerEmail } from '../../core/controllers/Auth/Customers/VarifyAccount.js';
import { ProtectUser } from '../../middlewares/Auth/AdminMiddleware/adminMiddleware.js';
import { logout, refreshToken } from '../../Utils/Auth/tokenUtils.js';
import { customerDraftRegistration, deactivateCustomer, deactivateDraftCustomer, getAllDraftCustomers, getMyDraftCustomers, updateDraftCustomer, restoreCustomer, restoreDraftCustomer, getDeletedCustomers, getDeletedDraftCustomers } from '../../core/controllers/Auth/Customers/darft.customers.controller.js';

const customerRouter = express.Router();

// Authentication routes
customerRouter.post('/login',  customerLogin);
customerRouter.post('/register', ProtectUser, attachDepartmentInfo, requireSalesFinanceOrSuperAdmin, customerBasicRegistration);

customerRouter.post('/draft-register', protectCustomer, attachDepartmentInfo, customerDraftRegistration);

// FINANCE COMPLETE
customerRouter.put('/:customerId/finance-complete', ProtectUser, attachDepartmentInfo, financeCompleteCustomer);

// SEND CUSTOMER BACK FOR CORRECTION (Finance/SuperAdmin only)
customerRouter.put('/:customerId/send-for-correction', ProtectUser, attachDepartmentInfo, sendCustomerForCorrection);

// RESUBMIT CORRECTED CUSTOMER (Sales can resubmit after corrections)
customerRouter.put('/:customerId/resubmit-correction', ProtectUser, attachDepartmentInfo, resubmitCorrectedCustomer);

// UPDATE CUSTOMER PROFILE
customerRouter.put('/update-profile/:customerId', ProtectUser, updateCustomerProfile);

// UPDATE CUSTOMER SHIP-TO DETAILS (Finance/SuperAdmin only)
customerRouter.put('/:customerId/update-ship-to-details', ProtectUser, attachDepartmentInfo, updateCustomerShipToDetails);

// RESET CUSTOMER CREDIT (Finance/SuperAdmin only)
customerRouter.put('/reset-credit/:customerId', ProtectUser, attachDepartmentInfo, resetCustomerCredit);

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
customerRouter.get('/customer/correction-required', ProtectUser, attachDepartmentInfo, getCorrectionRequiredCustomers);
customerRouter.get('/get-all-customers', ProtectUser, getAllCustomers);
customerRouter.get('/customers-profile', protectCustomer, getCustomerProfile);
customerRouter.get('/get-customer/:customerId', getCustomerById);
customerRouter.get('/get-draft-customer/:customerId',  getDraftCustomers);


// GET DRAFT CUSTOMERS
customerRouter.get('/get-all-draft-customers', ProtectUser, attachDepartmentInfo, requireSalesFinanceOrSuperAdmin, getAllDraftCustomers);
customerRouter.get('/get-my-draft-customers', ProtectUser, attachDepartmentInfo, requireSalesFinanceOrSuperAdmin, getMyDraftCustomers);

// UPDATE DRAFT CUSTOMER
customerRouter.put('/update-draft-customer/:draftId', ProtectUser, attachDepartmentInfo, requireSalesFinanceOrSuperAdmin, updateDraftCustomer);

// DEACTIVATE CUSTOMER
customerRouter.delete('/deactivate-customer/:customerId', ProtectUser, attachDepartmentInfo, requireSalesFinanceOrSuperAdmin, deactivateCustomer);
customerRouter.delete('/deactivate-draft-customer/:draftId', ProtectUser, attachDepartmentInfo,  deactivateDraftCustomer);

// RESTORE CUSTOMER (RECYCLE BIN)
customerRouter.put('/restore-customer/:customerId', ProtectUser, attachDepartmentInfo, requireSalesFinanceOrSuperAdmin, restoreCustomer);
customerRouter.put('/restore-draft-customer/:draftId', ProtectUser, attachDepartmentInfo, restoreDraftCustomer);

// GET DELETED CUSTOMERS (RECYCLE BIN)
customerRouter.get('/get-deleted-customers', ProtectUser, attachDepartmentInfo, requireSalesFinanceOrSuperAdmin, getDeletedCustomers);
customerRouter.get('/get-deleted-draft-customers', ProtectUser, attachDepartmentInfo, getDeletedDraftCustomers);


export default customerRouter;