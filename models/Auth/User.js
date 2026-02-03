import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: [true, 'Username is required'],
    unique: true,
    trim: true,
    minlength: [3, 'Username must be at least 3 characters'],
    maxlength: [50, 'Username cannot exceed 50 characters']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    trim: true,
    lowercase: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [8, 'Password must be at least 8 characters'],
    select: false
  },
  firstName: {
    type: String,
    required: [true, 'First name is required'],
    trim: true,
    maxlength: [50, 'First name cannot exceed 50 characters']
  },
  lastName: {
    type: String,
    required: [true, 'Last name is required'],
    trim: true,
    maxlength: [50, 'Last name cannot exceed 50 characters']
  },
  phone: {
    type: String,
    required: [true, 'Phone number is required'],
    match: [/^[0-9]{10}$/, 'Please enter a valid 10-digit phone number']
  },
  employeeId: {
    type: String,
    unique: true,
    sparse: true, // Only required for non-admin users
    trim: true,
    uppercase: true
  },
  
  // User Type and Hierarchy
  userType: {
    type: String,
    required: [true, 'User type is required'],
    enum: {
      values: ['superadmin', 'subadmin', 'supervisor', 'user'],
      message: 'Invalid user type'
    }
  },
  
  // Department and Region (not required for superadmin)
  department: {
    type: String,
    enum: ['Lab', 'Store', 'Dispatch', 'Sales', 'Finance', 'Customer Support'],
    required: function() {
      return this.userType !== 'superadmin';
    }
  },
  region: {
    type: String,
    enum: ['North', 'South', 'East', 'West'],
    required: function() {
      return this.userType !== 'superadmin';
    }
  },
  
  // Role within department (for regular users)
  role: {
    type: String,
    enum: ['Production', 'QC', 'Dispatch', 'Sales', 'Finance', 'Support', 'Store'],
    required: function() {
      return this.userType === 'user';
    }
  },
  
  // Hierarchy References
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: function() {
      return this.userType !== 'superadmin';
    }
  },
  supervisor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: function() {
      return this.userType === 'user';
    }
  },
  
  // Status and Security
  isActive: {
    type: Boolean,
    default: true
  },
  twoFactorEnabled: {
    type: Boolean,
    default: false
  },
  twoFactorSecret: {
    type: String,
    select: false
  },
  
  // Permissions based on user type
  permissions: {
    // User Management
    canCreateUsers: {
      type: Boolean,
      default: function() {
        return ['superadmin', 'subadmin', 'supervisor'].includes(this.userType);
      }
    },
    canManageUsers: {
      type: Boolean,
      default: function() {
        return ['superadmin', 'subadmin', 'supervisor'].includes(this.userType);
      }
    },
    
    // Department Management
    canManageDepartments: {
      type: Boolean,
      default: function() {
        return ['superadmin', 'subadmin'].includes(this.userType);
      }
    },
    
    // Order Management
    canCreateOrders: {
      type: Boolean,
      default: function() {
        return this.userType !== 'user' || ['Sales', 'Support'].includes(this.role);
      }
    },
    canUpdateOrders: {
      type: Boolean,
      default: function() {
        return this.userType !== 'user' || true; // All users can update orders they're assigned to
      }
    },
    canViewOrders: {
      type: Boolean,
      default: true
    },
    canDeleteOrders: {
      type: Boolean,
      default: function() {
        return ['superadmin', 'subadmin', 'supervisor'].includes(this.userType);
      }
    },
    
    // Workflow Management
    canProcessWorkflow: {
      type: Boolean,
      default: function() {
        return this.userType === 'user' && ['Production', 'QC'].includes(this.role);
      }
    },
    canApproveWorkflow: {
      type: Boolean,
      default: function() {
        return ['superadmin', 'subadmin', 'supervisor'].includes(this.userType);
      }
    },
    
    // Customer Management
    canCreateCustomers: {
      type: Boolean,
      default: function() {
        return this.userType !== 'user' || ['Sales', 'Finance'].includes(this.role);
      }
    },
    canManageCustomers: {
      type: Boolean,
      default: function() {
        return this.userType !== 'user' || ['Sales', 'Finance', 'Support'].includes(this.role);
      }
    },
    
    // Product Management
    canManageProducts: {
      type: Boolean,
      default: function() {
        return this.userType !== 'user' || ['Store'].includes(this.role);
      }
    },
    
    // Financial Management
    canViewFinancials: {
      type: Boolean,
      default: function() {
        return this.userType !== 'user' || ['Finance', 'Sales'].includes(this.role);
      }
    },
    canManageFinancials: {
      type: Boolean,
      default: function() {
        return this.userType !== 'user' || ['Finance'].includes(this.role);
      }
    },
    
    // System Settings
    canManageSettings: {
      type: Boolean,
      default: function() {
        return ['superadmin', 'subadmin'].includes(this.userType);
      }
    },
    
    // Reporting
    canViewReports: {
      type: Boolean,
      default: function() {
        return this.userType !== 'user';
      }
    },
    canExportReports: {
      type: Boolean,
      default: function() {
        return ['superadmin', 'subadmin', 'supervisor'].includes(this.userType);
      }
    }
  },
  
  // Profile Information
  profile: {
    dateOfJoining: {
      type: Date,
      default: Date.now
    },
    dateOfBirth: {
      type: Date
    },
    address: {
      street: String,
      city: String,
      state: String,
      pincode: {
        type: String,
        match: [/^[0-9]{6}$/, 'Invalid pincode format']
      }
    },
    emergencyContact: {
      name: String,
      phone: {
        type: String,
        match: [/^[0-9]{10}$/, 'Invalid phone number format']
      },
      relation: String
    },
    skills: [String],
    certifications: [String]
  },
  
  // Work Schedule
  workSchedule: {
    shift: {
      type: String,
      enum: ['Morning', 'Evening', 'Night', 'Flexible'],
      default: 'Morning'
    },
    workingDays: {
      type: [String],
      default: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
    }
  },
  
  // Security and Login
  lastLogin: {
    type: Date
  },
  loginAttempts: {
    type: Number,
    default: 0
  },
  lockUntil: {
    type: Date
  },
  passwordResetToken: {
    type: String,
    select: false
  },
  passwordResetExpires: {
    type: Date,
    select: false
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for full name
userSchema.virtual('fullName').get(function() {
  return `${this.firstName} ${this.lastName}`;
});

// Virtual for account lock status
userSchema.virtual('isLocked').get(function() {
  return !!(this.lockUntil && this.lockUntil > Date.now());
});

// Virtual for work experience
userSchema.virtual('workExperience').get(function() {
  if (!this.profile.dateOfJoining) return 0;
  
  const now = new Date();
  const joining = new Date(this.profile.dateOfJoining);
  const diffTime = Math.abs(now - joining);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  return Math.floor(diffDays / 365);
});

// Indexes
userSchema.index({ username: 1 });
userSchema.index({ email: 1 });
userSchema.index({ employeeId: 1 });
userSchema.index({ userType: 1 });
userSchema.index({ department: 1, region: 1 });
userSchema.index({ supervisor: 1 });
userSchema.index({ createdBy: 1 });
userSchema.index({ isActive: 1 });

// Compound indexes
userSchema.index({ userType: 1, department: 1, region: 1 });
userSchema.index({ userType: 1, isActive: 1 });

// Pre-save middleware to hash password
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();

  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Pre-save middleware to generate employee ID for non-admin users
userSchema.pre('save', async function(next) {
  if (!this.isNew || this.employeeId || this.userType === 'superadmin') return next();

  try {
    // Generate employee ID: USERTYPE-DEPT-REGION-YYYY-NNNN
    const year = new Date().getFullYear();
    let prefix;
    
    if (this.userType === 'subadmin') {
      prefix = `SA-${year}`;
    } else if (this.userType === 'supervisor') {
      prefix = `SUP-${this.department.substring(0, 3).toUpperCase()}-${this.region.substring(0, 1)}-${year}`;
    } else {
      prefix = `USR-${this.department.substring(0, 3).toUpperCase()}-${this.region.substring(0, 1)}-${year}`;
    }
    
    // Find the last employee with this prefix
    const lastEmployee = await this.constructor
      .findOne({ employeeId: new RegExp(`^${prefix}`) })
      .sort({ employeeId: -1 });
    
    let sequence = 1;
    if (lastEmployee) {
      const lastSequence = parseInt(lastEmployee.employeeId.split('-').pop());
      sequence = lastSequence + 1;
    }
    
    this.employeeId = `${prefix}-${sequence.toString().padStart(4, '0')}`;
    next();
  } catch (error) {
    next(error);
  }
});

// Pre-save middleware to set default permissions
userSchema.pre('save', function(next) {
  if (!this.isNew) return next();
  
  // Set permissions based on user type and role
  const permissions = this.permissions || {};
  
  // Apply default permissions based on user type
  if (this.userType === 'superadmin') {
    Object.keys(this.schema.paths.permissions.schema.paths).forEach(key => {
      permissions[key] = true;
    });
  }
  
  this.permissions = permissions;
  next();
});

// Instance method to check password
userSchema.methods.comparePassword = async function(candidatePassword) {
  try {
    return await bcrypt.compare(candidatePassword, this.password);
  } catch (error) {
    throw new Error('Password comparison failed');
  }
};

// Instance method to increment login attempts
userSchema.methods.incLoginAttempts = function() {
  if (this.lockUntil && this.lockUntil < Date.now()) {
    return this.updateOne({
      $unset: { lockUntil: 1 },
      $set: { loginAttempts: 1 }
    });
  }
  
  const updates = { $inc: { loginAttempts: 1 } };
  
  if (this.loginAttempts + 1 >= 5 && !this.isLocked) {
    updates.$set = { lockUntil: Date.now() + 2 * 60 * 60 * 1000 };
  }
  
  return this.updateOne(updates);
};

// Instance method to reset login attempts
userSchema.methods.resetLoginAttempts = function() {
  return this.updateOne({
    $unset: { loginAttempts: 1, lockUntil: 1 }
  });
};

// Instance method to update last login
userSchema.methods.updateLastLogin = function() {
  return this.updateOne({ lastLogin: new Date() });
};

// Instance method to check permission
userSchema.methods.hasPermission = function(permission) {
  return this.permissions[permission] === true;
};

// Instance method to check if user can manage another user
userSchema.methods.canManage = function(targetUser) {
  // SuperAdmin can manage everyone
  if (this.userType === 'superadmin') return true;
  
  // SubAdmin can manage supervisors and users
  if (this.userType === 'subadmin') {
    return ['supervisor', 'user'].includes(targetUser.userType);
  }
  
  // Supervisor can manage users in same department and region
  if (this.userType === 'supervisor') {
    return targetUser.userType === 'user' && 
           targetUser.department === this.department && 
           targetUser.region === this.region;
  }
  
  return false;
};

// Static method to find by user type
userSchema.statics.findByUserType = function(userType, isActive = true) {
  return this.find({ userType, isActive }).populate('createdBy supervisor', 'firstName lastName userType');
};

// Static method to find by department and region
userSchema.statics.findByDepartmentAndRegion = function(department, region, isActive = true) {
  return this.find({ department, region, isActive }).populate('createdBy supervisor', 'firstName lastName userType');
};

// Static method to find subordinates
userSchema.statics.findSubordinates = function(userId) {
  return this.find({ 
    $or: [
      { createdBy: userId },
      { supervisor: userId }
    ],
    isActive: true 
  }).populate('createdBy supervisor', 'firstName lastName userType');
};

// Static method to get hierarchy statistics
userSchema.statics.getHierarchyStats = async function() {
  const stats = await this.aggregate([
    { $match: { isActive: true } },
    {
      $group: {
        _id: '$userType',
        count: { $sum: 1 },
        departments: { $addToSet: '$department' },
        regions: { $addToSet: '$region' }
      }
    },
    {
      $project: {
        userType: '$_id',
        count: 1,
        departmentCount: { $size: { $filter: { input: '$departments', cond: { $ne: ['$$this', null] } } } },
        regionCount: { $size: { $filter: { input: '$regions', cond: { $ne: ['$$this', null] } } } }
      }
    }
  ]);
  
  return stats;
};

// Static method to create default super admin
userSchema.statics.createSuperAdmin = async function(adminData) {
  const existingAdmin = await this.findOne({ userType: 'superadmin' });
  if (existingAdmin) {
    throw new Error('Super Admin already exists');
  }
  
  return this.create({
    ...adminData,
    userType: 'superadmin'
  });
};

const User = mongoose.model('User', userSchema);

export default User;