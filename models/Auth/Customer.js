import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const customerSchema = new mongoose.Schema({
  username: {
    type: String,
    unique: true,
    sparse: true, 
    trim: true,
    minlength: [3, 'Username must be at least 3 characters'],
    maxlength: [50, 'Username cannot exceed 50 characters']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    trim: true,
    lowercase: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  password: {
    type: String,
    minlength: [8, 'Password must be at least 8 characters'],
    select: false
  },
  
  customerCode: {
    type: String,
    unique: true,
    required: [true, 'Customer code is required'],
    trim: true,
    uppercase: true
  },
  customerType: {
    type: String,
    enum: ['Retailer', 'Distributor', 'End Customer', 'Wholesale'],
    default: 'Retailer'
  },
  
  shopName: {
    type: String,
    required: [true, 'Shop name is required'],
    trim: true,
    maxlength: [100, 'Shop name cannot exceed 100 characters']
  },
  ownerName: {
    type: String,
    required: [true, 'Owner name is required'],
    trim: true,
    maxlength: [100, 'Owner name cannot exceed 100 characters']
  },
  businessType: {
    type: String,
    enum: ['Optical Store', 'Eye Clinic', 'Hospital', 'Chain Store', 'Online Store', 'Individual'],
    default: 'Optical Store'
  },
  
  phone: {
    type: String,
    required: [true, 'Phone number is required'],
    match: [/^[0-9]{10}$/, 'Please enter a valid 10-digit phone number']
  },
  alternatePhone: {
    type: String,
    match: [/^[0-9]{10}$/, 'Please enter a valid 10-digit phone number']
  },
  whatsappNumber: {
    type: String,
    match: [/^[0-9]{10}$/, 'Please enter a valid 10-digit WhatsApp number']
  },
  
  address: {
    street: {
      type: String,
      required: [true, 'Street address is required'],
      trim: true
    },
    city: {
      type: String,
      required: [true, 'City is required'],
      trim: true
    },
    state: {
      type: String,
      required: [true, 'State is required'],
      trim: true
    },
    pincode: {
      type: String,
      required: [true, 'Pincode is required'],
      match: [/^[0-9]{6}$/, 'Invalid pincode format']
    },
    country: {
      type: String,
      default: 'India',
      trim: true
    }
  },
  
  gstNumber: {
    type: String,
    trim: true,
    uppercase: true,
    match: [/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/, 'Invalid GST number format']
  },
  panNumber: {
    type: String,
    trim: true,
    uppercase: true,
    match: [/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/, 'Invalid PAN number format']
  },
  gstCertificate: {
    type: String // file path
  },
  businessLicense: {
    type: String // file path
  },
  
  // Financial Information
  creditLimit: {
    type: Number,
    default: 0,
    min: [0, 'Credit limit cannot be negative']
  },
  creditAmount: {
    type: Number,
    default: 0,
    min: [0, 'Credit amount cannot be negative']
  },
  creditDays: {
    type: Number,
    default: 0,
    min: [0, 'Credit days cannot be negative']
  },
  paymentTerms: {
    type: String,
    enum: ['Cash', 'Credit', 'Advance', 'COD', 'Net Banking', 'Mixed'],
    default: 'Cash'
  },
  
  // Lab and Region Assignment
  labMapping: {
    type: String,
    enum: ['Lab'], // Will be expanded based on available labs
    required: [true, 'Lab mapping is required']
  },
  region: {
    type: String,
    enum: ['North', 'South', 'East', 'West'],
    required: [true, 'Region is required']
  },
  
  // Verification Status
  verification: {
    isVerified: {
      type: Boolean,
      default: false
    },
    verifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    verificationDate: {
      type: Date
    },
    verificationNotes: {
      type: String,
      maxlength: [500, 'Verification notes cannot exceed 500 characters']
    },
    documents: [{
      type: {
        type: String,
        enum: ['GST Certificate', 'PAN Card', 'Business License', 'Address Proof', 'Bank Details']
      },
      filePath: String,
      uploadedAt: {
        type: Date,
        default: Date.now
      }
    }]
  },
  
  // Account Status
  status: {
    isActive: {
      type: Boolean,
      default: true
    },
    isSuspended: {
      type: Boolean,
      default: false
    },
    suspensionReason: {
      type: String,
      maxlength: [200, 'Suspension reason cannot exceed 200 characters']
    },
    suspendedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    suspensionDate: {
      type: Date
    },
    suspensionDuration: {
      type: Number // in days
    }
  },
  
  // Communication Preferences
  orderMode: {
    type: String,
    enum: ['Online', 'WhatsApp', 'Phone', 'Email', 'Offline'],
    default: 'Online'
  },
  communicationMedium: {
    type: [String],
    enum: ['Email', 'WhatsApp', 'SMS', 'Phone'],
    default: ['Email']
  },
  
  // Sales Assignment
  assignedSalesHead: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Sales head assignment is required']
  },
  assignedAccountsHead: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  
  // Customer Preferences
  preferences: {
    preferredBrands: [String],
    preferredLensTypes: [String],
    averageOrderValue: {
      type: Number,
      default: 0
    },
    orderFrequency: {
      type: String,
      enum: ['Daily', 'Weekly', 'Monthly', 'Quarterly', 'Occasional'],
      default: 'Monthly'
    }
  },
  
  // Performance Metrics
  metrics: {
    totalOrders: {
      type: Number,
      default: 0
    },
    totalRevenue: {
      type: Number,
      default: 0
    },
    averageOrderValue: {
      type: Number,
      default: 0
    },
    lastOrderDate: {
      type: Date
    },
    customerSince: {
      type: Date,
      default: Date.now
    },
    loyaltyPoints: {
      type: Number,
      default: 0
    }
  },
  
  // Account Management
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Creator reference is required']
  },
  lastLogin: {
    type: Date
  },
  loginAttempts: {
    type: Number,
    default: 0
  },
  lockUntil: {
    type: Date
  },
  passwordResetToken: {
    type: String,
    select: false
  },
  passwordResetExpires: {
    type: Date,
    select: false
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for full business name
customerSchema.virtual('fullBusinessName').get(function() {
  return `${this.shopName} (${this.ownerName})`;
});

// Virtual for account lock status
customerSchema.virtual('isLocked').get(function() {
  return !!(this.lockUntil && this.lockUntil > Date.now());
});

// Virtual for available credit
customerSchema.virtual('availableCredit').get(function() {
  return Math.max(0, this.creditLimit - this.creditAmount);
});

// Virtual for customer age (in days)
customerSchema.virtual('customerAge').get(function() {
  const now = new Date();
  const since = new Date(this.metrics.customerSince);
  const diffTime = Math.abs(now - since);
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
});

// Virtual for credit utilization percentage
customerSchema.virtual('creditUtilization').get(function() {
  if (this.creditLimit === 0) return 0;
  return Math.round((this.creditAmount / this.creditLimit) * 100);
});

// Indexes
customerSchema.index({ customerCode: 1 });
customerSchema.index({ email: 1 });
customerSchema.index({ username: 1 });
customerSchema.index({ gstNumber: 1 });
customerSchema.index({ phone: 1 });
customerSchema.index({ region: 1 });
customerSchema.index({ assignedSalesHead: 1 });
customerSchema.index({ 'status.isActive': 1 });
customerSchema.index({ 'status.isSuspended': 1 });
customerSchema.index({ 'verification.isVerified': 1 });

// Compound indexes
customerSchema.index({ region: 1, 'status.isActive': 1 });
customerSchema.index({ assignedSalesHead: 1, 'status.isActive': 1 });
customerSchema.index({ customerType: 1, region: 1 });

// Pre-save middleware to hash password
customerSchema.pre('save', async function(next) {
  if (!this.isModified('password') || !this.password) return next();

  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Pre-save middleware to generate customer code
customerSchema.pre('save', async function(next) {
  if (!this.isNew || this.customerCode) return next();

  try {
    // Generate customer code: CUST-REGION-YYYY-NNNN
    const year = new Date().getFullYear();
    const regionCode = this.region.substring(0, 1); // N, S, E, W
    const prefix = `CUST-${regionCode}-${year}`;
    
    // Find the last customer with this prefix
    const lastCustomer = await this.constructor
      .findOne({ customerCode: new RegExp(`^${prefix}`) })
      .sort({ customerCode: -1 });
    
    let sequence = 1;
    if (lastCustomer) {
      const lastSequence = parseInt(lastCustomer.customerCode.split('-').pop());
      sequence = lastSequence + 1;
    }
    
    this.customerCode = `${prefix}-${sequence.toString().padStart(4, '0')}`;
    next();
  } catch (error) {
    next(error);
  }
});

// Pre-save middleware to set username if not provided
customerSchema.pre('save', function(next) {
  if (!this.username && this.email) {
    this.username = this.email.split('@')[0] + '_' + this.customerCode.split('-').pop();
  }
  next();
});

// Instance method to check password
customerSchema.methods.comparePassword = async function(candidatePassword) {
  if (!this.password) {
    throw new Error('No password set for this customer');
  }
  
  try {
    return await bcrypt.compare(candidatePassword, this.password);
  } catch (error) {
    throw new Error('Password comparison failed');
  }
};

// Instance method to increment login attempts
customerSchema.methods.incLoginAttempts = function() {
  if (this.lockUntil && this.lockUntil < Date.now()) {
    return this.updateOne({
      $unset: { lockUntil: 1 },
      $set: { loginAttempts: 1 }
    });
  }
  
  const updates = { $inc: { loginAttempts: 1 } };
  
  if (this.loginAttempts + 1 >= 5 && !this.isLocked) {
    updates.$set = { lockUntil: Date.now() + 2 * 60 * 60 * 1000 };
  }
  
  return this.updateOne(updates);
};

// Instance method to reset login attempts
customerSchema.methods.resetLoginAttempts = function() {
  return this.updateOne({
    $unset: { loginAttempts: 1, lockUntil: 1 }
  });
};

// Instance method to update last login
customerSchema.methods.updateLastLogin = function() {
  return this.updateOne({ lastLogin: new Date() });
};

// Instance method to check if customer can place order
customerSchema.methods.canPlaceOrder = function(orderAmount = 0) {
  // Check if customer is active and not suspended
  if (!this.status.isActive || this.status.isSuspended) {
    return { canOrder: false, reason: 'Account is inactive or suspended' };
  }
  
  // Check if customer is verified
  if (!this.verification.isVerified) {
    return { canOrder: false, reason: 'Account is not verified' };
  }
  
  // Check credit limit
  if (this.paymentTerms === 'Credit' && orderAmount > 0) {
    const availableCredit = this.creditLimit - this.creditAmount;
    if (orderAmount > availableCredit) {
      return { canOrder: false, reason: 'Insufficient credit limit' };
    }
  }
  
  return { canOrder: true };
};

// Instance method to update credit amount
customerSchema.methods.updateCredit = function(amount, operation = 'add') {
  if (operation === 'add') {
    this.creditAmount += amount;
  } else if (operation === 'subtract') {
    this.creditAmount = Math.max(0, this.creditAmount - amount);
  }
  
  return this.save();
};

// Instance method to suspend customer
customerSchema.methods.suspend = function(reason, duration, suspendedBy) {
  this.status.isSuspended = true;
  this.status.suspensionReason = reason;
  this.status.suspensionDate = new Date();
  this.status.suspensionDuration = duration;
  this.status.suspendedBy = suspendedBy;
  
  return this.save();
};

// Instance method to activate customer
customerSchema.methods.activate = function() {
  this.status.isSuspended = false;
  this.status.suspensionReason = undefined;
  this.status.suspensionDate = undefined;
  this.status.suspensionDuration = undefined;
  this.status.suspendedBy = undefined;
  
  return this.save();
};

// Static method to find by region
customerSchema.statics.findByRegion = function(region, isActive = true) {
  return this.find({ 
    region, 
    'status.isActive': isActive 
  }).populate('assignedSalesHead assignedAccountsHead', 'firstName lastName userType');
};

// Static method to find by sales head
customerSchema.statics.findBySalesHead = function(salesHeadId, isActive = true) {
  return this.find({ 
    assignedSalesHead: salesHeadId, 
    'status.isActive': isActive 
  });
};

// Static method to find customers needing verification
customerSchema.statics.findUnverified = function() {
  return this.find({ 
    'verification.isVerified': false,
    'status.isActive': true 
  }).populate('assignedSalesHead', 'firstName lastName');
};

// Static method to get customer statistics
customerSchema.statics.getStatistics = async function(filters = {}) {
  const matchStage = { 'status.isActive': true, ...filters };
  
  const stats = await this.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: null,
        totalCustomers: { $sum: 1 },
        verifiedCustomers: {
          $sum: { $cond: ['$verification.isVerified', 1, 0] }
        },
        suspendedCustomers: {
          $sum: { $cond: ['$status.isSuspended', 1, 0] }
        },
        totalCreditLimit: { $sum: '$creditLimit' },
        totalCreditUsed: { $sum: '$creditAmount' },
        totalRevenue: { $sum: '$metrics.totalRevenue' },
        totalOrders: { $sum: '$metrics.totalOrders' },
        avgOrderValue: { $avg: '$metrics.averageOrderValue' }
      }
    }
  ]);
  
  return stats[0] || {
    totalCustomers: 0,
    verifiedCustomers: 0,
    suspendedCustomers: 0,
    totalCreditLimit: 0,
    totalCreditUsed: 0,
    totalRevenue: 0,
    totalOrders: 0,
    avgOrderValue: 0
  };
};

const Customer = mongoose.model('Customer', customerSchema);

export default Customer;