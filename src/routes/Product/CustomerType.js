import express from 'express';
import {
  createCustomerType,
  getAllCustomerTypes,
  getCustomerTypeById,
  updateCustomerType,
  deleteCustomerType
} from '../../core/controllers/Product/CustomerTypeController.js';
import { ProtectUser } from '../../middlewares/Auth/AdminMiddleware/adminMiddleware.js';

const customerTypeRouter = express.Router();

customerTypeRouter.use(ProtectUser);

customerTypeRouter.post('/', createCustomerType);
customerTypeRouter.get('/', getAllCustomerTypes);
customerTypeRouter.get('/:id', getCustomerTypeById);
customerTypeRouter.put('/:id', updateCustomerType);
customerTypeRouter.delete('/:id', deleteCustomerType);

export default customerTypeRouter;
