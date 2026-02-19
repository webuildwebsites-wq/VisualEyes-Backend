import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const employee = new mongoose.Schema({
  employeeName: {
    type: String,
    required: [true, 'Employee name is required'],
    unique: true,
    trim: true,
    minlength: [3, 'Employee name must be at least 3 characters'],
    maxlength: [50, 'Employee name cannot exceed 50 characters']
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
  EmployeeType: {
    name: {
      type: String,
      required: [true, 'Employee type is required'],
      trim: true
    },
    refId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Role'
    }
  },
  Role: {
    name: {
      type: String,
      required: [true, 'Role type is required'],
      trim: true
    },
    refId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Role'
    }
  },
  ProfilePicture: {
    type: String,
    trim: true,
    default: null
  },
  Department: {
    name: {
      type: String,
      trim: true,
      required: function() {
        const empType = this.EmployeeType?.name || this.EmployeeType;
        return !['SUPERADMIN', 'ADMIN'].includes(empType);
      }
    },
    refId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Department'
    }
  },
  lab: {
    name: {
      type: String,
      trim: true
    },
    refId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Lab'
    }
  },
  region: {
    name: {
      type: String,
      required: function() {
        const empType = this.EmployeeType?.name || this.EmployeeType;
        const dept = this.Department?.name || this.Department;
        return ['EMPLOYEE', 'SUPERVISOR', 'REGIONMANAGER'].includes(empType) && dept === 'SALES';
      },
      trim: true
    },
    refId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Region',
      required: function() {
        const empType = this.EmployeeType?.name || this.EmployeeType;
        const dept = this.Department?.name || this.Department;
        return ['EMPLOYEE', 'SUPERVISOR', 'REGIONMANAGER'].includes(empType) && dept === 'SALES';
      }
    }
  },
  regionManager: {
    name: {
      type: String,
      trim: true
    },
    refId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'employee',
      required: function() {
        const empType = this.EmployeeType?.name || this.EmployeeType;
        const dept = this.Department?.name || this.Department;
        return empType === 'EMPLOYEE' && dept === 'SALES';
      }
    }
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
      const empType = this.EmployeeType?.name || this.EmployeeType;
      return !['SUPERADMIN'].includes(empType);
    }
  },
  supervisor: {
    name: {
      type: String,
      trim: true
    },
    refId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'employee',
      required: function() {
        const empType = this.EmployeeType?.name || this.EmployeeType;
        return empType === 'EMPLOYEE';
      }
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
    CanCreateEmployee: {
      type: Boolean,
      default: function() {
        const empType = this.EmployeeType?.name || this.EmployeeType;
        return ['SUPERADMIN', 'ADMIN', 'SUPERVISOR'].includes(empType);
      }
    },
    CanManageEmployee: {
      type: Boolean,
      default: function() {
        const empType = this.EmployeeType?.name || this.EmployeeType;
        return ['SUPERADMIN', 'ADMIN', 'SUPERVISOR'].includes(empType);
      }
    },
    CanManageDepartments: {
      type: Boolean,
      default: function() {
        const empType = this.EmployeeType?.name || this.EmployeeType;
        return ['SUPERADMIN', 'ADMIN'].includes(empType);
      }
    },
    CanManageAllDepartments: {
      type: Boolean,
      default: function() {
        const empType = this.EmployeeType?.name || this.EmployeeType;
        return empType === 'ADMIN';
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
        const empType = this.EmployeeType?.name || this.EmployeeType;
        return ['SUPERADMIN', 'ADMIN', 'SUPERVISOR'].includes(empType);
      }
    },
    CanProcessWorkflow: {
      type: Boolean,
      default: true
    },
    CanApproveWorkflow: {
      type: Boolean,
      default: function() {
        const empType = this.EmployeeType?.name || this.EmployeeType;
        return ['SUPERADMIN', 'ADMIN', 'SUPERVISOR'].includes(empType);
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
        const empType = this.EmployeeType?.name || this.EmployeeType;
        return ['SUPERADMIN', 'ADMIN'].includes(empType);
      }
    },    
    CanManageSettings: {
      type: Boolean,
      default: function() {
        const empType = this.EmployeeType?.name || this.EmployeeType;
        return ['SUPERADMIN', 'ADMIN'].includes(empType);
      }
    },
    CanViewReports: {
      type: Boolean,
      default: function() {
        const empType = this.EmployeeType?.name || this.EmployeeType;
        return empType !== 'EMPLOYEE';
      }
    },
    CanExportReports: {
      type: Boolean,
      default: function() {
        const empType = this.EmployeeType?.name || this.EmployeeType;
        return ['SUPERADMIN', 'ADMIN', 'SUPERVISOR'].includes(empType);
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
