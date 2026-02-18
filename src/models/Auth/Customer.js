import bcrypt from "bcryptjs";
import mongoose from "mongoose";

const addressSchema = new mongoose.Schema(
  {
    address1: { type: String, required: true, trim: true },
    contactPerson: { type: String, required: true, trim: true },
    contactNumber: { type: String, required: true },
    city: { type: String, required: true, trim: true },
    state: { type: String, required: true },
    zipCode: { type: String, required: true, trim: true },
    country: { type: String, default: "INDIA" },
    billingCurrency: { type: String, required: true },
    billingMode: { type: String, required: true },
  },
  { _id: false }
);

const customerSchema = new mongoose.Schema(
  {
    // BASIC DETAILS
    shopName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    ownerName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    CustomerType: {
      type: String,
      required: true,
    },
    orderMode: {
      type: String,
      required: true,
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
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, "Invalid email"],
    },


    // Address details
    address: {
      type: [addressSchema],
      validate: [(val) => val.length > 0, "At least one address is required"],
    },


    // LOGIN DETAILS
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      minlength: 3,
      maxlength: 50,
    },
    password: {
      type: String,
      minlength: 6,
      select: false,
    },
    zone: String,
    hasFlatFitting: {
      type: Boolean,
      default: false,
    },
    selectType: {
      type: [String],
      required: function () {
        return this.hasFlatFitting === true;
      },
    },
    selectTypeIndex: {
      type: [Number],
      required: function () {
        return this.hasFlatFitting === true;
      },
    },
    Price: {
      type: Number,
      required: function () {
        return this.hasFlatFitting === true;
      },
    },
    specificLab: String,
    specificBrand: {
      type : String,
      required : true,
    },
    specificCategory: {
      type : String,
      required : true,
    },
    salesPerson : String,


    // DOCUMENTATION DETAILS
    IsGSTRegistered: {
      type: Boolean,
      required: true,
    },
    gstType: {
      type: String,
      required: function () {
        return this.IsGSTRegistered === true;
      },
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
    plant: String,
    lab: String,
    fittingCenter: String,
    creditLimit: {
      type: Number,
      default: 0,
      min: 0,
    },
    creditAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
    creditDays: {
      type: Number,
      default: 0,
    },
    courierName: String,
    courierTime: String,
    dcWithoutValue: {
      type: Boolean,
      default: false,
    },


    // SYSTEM INTERNAL DETAILS
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "employee",
      required: true,
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

customerSchema.pre("save", async function () {
  if (!this.isModified("password") || !this.password) return;
  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
});

customerSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

export default mongoose.model("Customer", customerSchema);
