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
  UserType: {
    type: String,
    required: [true, 'User type is required'],
    enum: {
      values: ['SUPERADMIN', 'SUBADMIN', 'SUPERVISOR', 'USER'],
      message: 'Invalid user type'
    }
  },
  Department: {
    type: String,
    enum: ['LAB', 'STORE', 'DISPATCH', 'SALES', 'FINANCE', 'CUSTOMER_SUPPORT'],
    required: function() {
      return !['SUPERADMIN', 'SUBADMIN'].includes(this.UserType);
    }
  },
  Region: {
    type: String,
    enum: ['NORTH', 'SOUTH', 'EAST', 'WEST'],
    required: function() {
      return !['SUPERADMIN', 'SUBADMIN'].includes(this.UserType);
    }
  },
  
  Role: {
    type: String,
    enum: ['PRODUCTION', 'QC', 'DISPATCH', 'SALES', 'FINANCE', 'SUPPORT', 'STORE'],
    required: function() {
      return this.UserType === 'USER';
    }
  },
  
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: function() {
      return !['SUPERADMIN'].includes(this.UserType);
    }
  },
  supervisor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: function() {
      return this.UserType === 'USER';
    },
    validate: {
      validator: async function(supervisorId) {
        if (!supervisorId || this.UserType !== 'USER') return true;
        
        const supervisor = await mongoose.model('User').findById(supervisorId);
        return supervisor && supervisor.UserType === 'SUPERVISOR';
      },
      message: 'Supervisor must have SUPERVISOR user type'
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
    CanCreateUsers: {
      type: Boolean,
      default: function() {
        return ['SUPERADMIN', 'SUBADMIN', 'SUPERVISOR'].includes(this.UserType);
      }
    },
    CanManageUsers: {
      type: Boolean,
      default: function() {
        return ['SUPERADMIN', 'SUBADMIN', 'SUPERVISOR'].includes(this.UserType);
      }
    },
    CanManageDepartments: {
      type: Boolean,
      default: function() {
        return ['SUPERADMIN', 'SUBADMIN'].includes(this.UserType);
      }
    },
    CanManageAllDepartments: {
      type: Boolean,
      default: function() {
        return this.UserType === 'SUBADMIN';
      }
    },
    CanCreateOrders: {
      type: Boolean,
      default: function() {
        return this.UserType !== 'USER' || ['SALES', 'SUPPORT'].includes(this.Role);
      }
    },
    CanUpdateOrders: {
      type: Boolean,
      default: function() {
        return this.UserType !== 'USER' || true; 
      }
    },
    CanViewOrders: {
      type: Boolean,
      default: true
    },
    CanDeleteOrders: {
      type: Boolean,
      default: function() {
        return ['SUPERADMIN', 'SUBADMIN', 'SUPERVISOR'].includes(this.UserType);
      }
    },
    CanProcessWorkflow: {
      type: Boolean,
      default: function() {
        return this.UserType === 'USER' && ['PRODUCTION', 'QC'].includes(this.Role);
      }
    },
    CanApproveWorkflow: {
      type: Boolean,
      default: function() {
        return ['SUPERADMIN', 'SUBADMIN', 'SUPERVISOR'].includes(this.UserType);
      }
    },
    CanCreateCustomers: {
      type: Boolean,
      default: function() {
        return this.UserType !== 'USER' || ['SALES', 'FINANCE'].includes(this.Role);
      }
    },
    CanManageCustomers: {
      type: Boolean,
      default: function() {
        return this.UserType !== 'USER' || ['SALES', 'FINANCE', 'SUPPORT'].includes(this.Role);
      }
    },
    CanManageProducts: {
      type: Boolean,
      default: function() {
        return this.UserType !== 'USER' || ['STORE'].includes(this.Role);
      }
    },
    CanViewFinancials: {
      type: Boolean,
      default: function() {
        return this.UserType !== 'USER' || ['FINANCE', 'SALES'].includes(this.Role);
      }
    },
    CanManageFinancials: {
      type: Boolean,
      default: function() {
        return this.UserType !== 'USER' || ['FINANCE'].includes(this.Role);
      }
    },    
    CanManageSettings: {
      type: Boolean,
      default: function() {
        return ['SUPERADMIN', 'SUBADMIN'].includes(this.UserType);
      }
    },
    CanViewReports: {
      type: Boolean,
      default: function() {
        return this.UserType !== 'USER';
      }
    },
    CanExportReports: {
      type: Boolean,
      default: function() {
        return ['SUPERADMIN', 'SUBADMIN', 'SUPERVISOR'].includes(this.UserType);
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

userSchema.pre('save', async function () {
  if (!this.isModified('password') || !this.password) return;
  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
  } catch (error) {
    console.log("Error : ", error);
    return;
  }
});

const User = mongoose.model('User', userSchema);

export default User;