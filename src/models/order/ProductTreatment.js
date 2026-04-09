import mongoose from "mongoose";

const productTreatmentSchema = new mongoose.Schema({
  name:      { type: String, required: true, unique: true, trim: true },
  isActive:  { type: Boolean, default: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "employee", default: null },
}, { timestamps: true });

export default mongoose.model("ProductTreatment", productTreatmentSchema);
