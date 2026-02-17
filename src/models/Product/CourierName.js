import mongoose from "mongoose";

const courierNameSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Courier name is required"],
      trim: true,
      maxlength: [100, "Courier name cannot exceed 100 characters"],
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

courierNameSchema.index({ name: 1 }, { unique: true });
courierNameSchema.index({ isActive: 1 });

export default mongoose.model("CourierName", courierNameSchema);
