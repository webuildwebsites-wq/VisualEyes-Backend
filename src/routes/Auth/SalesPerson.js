import express from 'express';
import {
  getAllSalesPersons,
  getSalesPersonById
} from '../../core/controllers/Auth/Employee/SalesPersonController.js';
import { ProtectUser } from '../../middlewares/Auth/AdminMiddleware/adminMiddleware.js';

const salesPersonRouter = express.Router();

salesPersonRouter.use(ProtectUser);

salesPersonRouter.get('/', getAllSalesPersons);
salesPersonRouter.get('/:id', getSalesPersonById);

export default salesPersonRouter;
