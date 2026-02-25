import express from 'express';
import {
  getAllDepartments,
  getDepartmentById,
  getSubRolesByDepartment,
  createDepartment,
  addSubRole,
  updateSubRole,
  deleteSubRole,
  updateDepartment
} from '../../core/controllers/Auth/Employee/DepartmentController.js';
import { ProtectUser } from '../../middlewares/Auth/AdminMiddleware/adminMiddleware.js';
import { isSuperAdmin } from '../../middlewares/Auth/AdminMiddleware/superAdminMiddleware.js';

const router = express.Router();

// Public routes (authenticated users)
router.get('/get-all-departments', ProtectUser, getAllDepartments);
router.get('/:id', ProtectUser, getDepartmentById);
router.get('/:departmentId/sub-roles', ProtectUser, getSubRolesByDepartment);

// SuperAdmin only routes
router.post('/', ProtectUser, isSuperAdmin, createDepartment);
router.put('/:id', ProtectUser, isSuperAdmin, updateDepartment);

// SuperAdmin or Department Admin routes
router.post('/:departmentId/sub-roles', ProtectUser, addSubRole);
router.put('/:departmentId/sub-roles/:subRoleId', ProtectUser, updateSubRole);
router.delete('/:departmentId/sub-roles/:subRoleId', ProtectUser, deleteSubRole);

export default router;
