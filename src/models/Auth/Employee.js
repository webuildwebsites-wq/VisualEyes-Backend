import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const employee = new mongoose.Schema({
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
  phone: {
    type: String,
    required: [true, 'Phone number is required'],
    match: [/^[0-9]{10}$/, 'Please enter a valid 10-digit phone number']
  },
  address: {
    type: String,
    required: [true, 'Address is required'],
    trim: true
  },
  country: {
    type: String,
    required: [true, 'Country is required'],
    trim: true
  },
  pincode: {
    type: String,
    trim: true,
  },
  UserType: {
    type: String,
    required: [true, 'Employee type is required'],
    enum: {
      values: ['SUPERADMIN', 'ADMIN', 'SUPERVISOR', 'EMPLOYEE'],
      message: 'Invalid employee type'
    }
  },
  Role : {
  type: String,
    required: [true, 'Role type is required'],
    enum: {
    values: ["ADMIN", "BRANCH USER", "PRIORITY ORDER", "CUSTOMER", "ACCOUNTING MODULE",
    "SALES EXECUTIVE", "OTHER ADMIN", "STOCK POINT USER", "CUSTOMER CARE",
    "STORES", "PRODUCTION", "SUPERVISOR", "FITTING CENTER", "F&A",
    "DISTRIBUTOR", "DISPATCH", "STORES ADMIN", "BELOW ADMIN", "INVESTOR PROFILE",
    "AUDITOR", "CUSTOMER CARE (DB)", "BELOW ADMIN (FITTING CENTER)",
    "FITTING CENTER-V2", "DISPATCH-KOLKATTA", "SALES HEAD", "CUSTOM PROFILE", "F&A CFO"],
    message: 'Invalid Role type'
    }
  },
  ProfilePicture: {
    type: String,
    trim: true,
    default: null
  },
  Department: {
    type: String,
    enum: ['LAB', 'STORE', 'DISPATCH', 'SALES', 'FINANCE', 'CUSTOMER_SUPPORT'],
    required: function() {
      return !['SUPERADMIN', 'ADMIN'].includes(this.UserType);
  }
  },
  lab: {
    type: String,
    enum: [
      'KOLKATA STOCK',
      'STOCK ORDER',
      'VISUAL EYES LAB',
      'VE AHMEDABAD LAB',
      'VE CHENNAI LAB',
      'VE KOCHI LAB',
      'VE GURGAON LAB',
      'VE MUMBAI LAB',
      'VE TRIVANDRUM LAB',
      'SERVICE',
      'VE GLASS ORDER',
      'VE PUNE LAB',
      'VE NAGPUR LAB',
      'VE BENGALURU LAB',
      'VE HYDERBAD LAB',
      'VE KOLKATTA LAB'
    ]
  },
  region: {
    type: String,
    required: function() {
      return ['EMPLOYEE', 'SUPERVISOR'].includes(this.UserType) && this.Department === 'SALES';
    },
    trim: true
  },
  aadharCard: {
    type: String,
    trim: true
  },
  panCard: {
    type: String,
    trim: true
  },
  expiry: {
    type: Date
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'employee',
    required: function() {
      return !['SUPERADMIN'].includes(this.UserType);
    }
  },
  supervisor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'employee',
    required: function() {
      return this.UserType === 'EMPLOYEE';
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
        return ['SUPERADMIN', 'ADMIN', 'SUPERVISOR'].includes(this.UserType);
      }
    },
    CanManageUsers: {
      type: Boolean,
      default: function() {
        return ['SUPERADMIN', 'ADMIN', 'SUPERVISOR'].includes(this.UserType);
      }
    },
    CanManageDepartments: {
      type: Boolean,
      default: function() {
        return ['SUPERADMIN', 'ADMIN'].includes(this.UserType);
      }
    },
    CanManageAllDepartments: {
      type: Boolean,
      default: function() {
        return this.UserType === 'ADMIN';
      }
    },
    CanCreateOrders: {
      type: Boolean,
      default: true
    },
    CanUpdateOrders: {
      type: Boolean,
      default: true
    },
    CanViewOrders: {
      type: Boolean,
      default: true
    },
    CanDeleteOrders: {
      type: Boolean,
      default: function() {
        return ['SUPERADMIN', 'ADMIN', 'SUPERVISOR'].includes(this.UserType);
      }
    },
    CanProcessWorkflow: {
      type: Boolean,
      default: true
    },
    CanApproveWorkflow: {
      type: Boolean,
      default: function() {
        return ['SUPERADMIN', 'ADMIN', 'SUPERVISOR'].includes(this.UserType);
      }
    },
    CanCreateCustomers: {
      type: Boolean,
      default: true
    },
    CanManageCustomers: {
      type: Boolean,
      default: true
    },
    CanManageProducts: {
      type: Boolean,
      default: true
    },
    CanViewFinancials: {
      type: Boolean,
      default: true
    },
    CanManageFinancials: {
      type: Boolean,
      default: function() {
        return ['SUPERADMIN', 'ADMIN'].includes(this.UserType);
      }
    },    
    CanManageSettings: {
      type: Boolean,
      default: function() {
        return ['SUPERADMIN', 'ADMIN'].includes(this.UserType);
      }
    },
    CanViewReports: {
      type: Boolean,
      default: function() {
        return this.UserType !== 'EMPLOYEE';
      }
    },
    CanExportReports: {
      type: Boolean,
      default: function() {
        return ['SUPERADMIN', 'ADMIN', 'SUPERVISOR'].includes(this.UserType);
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
    emergencyContact: {
      name: String,
      phone: {
        type: String,
        match: [/^[0-9]{10}$/, 'Invalid phone number format']
      },
      relation: String
    },
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
  },
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

employee.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

employee.pre('save', async function () {
  if (!this.isModified('password') || !this.password) return;
  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
  } catch (error) {
    console.log("Error : ", error);
    return;
  }
});

const employeeSchema = mongoose.model('employee', employee);

export default employeeSchema;