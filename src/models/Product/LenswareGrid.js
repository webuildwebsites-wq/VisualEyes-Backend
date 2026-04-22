import mongoose from "mongoose";
const lenswareGridSchema = new mongoose.Schema(
  {
    gridType: {
      type: String,
      required: true,
      enum: ["RxSvGrid", "FFGrid"],
      unique: true,
    },
    cells: [
      {
        _id: false,
        sphere:    { type: Number, required: true },
        axisValue: { type: Number, required: true },
        baseCurve: { type: Number, default: null },
      },
    ],
  },
  { timestamps: true }
);

const LenswareGrid = mongoose.model("LenswareGrid", lenswareGridSchema);
export default LenswareGrid;
