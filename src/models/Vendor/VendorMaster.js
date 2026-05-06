import mongoose from "mongoose";
import Counter from "../Auth/Counter.js";

const accountingDetailsSchema = new mongoose.Schema(
  {
    companyCode: { type: String, trim: true },
    reconciliationAccount: { type: String, trim: true },
    paymentMethod: { type: String, trim: true },
    cashManagementGroup: { type: String, trim: true },
    toleranceGroup: { type: String, trim: true },
    withholdingTaxType: { type: String, trim: true },
    withholdingTaxCode: { type: String, trim: true },
  },
  { _id: false }
);

const purchasingDetailsSchema = new mongoose.Schema(
  {
    isMSME: { type: Boolean, default: false },
    purchasingOrganisation: { type: String, trim: true },
    orderCurrency: { type: String, trim: true },
    placeOfDelivery: { type: String, trim: true },
    deliveryTime: { type: String, trim: true },
    minimumOrderValue: { type: Number, min: 0 },
    invoicingPartner: { type: String, trim: true },
    vendorSchemaGroup: { type: String, trim: true },
  },
  { _id: false }
);

const bankingDetailsSchema = new mongoose.Schema(
  {
    bankCountry: { type: String, trim: true },
    ifscRoutingNo: { type: String, trim: true },
    bankAccountNo: { type: String, trim: true },
    accountHolderName: { type: String, trim: true },
    ibanSwift: { type: String, trim: true },
  },
  { _id: false }
);

const vendorMasterSchema = new mongoose.Schema(
  {
    // Auto-generated vendor ID (e.g. VEN-1001)
    vendorId: {
      type: String,
      unique: true,
      trim: true,
      uppercase: true,
    },

    vendorName: {
      type: String,
      required: [true, "Vendor name is required"],
      trim: true,
      maxlength: 150,
    },
    address: {
      type: String,
      trim: true,
    },
    city: {
      type: String,
      trim: true,
    },
    state: {
      type: String,
      trim: true,
    },
    country: {
      type: String,
      trim: true,
    },
    language: {
      type: String,
      trim: true,
    },
    contactNo: {
      type: String,
      trim: true,
      match: [/^[0-9+\-\s()]{7,20}$/, "Invalid contact number"],
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      match: [
        /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
        "Please enter a valid email address",
      ],
    },
    taxNo: {
      type: String,
      trim: true,
      uppercase: true,
    },

    accountingDetails: {
      type: accountingDetailsSchema,
      default: {},
    },

    purchasingDetails: {
      type: purchasingDetailsSchema,
      default: {},
    },

    bankingDetails: {
      type: bankingDetailsSchema,
      default: {},
    },

    isDeleted: { type: Boolean, default: false },
    deletedAt: { type: Date, default: null },
    deletedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "employee",
      default: null,
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "employee",
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "employee",
    },

    serialNumber: { type: Number, unique: true },
  },
  { timestamps: true }
);

vendorMasterSchema.pre("save", async function () {
  if (this.isNew) {
    try {
      this.serialNumber = await Counter.getNextSequence("vendor_serial");
      this.vendorId = `VEN-${this.serialNumber}`;
    } catch (error) {
      throw error;
    }
  }
});

const VendorMaster = mongoose.model("VendorMaster", vendorMasterSchema);
export default VendorMaster;
