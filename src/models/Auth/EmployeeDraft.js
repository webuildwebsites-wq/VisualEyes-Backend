import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const subRoleSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      trim: true,
    },
    refId: {
      type: mongoose.Schema.Types.ObjectId,
    },
  },
  { _id: false },
);

const employee = new mongoose.Schema(
  {
    employeeName: {
      type: String,
      trim: true,
    },
    username: {
      type: String,
      sparse: true,
      trim: true,
    },
    email: {
      type: String,
      sparse: true,
      trim: true,
      lowercase: true,
    },
    password: {
      type: String,
      select: false,
    },
    phone: {
      type: String,
    },
    address: {
      type: String,
      trim: true,
    },
    country: {
      type: String,
      trim: true,
    },
    pincode: {
      type: String,
      trim: true,
    },
    EmployeeType: {
      type: String,
      trim: true,
    },
    ProfilePicture: {
      type: String,
      trim: true,
      default: null,
    },
    Department: {
      name: {
        type: String,
        trim: true,
      },
      refId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Department",
      },
    },
    subRoles: [subRoleSchema],
    lab: {
      name: {
        type: String,
        trim: true,
      },
      refId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Lab",
      },
    },
    zone: {
      name: {
        type: String,
        trim: true,
        uppercase: true,
      },
      refId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Location",
      },
    },
    aadharCard: {
      type: String,
      trim: true,
    },
    panCard: {
      type: String,
      trim: true,
    },
    aadharCardImg: {
      type: String,
      trim: true,
    },
    panCardImg: {
      type: String,
      trim: true,
    },
    expiry: {
      type: Date,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "employee",
    },
    supervisor: {
      name: {
        type: String,
        trim: true,
      },
      refId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "employee",
      },
    },
    teamLead: {
      name: {
        type: String,
        trim: true,
      },
      refId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "employee",
      },
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    twoFactorEnabled: {
      type: Boolean,
      default: false,
    },
    twoFactorSecret: {
      type: String,
      select: false,
    },
    permissions: {
        CanCreateEmployee: {
          type: Boolean,
        },
        CanManageEmployee: {
          type: Boolean,
        },
        CanManageDepartments: {
          type: Boolean,
         
        },
        CanManageAllDepartments: {
          type: Boolean,
         
        },
        CanCreateOrders: {
          type: Boolean,
          default: true,
        },
        CanUpdateOrders: {
          type: Boolean,
          default: true,
        },
        CanViewOrders: {
          type: Boolean,
          default: true,
        },
        CanDeleteOrders: {
          type: Boolean,
          
        },
        CanProcessWorkflow: {
          type: Boolean,
          default: true,
        },
        CanApproveWorkflow: {
          type: Boolean,
          
        },
        CanCreateCustomers: {
          type: Boolean,
          default: true,
        },
        CanManageCustomers: {
          type: Boolean,
          default: true,
        },
        CanManageProducts: {
          type: Boolean,
          default: true,
        },
        CanViewFinancials: {
          type: Boolean,
          default: true,
        },
        CanManageFinancials: {
          type: Boolean,
         
        },
        CanManageSettings: {
          type: Boolean,
         
        },
        CanViewReports: {
          type: Boolean,
         
        },
        CanExportReports: {
          type: Boolean,
          
        },
      },
    profile: {
      dateOfJoining: {
        type: Date,
        default: Date.now,
      },
      dateOfBirth: {
        type: Date,
      },
      emergencyContact: {
        name: String,
        phone: {
          type: String,
  
        },
        relation: String,
      },
    },
    lastLogin: {
      type: Date,
    },
    lockUntil: {
      type: Date,
    },
    passwordResetToken: {
      type: String,
      select: false,
    },
    passwordResetExpires: {
      type: Date,
      select: false,
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: function (doc, ret) {
        delete ret.id;
        return ret;
      },
    },
    toObject: {
      virtuals: true,
      transform: function (doc, ret) {
        delete ret.id;
        return ret;
      },
    },
  },
);

employee.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

employee.pre("save", async function () {
  if (!this.isModified("password") || !this.password) return;
  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
  } catch (error) {
    console.log("Error : ", error);
    return;
  }
});

const employeeDraftSchema = mongoose.model("employeeDraft", employee);

export default employeeDraftSchema;
