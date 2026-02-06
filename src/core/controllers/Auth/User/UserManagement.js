import VerificationEmail from '../../../../Utils/Mail/verifyEmailTemplate.js';
import { sendSuccessResponse, sendErrorResponse } from '../../../../Utils/response/responseHandler.js';
import User from '../../../../models/Auth/User.js';
import sendOTPEmail from '../../../config/Email/sendEmail.js';

export const createSubAdmin = async (req, res) => {
  try {
    const { username, email, password, firstName, lastName, phone, employeeId } = req.body;
    
    if (!username || !email || !password || !firstName || !lastName || !phone) {
      return sendErrorResponse(res, 400, 'VALIDATION_ERROR', 'All required fields must be provided');
    }

    if (req.user.UserType !== 'SUPERADMIN') {
      return sendErrorResponse(res, 403, 'FORBIDDEN', 'Only SuperAdmin can create SubAdmin');
    }

    const existingUser = await User.findOne({
      $or: [{ email }, { username }, { employeeId: employeeId || null }]
    });

    if (existingUser) {
      return sendErrorResponse(res, 409, 'USER_EXISTS', 'User with this email, username, or employee ID already exists');
    }
    
    const EmailOtp = Math.floor(100000 + Math.random() * 800000).toString();
    const MobileOtp = Math.floor(100000 + Math.random() * 900000).toString();
    
    const subAdmin = new User({
      username,
      email,
      password, 
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

export const createSupervisorOrUser = async (req, res) => {
  try {
   const { username, email, password, firstName, lastName, phone, employeeId, userType, department, region, role } = req.body;
   let assignedSupervisor = null;

    if (!username || !email || !password || !firstName || !lastName || !phone || !userType || !department || !region) {
      return sendErrorResponse(res, 400, 'VALIDATION_ERROR', 'All required fields must be provided');
    }

    if (!['SUPERVISOR', 'USER'].includes(userType.toUpperCase())) {
      return sendErrorResponse(res, 400, 'VALIDATION_ERROR', 'User type must be either SUPERVISOR or USER');
    }

    if (userType.toUpperCase()  === 'USER') {
      if (!role) {
        return sendErrorResponse(res,400,'VALIDATION_ERROR','Role is required for USER type');
      }

      assignedSupervisor = await User.findOne({
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

    const existingUser = await User.findOne({
      $or: [{ email }, { username }, 
      { employeeId: employeeId || null }]
    });

    if (existingUser) {
      return sendErrorResponse(res, 409, 'USER_EXISTS', 'User with this email, username, or employee ID already exists');
    }

    const userData = {
      username,
      email,
      password, 
      firstName,
      lastName,
      phone,
      employeeId,
      UserType: userType.toUpperCase(),
      Department: department.toUpperCase(),
      Region: region.toUpperCase(),
      createdBy: req.user.id,
      isActive: true
    };

    if (userType.toUpperCase() === 'USER') {
      userData.Role = role.toUpperCase();
      userData.supervisor = assignedSupervisor._id;
    }

    const newUser = new User(userData);
    await newUser.save();

    const userResponse = newUser.toObject();
    delete userResponse.password;

    return sendSuccessResponse(res, 201, { user: userResponse }, `${userType.charAt(0).toUpperCase() + userType.slice(1)} created successfully`);

  } catch (error) {
    console.error('Create Supervisor/User error:', error);
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return sendErrorResponse(res, 400, 'VALIDATION_ERROR', messages.join(', '));
    }
    return sendErrorResponse(res, 500, 'INTERNAL_ERROR', 'Failed to create user');
  }
};

export const getUsersByHierarchy = async (req, res) => {
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
      query.UserType = { $in: ['SUPERVISOR', 'USER'] }; 
      
      if (userType && ['SUPERVISOR', 'USER'].includes(userType.toUpperCase())) {
        query.UserType = userType.toUpperCase();
      }
    } else {
      query.$or = [
        { _id: req.user.id },
        { 
          Department: req.user.Department, 
          Region: req.user.Region,
          UserType: 'USER'
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

    const users = await User.find(query)
      .select('-password -passwordResetToken -passwordResetExpires -twoFactorSecret')
      .populate('createdBy supervisor', 'firstName lastName UserType')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await User.countDocuments(query);

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

export const updateUser = async (req, res) => {
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
      const targetUser = await User.findById(userId);
      if (targetUser && targetUser.UserType === 'SUPERADMIN') {
        return sendErrorResponse(res, 403, 'FORBIDDEN', 'SubAdmin cannot update SuperAdmin');
      }
    } else if (req.user.UserType === 'SUPERVISOR') {
      query.Department = req.user.Department;
      query.Region = req.user.Region;
      query.UserType = { $in: ['USER'] }; 
    } else {
      query._id = req.user.id;
    }

    const user = await User.findOne(query);

    if (!user) {
      return sendErrorResponse(res, 404, 'USER_NOT_FOUND', 'User not found or not authorized to update');
    }

    Object.assign(user, updates);
    await user.save();

    const userResponse = user.toObject();
    delete userResponse.password;

    return sendSuccessResponse(res, 200, { user: userResponse }, 'User updated successfully');

  } catch (error) {
    console.error('Update user error:', error);
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return sendErrorResponse(res, 400, 'VALIDATION_ERROR', messages.join(', '));
    }
    return sendErrorResponse(res, 500, 'INTERNAL_ERROR', 'Failed to update user');
  }
};

export const deactivateUser = async (req, res) => {
  try {
    const { userId } = req.params;
    let query = { _id: userId, isActive: true };
    if (req.user.UserType === 'SUPERADMIN') {
      const targetUser = await User.findById(userId);
      if (targetUser && targetUser.UserType === 'SUPERADMIN') {
        return sendErrorResponse(res, 403, 'FORBIDDEN', 'Cannot deactivate another SuperAdmin');
      }
    } else if (req.user.UserType === 'SUBADMIN') {
      const targetUser = await User.findById(userId);
      if (targetUser && targetUser.UserType === 'SUPERADMIN') {
        return sendErrorResponse(res, 403, 'FORBIDDEN', 'SubAdmin cannot deactivate SuperAdmin');
      }
    } else if (req.user.UserType === 'SUPERVISOR') {
      query.Department = req.user.Department;
      query.Region = req.user.Region;
      query.UserType = 'USER';
    } else {
      return sendErrorResponse(res, 403, 'FORBIDDEN', 'Insufficient privileges to deactivate users');
    }
    const user = await User.findOne(query);
    if (!user) {
      return sendErrorResponse(res, 404, 'USER_NOT_FOUND', 'User not found or not authorized to deactivate');
    }

    user.isActive = false;
    await user.save();

    return sendSuccessResponse(res, 200, null, 'User deactivated successfully');

  } catch (error) {
    console.error('Deactivate user error:', error);
    return sendErrorResponse(res, 500, 'INTERNAL_ERROR', 'Failed to deactivate user');
  }
};

export const getUserDetails = async (req, res) => {
  try {
    const { userId } = req.params;

    let query = { _id: userId, isActive: true };
    if (req.user.UserType === 'SUPERADMIN') {
    } else if (req.user.UserType === 'SUBADMIN') {
      const targetUser = await User.findById(userId);
      if (targetUser && targetUser.UserType === 'SUPERADMIN') {
        return sendErrorResponse(res, 403, 'FORBIDDEN', 'SubAdmin cannot view SuperAdmin details');
      }
    } else if (req.user.UserType === 'SUPERVISOR') {
      query.Department = req.user.Department;
      query.Region = req.user.Region;
    } else {
      const targetUser = await User.findById(userId);
      if (targetUser && 
          (targetUser._id.toString() !== req.user.id && 
           (targetUser.Department !== req.user.Department || 
            targetUser.Region !== req.user.Region ||
            targetUser.UserType !== 'USER'))) {
        return sendErrorResponse(res, 403, 'FORBIDDEN', 'Access denied');
      }
    }

    const user = await User.findOne(query)
      .select('-password -passwordResetToken -passwordResetExpires -twoFactorSecret')
      .populate('createdBy supervisor', 'firstName lastName UserType');

    if (!user) {
      return sendErrorResponse(res, 404, 'USER_NOT_FOUND', 'User not found');
    }

    return sendSuccessResponse(res, 200, { user }, 'User details retrieved successfully');

  } catch (error) {
    console.error('Get user details error:', error);
    return sendErrorResponse(res, 500, 'INTERNAL_ERROR', 'Failed to retrieve user details');
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

    const supervisors = await User.find(query)
      .select('firstName lastName username email Department Region')
      .sort({ firstName: 1, lastName: 1 });

    return sendSuccessResponse(res, 200, { supervisors }, 'Supervisors retrieved successfully');

  } catch (error) {
    console.error('Get supervisors by department error:', error);
    return sendErrorResponse(res, 500, 'INTERNAL_ERROR', 'Failed to retrieve supervisors');
  }
};