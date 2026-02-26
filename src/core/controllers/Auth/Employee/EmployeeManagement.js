import { sendSuccessResponse, sendErrorResponse } from '../../../../Utils/response/responseHandler.js';
import employeeSchema from '../../../../models/Auth/Employee.js';
import Department from '../../../../models/Auth/Department.js';
import SystemConfig from '../../../../models/Auth/SystemConfig.js';
import Location from '../../../../models/Location/Location.js';
import mongoose from 'mongoose';

export const createEmployee = async (req, res) => {
  try {
    const { employeeType, username, employeeName, email, password, phone, address, department, departmentRefId, country, 
    pincode, expiry, zone, zoneRefId, aadharCard, panCard, lab, labRefId, subRoles, aadharCardImg, panCardImg } = req.body;

    let assignedSupervisor = null;

    if (!employeeType || !username  || !employeeName || !country || !email || !password || !phone || !address) {
      return sendErrorResponse(res, 400, 'VALIDATION_ERROR', 'All required fields must be provided');
    }

    // Validate ObjectId formats
    if (departmentRefId && !mongoose.Types.ObjectId.isValid(departmentRefId)) {
      return sendErrorResponse(res, 400, 'INVALID_ID', 'Invalid department ID format');
    }

    if (zoneRefId && !mongoose.Types.ObjectId.isValid(zoneRefId)) {
      return sendErrorResponse(res, 400, 'INVALID_ID', 'Invalid zone ID format');
    }

    if (labRefId && !mongoose.Types.ObjectId.isValid(labRefId)) {
      return sendErrorResponse(res, 400, 'INVALID_ID', 'Invalid lab ID format');
    }

    if (subRoles && Array.isArray(subRoles)) {
      for (const subRole of subRoles) {
        if (subRole.refId && !mongoose.Types.ObjectId.isValid(subRole.refId)) {
          return sendErrorResponse(res, 400, 'INVALID_ID', `Invalid sub-role ID format: ${subRole.name || 'unknown'}`);
        }
      }
    }

    const validEmployeeTypes = ['SUPERADMIN','ADMIN', 'SUPERVISOR', 'TEAMLEAD', 'EMPLOYEE'];
    if (!validEmployeeTypes.includes(employeeType.toUpperCase())) {
      return sendErrorResponse(res, 400, 'VALIDATION_ERROR', 'Invalid employee type. Must be ADMIN, SUPERVISOR, TEAMLEAD, or EMPLOYEE');
    }

    // if (employeeType.toUpperCase() === 'ADMIN' && req.user.EmployeeType !== 'SUPERADMIN') {
    //   return sendErrorResponse(res, 403, 'FORBIDDEN', 'Only SuperAdmin can create Admin');
    // }

    if (employeeType.toUpperCase() !== 'SUPERADMIN') {
      if (!department && employeeType.toUpperCase() !== 'ADMIN') {
        return sendErrorResponse(res, 400, 'VALIDATION_ERROR', 'Department is required');
      }

      if (department && departmentRefId) {
        const departmentDoc = await Department.findById(departmentRefId);
        if (!departmentDoc) {
          return sendErrorResponse(res, 404, 'DEPARTMENT_NOT_FOUND', 'Department not found');
        }
        if (departmentDoc.name !== department.toUpperCase()) {
          return sendErrorResponse(res, 400, 'DEPARTMENT_MISMATCH', 'Department name does not match the provided ID');
        }

        if (employeeType.toUpperCase() === 'ADMIN') {
          const existingAdmin = await employeeSchema.findOne({
            EmployeeType: 'ADMIN',
            'Department.refId': departmentRefId,
            isActive: true
          });

          if (existingAdmin) {
            return sendErrorResponse(res, 409, 'ADMIN_EXISTS', `An admin already exists for ${department} department`);
          }
        }
      }

      // if ((req.user.EmployeeType === 'SUPERADMIN' || req.user.EmployeeType === 'ADMIN' ) && employeeType.toUpperCase() !== 'ADMIN') {
      //   const userDepartmentId = req.user.Department?.refId?.toString();
      //   if (userDepartmentId && departmentRefId && userDepartmentId !== departmentRefId) {
      //     return sendErrorResponse(res, 403, 'FORBIDDEN', 'Admin can only create employees in their own department');
      //   }
      // }
    }

    if (subRoles && Array.isArray(subRoles) && subRoles.length > 0) {
      if (!departmentRefId) {
        return sendErrorResponse(res, 400, 'VALIDATION_ERROR', 'Department reference ID is required when assigning sub-roles');
      }

      const departmentDoc = await Department.findById(departmentRefId);
      if (!departmentDoc) {
        return sendErrorResponse(res, 404, 'DEPARTMENT_NOT_FOUND', 'Department not found');
      }

      for (const subRole of subRoles) {
        if (!subRole.refId) {
          return sendErrorResponse(res, 400, 'VALIDATION_ERROR', 'Sub-role refId is required');
        }

        const subRoleExists = departmentDoc.subRoles.id(subRole.refId);
        if (!subRoleExists) {
          return sendErrorResponse(res, 400, 'INVALID_SUBROLE', `Sub-role ${subRole.name} does not belong to department ${department}`);
        }

        if (!subRoleExists.isActive) {
          return sendErrorResponse(res, 400, 'INACTIVE_SUBROLE', `Sub-role ${subRole.name} is not active`);
        }
      }
    }

    if (['EMPLOYEE', 'SUPERVISOR', 'TEAMLEAD'].includes(employeeType.toUpperCase()) && 
      department && department.toUpperCase() === 'SALES' && !zone) {
      return sendErrorResponse(res, 400, 'VALIDATION_ERROR', 'Zone is required for SALES department employees, supervisors, and team leads');
    }

    if (zone && zoneRefId) {
      const locationDoc = await Location.findById(zoneRefId);
      if (!locationDoc) {
        return sendErrorResponse(res, 404, 'ZONE_NOT_FOUND', 'Zone not found');
      }
      if (!locationDoc.isActive) {
        return sendErrorResponse(res, 400, 'ZONE_INACTIVE', 'Zone is not active');
      }
      if (locationDoc.zone !== zone.toUpperCase()) {
        return sendErrorResponse(res, 400, 'ZONE_MISMATCH', 'Zone name does not match the provided ID');
      }
    }

    if (lab) {
      const labConfig = await SystemConfig.findOne({ configType: 'Lab' });
      if (!labConfig) {
        return sendErrorResponse(res, 400, 'VALIDATION_ERROR', 'Lab configuration not found in system');
      }

      const validLabs = labConfig.values;
      if (!validLabs.includes(lab.toUpperCase())) {
        return sendErrorResponse(res, 400, 'VALIDATION_ERROR', `Invalid lab value. Valid labs: ${validLabs.join(', ')}`);
      }
    }

    let assignedTeamLead = null;

    if (employeeType.toUpperCase() === 'EMPLOYEE') {
      const isSalesDepartment = department.toUpperCase() === 'SALES';
      
      const supervisorQuery = {
        EmployeeType: 'SUPERVISOR',
        'Department.name': department.toUpperCase(),
        isActive: true
      };

      if (isSalesDepartment && zone) {
        supervisorQuery['zone.name'] = zone.toUpperCase();
      } else if (!isSalesDepartment && subRoles && subRoles.length > 0) {
        supervisorQuery['subRoles.refId'] = { $in: subRoles.map(sr => sr.refId) };
      }

      assignedSupervisor = await employeeSchema.findOne(supervisorQuery);

      // if (assignedSupervisor && req.user.EmployeeType === 'SUPERVISOR' && assignedSupervisor._id.toString() !== req.user.id.toString()) {
      //   return sendErrorResponse(res, 403, 'FORBIDDEN', 'Supervisors can only assign themselves as supervisor');
      // }

      const teamLeadQuery = {
        EmployeeType: 'TEAMLEAD',
        'Department.name': department.toUpperCase(),
        isActive: true
      };

      if (isSalesDepartment && zone) {
        teamLeadQuery['zone.name'] = zone.toUpperCase();
      } else if (!isSalesDepartment && subRoles && subRoles.length > 0) {
        teamLeadQuery['subRoles.refId'] = { $in: subRoles.map(sr => sr.refId) };
      }

      assignedTeamLead = await employeeSchema.findOne(teamLeadQuery);
    }

    const existingUser = await employeeSchema.findOne({
      $or: [{ email }, { username }]
    });

    if (existingUser) {
      return sendErrorResponse(res, 409, 'USER_EXISTS', 'Employee with this email or username already exists');
    }

    const userData = {
      username,
      employeeName,
      email,
      password, 
      phone,
      address,
      country,
      pincode,
      aadharCard,
      panCard,
      expiry,
      EmployeeType: employeeType.toUpperCase(),
      createdBy: req.user.id,
      isActive: true,
      aadharCardImg, 
      panCardImg
    };

    if (employeeType.toUpperCase() !== 'SUPERADMIN') {
      if (department && departmentRefId) {
        userData.Department = {
          name: department.toUpperCase(),
          refId: departmentRefId
        };
      } else if (employeeType.toUpperCase() === 'ADMIN') {
        userData.Department = {
          name: 'ALL',
          refId: null
        };
      }
    }

    userData.subRoles = subRoles || [];

    if (lab && labRefId) {
      userData.lab = {
        name: lab.toUpperCase(),
        refId: labRefId
      };
    }

    if (zone && zoneRefId) {
      userData.zone = {
        name: zone.toUpperCase(),
        refId: zoneRefId
      };
    }

    if (employeeType.toUpperCase() === 'EMPLOYEE' && assignedSupervisor) {
      userData.supervisor = {
        name: assignedSupervisor.employeeName,
        refId: assignedSupervisor._id
      };

      if (assignedTeamLead) {
        userData.teamLead = {
          name: assignedTeamLead.employeeName,
          refId: assignedTeamLead._id
        };
      }
    }

    const newUser = new employeeSchema(userData);
    await newUser.save();

    const userResponse = newUser.toObject();
    delete userResponse.password;

    return sendSuccessResponse(res, 201, { employee: userResponse }, `${employeeType.charAt(0).toUpperCase() + employeeType.slice(1).toLowerCase()} created successfully`);

  } catch (error) {
    console.error('Create employee error:', error);
    
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return sendErrorResponse(res, 400, 'VALIDATION_ERROR', messages.join(', '));
    }
    
    if (error.name === 'CastError') {
      return sendErrorResponse(res, 400, 'INVALID_ID', `Invalid ${error.path} format. Please provide a valid MongoDB ObjectId`);
    }
    
    return sendErrorResponse(res, 500, 'INTERNAL_ERROR', 'Failed to create employee');
  }
};

export const getAllEmployees = async (req, res) => {
  try {
    
     const page = Math.max(parseInt(req.query.page) || 1, 1);
     const limit = Math.min(parseInt(req.query.limit) || 10, 100); 
     const skip = (page - 1) * limit;
     const query = {};

    const [users, total] = await Promise.all([
      employeeSchema
        .find(query)
        .select('-password -passwordResetToken -passwordResetExpires -twoFactorSecret -permissions -profile')
        .populate('createdBy supervisor', 'firstName lastName EmployeeType')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      employeeSchema.countDocuments(query)
    ]);

    const totalPages = Math.ceil(total / limit);
      const pagination = {
      currentPage: page,
      totalPages,
      totalUsers: total,
      hasNext: page < totalPages,
      hasPrev: page > 1
    };

    return sendSuccessResponse(res, 200, { users, pagination }, 'Users retrieved successfully');

  } catch (error) {
    console.error('Get users by hierarchy error:', error);
    return sendErrorResponse(res, 500, 'INTERNAL_ERROR', 'Failed to retrieve users');
  }
};

export const getFilteredEmployees = async (req, res) => {
  try {
    const page = Math.max(parseInt(req.query.page) || 1, 1);
    const limit = Math.min(parseInt(req.query.limit) || 10, 100);
    const skip = (page - 1) * limit;

    const { EmployeeType, department, zone, search } = req.query;

    let query = { isActive: true };

     if (req.user.EmployeeType === 'SUPERADMIN') {
      if (EmployeeType) query.EmployeeType = EmployeeType.toUpperCase();
      if (department) query['Department.name'] = department.toUpperCase();
      if (zone) query['zone.name'] = zone.toUpperCase();

    } else if (req.user.EmployeeType === 'ADMIN') {
      query.EmployeeType = { $ne: 'SUPERADMIN' };

      if (EmployeeType && EmployeeType.toUpperCase() !== 'SUPERADMIN') {
        query.EmployeeType = EmployeeType.toUpperCase();
      }

      if (department) query['Department.name'] = department.toUpperCase();
      if (zone) query['zone.name'] = zone.toUpperCase();

    } else if (req.user.EmployeeType === 'SUPERVISOR') {
      query['Department.name'] = req.user.Department;
      query['zone.name'] = req.user.zone?.name;
      query.EmployeeType = { $in: ['SUPERVISOR', 'EMPLOYEE'] };

      if (EmployeeType && ['SUPERVISOR', 'EMPLOYEE'].includes(EmployeeType.toUpperCase())) {
        query.EmployeeType = EmployeeType.toUpperCase();
      }

    } else {
      query.$or = [
        { _id: req.user.id },
        {
          'Department.name': req.user.Department,
          'zone.name': req.user.zone?.name,
          EmployeeType: 'EMPLOYEE'
        }
      ];
    }

    if (search) {
      const searchQuery = {
        $or: [
          { username: { $regex: search, $options: 'i' } },
          { employeeName: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } }
        ]
      };
      query = { $and: [query, searchQuery] };
    }

     const [users, total] = await Promise.all([
      employeeSchema
        .find(query)
        .select('-password -passwordResetToken -passwordResetExpires -twoFactorSecret -permissions -profile')
        .populate('createdBy supervisor', 'firstName lastName EmployeeType')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      employeeSchema.countDocuments(query)
    ]);

    const totalPages = Math.ceil(total / limit);

    const pagination = {
      currentPage: page,
      totalPages,
      totalUsers: total,
      hasNext: page < totalPages,
      hasPrev: page > 1
    };


    return sendSuccessResponse(res, 200, { users, pagination }, 'Users retrieved successfully');

  } catch (error) {
    console.error('Get users by hierarchy error:', error);
    return sendErrorResponse(res, 500, 'INTERNAL_ERROR', 'Failed to retrieve users');
  }
};

export const updateEmployeeDetails = async (req, res) => {
  try {
    const { userId } = req.params;
    const updates = req.body;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return sendErrorResponse(res, 400, 'INVALID_ID', 'Invalid user ID format');
    }

    delete updates.password;
    delete updates.EmployeeType;
    delete updates.createdBy;
    delete updates._id;

    let query = { _id: userId, isActive: true };

    if (req.user.EmployeeType === 'SUPERADMIN') {
    } else if (req.user.EmployeeType === 'ADMIN') {
      const targetUser = await employeeSchema.findById(userId);
      if (targetUser && targetUser.EmployeeType === 'SUPERADMIN') {
        return sendErrorResponse(res, 403, 'FORBIDDEN', 'Admin cannot update SuperAdmin');
      }
    } else if (req.user.EmployeeType === 'SUPERVISOR') {
      query['Department.name'] = req.user.Department;
      query['zone.name'] = req.user.zone?.name;
      query.EmployeeType = { $in: ['EMPLOYEE'] }; 
    } else {
      query._id = req.user.id;
    }

    const user = await employeeSchema.findOne(query);

    if (!user) {
      return sendErrorResponse(res, 404, 'USER_NOT_FOUND', 'Employee not found or not authorized to update');
    }

    Object.assign(user, updates);
    await user.save();

    const userResponse = user.toObject();
    delete userResponse.password;

    return sendSuccessResponse(res, 200, { user: userResponse }, 'Employee updated successfully');

  } catch (error) {
    console.error('Update employee error:', error);
    
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return sendErrorResponse(res, 400, 'VALIDATION_ERROR', messages.join(', '));
    }
    
    if (error.name === 'CastError') {
      return sendErrorResponse(res, 400, 'INVALID_ID', `Invalid ${error.path} format. Please provide a valid MongoDB ObjectId`);
    }
    
    return sendErrorResponse(res, 500, 'INTERNAL_ERROR', 'Failed to update user');
  }
};

export const deactivateEmployee = async (req, res) => {
  try {
    const { userId } = req.params;
    
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return sendErrorResponse(res, 400, 'INVALID_ID', 'Invalid user ID format');
    }
    
    let query = { _id: userId, isActive: true };
    if (req.user.EmployeeType === 'SUPERADMIN') {
      const targetUser = await employeeSchema.findById(userId);
      if (targetUser && targetUser.EmployeeType === 'SUPERADMIN') {
        return sendErrorResponse(res, 403, 'FORBIDDEN', 'Cannot deactivate another SuperAdmin');
      }
    } else if (req.user.EmployeeType === 'ADMIN') {
      const targetUser = await employeeSchema.findById(userId);
      if (targetUser && targetUser.EmployeeType === 'SUPERADMIN') {
        return sendErrorResponse(res, 403, 'FORBIDDEN', 'Admin cannot deactivate SuperAdmin');
      }
    } else if (req.user.EmployeeType === 'SUPERVISOR') {
      query['Department.name'] = req.user.Department;
      query['zone.name'] = req.user.zone;
      query.EmployeeType = 'EMPLOYEE';
    } else {
      return sendErrorResponse(res, 403, 'FORBIDDEN', 'Insufficient privileges to deactivate users');
    }
    const user = await employeeSchema.findOne(query);
    if (!user) {
      return sendErrorResponse(res, 404, 'USER_NOT_FOUND', 'Employee not found or not authorized to deactivate');
    }

    user.isActive = false;
    await user.save();

    return sendSuccessResponse(res, 200, null, 'Employee deactivated successfully');

  } catch (error) {
    console.error('Deactivate employee error:', error);
    
    if (error.name === 'CastError') {
      return sendErrorResponse(res, 400, 'INVALID_ID', `Invalid ${error.path} format. Please provide a valid MongoDB ObjectId`);
    }
    
    return sendErrorResponse(res, 500, 'INTERNAL_ERROR', 'Failed to deactivate employee');
  }
};

export const getEmployeeDetails = async (req, res) => {
  try {
    const { userId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return sendErrorResponse(res, 400, 'INVALID_ID', 'Invalid user ID format');
    }

    let query = { _id: userId, isActive: true };
    if (req.user.EmployeeType === 'SUPERADMIN') {
    } else if (req.user.EmployeeType === 'ADMIN') {
      const targetUser = await employeeSchema.findById(userId);
      if (targetUser && targetUser.EmployeeType === 'SUPERADMIN') {
        return sendErrorResponse(res, 403, 'FORBIDDEN', 'Admin cannot view SuperAdmin details');
      }
    } else if (req.user.EmployeeType === 'SUPERVISOR') {
      query['Department.name'] = req.user.Department;
      query['region.name'] = req.user.region;
    } else {
      const targetUser = await employeeSchema.findById(userId);
      if (targetUser && 
          (targetUser._id.toString() !== req.user.id && 
           (targetUser.Department?.name !== req.user.Department || 
            targetUser.region?.name !== req.user.region ||
            targetUser.EmployeeType !== 'EMPLOYEE'))) {
        return sendErrorResponse(res, 403, 'FORBIDDEN', 'Access denied');
      }
    }

    const user = await employeeSchema.findOne(query)
      .select('-password -passwordResetToken -passwordResetExpires -twoFactorSecret')
      .populate('createdBy supervisor', 'firstName lastName EmployeeType');

    if (!user) {
      return sendErrorResponse(res, 404, 'USER_NOT_FOUND', 'Employee not found');
    }

    return sendSuccessResponse(res, 200, { user }, 'Employee details retrieved successfully');

  } catch (error) {
    console.error('Get employee details error:', error);
    
    if (error.name === 'CastError') {
      return sendErrorResponse(res, 400, 'INVALID_ID', `Invalid ${error.path} format. Please provide a valid MongoDB ObjectId`);
    }
    
    return sendErrorResponse(res, 500, 'INTERNAL_ERROR', 'Failed to retrieve employee details');
  }
};

export const getSupervisorsByDepartment = async (req, res) => {
  try {
    const { department, zone } = req.query;

    let query = { 
      EmployeeType: 'SUPERVISOR', 
      isActive: true 
    };
    if (req.user.EmployeeType === 'SUPERADMIN') {
      if (department) query['Department.name'] = department.toUpperCase();
      if (zone) query['zone.name'] = zone.toUpperCase();
    } else if (req.user.EmployeeType === 'ADMIN') {
      if (department) query['Department.name'] = department.toUpperCase();
      if (zone) query['zone.name'] = zone.toUpperCase();
    } else if (req.user.EmployeeType === 'SUPERVISOR') {
      query['Department.name'] = req.user.Department;
      query['zone.name'] = req.user.zone?.name;
    } else {
      query['Department.name'] = req.user.Department;
      query['zone.name'] = req.user.zone?.name;
    }

    const supervisors = await employeeSchema.find(query)
      .select('username employeeName email Department zone')
      .sort({ employeeName: 1 });

    return sendSuccessResponse(res, 200, { supervisors }, 'Supervisors retrieved successfully');

  } catch (error) {
    console.error('Get supervisors by department error:', error);
    return sendErrorResponse(res, 500, 'INTERNAL_ERROR', 'Failed to retrieve supervisors');
  }
};
