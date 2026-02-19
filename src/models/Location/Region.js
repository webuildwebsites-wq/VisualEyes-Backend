import mongoose from 'mongoose';

const regionSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Region name is required'],
    unique: true,
    trim: true,
    maxlength: [100, 'Region name cannot exceed 100 characters']
  },
  code: {
    type: String,
    required: [true, 'Region code is required'],
    unique: true,
    uppercase: true,
    trim: true,
    maxlength: [20, 'Region code cannot exceed 20 characters']
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

regionSchema.index({ isActive: 1 });

regionSchema.virtual('cities', {
  ref: 'City',
  localField: '_id',
  foreignField: 'regionId'
});

export default mongoose.model('Region', regionSchema);
