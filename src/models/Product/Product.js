import mongoose from "mongoose";

const productSchema = new mongoose.Schema(
  {
    itemCode: { type: String, trim: true },
    productName: { type: String, trim: true },
    coating: { type: String, trim: true },
    index: { type: Number },
    productShortCode: { type: String, trim: true },
    brand: { type: String, trim: true },
    productType: { type: String, trim: true },
    category: { type: String, trim: true },
    treatment: { type: String, trim: true },
    price: { type: Number },
    status: { type: String, trim: true },
    lab: { type: String, trim: true },
    blankCode: { type: String, trim: true },
  },
  { timestamps: true }
);

export default mongoose.model("Product", productSchema);
