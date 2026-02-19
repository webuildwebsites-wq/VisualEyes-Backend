import mongoose from 'mongoose';

const zoneSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Zone name is required'],
    trim: true,
    maxlength: [100, 'Zone name cannot exceed 100 characters']
  },
  code: {
    type: String,
    required: [true, 'Zone code is required'],
    uppercase: true,
    trim: true,
    maxlength: [20, 'Zone code cannot exceed 20 characters']
  },
  cityId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'City',
    required: [true, 'City ID is required']
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

zoneSchema.index({ cityId: 1, name: 1 }, { unique: true });
zoneSchema.index({ cityId: 1 });
zoneSchema.index({ isActive: 1 });

export default mongoose.model('Zone', zoneSchema);
