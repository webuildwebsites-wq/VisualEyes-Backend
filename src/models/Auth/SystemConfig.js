import mongoose from 'mongoose';

const systemConfigSchema = new mongoose.Schema({
  configType: {
    type: String,
    required: true,
    enum: ['EmployeeType', 'Role', 'Department', 'Lab', 'Region'],
    unique: true 
  },
  values: [{
    type: String,
    required: true,
    trim: true,
    uppercase: true
  }],
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'employee',
    required: true
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'employee'
  }
}, { timestamps: true });

const SystemConfig = mongoose.model('SystemConfig', systemConfigSchema);
export default SystemConfig;
