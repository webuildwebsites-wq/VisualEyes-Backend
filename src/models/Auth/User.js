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
    sparse: true, 
    trim: true,
    uppercase: true
  },
  userType: {
    type: String,
    required: [true, 'User type is required'],
    enum: {
      values: ['superadmin', 'subadmin', 'supervisor', 'user'],
      message: 'Invalid user type'
    }
  },
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
  
  role: {
    type: String,
    enum: ['Production', 'QC', 'Dispatch', 'Sales', 'Finance', 'Support', 'Store'],
    required: function() {
      return this.userType === 'user';
    }
  },
  
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
  
  permissions: {
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
    canManageDepartments: {
      type: Boolean,
      default: function() {
        return ['superadmin', 'subadmin'].includes(this.userType);
      }
    },
    canCreateOrders: {
      type: Boolean,
      default: function() {
        return this.userType !== 'user' || ['Sales', 'Support'].includes(this.role);
      }
    },
    canUpdateOrders: {
      type: Boolean,
      default: function() {
        return this.userType !== 'user' || true; 
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
    canManageProducts: {
      type: Boolean,
      default: function() {
        return this.userType !== 'user' || ['Store'].includes(this.role);
      }
    },
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
    canManageSettings: {
      type: Boolean,
      default: function() {
        return ['superadmin', 'subadmin'].includes(this.userType);
      }
    },
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

userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

const User = mongoose.model('User', userSchema);

export default User;