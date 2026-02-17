import express from 'express';
import {
  createCategory,
  getAllCategories,
  getCategoriesByBrand,
  getCategoryById,
  updateCategory,
  deleteCategory
} from '../../core/controllers/Product/CategoryController.js';
import { ProtectUser } from '../../middlewares/Auth/AdminMiddleware/adminMiddleware.js';

const categoryRouter = express.Router();

categoryRouter.use(ProtectUser);

categoryRouter.post('/', createCategory);
categoryRouter.get('/', getAllCategories);
categoryRouter.get('/brand/:brandId', getCategoriesByBrand);
categoryRouter.get('/:id', getCategoryById);
categoryRouter.put('/:id', updateCategory);
categoryRouter.delete('/:id', deleteCategory);

export default categoryRouter;
