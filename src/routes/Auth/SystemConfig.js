import express from 'express';
import {
  getConfigsByType,
  getAllConfigs,
  createConfig,
  updateConfigValue,
  permanentDeleteConfig
} from '../../core/controllers/Auth/Employee/SystemConfigController.js';
import { ProtectUser } from '../../middlewares/Auth/AdminMiddleware/adminMiddleware.js';
import { isSuperAdminOrAdmin } from '../../middlewares/Auth/AdminMiddleware/superAdminMiddleware.js';

const router = express.Router();

router.get('/all', ProtectUser, getAllConfigs);

router.get('/:configType', ProtectUser, getConfigsByType);

router.post('/', ProtectUser, isSuperAdminOrAdmin, createConfig);

router.put('/:id', ProtectUser, isSuperAdminOrAdmin, updateConfigValue);

router.delete('/permanent/:id', ProtectUser, isSuperAdminOrAdmin, permanentDeleteConfig);

export default router;
