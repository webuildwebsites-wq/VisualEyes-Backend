import { sendSuccessResponse, sendErrorResponse } from '../../../../Utils/response/responseHandler.js';
import employeeSchema from '../../../../models/Auth/Employee.js';

export const createSubAdmin = async (req, res) => {
  try {
    const { username, email, password, phone, address, country, pincode, region, department, aadharCard, panCard, lab, expiry } = req.body;
    
    if (!username || !email || !password || !phone || !address || !country || !region) {
      return sendErrorResponse(res, 400, 'VALIDATION_ERROR', 'All required fields must be provided');
    }

    if (req.user.UserType !== 'SUPERADMIN') {
      return sendErrorResponse(res, 403, 'FORBIDDEN', 'Only SuperAdmin can create Admin');
    }

    const existingUser = await employeeSchema.findOne({
      $or: [{ email }, { username }]
    });

    if (existingUser) {
      return sendErrorResponse(res, 409, 'USER_EXISTS', 'Employee with this email or username already exists');
    }
    
    const subAdmin = new employeeSchema({
      username,
      email,
      password, 
      phone,
      address,
      country,
      pincode,
      region,
      department,
      lab,
      aadharCard,
      panCard,
      expiry,
      UserType: 'ADMIN',
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
    const { employeeType, username, email, password, phone, address, 
      department, country, pincode, expiry, region, aadharCard, panCard, lab } = req.body;

    let assignedSupervisor = null;

    if (!employeeType || !username || !country || !email || !password || !phone || !address || !department || !region) {
      return sendErrorResponse(res, 400, 'VALIDATION_ERROR', 'All required fields must be provided');
    }

    const validDepartments = [
      'ADMIN', 'BRANCH USER', 'PRIORITY ORDER', 'CUSTOMER', 'ACCOUNTING MODULE',
      'SALES EXECUTIVE', 'OTHER ADMIN', 'STOCK POINT USER', 'CUSTOMER CARE',
      'STORES', 'PRODUCTION', 'SUPERVISOR', 'FITTING CENTER', 'F&A',
      'DISTRIBUTOR', 'DISPATCH', 'STORES ADMIN', 'BELOW ADMIN',
      'INVESTOR PROFILE', 'AUDITOR', 'CUSTOMER CARE (DB)',
      'BELOW ADMIN (FITTING CENTER)', 'FITTING CENTER-V2', 'DISPATCH-KOLKATTA',
      'SALES HEAD', 'CUSTOM PROFILE', 'F&A CFO'
    ];

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
      assignedSupervisor = await employeeSchema.findOne({
        UserType: 'SUPERVISOR',
        Department: department.toUpperCase(),
        region: region,
        isActive: true
      });

      if (!assignedSupervisor) {
        return sendErrorResponse(res, 400, 'NO_SUPERVISOR_FOUND', 'No active supervisor found for this department and region');
      }

      if (req.user.UserType === 'SUPERVISOR' && assignedSupervisor._id.toString() !== req.user.id.toString()) {
        return sendErrorResponse(res, 403, 'FORBIDDEN', 'Supervisors can only assign themselves as supervisor');
      }
    }

    const existingUser = await employeeSchema.findOne({
      $or: [{ email }, { username }]
    });

    if (existingUser) {
      return sendErrorResponse(res, 409, 'USER_EXISTS', 'Employee with this email or username already exists');
    }

    const userData = {
      username,
      email,
      password, 
      phone,
      address,
      country,
      pincode,
      region,
      department: department.toUpperCase(),
      lab: lab ? lab.toUpperCase() : undefined,
      aadharCard,
      panCard,
      expiry,
      UserType: employeeType.toUpperCase(),
      createdBy: req.user.id,
      isActive: true
    };

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

export const getEmployeesByHierarchy = async (req, res) => {
  try {
    const { page = 1, limit = 10, userType, department, region, search } = req.query;
    const skip = (page - 1) * limit;

    let query = { isActive: true };

    if (req.user.UserType === 'SUPERADMIN') {
      if (userType) query.UserType = userType.toUpperCase();
      if (department) query.Department = department.toUpperCase();
      if (region) query.region = region;
    } else if (req.user.UserType === 'ADMIN') {
      query.UserType = { $ne: 'SUPERADMIN' };
      if (userType && userType.toUpperCase() !== 'SUPERADMIN') {
        query.UserType = userType.toUpperCase();
      }
      if (department) query.Department = department.toUpperCase();
      if (region) query.region = region;
    } else if (req.user.UserType === 'SUPERVISOR') {
      query.Department = req.user.Department;
      query.region = req.user.region;
      query.UserType = { $in: ['SUPERVISOR', 'EMPLOYEE'] }; 
      
      if (userType && ['SUPERVISOR', 'EMPLOYEE'].includes(userType.toUpperCase())) {
        query.UserType = userType.toUpperCase();
      }
    } else {
      query.$or = [
        { _id: req.user.id },
        { 
          Department: req.user.Department, 
          region: req.user.region,
          UserType: 'EMPLOYEE'
        } 
      ];
    }

    if (search) {
      const searchQuery = {
        $or: [
          { username: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } }
        ]
      };
      
      query = { $and: [query, searchQuery] };
    }

    const users = await employeeSchema.find(query)
      .select('-password -passwordResetToken -passwordResetExpires -twoFactorSecret')
      .populate('createdBy supervisor', 'firstName lastName UserType')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await employeeSchema.countDocuments(query);

    const pagination = {
      currentPage: parseInt(page),
      totalPages: Math.ceil(total / limit),
      totalUsers: total,
      hasNext: page < Math.ceil(total / limit),
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
    delete updates.UserType;
    delete updates.createdBy;
    delete updates._id;

    let query = { _id: userId, isActive: true };

    if (req.user.UserType === 'SUPERADMIN') {
    } else if (req.user.UserType === 'ADMIN') {
      const targetUser = await employeeSchema.findById(userId);
      if (targetUser && targetUser.UserType === 'SUPERADMIN') {
        return sendErrorResponse(res, 403, 'FORBIDDEN', 'Admin cannot update SuperAdmin');
      }
    } else if (req.user.UserType === 'SUPERVISOR') {
      query.Department = req.user.Department;
      query.region = req.user.region;
      query.UserType = { $in: ['EMPLOYEE'] }; 
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
    if (req.user.UserType === 'SUPERADMIN') {
      const targetUser = await employeeSchema.findById(userId);
      if (targetUser && targetUser.UserType === 'SUPERADMIN') {
        return sendErrorResponse(res, 403, 'FORBIDDEN', 'Cannot deactivate another SuperAdmin');
      }
    } else if (req.user.UserType === 'ADMIN') {
      const targetUser = await employeeSchema.findById(userId);
      if (targetUser && targetUser.UserType === 'SUPERADMIN') {
        return sendErrorResponse(res, 403, 'FORBIDDEN', 'Admin cannot deactivate SuperAdmin');
      }
    } else if (req.user.UserType === 'SUPERVISOR') {
      query.Department = req.user.Department;
      query.region = req.user.region;
      query.UserType = 'EMPLOYEE';
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
    if (req.user.UserType === 'SUPERADMIN') {
    } else if (req.user.UserType === 'ADMIN') {
      const targetUser = await employeeSchema.findById(userId);
      if (targetUser && targetUser.UserType === 'SUPERADMIN') {
        return sendErrorResponse(res, 403, 'FORBIDDEN', 'Admin cannot view SuperAdmin details');
      }
    } else if (req.user.UserType === 'SUPERVISOR') {
      query.Department = req.user.Department;
      query.region = req.user.region;
    } else {
      const targetUser = await employeeSchema.findById(userId);
      if (targetUser && 
          (targetUser._id.toString() !== req.user.id && 
           (targetUser.Department !== req.user.Department || 
            targetUser.region !== req.user.region ||
            targetUser.UserType !== 'EMPLOYEE'))) {
        return sendErrorResponse(res, 403, 'FORBIDDEN', 'Access denied');
      }
    }

    const user = await employeeSchema.findOne(query)
      .select('-password -passwordResetToken -passwordResetExpires -twoFactorSecret')
      .populate('createdBy supervisor', 'firstName lastName UserType');

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
      UserType: 'SUPERVISOR', 
      isActive: true 
    };
    if (req.user.UserType === 'SUPERADMIN') {
      if (department) query.Department = department.toUpperCase();
      if (region) query.region = region;
    } else if (req.user.UserType === 'ADMIN') {
      if (department) query.Department = department.toUpperCase();
      if (region) query.region = region;
    } else if (req.user.UserType === 'SUPERVISOR') {
      query.Department = req.user.Department;
      query.region = req.user.region;
    } else {
      query.Department = req.user.Department;
      query.region = req.user.region;
    }

    const supervisors = await employeeSchema.find(query)
      .select('username email Department region')
      .sort({ username: 1 });

    return sendSuccessResponse(res, 200, { supervisors }, 'Supervisors retrieved successfully');

  } catch (error) {
    console.error('Get supervisors by department error:', error);
    return sendErrorResponse(res, 500, 'INTERNAL_ERROR', 'Failed to retrieve supervisors');
  }
};