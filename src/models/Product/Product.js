import mongoose from "mongoose";

const supplierEntrySchema = new mongoose.Schema({
  name: { type: String, trim: true, uppercase: true, required: true },
  priority: { type: Number, required: true },
  active: { type: Boolean, default: true },
}, { _id: false }
);

const productSchema = new mongoose.Schema(
  {
    itemCode: {
      type: String,
      trim: true,
      uppercase: true,
      index: true,
    },

    productName: { type: String, trim: true },
    brand: { type: String, trim: true },
    productType: { type: String, trim: true },
    category: { type: String, trim: true },
    treatment: { type: String, trim: true },
    price: { type: Number },
    status: { type: String, trim: true },

    productShortCode: { type: String, trim: true, uppercase: true, index: true },
    coating: { type: String, trim: true },
    index: { type: Number },
    lab: { type: String, trim: true },
    blankCode: { type: String, trim: true },

    gstPercentage: { type: Number },
    hsnCode: { type: String, trim: true },
    thirdParty: { type: String, trim: true },

    suppliers: { type: [supplierEntrySchema], default: [] },

    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "Employee" },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "Employee" },
  }, { timestamps: true }
);

// Compound index used by the order resolution engine
productSchema.index({ brand: 1, category: 1, productName: 1 });

export default mongoose.model("Product", productSchema);
