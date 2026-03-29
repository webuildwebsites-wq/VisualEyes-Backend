import mongoose from "mongoose";

const supplierSchema = new mongoose.Schema(
  {
    productCode: { type: String, trim: true, unique: true },
    productName: { type: String, trim: true },
    brand: { type: String, trim: true },
    productType: { type: String, trim: true },
    category: { type: String, trim: true },
    treatment: { type: String, trim: true },
    gstPercentage: { type: Number },
    hsnCode: { type: String, trim: true },
    productShortCode: { type: String, trim: true },
    thirdParty: { type: String, trim: true },
    price: { type: Number },
    status: { type: String, trim: true },
    suppliers: { type: [String], default: [] },
  },
  { timestamps: true }
);

export default mongoose.model("Supplier", supplierSchema);
