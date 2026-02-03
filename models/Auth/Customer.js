import mongoose from 'mongoose';

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
    type: String
  },
  businessLicense: {
    type: String
  },
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
  labMapping: {
    type: String,
    enum: ['Lab'],
    required: [true, 'Lab mapping is required']
  },
  region: {
    type: String,
    enum: ['North', 'South', 'East', 'West'],
    required: [true, 'Region is required']
  },
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
      type: Number 
    }
  },
  
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
  
  assignedSalesHead: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Sales head assignment is required']
  },
  assignedAccountsHead: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  
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

const Customer = mongoose.model('Customer', customerSchema);

export default Customer;