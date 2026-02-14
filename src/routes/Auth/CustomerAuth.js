import express from 'express';
import { 
  customerForgotPassword, 
  customerLogin, 
  customerRegister, 
  customerResetPassword, 
  customerUpdatePassword, 
  getCustomerProfile,
  financeApproveCustomer,
  salesApproveCustomer,
  getPendingFinanceApprovals,
  getPendingSalesApprovals,
  getAllCustomersWithApprovalStatus
} from '../../core/controllers/Auth/Customers/CustomerAuth.js';
import { protectCustomer, protectCustomerCreation } from '../../middlewares/Auth/CustomerMiddleware/customerMiddleware.js';
import { logout, refreshToken } from '../../Utils/Auth/tokenUtils.js';
import { verifyCustomerEmail } from '../../core/controllers/Auth/Customers/VarifyAccount.js';
import { ProtectUser } from '../../middlewares/Auth/AdminMiddleware/adminMiddleware.js';
const customerRouter = express.Router();

// Authentication routes
customerRouter.post('/login',  customerLogin);
customerRouter.post('/register', protectCustomerCreation, customerRegister);

customerRouter.post('/forgot-password',  customerForgotPassword);
customerRouter.put('/reset-password/:resettoken', customerResetPassword);
customerRouter.get('/profile', protectCustomer, getCustomerProfile);
customerRouter.put('/update-password', protectCustomer, customerUpdatePassword);

customerRouter.post('/verify-email', verifyCustomerEmail);

customerRouter.post('/refresh', refreshToken);
customerRouter.post('/logout', protectCustomer, logout);

// Approval workflow routes
customerRouter.put('/finance-approve/:customerId', ProtectUser, financeApproveCustomer);
customerRouter.put('/sales-approve/:customerId', ProtectUser, salesApproveCustomer);

customerRouter.get('/pending-finance-approvals', ProtectUser, getPendingFinanceApprovals);
customerRouter.get('/pending-sales-approvals', ProtectUser, getPendingSalesApprovals);

customerRouter.get('/all-with-approval-status', ProtectUser, getAllCustomersWithApprovalStatus);

export default customerRouter;