import { sendSuccessResponse, sendErrorResponse } from '../../../../Utils/response/responseHandler.js';
import employeeSchema from '../../../../models/Auth/Employee.js';
import Department from '../../../../models/Auth/Department.js';
import SystemConfig from '../../../../models/Auth/SystemConfig.js';

export const createEmployee = async (req, res) => {
  try {
    const { employeeType, employeeName, email, password, phone, address, department, departmentRefId, country, pincode, expiry, region, regionRefId, aadharCard, panCard, lab, labRefId, role, roleRefId, subRoles } = req.body;

    let assignedSupervisor = null;
    let assignedRegionManager = null;

    if (!employeeType || !employeeName || !country || !email || !password || !phone || !address) {
      return sendErrorResponse(res, 400, 'VALIDATION_ERROR', 'All required fields must be provided');
    }

    const validEmployeeTypes = ['ADMIN', 'SUPERVISOR', 'TEAMLEAD', 'REGIONMANAGER', 'EMPLOYEE'];
    if (!validEmployeeTypes.includes(employeeType.toUpperCase())) {
      return sendErrorResponse(res, 400, 'VALIDATION_ERROR', 'Invalid employee type. Must be ADMIN, SUPERVISOR, TEAMLEAD, REGIONMANAGER, or EMPLOYEE');
    }

    if (employeeType.toUpperCase() === 'ADMIN' && req.user.EmployeeType !== 'SUPERADMIN') {
      return sendErrorResponse(res, 403, 'FORBIDDEN', 'Only SuperAdmin can create Admin');
    }

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
      }

      if ((req.user.EmployeeType === 'SUPERADMIN' || req.user.EmployeeType === 'ADMIN' ) && employeeType.toUpperCase() !== 'ADMIN') {
        const userDepartmentId = req.user.Department?.refId?.toString();
        if (userDepartmentId && departmentRefId && userDepartmentId !== departmentRefId) {
          return sendErrorResponse(res, 403, 'FORBIDDEN', 'Admin can only create employees in their own department');
        }
      }
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

    if (['EMPLOYEE', 'SUPERVISOR', 'REGIONMANAGER', 'TEAMLEAD'].includes(employeeType.toUpperCase()) && 
      department && department.toUpperCase() === 'SALES' && !region) {
      return sendErrorResponse(res, 400, 'VALIDATION_ERROR', 'Region is required for SALES department employees, supervisors, team leads, and region managers');
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
      const supervisorQuery = {
        'EmployeeType.name': 'SUPERVISOR',
        'Department.name': department.toUpperCase(),
        isActive: true
      };

      if (region) {
        supervisorQuery['region.name'] = region;
      }

      if (subRoles && subRoles.length > 0) {
        supervisorQuery['subRoles.refId'] = { $in: subRoles.map(sr => sr.refId) };
      }

      assignedSupervisor = await employeeSchema.findOne(supervisorQuery);

      if (!assignedSupervisor) {
        const errorMsg = subRoles && subRoles.length > 0
          ? 'No active supervisor found for this department and sub-role(s)'
          : region 
            ? 'No active supervisor found for this department and region'
            : 'No active supervisor found for this department';
        return sendErrorResponse(res, 400, 'NO_SUPERVISOR_FOUND', errorMsg);
      }

      if (req.user.EmployeeType === 'SUPERVISOR' && assignedSupervisor._id.toString() !== req.user.id.toString()) {
        return sendErrorResponse(res, 403, 'FORBIDDEN', 'Supervisors can only assign themselves as supervisor');
      }

      const teamLeadQuery = {
        'EmployeeType.name': 'TEAMLEAD',
        'Department.name': department.toUpperCase(),
        isActive: true
      };

      if (region) {
        teamLeadQuery['region.name'] = region;
      }

      if (subRoles && subRoles.length > 0) {
        teamLeadQuery['subRoles.refId'] = { $in: subRoles.map(sr => sr.refId) };
      }

      assignedTeamLead = await employeeSchema.findOne(teamLeadQuery);


      if (department.toUpperCase() === 'SALES' && region) {
        const regionManagerQuery = {
          'EmployeeType.name': 'REGIONMANAGER',
          'Department.name': 'SALES',
          'region.name': region,
          isActive: true
        };

        assignedRegionManager = await employeeSchema.findOne(regionManagerQuery);

        if (!assignedRegionManager) {
          return sendErrorResponse(res, 400, 'NO_REGION_MANAGER_FOUND', 
            'No active region manager found for this region. Please create a region manager first.');
        }
      }
    }

    const existingUser = await employeeSchema.findOne({
      $or: [{ email }, { employeeName }]
    });

    if (existingUser) {
      return sendErrorResponse(res, 409, 'USER_EXISTS', 'Employee with this email or employee name already exists');
    }

    const userData = {
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
      EmployeeType: {
        name: employeeType.toUpperCase(),
        refId: null
      },
      createdBy: req.user.id,
      isActive: true,
      Role: role ? {
        name: role,
        refId: roleRefId
      } : {
        name: employeeType.toUpperCase(),
        refId: null
      }
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

    if (region && regionRefId) {
      userData.region = {
        name: region,
        refId: regionRefId
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

      if (assignedRegionManager) {
        userData.regionManager = {
          name: assignedRegionManager.employeeName,
          refId: assignedRegionManager._id
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

    const { EmployeeType, department, region, search } = req.query;

    let query = { isActive: true };

     if (req.user.EmployeeType === 'SUPERADMIN') {
      if (EmployeeType) query['EmployeeType.name'] = EmployeeType.toUpperCase();
      if (department) query['Department.name'] = department.toUpperCase();
      if (region) query['region.name'] = region;

    } else if (req.user.EmployeeType === 'ADMIN') {
      query['EmployeeType.name'] = { $ne: 'SUPERADMIN' };

      if (EmployeeType && EmployeeType.toUpperCase() !== 'SUPERADMIN') {
        query['EmployeeType.name'] = EmployeeType.toUpperCase();
      }

      if (department) query['Department.name'] = department.toUpperCase();
      if (region) query['region.name'] = region;

    } else if (req.user.EmployeeType === 'SUPERVISOR') {
      query['Department.name'] = req.user.Department;
      query['region.name'] = req.user.region;
      query['EmployeeType.name'] = { $in: ['SUPERVISOR', 'EMPLOYEE'] };

      if (EmployeeType && ['SUPERVISOR', 'EMPLOYEE'].includes(EmployeeType.toUpperCase())) {
        query['EmployeeType.name'] = EmployeeType.toUpperCase();
      }

    } else {
      query.$or = [
        { _id: req.user.id },
        {
          'Department.name': req.user.Department,
          'region.name': req.user.region,
          'EmployeeType.name': 'EMPLOYEE'
        }
      ];
    }

    if (search) {
      const searchQuery = {
        $or: [
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

    delete updates.password;
    delete updates.EmployeeType;
    delete updates.createdBy;
    delete updates._id;

    let query = { _id: userId, isActive: true };

    if (req.user.EmployeeType === 'SUPERADMIN') {
    } else if (req.user.EmployeeType === 'ADMIN') {
      const targetUser = await employeeSchema.findById(userId);
      if (targetUser && targetUser.EmployeeType?.name === 'SUPERADMIN') {
        return sendErrorResponse(res, 403, 'FORBIDDEN', 'Admin cannot update SuperAdmin');
      }
    } else if (req.user.EmployeeType === 'SUPERVISOR') {
      query['Department.name'] = req.user.Department;
      query['region.name'] = req.user.region;
      query['EmployeeType.name'] = { $in: ['EMPLOYEE'] }; 
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
    return sendErrorResponse(res, 500, 'INTERNAL_ERROR', 'Failed to update user');
  }
};

export const deactivateEmployee = async (req, res) => {
  try {
    const { userId } = req.params;
    let query = { _id: userId, isActive: true };
    if (req.user.EmployeeType === 'SUPERADMIN') {
      const targetUser = await employeeSchema.findById(userId);
      if (targetUser && targetUser.EmployeeType?.name === 'SUPERADMIN') {
        return sendErrorResponse(res, 403, 'FORBIDDEN', 'Cannot deactivate another SuperAdmin');
      }
    } else if (req.user.EmployeeType === 'ADMIN') {
      const targetUser = await employeeSchema.findById(userId);
      if (targetUser && targetUser.EmployeeType?.name === 'SUPERADMIN') {
        return sendErrorResponse(res, 403, 'FORBIDDEN', 'Admin cannot deactivate SuperAdmin');
      }
    } else if (req.user.EmployeeType === 'SUPERVISOR') {
      query['Department.name'] = req.user.Department;
      query['region.name'] = req.user.region;
      query['EmployeeType.name'] = 'EMPLOYEE';
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
    return sendErrorResponse(res, 500, 'INTERNAL_ERROR', 'Failed to deactivate employee');
  }
};

export const getEmployeeDetails = async (req, res) => {
  try {
    const { userId } = req.params;

    let query = { _id: userId, isActive: true };
    if (req.user.EmployeeType === 'SUPERADMIN') {
    } else if (req.user.EmployeeType === 'ADMIN') {
      const targetUser = await employeeSchema.findById(userId);
      if (targetUser && targetUser.EmployeeType?.name === 'SUPERADMIN') {
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
            targetUser.EmployeeType?.name !== 'EMPLOYEE'))) {
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
    return sendErrorResponse(res, 500, 'INTERNAL_ERROR', 'Failed to retrieve employee details');
  }
};

export const getSupervisorsByDepartment = async (req, res) => {
  try {
    const { department, region } = req.query;

    let query = { 
      'EmployeeType.name': 'SUPERVISOR', 
      isActive: true 
    };
    if (req.user.EmployeeType === 'SUPERADMIN') {
      if (department) query['Department.name'] = department.toUpperCase();
      if (region) query['region.name'] = region;
    } else if (req.user.EmployeeType === 'ADMIN') {
      if (department) query['Department.name'] = department.toUpperCase();
      if (region) query['region.name'] = region;
    } else if (req.user.EmployeeType === 'SUPERVISOR') {
      query['Department.name'] = req.user.Department;
      query['region.name'] = req.user.region;
    } else {
      query['Department.name'] = req.user.Department;
      query['region.name'] = req.user.region;
    }

    const supervisors = await employeeSchema.find(query)
      .select('employeeName email Department region')
      .sort({ employeeName: 1 });

    return sendSuccessResponse(res, 200, { supervisors }, 'Supervisors retrieved successfully');

  } catch (error) {
    console.error('Get supervisors by department error:', error);
    return sendErrorResponse(res, 500, 'INTERNAL_ERROR', 'Failed to retrieve supervisors');
  }
};
