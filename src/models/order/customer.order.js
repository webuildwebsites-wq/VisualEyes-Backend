import mongoose from "mongoose";

const powerSchema = new mongoose.Schema({
  side: { type: String, enum: ["R", "L"] },
  sph: Number,
  cyl: Number,
  axis: Number,
  add: Number,
  diameter: Number,
}, { _id: false });

const prismSchema = new mongoose.Schema({
  side: { type: String, enum: ["R", "L"] },
  prism: Number,
  base: String,
}, { _id: false });

const centrationSchema = new mongoose.Schema({
  side: { type: String, enum: ["R", "L"] },
  pd: Number,
  corridor: Number,
  fittingHeight: Number,
}, { _id: false });

const fittingSchema = new mongoose.Schema({
  hasFlatFitting: Boolean,
  dbl: Number,
  frameType: String,
  frameLength: Number,
  frameHeight: Number,
}, { _id: false });

const lensDataSchema = new mongoose.Schema({
  pantoscopeAngle: Number,
  bowAngle: Number,
  bvd: Number,
}, { _id: false });

// Per-eye resolved grid data
const resolvedEyeSchema = new mongoose.Schema({
  side:      { type: String, enum: ["R", "L"] },
  itemCode:  String,
  blankCode: String,
  supplier:  String,
  baseCurve: Number,
  diameter:  Number,
}, { _id: false });

const supplierEntrySchema = new mongoose.Schema({
  name:     { type: String },
  priority: { type: Number },
  active:   { type: Boolean },
}, { _id: false });

const orderSchema = new mongoose.Schema({
  // Auto-generated order number
  orderNumber: { type: String, unique: true, sparse: true },

  // Customer Details
  customer: {
    customerId: { type: mongoose.Schema.Types.ObjectId, ref: "Customer", required: true },
    customerName: { type: String },
    customerShipToId: { type: mongoose.Schema.Types.ObjectId },
    customerShipToBranchName: { type: String },
  },

  lab: {
    id: { type: mongoose.Schema.Types.ObjectId, ref: "ProductLab" },
    name: String,
  },
  orderReference: String,
  consumerCardName: String,
  opticianName: String,

  // Product Details
  powerType: { type: String, enum: ["Single", "Both"] },
  productMode: { type: String, enum: ["Stock Lens", "Rx"] },
  hasPrism: Boolean,

  powers: [powerSchema],
  prisms: [prismSchema],

  brand: {
    id: { type: mongoose.Schema.Types.ObjectId, ref: "ProductBrand" },
    name: String,
  },
  category: {
    id: { type: mongoose.Schema.Types.ObjectId, ref: "ProductCategory" },
    name: String,
  },
  index: Number,
  productName: {
    id: { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
    name: String,
  },
  coating: {
    id: { type: mongoose.Schema.Types.ObjectId, ref: "ProductCoating" },
    name: String,
  },
  treatment: {
    id: { type: mongoose.Schema.Types.ObjectId, ref: "ProductTreatment" },
    name: String,
  },
  tint: {
    id: { type: mongoose.Schema.Types.ObjectId, ref: "Tint" },
    name: String,
  },
  tintDetails: String,
  remarks: String,
  mirror: Boolean,

  resolved: [resolvedEyeSchema],

  suppliers:        [supplierEntrySchema],

  // Centration
  centration: [centrationSchema],

  // Advanced
  fitting: fittingSchema,
  lensData: lensDataSchema,

  // Charges
  directCustomer: String,
  shippingCharges: Number,
  otherCharges: Number,

  status: {
    type: String,
    enum: ["Draft", "Submitted", "Processing", "Completed", "Cancelled"],
    default: "Submitted",
  },

  cancelReason: String,
  submittedAt: Date,
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "employee" },
}, { timestamps: true });

orderSchema.index({ "customer.customerId": 1, createdAt: -1 });
orderSchema.index({ status: 1 });

export default mongoose.model("Order", orderSchema);
