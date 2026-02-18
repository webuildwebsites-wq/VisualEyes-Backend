import { sendSuccessResponse, sendErrorResponse } from '../../../../Utils/response/responseHandler.js';
import employeeSchema from '../../../../models/Auth/Employee.js';

export const createSubAdmin = async (req, res) => {
  try {
    const { employeeName, email, password, phone, address, country, pincode, aadharCard, panCard, expiry } = req.body;
    
    if (!employeeName || !email || !password || !phone || !address || !country) {
      return sendErrorResponse(res, 400, 'VALIDATION_ERROR', 'All required fields must be provided');
    }

    if (req.user.EmployeeType !== 'SUPERADMIN') {
      return sendErrorResponse(res, 403, 'FORBIDDEN', 'Only SuperAdmin can create Admin');
    }

    const existingUser = await employeeSchema.findOne({
      $or: [{ email }, { employeeName }]
    });

    if (existingUser) {
      return sendErrorResponse(res, 409, 'USER_EXISTS', 'Employee with this email or employee name already exists');
    }
    
    const subAdmin = new employeeSchema({
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
      EmployeeType: 'ADMIN',
      Role : 'ADMIN',
      createdBy: req.user.id,
      isActive: true
    });

    await subAdmin.save();

    const subAdminResponse = subAdmin.toObject();
    delete subAdminResponse.password;

    return sendSuccessResponse(res, 201, { admin: subAdminResponse }, 'Admin created successfully');

  } catch (error) {
    console.error('Create Admin error:', error);
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return sendErrorResponse(res, 400, 'VALIDATION_ERROR', messages.join(', '));
    }
    return sendErrorResponse(res, 500, 'INTERNAL_ERROR', 'Failed to create Admin');
  }
};

export const createSupervisorOrEmployee = async (req, res) => {
  try {
    const { employeeType, employeeName, email, password, phone, address, 
      department, country, pincode, expiry, region, aadharCard, panCard, lab, role } = req.body;

    let assignedSupervisor = null;

    if (!employeeType || !employeeName || !country || !email || !password || !phone || !address || !department) {
      return sendErrorResponse(res, 400, 'VALIDATION_ERROR', 'All required fields must be provided');
    }

    if (['EMPLOYEE', 'SUPERVISOR'].includes(employeeType.toUpperCase()) && 
      department.toUpperCase() === 'SALES' && !region) {
      return sendErrorResponse(res, 400, 'VALIDATION_ERROR', 'Region is required for SALES department employees and supervisors');
    }

    const validDepartments = ['LAB', 'STORE', 'DISPATCH', 'SALES', 'FINANCE', 'CUSTOMER_SUPPORT'];

    const validLabs = [
      'KOLKATA STOCK', 'STOCK ORDER', 'VISUAL EYES LAB', 'VE AHMEDABAD LAB',
      'VE CHENNAI LAB', 'VE KOCHI LAB', 'VE GURGAON LAB', 'VE MUMBAI LAB',
      'VE TRIVANDRUM LAB', 'SERVICE', 'VE GLASS ORDER', 'VE PUNE LAB',
      'VE NAGPUR LAB', 'VE BENGALURU LAB', 'VE HYDERBAD LAB', 'VE KOLKATTA LAB'
    ];

    if (!validDepartments.includes(department.toUpperCase())) {
      return sendErrorResponse(res, 400, 'VALIDATION_ERROR', 'Invalid department value');
    }

    if (lab && !validLabs.includes(lab.toUpperCase())) {
      return sendErrorResponse(res, 400, 'VALIDATION_ERROR', 'Invalid lab value');
    }

    if (!['SUPERVISOR', 'EMPLOYEE'].includes(employeeType.toUpperCase())) {
      return sendErrorResponse(res, 400, 'VALIDATION_ERROR', 'Employee type must be either SUPERVISOR or EMPLOYEE');
    }

    if (employeeType.toUpperCase() === 'EMPLOYEE') {
      const supervisorQuery = {
        EmployeeType: 'SUPERVISOR',
        Department: department.toUpperCase(),
        isActive: true
      };

      if (region) {
        supervisorQuery.region = region;
      }

      assignedSupervisor = await employeeSchema.findOne(supervisorQuery);

      if (!assignedSupervisor) {
        const errorMsg = region 
          ? 'No active supervisor found for this department and region'
          : 'No active supervisor found for this department';
        return sendErrorResponse(res, 400, 'NO_SUPERVISOR_FOUND', errorMsg);
      }

      if (req.user.EmployeeType === 'SUPERVISOR' && assignedSupervisor._id.toString() !== req.user.id.toString()) {
        return sendErrorResponse(res, 403, 'FORBIDDEN', 'Supervisors can only assign themselves as supervisor');
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
      Department: department.toUpperCase(),
      lab: lab ? lab.toUpperCase() : undefined,
      aadharCard,
      panCard,
      expiry,
      EmployeeType: employeeType.toUpperCase(),
      createdBy: req.user.id,
      isActive: true,
      Role : role
    };

    if (region) {
      userData.region = region;
    }

    if (employeeType.toUpperCase() === 'EMPLOYEE') {
      userData.supervisor = assignedSupervisor._id;
    }

    const newUser = new employeeSchema(userData);
    await newUser.save();

    const userResponse = newUser.toObject();
    delete userResponse.password;

    return sendSuccessResponse(res, 201, { user: userResponse }, `${employeeType.charAt(0).toUpperCase() + employeeType.slice(1)} created successfully`);

  } catch (error) {
    console.error('Create Supervisor/Employee error:', error);
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return sendErrorResponse(res, 400, 'VALIDATION_ERROR', messages.join(', '));
    }
    return sendErrorResponse(res, 500, 'INTERNAL_ERROR', 'Failed to create user');
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
      if (EmployeeType) query.EmployeeType = EmployeeType.toUpperCase();
      if (department) query.Department = department.toUpperCase();
      if (region) query.region = region;

    } else if (req.user.EmployeeType === 'ADMIN') {
      query.EmployeeType = { $ne: 'SUPERADMIN' };

      if (EmployeeType && EmployeeType.toUpperCase() !== 'SUPERADMIN') {
        query.EmployeeType = EmployeeType.toUpperCase();
      }

      if (department) query.Department = department.toUpperCase();
      if (region) query.region = region;

    } else if (req.user.EmployeeType === 'SUPERVISOR') {
      query.Department = req.user.Department;
      query.region = req.user.region;
      query.EmployeeType = { $in: ['SUPERVISOR', 'EMPLOYEE'] };

      if (EmployeeType && ['SUPERVISOR', 'EMPLOYEE'].includes(EmployeeType.toUpperCase())) {
        query.EmployeeType = EmployeeType.toUpperCase();
      }

    } else {
      query.$or = [
        { _id: req.user.id },
        {
          Department: req.user.Department,
          region: req.user.region,
          EmployeeType: 'EMPLOYEE'
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
      if (targetUser && targetUser.EmployeeType === 'SUPERADMIN') {
        return sendErrorResponse(res, 403, 'FORBIDDEN', 'Admin cannot update SuperAdmin');
      }
    } else if (req.user.EmployeeType === 'SUPERVISOR') {
      query.Department = req.user.Department;
      query.region = req.user.region;
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
    return sendErrorResponse(res, 500, 'INTERNAL_ERROR', 'Failed to update user');
  }
};

export const deactivateEmployee = async (req, res) => {
  try {
    const { userId } = req.params;
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
      query.Department = req.user.Department;
      query.region = req.user.region;
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
      if (targetUser && targetUser.EmployeeType === 'SUPERADMIN') {
        return sendErrorResponse(res, 403, 'FORBIDDEN', 'Admin cannot view SuperAdmin details');
      }
    } else if (req.user.EmployeeType === 'SUPERVISOR') {
      query.Department = req.user.Department;
      query.region = req.user.region;
    } else {
      const targetUser = await employeeSchema.findById(userId);
      if (targetUser && 
          (targetUser._id.toString() !== req.user.id && 
           (targetUser.Department !== req.user.Department || 
            targetUser.region !== req.user.region ||
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
    return sendErrorResponse(res, 500, 'INTERNAL_ERROR', 'Failed to retrieve employee details');
  }
};

export const getSupervisorsByDepartment = async (req, res) => {
  try {
    const { department, region } = req.query;

    let query = { 
      EmployeeType: 'SUPERVISOR', 
      isActive: true 
    };
    if (req.user.EmployeeType === 'SUPERADMIN') {
      if (department) query.Department = department.toUpperCase();
      if (region) query.region = region;
    } else if (req.user.EmployeeType === 'ADMIN') {
      if (department) query.Department = department.toUpperCase();
      if (region) query.region = region;
    } else if (req.user.EmployeeType === 'SUPERVISOR') {
      query.Department = req.user.Department;
      query.region = req.user.region;
    } else {
      query.Department = req.user.Department;
      query.region = req.user.region;
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