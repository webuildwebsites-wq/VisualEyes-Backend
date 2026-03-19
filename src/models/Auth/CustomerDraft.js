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

    },
    ownerName: {
      type: String,
      trim: true,

    },
    BusinessType: {
      name: {
        type: String,
        required: false,
      },
      refId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'BusinessType',
        required: false
      }
    },
    orderMode: {
      type: String,
    },
    mobileNo1: {
      type: String,
    },
    mobileNo2: {
      type: String,
    },
    businessEmail: {
      type: String,
      required: false,
      sparse: true,
      trim: true,
      lowercase: true,
    },

    // Address details
    address: {
      type: [addressDraftSchema],
    },


    // LOGIN DETAILS
    password: {
      type: String,
      select: false,
    },
    zone: {
      name: {
        type: String,

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

      },
      refId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'SpecificLab',

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
    },
    salesPerson: {
      name: {
        type: String,

      },
      refId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'employee',
      }
    },


    // DOCUMENTATION DETAILS
    IsGSTRegistered: {
      type: Boolean,
    },
    gstType: {
      name: {
        type: String,
      },
      refId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'GSTType'
      }
    },
    GSTNumber: {
      type: String,
      uppercase: true,
    },
    GSTCertificateImg: {
      type: String,
    },
    PANCard: {
      type: String,
    },
    AadharCard: {
      type: String,
    },
    PANCardImg: {
      type: String,
    },

    AadharCardImg: {
      type: String,
    },


    // BUSINESS DETAILS
    plant: {
      name: {
        type: String,
      },
      refId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Plant',
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
      },
      refId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'FittingCenter',
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
      },
      refId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'CreditDay',
      }
    },
    courierName: {
      name: {
        type: String,

      },
      refId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'CourierName',

      }
    },
    courierTime: {
      name: {
        type: String,

      },
      refId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'CourierTime',

      }
    },
    dcWithoutValue: {
      type: Boolean,
      default: false,
    },
    Status: {
      isSuspended: {
        type: Boolean,
        default: false
      },
      isActive: {
        type: Boolean,
        default: false,
      },
      suspensionReason: String,
    },
    isDeleted: {
      type: Boolean,
      default: false
    },
    deletedAt: {
      type: Date,
      default: null
    },
    deletedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'employee',
      default: null
    },
    expireAt: {
      type: Date,
      default: null
    },

    // SYSTEM INTERNAL DETAILS
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "employee",
    },
    createdByDepartment: {
      type: String,
    },
    approvalStatus: {
      type: String,
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
  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
  } catch (error) {
    throw error;
  }
});

customerDraftSchema.pre('save', function () {
  try {
    if (this.isModified('isDeleted') && this.isDeleted === true) {
      const expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() + 30);
      this.expireAt = expiryDate;

      console.log(`Customer Draft will be automatically deleted on ${expiryDate.toISOString()}`);
    }

    if (this.isModified('isDeleted') && this.isDeleted === false) {
      this.expireAt = null;
      console.log(`Customer Draft restored - automatic deletion cancelled`);
    }
  } catch (error) {
    console.log("eror : ", error);
    throw error;
  }
});

customerDraftSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

customerDraftSchema.index({ expireAt: 1 }, { expireAfterSeconds: 0, partialFilterExpression: { expireAt: { $ne: null } } });
const CustomerDraft = mongoose.model('CustomerDraft', customerDraftSchema);
export default CustomerDraft;