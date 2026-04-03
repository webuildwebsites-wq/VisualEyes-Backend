import mongoose from "mongoose";

const productIndexSchema = new mongoose.Schema({
  value: { type: Number, required: true, unique: true },
}, { timestamps: true });

export default mongoose.model("ProductIndex", productIndexSchema);
