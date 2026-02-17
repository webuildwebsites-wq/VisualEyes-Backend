import express from 'express';
import {
  createBrand,
  getAllBrands,
  getBrandById,
  updateBrand,
  deleteBrand
} from '../../core/controllers/Product/BrandController.js';
import { ProtectUser } from '../../middlewares/Auth/AdminMiddleware/adminMiddleware.js';

const brandRouter = express.Router();

brandRouter.use(ProtectUser);

brandRouter.post('/', createBrand);
brandRouter.get('/', getAllBrands);
brandRouter.get('/:id', getBrandById);
brandRouter.put('/:id', updateBrand);
brandRouter.delete('/:id', deleteBrand);

export default brandRouter;
