import mongoose from "mongoose";

const supplierEntrySchema = new mongoose.Schema(
  {
    name:     { type: String, trim: true, required: true },
    priority: { type: Number, required: true },   // 1 = highest
    active:   { type: Boolean, default: true },
  },
  { _id: false }
);

const productSchema = new mongoose.Schema(
  {
    itemCode:         { type: String, trim: true, index: true },
    productName:      { type: String, trim: true },
    coating:          { type: String, trim: true },
    index:            { type: Number },
    productShortCode: { type: String, trim: true },
    brand:            { type: String, trim: true },
    productType:      { type: String, trim: true },
    category:         { type: String, trim: true },
    treatment:        { type: String, trim: true },
    price:            { type: Number },
    status:           { type: String, trim: true },
    lab:              { type: String, trim: true },
    blankCode:        { type: String, trim: true },
    suppliers: { type: [supplierEntrySchema], default: [] },
  },
  { timestamps: true }
);

productSchema.index({ brand: 1, category: 1, productName: 1 });

export default mongoose.model("Product", productSchema);
