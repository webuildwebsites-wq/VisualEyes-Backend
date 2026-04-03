import mongoose from "mongoose";

const productBrandSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true, trim: true },
}, { timestamps: true });

export default mongoose.model("ProductBrand", productBrandSchema);
