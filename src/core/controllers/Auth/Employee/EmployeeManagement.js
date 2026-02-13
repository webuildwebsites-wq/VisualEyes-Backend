import VerificationEmail from '../../../../Utils/Mail/verifyEmailTemplate.js';
import { sendSuccessResponse, sendErrorResponse } from '../../../../Utils/response/responseHandler.js';
import employeeSchema from '../../../../models/Auth/Employee.js';
import sendOTPEmail from '../../../config/Email/sendEmail.js';

export const createSubAdmin = async (req, res) => {
  try {
    const { username, email, firstName, lastName, phone, employeeId } = req.body;
    
    if (!username || !email || !firstName || !lastName || !phone) {
      return sendErrorResponse(res, 400, 'VALIDATION_ERROR', 'All required fields must be provided');
    }

    if (req.user.UserType !== 'SUPERADMIN') {
      return sendErrorResponse(res, 403, 'FORBIDDEN', 'Only SuperAdmin can create SubAdmin');
    }

    const existingUser = await employeeSchema.findOne({
      $or: [{ email }, { username }, { employeeId: employeeId || null }]
    });

    if (existingUser) {
      return sendErrorResponse(res, 409, 'USER_EXISTS', 'Employee with this email, username, or employee ID already exists');
    }
    
    const EmailOtp = Math.floor(100000 + Math.random() * 800000).toString();
    const MobileOtp = Math.floor(100000 + Math.random() * 900000).toString();
    const userpassword = Math.random().toString(36).slice(-8);
    
    const subAdmin = new employeeSchema({
      username,
      email,
      password: userpassword, 
      firstName,
      lastName,
      phone,
      employeeId,
      UserType: 'SUBADMIN',
      createdBy: req.user.id,
      isActive: false,
      emailOtp : EmailOtp,
      emailOtpExpires : Date.now() + 600000, // 10 minute 
      mobileOtp : MobileOtp,
      mobileOtpExpires : Date.now() + 600000, // 10 minute
    });

    await subAdmin.save();

    const subAdminResponse = subAdmin.toObject();
    delete subAdminResponse.password;

    await sendOTPEmail({
      sendTo: email,
      subject: "Welcome Mail for choosing VISUAL EYES",
      text: "Register email in the VISUAL EYES server",
      html: VerificationEmail(username, EmailOtp),
    });

    return sendSuccessResponse(res, 201, { subAdmin: subAdminResponse }, 'SubAdmin created successfully! Please check your email inbox to verify your account');

  } catch (error) {
    console.error('Create SubAdmin error:', error);
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return sendErrorResponse(res, 400, 'VALIDATION_ERROR', messages.join(', '));
    }
    return sendErrorResponse(res, 500, 'INTERNAL_ERROR', 'Failed to create SubAdmin');
  }
};

export const createSupervisorOrEmployee = async (req, res) => {
  try {
   const { username, email, firstName, lastName, phone, employeeId, userType, department, region } = req.body;
   let assignedSupervisor = null;

    if (!username || !email || !firstName || !lastName || !phone || !userType || !department || !region) {
      return sendErrorResponse(res, 400, 'VALIDATION_ERROR', 'All required fields must be provided');
    }

    if (!['SUPERVISOR', 'EMPLOYEE'].includes(userType.toUpperCase())) {
      return sendErrorResponse(res, 400, 'VALIDATION_ERROR', 'Employee type must be either SUPERVISOR or EMPLOYEE');
    }

    if (userType.toUpperCase()  === 'EMPLOYEE') {
      assignedSupervisor = await employeeSchema.findOne({
        UserType: 'SUPERVISOR',
        Department: department.toUpperCase(),
        Region: region.toUpperCase(),
        isActive: true
      });

      if (!assignedSupervisor) {
        return sendErrorResponse(res,400,'NO_SUPERVISOR_FOUND','No active supervisor found for this department and region');
      }

      if (req.user.UserType === 'SUPERVISOR' && assignedSupervisor._id.toString() !== req.user.id.toString()) {
        return sendErrorResponse(res,403,'FORBIDDEN','Supervisors can only assign themselves as supervisor');
      }
    }

    const existingUser = await employeeSchema.findOne({
      $or: [{ email }, { username }, 
      { employeeId: employeeId || null }]
    });

    if (existingUser) {
      return sendErrorResponse(res, 409, 'USER_EXISTS', 'Employee with this email, username, or employee ID already exists');
    }

    const EmailOtp = Math.floor(100000 + Math.random() * 800000).toString();
    const MobileOtp = Math.floor(100000 + Math.random() * 900000).toString();
    const userpassword = Math.random().toString(36).slice(-8);

    const userData = {
      username,
      email,
      password : userpassword, 
      firstName,
      lastName,
      phone,
      employeeId,
      UserType: userType.toUpperCase(),
      Department: department.toUpperCase(),
      Region: region.toUpperCase(),
      createdBy: req.user.id,
      isActive: false,
      emailOtp : EmailOtp,
      emailOtpExpires : Date.now() + 600000, // 10 minute 
      mobileOtp : MobileOtp,
      mobileOtpExpires : Date.now() + 600000, // 10 minute
    };

    if (userType.toUpperCase() === 'EMPLOYEE') {
      userData.supervisor = assignedSupervisor._id;
    }

    const newUser = new employeeSchema(userData);
    await newUser.save();
    
    await sendOTPEmail({
      sendTo: email,
      subject: "Welcome Mail for choosing VISUAL EYES",
      text: "Register email in the VISUAL EYES server",
      html: VerificationEmail(username, EmailOtp),
    });

    const userResponse = newUser.toObject();
    delete userResponse.password;

    return sendSuccessResponse(res, 201, { user: userResponse }, `${userType.charAt(0).toUpperCase() + userType.slice(1)} created successfully`);

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
      if (region) query.Region = region.toUpperCase();
    } else if (req.user.UserType === 'SUBADMIN') {
      query.UserType = { $ne: 'SUPERADMIN' };
      if (userType && userType.toUpperCase() !== 'SUPERADMIN') {
        query.UserType = userType.toUpperCase();
      }
      if (department) query.Department = department.toUpperCase();
      if (region) query.Region = region.toUpperCase();
    } else if (req.user.UserType === 'SUPERVISOR') {
      query.Department = req.user.Department;
      query.Region = req.user.Region;
      query.UserType = { $in: ['SUPERVISOR', 'EMPLOYEE'] }; 
      
      if (userType && ['SUPERVISOR', 'EMPLOYEE'].includes(userType.toUpperCase())) {
        query.UserType = userType.toUpperCase();
      }
    } else {
      query.$or = [
        { _id: req.user.id },
        { 
          Department: req.user.Department, 
          Region: req.user.Region,
          UserType: 'EMPLOYEE'
        } 
      ];
    }

    if (search) {
      const searchQuery = {
        $or: [
          { firstName: { $regex: search, $options: 'i' } },
          { lastName: { $regex: search, $options: 'i' } },
          { username: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } },
          { employeeId: { $regex: search, $options: 'i' } }
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
    } else if (req.user.UserType === 'SUBADMIN') {
      const targetUser = await employeeSchema.findById(userId);
      if (targetUser && targetUser.UserType === 'SUPERADMIN') {
        return sendErrorResponse(res, 403, 'FORBIDDEN', 'SubAdmin cannot update SuperAdmin');
      }
    } else if (req.user.UserType === 'SUPERVISOR') {
      query.Department = req.user.Department;
      query.Region = req.user.Region;
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
    } else if (req.user.UserType === 'SUBADMIN') {
      const targetUser = await employeeSchema.findById(userId);
      if (targetUser && targetUser.UserType === 'SUPERADMIN') {
        return sendErrorResponse(res, 403, 'FORBIDDEN', 'SubAdmin cannot deactivate SuperAdmin');
      }
    } else if (req.user.UserType === 'SUPERVISOR') {
      query.Department = req.user.Department;
      query.Region = req.user.Region;
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
    } else if (req.user.UserType === 'SUBADMIN') {
      const targetUser = await employeeSchema.findById(userId);
      if (targetUser && targetUser.UserType === 'SUPERADMIN') {
        return sendErrorResponse(res, 403, 'FORBIDDEN', 'SubAdmin cannot view SuperAdmin details');
      }
    } else if (req.user.UserType === 'SUPERVISOR') {
      query.Department = req.user.Department;
      query.Region = req.user.Region;
    } else {
      const targetUser = await employeeSchema.findById(userId);
      if (targetUser && 
          (targetUser._id.toString() !== req.user.id && 
           (targetUser.Department !== req.user.Department || 
            targetUser.Region !== req.user.Region ||
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
      if (region) query.Region = region.toUpperCase();
    } else if (req.user.UserType === 'SUBADMIN') {
      if (department) query.Department = department.toUpperCase();
      if (region) query.Region = region.toUpperCase();
    } else if (req.user.UserType === 'SUPERVISOR') {
      query.Department = req.user.Department;
      query.Region = req.user.Region;
    } else {
      query.Department = req.user.Department;
      query.Region = req.user.Region;
    }

    const supervisors = await employeeSchema.find(query)
      .select('firstName lastName username email Department Region')
      .sort({ firstName: 1, lastName: 1 });

    return sendSuccessResponse(res, 200, { supervisors }, 'Supervisors retrieved successfully');

  } catch (error) {
    console.error('Get supervisors by department error:', error);
    return sendErrorResponse(res, 500, 'INTERNAL_ERROR', 'Failed to retrieve supervisors');
  }
};