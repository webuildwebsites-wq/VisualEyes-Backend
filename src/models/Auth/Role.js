import mongoose from 'mongoose';

const roleSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Role name is required'],
    unique: true,
    uppercase: true,
    trim: true,
    enum: ['SUPERADMIN', 'ADMIN', 'SUPERVISOR', 'REGIONMANAGER', 'EMPLOYEE']
  },
  level: {
    type: Number,
    required: true,
    unique: true
  },
  description: {
    type: String,
    trim: true
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

roleSchema.index({ name: 1 });
roleSchema.index({ level: 1 });

export default mongoose.model('Role', roleSchema);
