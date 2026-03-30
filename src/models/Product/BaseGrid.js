import mongoose from "mongoose";

const baseGridSchema = new mongoose.Schema(
  {
    supplier:     { type: String, required: true, index: true },
    productCode:  { type: String, required: true, index: true },
    gridType:     { type: String, required: true, enum: ["FFGrid", "RxGrid", "BaseGrid"] },
    sheetName:    { type: String, required: true, unique: true },
    productTitle: { type: String },
    axisType:     { type: String, required: true }, // "Addition" | "Minus cylinder"
    grid: [
      {
        _id:       false,
        sphere:    { type: Number, required: true },
        axisValue: { type: Number, required: true }, // CYL (Minus cylinder) or ADD (Addition)
        stock:     { type: Number, default: null },  // base curve value
      },
    ],
  },
  { timestamps: true }
);

// Compound index for supplier + productCode lookups
baseGridSchema.index({ supplier: 1, productCode: 1 });

const BaseGrid = mongoose.model("BaseGrid", baseGridSchema);
export default BaseGrid;
