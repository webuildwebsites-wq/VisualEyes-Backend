import bcrypt from 'bcryptjs';
import { sendSuccessResponse, sendErrorResponse } from '../../../../Utils/response/responseHandler.js';
import User from '../../../../models/Auth/User.js';

export const createSubAdmin = async (req, res) => {
  try {
    const { username,email,password,firstName,lastName,phone,employeeId,department,region } = req.body;
    if (!username || !email || !password || !firstName || !lastName || !phone || !department || !region) {
      return sendErrorResponse(res, 400, 'VALIDATION_ERROR', 'All required fields must be provided');
    }

    const existingUser = await User.findOne({
      $or: [{ email }, { username }, { employeeId: employeeId || null }]
    });

    if (existingUser) {
      return sendErrorResponse(res, 409, 'USER_EXISTS', 'User with this email, username, or employee ID already exists');
    }

    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash(password, salt);

    const subAdmin = new User({
      username,
      email,
      password: hashedPassword,
      firstName,
      lastName,
      phone,
      employeeId,
      userType: 'subadmin',
      department,
      region,
      createdBy: req.user.id,
      isActive: true
    });

    await subAdmin.save();

    const subAdminResponse = subAdmin.toObject();
    delete subAdminResponse.password;

    return sendSuccessResponse(res, 201, { subAdmin: subAdminResponse }, 'SubAdmin created successfully');

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
    const { username, email, password, firstName, lastName, phone, employeeId, userType, department, region, role, supervisor } = req.body;

    if (!username || !email || !password || !firstName || !lastName || !phone || !userType) {
      return sendErrorResponse(res, 400, 'VALIDATION_ERROR', 'All required fields must be provided');
    }

    if (!['supervisor', 'user'].includes(userType)) {
      return sendErrorResponse(res, 400, 'VALIDATION_ERROR', 'User type must be either supervisor or user');
    }

    if (userType === 'user') {
      if (!role || !supervisor) {
        return sendErrorResponse(res, 400, 'VALIDATION_ERROR', 'Role and supervisor are required for user type');
      }

      const supervisorUser = await User.findOne({
        _id: supervisor,
        userType: 'supervisor',
        department: req.user.department,
        isActive: true
      });

      if (!supervisorUser) {
        return sendErrorResponse(res, 400, 'VALIDATION_ERROR', 'Invalid supervisor or supervisor not in the same department');
      }
    }

    const existingUser = await User.findOne({
      $or: [{ email }, { username }, { employeeId: employeeId || null }]
    });

    if (existingUser) {
      return sendErrorResponse(res, 409, 'USER_EXISTS', 'User with this email, username, or employee ID already exists');
    }

    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash(password, salt);

    const userData = {
      username,
      email,
      password: hashedPassword,
      firstName,
      lastName,
      phone,
      employeeId,
      userType,
      department: department || req.user.department,
      region: region || req.user.region,
      createdBy: req.user.id,
      isActive: true
    };

    if (userType === 'user') {
      userData.role = role;
      userData.supervisor = supervisor;
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

    if (req.user.userType === 'superadmin') {
      if (userType) query.userType = userType;
      if (department) query.department = department;
      if (region) query.region = region;
    } else if (req.user.userType === 'subadmin') {
      query.department = req.user.department;
      query.region = req.user.region;
      if (userType && ['supervisor', 'user'].includes(userType)) {
        query.userType = userType;
      }
    }

    if (search) {
      query.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { username: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { employeeId: { $regex: search, $options: 'i' } }
      ];
    }

    const users = await User.find(query)
      .select('-password -passwordResetToken -passwordResetExpires -twoFactorSecret')
      .populate('createdBy supervisor', 'firstName lastName userType')
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
    delete updates.userType;
    delete updates.createdBy;
    delete updates._id;

    let query = { _id: userId, isActive: true };

    if (req.user.userType === 'subadmin') {
      query.department = req.user.department;
      query.region = req.user.region;
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

    if (req.user.userType === 'subadmin') {
      query.department = req.user.department;
      query.region = req.user.region;
    }

    const user = await User.findOne(query);

    if (!user) {
      return sendErrorResponse(res, 404, 'USER_NOT_FOUND', 'User not found or not authorized to deactivate');
    }

    if (user.userType === 'superadmin') {
      return sendErrorResponse(res, 403, 'FORBIDDEN', 'Cannot deactivate SuperAdmin');
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

    if (req.user.userType === 'subadmin') {
      query.department = req.user.department;
      query.region = req.user.region;
    }

    const user = await User.findOne(query)
      .select('-password -passwordResetToken -passwordResetExpires -twoFactorSecret')
      .populate('createdBy supervisor', 'firstName lastName userType');

    if (!user) {
      return sendErrorResponse(res, 404, 'USER_NOT_FOUND', 'User not found');
    }

    return sendSuccessResponse(res, 200, { user }, 'User details retrieved successfully');

  } catch (error) {
    console.error('Get user details error:', error);
    return sendErrorResponse(res, 500, 'INTERNAL_ERROR', 'Failed to retrieve user details');
  }
};
