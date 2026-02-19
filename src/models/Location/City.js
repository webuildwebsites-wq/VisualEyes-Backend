import mongoose from 'mongoose';

const citySchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'City name is required'],
    trim: true,
    maxlength: [100, 'City name cannot exceed 100 characters']
  },
  code: {
    type: String,
    required: [true, 'City code is required'],
    uppercase: true,
    trim: true,
    maxlength: [20, 'City code cannot exceed 20 characters']
  },
  regionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Region',
    required: [true, 'Region ID is required']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'employee',
    required: true
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

citySchema.index({ regionId: 1, name: 1 }, { unique: true });
citySchema.index({ regionId: 1 });
citySchema.index({ isActive: 1 });

citySchema.virtual('zones', {
  ref: 'Zone',
  localField: '_id',
  foreignField: 'cityId'
});

export default mongoose.model('City', citySchema);
