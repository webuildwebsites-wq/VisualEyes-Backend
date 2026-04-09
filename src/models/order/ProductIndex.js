import mongoose from "mongoose";

const productIndexSchema = new mongoose.Schema({
  value:     { type: Number, required: true, unique: true },
  isActive:  { type: Boolean, default: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "employee", default: null },
}, { timestamps: true });

export default mongoose.model("ProductIndex", productIndexSchema);
