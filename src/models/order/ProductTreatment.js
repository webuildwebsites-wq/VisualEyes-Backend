import mongoose from "mongoose";

const productTreatmentSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true, trim: true },
}, { timestamps: true });

export default mongoose.model("ProductTreatment", productTreatmentSchema);
