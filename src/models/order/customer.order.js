import mongoose from "mongoose";

const powerSchema = new mongoose.Schema({
  side:     { type: String, enum: ["R", "L"] },
  sph:      Number,
  cyl:      Number,
  axis:     Number,
  add:      Number,
  diameter: Number,
}, { _id: false });

const prismSchema = new mongoose.Schema({
  side:  { type: String, enum: ["R", "L"] },
  prism: Number,
  base:  String,
}, { _id: false });

const centrationSchema = new mongoose.Schema({
  side:          { type: String, enum: ["R", "L"] },
  pd:            Number,
  corridor:      Number,
  fittingHeight: Number,
}, { _id: false });

const fittingSchema = new mongoose.Schema({
  hasFlatFitting: Boolean,
  dbl:            Number,
  frameType:      String,
  frameLength:    Number,
  frameHeight:    Number,
}, { _id: false });

const lensDataSchema = new mongoose.Schema({
  pantoscopeAngle: Number,
  bowAngle:        Number,
  bvd:             Number,
}, { _id: false });

// Per-eye resolved grid data
const resolvedEyeSchema = new mongoose.Schema({
  side:      { type: String, enum: ["R", "L"] },
  itemCode:  String,
  supplier:  String,
  baseCurve: Number,
  diameter:  Number,
}, { _id: false });

const orderSchema = new mongoose.Schema({
  // Auto-generated order number
  orderNumber: { type: String, unique: true, sparse: true },

  // Customer Details
  customerId:       { type: mongoose.Schema.Types.ObjectId, ref: "Customer", required: true },
  shipTo:           String,
  customerBalance:  Number,
  lab:              String,
  orderReference:   String,
  consumerCardName: String,
  opticianName:     String,

  // Product Details
  powerType:   { type: String, enum: ["Single", "Both"] },
  productMode: { type: String, enum: ["Stock Lens", "Rx"] },
  hasPrism:    Boolean,

  powers: [powerSchema],
  prisms: [prismSchema],

  brand:       String,
  category:    String,
  index:       Number,
  productName: String,
  coating:     String,
  treatment:   String,
  tint:        String,
  tintDetails: String,
  remarks:     String,
  mirror:      Boolean,

  resolved: [resolvedEyeSchema],

  // Centration
  centration: [centrationSchema],

  // Advanced
  fitting:  fittingSchema,
  lensData: lensDataSchema,

  // Charges
  directCustomer:  String,
  shippingCharges: Number,
  otherCharges:    Number,

  status: {
    type:    String,
    enum:    ["Draft", "Submitted", "Processing", "Completed", "Cancelled"],
    default: "Draft",
  },

  cancelReason: String,
  submittedAt:  Date,
  createdBy:    { type: mongoose.Schema.Types.ObjectId, ref: "Employee" },
}, { timestamps: true });

orderSchema.index({ customerId: 1, createdAt: -1 });
orderSchema.index({ status: 1 });

export default mongoose.model("Order", orderSchema);
