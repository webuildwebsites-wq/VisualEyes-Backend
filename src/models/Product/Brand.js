import mongoose from "mongoose";

const brandSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Brand name is required"],
      trim: true,
      uppercase: true,
      maxlength: [100, "Brand name cannot exceed 100 characters"],
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

brandSchema.virtual('categories', {
  ref: 'Category',
  localField: '_id',
  foreignField: 'brand'
});

brandSchema.index({ name: 1 }, { unique: true });
brandSchema.index({ isActive: 1 });

export default mongoose.model("Brand", brandSchema);
