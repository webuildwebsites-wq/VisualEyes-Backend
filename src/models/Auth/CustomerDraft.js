import bcrypt from "bcryptjs";
import mongoose from "mongoose";

const addressDraftSchema = new mongoose.Schema(
  {
    branchAddress: { type: String, trim: true },
    contactPerson: { type: String, trim: true },
    contactNumber: { type: String },
    city: { type: String, trim: true },
    state: { type: String },
    zipCode: { type: String, trim: true },
    country: { type: String, default: "INDIA" },
    billingCurrency: { type: String },
    billingMode: { type: String },
  },
  { _id: false }
);

const flatFittingDraftSchema = new mongoose.Schema(
  {
    selectType: {
      name: { type: String },
      refId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "FittingCenter",
      },
    },
    index: {
      name: { type: String },
      refId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "FittingIndex",
      },
    },
    price: { type: Number },
  },
  { _id: false }
);

const customerDraftSchema = new mongoose.Schema(
  {
    // BASIC DETAILS
    shopName: {
      type: String,
      trim: true,
      maxlength: 100,
    },
    ownerName: {
      type: String,
      trim: true,
      maxlength: 100,
    },
    CustomerType: {
      name: {
        type: String,
        required: false,
      },
      refId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'CustomerType',
        required: false
      }
    },
    orderMode: {
      type: String,
    },
    mobileNo1: {
      type: String,
      match: [/^[0-9]{10}$/, "Invalid mobile number"],
    },
    mobileNo2: {
      type: String,
      match: [/^[0-9]{10}$/, "Invalid mobile number"],
    },
    landlineNo: String,
    emailId: {
      type: String,
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, "Invalid email"],
    },

    businessEmail: {
      type: String,
      required: false,
      unique: true,
      sparse: true,
      trim: true,
      lowercase: true,
      match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid businessEmail']
    },

    // Address details
    address: {
      type: [addressDraftSchema],
      validate: [(val) => val.length > 0, "At least one address is required"],
    },


    // LOGIN DETAILS
    password: {
      type: String,
      minlength: 6,
      select: false,
      required: function() {
        return ['FINANCE', 'SUPERADMIN'].includes(this.createdByDepartment) || this.approvalStatus === 'APPROVED';
      }
    },
    zone: {
      name: {
        type: String,
        required: function() {
          return ['FINANCE', 'SUPERADMIN'].includes(this.createdByDepartment) || this.approvalStatus === 'APPROVED';
        }
      },
      refId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Location',
      }
    },
    hasFlatFitting: {
      type: Boolean,
      default: false,
    },

    flatFittingData: {
      type: [flatFittingDraftSchema],
      default: [],
    },
    specificLab: {
      name: {
        type: String,
        required: function() {
          return ['FINANCE', 'SUPERADMIN'].includes(this.createdByDepartment) || this.approvalStatus === 'APPROVED';
        }
      },
      refId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'SpecificLab',
        required: function() {
          return ['FINANCE', 'SUPERADMIN'].includes(this.createdByDepartment) || this.approvalStatus === 'APPROVED';
        }
      }
    },
    brandCategories: {
      type: [{
        brandName: {
          type: String,
      
        },
        brandId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Brand',
      
        },
        categories: [{
          categoryName: {
            type: String,
        
          },
          categoryId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Category',
        
          }
        }]
      }],
      validate: {
        validator: function(value) {
          if (['FINANCE', 'SUPERADMIN'].includes(this.createdByDepartment) || this.approvalStatus === 'APPROVED') {
            return value && value.length > 0;
          }
          return true;
        },
        message: 'At least one brand with categories is required for approved customers'
      }
    },
    salesPerson: {
      name: {
        type: String,
        required: function() {
          return ['FINANCE', 'SUPERADMIN'].includes(this.createdByDepartment) || this.approvalStatus === 'APPROVED';
        }
      },
      refId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'employee',
        required: function() {
          return ['FINANCE', 'SUPERADMIN'].includes(this.createdByDepartment) || this.approvalStatus === 'APPROVED';
        }
      }
    },


    // DOCUMENTATION DETAILS
    IsGSTRegistered: {
      type: Boolean,
    },
    gstType: {
      name: {
        type: String,
        required: function () {
          return this.IsGSTRegistered === true;
        },
      },
      refId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'GSTType'
      }
    },
    GSTNumber: {
      type: String,
      uppercase: true,
      required: function () {
        return this.IsGSTRegistered === true;
      },
    },
    GSTCertificateImg: {
      type: String,
      required: function () {
        return this.IsGSTRegistered === true;
      },
    },
    PANCard: {
      type: String,
      required: function () {
        return this.IsGSTRegistered === false;
      },
    },
    AadharCard: {
      type: String,
      required: function () {
        return this.IsGSTRegistered === false;
      },
    },
    PANCardImg: {
      type: String,
      required: function () {
        return this.IsGSTRegistered === false;
      },
    },

    AadharCardImg: {
      type: String,
      required: function () {
        return this.IsGSTRegistered === false;
      },
    },


    // BUSINESS DETAILS
    plant: {
      name: {
        type: String,
        required: function() {
          return ['FINANCE', 'SUPERADMIN'].includes(this.createdByDepartment) || this.approvalStatus === 'APPROVED';
        }
      },
      refId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Plant',
        required: function() {
          return ['FINANCE', 'SUPERADMIN'].includes(this.createdByDepartment) || this.approvalStatus === 'APPROVED';
        }
      }
    },
    lab: {
      name: {
        type: String,
      },
      refId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Lab'
      }
    },
    fittingCenter: {
      name: {
        type: String,
        required: function() {
          return ['FINANCE', 'SUPERADMIN'].includes(this.createdByDepartment) || this.approvalStatus === 'APPROVED';
        }
      },
      refId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'FittingCenter',
        required: function() {
          return ['FINANCE', 'SUPERADMIN'].includes(this.createdByDepartment) || this.approvalStatus === 'APPROVED';
        }
      }
    },
    creditLimit: {
      type: Number,
      default: 0,
      min: 0,
    },
    creditDays: {
      name: {
        type: String,
        required: function() {
          return ['FINANCE', 'SUPERADMIN'].includes(this.createdByDepartment) || this.approvalStatus === 'APPROVED';
        }
      },
      refId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'CreditDay',
        required: function() {
          return ['FINANCE', 'SUPERADMIN'].includes(this.createdByDepartment) || this.approvalStatus === 'APPROVED';
        }
      }
    },
    courierName: {
      name: {
        type: String,
        required: function() {
          return ['FINANCE', 'SUPERADMIN'].includes(this.createdByDepartment) || this.approvalStatus === 'APPROVED';
        }
      },
      refId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'CourierName',
        required: function() {
          return ['FINANCE', 'SUPERADMIN'].includes(this.createdByDepartment) || this.approvalStatus === 'APPROVED';
        }
      }
    },
    courierTime: {
      name: {
        type: String,
        required: function() {
          return ['FINANCE', 'SUPERADMIN'].includes(this.createdByDepartment) || this.approvalStatus === 'APPROVED';
        }
      },
      refId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'CourierTime',
        required: function() {
          return ['FINANCE', 'SUPERADMIN'].includes(this.createdByDepartment) || this.approvalStatus === 'APPROVED';
        }
      }
    },
    dcWithoutValue: {
      type: Boolean,
      default: false,
    },
    Status : {
      isSuspended : {
        type : Boolean,
        default : false
      },
      isActive : {
        type : Boolean,
        default : true,
      },
      suspensionReason : String,
    },

    // SYSTEM INTERNAL DETAILS
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "employee",
    },
    createdByDepartment: {
      type: String,
      enum: ['SALES', 'FINANCE', 'SUPERADMIN'],
    },
    approvalStatus: {
      type: String,
      enum: ['PENDING_FINANCE', 'APPROVED'],
      default: function() {
        return this.createdByDepartment === 'SALES' ? 'PENDING_FINANCE' : 'APPROVED';
      }
    },
    financeCompletedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "employee",
    },
    financeCompletedAt: {
      type: Date,
    },
    emailOtp: String,
    emailOtpExpires: Date,
    mobileOtp: String,
    mobileOtpExpires: Date,
    designation: {
      type: String,
      default: "Customer",
    },
  },
  { timestamps: true }
);

customerDraftSchema.pre("save", async function () {
  if (!this.isModified("password") || !this.password) return;
  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
});

customerDraftSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

export default mongoose.model("CustomerDraft", customerDraftSchema);
