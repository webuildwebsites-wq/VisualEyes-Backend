import mongoose from "mongoose";

const specificLabSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Specific lab name is required"],
      trim: true,
      maxlength: [100, "Specific lab name cannot exceed 100 characters"],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [500, "Description cannot exceed 500 characters"],
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "employee",
      required: true,
    },
  },
  { 
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

specificLabSchema.index({ name: 1 }, { unique: true });
specificLabSchema.index({ isActive: 1 });

export default mongoose.model("SpecificLab", specificLabSchema);
