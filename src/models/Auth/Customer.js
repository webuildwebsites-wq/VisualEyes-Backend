import bcrypt from 'bcryptjs';
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
  CustomerType: {
    type: String,
    enum: ['RETAILER', 'DISTRIBUTOR', 'END_CUSTOMER', 'WHOLESALE'],
    default: 'RETAILER'
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
  BusinessType: {
    type: String,
    enum: ['OPTICAL_STORE', 'EYE_CLINIC', 'HOSPITAL', 'CHAIN_STORE', 'ONLINE_STORE', 'INDIVIDUAL'],
    default: 'OPTICAL_STORE'
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
    enum: ['CASH', 'CREDIT', 'ADVANCE', 'COD', 'NET_BANKING', 'MIXED'],
    default: 'CASH'
  },
  labMapping: {
    type: String,
    enum: ['LAB'],
    required: [true, 'Lab mapping is required']
  },
  Region: {
    type: String,
    enum: ['NORTH', 'SOUTH', 'EAST', 'WEST'],
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
        enum: ['GST_CERTIFICATE', 'PAN_CARD', 'BUSINESS_LICENSE', 'ADDRESS_PROOF', 'BANK_DETAILS']
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
    enum: ['ONLINE', 'WHATSAPP', 'PHONE', 'EMAIL', 'OFFLINE'],
    default: 'ONLINE'
  },
  communicationMedium: {
    type: [String],
    enum: ['EMAIL', 'WHATSAPP', 'SMS', 'PHONE'],
    default: ['EMAIL']
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
      enum: ['DAILY', 'WEEKLY', 'MONTHLY', 'QUARTERLY', 'OCCASIONAL'],
      default: 'MONTHLY'
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

customerSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

customerSchema.pre('save', async function () {
  if (!this.isModified('password') || !this.password) return;
  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
  } catch (error) {
    console.log("error : ",error);
    return;
  }
});

const Customer = mongoose.model('Customer', customerSchema);

export default Customer;