import mongoose from "mongoose";

const productCategorySchema = new mongoose.Schema({
  name:      { type: String, required: true, unique: true, trim: true },
  isActive:  { type: Boolean, default: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "Employee", default: null },
}, { timestamps: true });

export default mongoose.model("ProductCategory", productCategorySchema);
