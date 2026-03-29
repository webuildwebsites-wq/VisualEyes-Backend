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
        axisValue: { type: Number, required: true }, // Addition or Cylinder value
        stock:     { type: Number, default: null },  // base curve value
      },
    ],
  },
  { timestamps: true }
);

const BaseGrid = mongoose.model("BaseGrid", baseGridSchema);
export default BaseGrid;
