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
    enum: [
      'RETAILER',
      'CORPORATE EYE HOSPITAL',
      'DISTRIBUTOR',
      'WHOLESALER',
      'DR. AGARWAL EH',
      'EYE CLINIC',
      'RETAIL CHAIN',
      'OEM'
    ],
    required: [true, 'Customer type is required']
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
  emailId: {
    type: String,
    required: [true, 'Email is required'],
    trim: true,
    lowercase: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  address: {
    address1: {
      type: String,
      required: [true, 'Address 1 is required'],
      trim: true
    },
    address2: {
      type: String,
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
      enum: [
        'JAMMU & KASHMIR',
        'HIMACHAL PRADESH',
        'PUNJAB',
        'CHANDIGARH',
        'UTTARAKHAND',
        'HARYAANA',
        'DELHI',
        'RAJASTHAN',
        'UTTAR PRADESH',
        'BIHAR',
        'SIKKIM',
        'ARUNACHAL PRADESH',
        'NAGALAND',
        'MANIPUR',
        'MIZORAM',
        'TRIPURA',
        'MEGHALAYA',
        'ASSAM',
        'WEST BENGAL',
        'JHARKHAND',
        'ODISHA',
        'CHHATTISGARH',
        'MADHYA PRADESH',
        'GUJARAT',
        'DAMMAN & DIU',
        'DADRA & NAGAR HAVELI',
        'MAHARASHTRA',
        'KARNATAKA',
        'GOA',
        'LAKSHDEEP',
        'KERALA',
        'TAMIL NADU',
        'PUDUCHERRY',
        'ANDAMAN & NICOBAR ISLANDS',
        'TELANGANA',
        'ANDHRA PRADESH',
        'LADAKH',
        'OTHERS'
      ]
    },
    zipCode: {
      type: String,
      trim: true
    },
    country: {
      type: String,
      required: [true, 'Country is required'],
      enum: ['INDIA', 'OTHER'],
      default: 'INDIA'
    }
  },
  gstType: {
    type: String,
    enum: ['REGULAR', 'COMPOSITION', 'UNREGISTERED', 'CONSUMER']
  },
  gstNumber: {
    type: String,
    trim: true,
    // uppercase: true,
    // match: [/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/, 'Invalid GST number format']
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
    enum: [0, 30, 45, 60, 90, 120, 150],
    default: 0
  },
  paymentTerms: {
    type: String,
    enum: ['CASH', 'CREDIT', 'ADVANCE', 'COD', 'NET_BANKING', 'MIXED'],
    default: 'CASH'
  },
  plant: {
    type: String,
    enum: ['VISUALEYES OPTIK TECHNOLOGIES', 'VISUALEYES RX LABS LLP']
  },
  lab: {
    type: String,
    enum: ['100', '101']
  },
  fittingCenter: {
    type: String,
    enum: ['VISUALEYES-OPTIK TECHNOLOGIES', 'VISUALEYES RX LABS LLP']
  },
  dcWithoutValue: {
    type: String,
    enum: ['YES', 'NO']
  },
  courierName: {
    type: String,
    enum: [
      'JAGDISH',
      'SJ COURIER',
      'VERMA COURIER',
      'BLUEDART',
      'SHYAM',
      'SHREE RAJ COURIER',
      'TANVEER',
      'NAVEEN',
      'RAHUL RAO',
      'CHANCHAL',
      'KAMAL',
      'HARI RAM',
      'DEEPAK',
      'ANJANI COURIER',
      'TRACKON COURIER',
      'OFFICE'
    ]
  },
  courierTime: {
    type: String,
    enum: [
      'DELHI/NCR14:00PM',
      '6:00PM',
      '8:00PM',
      '3:00AM',
      'DELHI/NCR23:00AM',
      '4:00PM',
      'SPECIAL CASE INDEX',
      'SPECIAL CASE TINTING',
      'SPECIAL CASE FITTING'
    ]
  },
  billingCurrency: {
    type: String,
    enum: ['INDIAN RUPEES', 'USD'],
    default: 'INDIAN RUPEES'
  },
  salesPerson: {
    type: String,
    enum: [
      'GIRDHARI LAL ARORA',
      'PRADEEP SHARMA',
      'VINAY- BLR',
      'KULVINDER SINGH',
      'MOHIT SINGH',
      'ANIL KUMAR',
      'ARUNA CHAUDHARY',
      'DURGESH KUMAR',
      'SAPTARSHI',
      'RANJEET RAY',
      'RINKU SINGH',
      'PROMISH MANGARA',
      'JVISHESH SHARMA',
      'DIRECT HO',
      'VINAY SINGH- PB',
      'ANUJ SHARMA',
      'ANIRBAN GHOSH',
      'MUKESH TANWAR',
      'ARUP DAS',
      'SANDIP SINGH',
      'BHARAT KUMAR',
      'HARSH SUTHAR',
      'MOHIT KUMAR - HR',
      'DEVI LAL',
      'VCNT-MUMBAI',
      'VCNT-KL',
      'VINOD TURALE',
      'VCNT-NASHIK',
      'VISHESH SHARMA-UK',
      'KUMER SINGH',
      'VCNT - NW DELHI',
      'NEHA TIWARI',
      'SOUTH CS',
      'SUJEET KUMAR',
      'PRATAP CHOWDHURY',
      'SOURAV BARUAH',
      'PRATAP KUMAR JENA',
      'LALAN KUMAR',
      'VIJOY KARMAKAR',
      'ROHIT MISHRA',
      'MR. VIKAS KUMAR',
      'SHRI PRAKASH CHAUBEY',
      'POULOMI'
    ]
  },
  zone: {
    type: String,
    trim: true
  },
  hasFlatFitting: {
    type: String,
    enum: ['YES', 'NO']
  },
  specificBrand: {
    type: String,
    enum: [
      'VE-FUJI',
      'VE-SIGNATURE',
      'VISION EASE',
      'VISUALEYES',
      'ZIRCON',
      'ZIRCON EXCLUSIVE',
      'ASAHI-LITE',
      '02LENS',
      'ASDOL-OEM',
      'LITHOUS-OEM',
      'DIVA',
      'PIXEL',
      'VE-DUBAI',
      'DIVA-WHL',
      'DIVA-RETAIL'
    ]
  },
  specificCategory: {
    type: String,
    enum: [
      'ZIRCON FSV',
      'ZIRCON FBF',
      'ZIRCON SVRX',
      'ZIRCON KT BIFOCAL',
      'ZIRCON D BIFOCAL',
      'CHORUS PEARL',
      'CHORUS CLEAR',
      'MARCO PAL',
      'MARCO BF',
      'MARBAL PAL',
      'MARBAL BF',
      'SIGHTX PAL',
      'SIGHTX BF',
      'ZIRCON PEARL',
      'AURA',
      'CLEO',
      'NSOLACE',
      'VISAO LITE',
      'VLITE BF',
      'VLITE DBF',
      'ZIR+ SV-DS',
      'CHORUS GARNET',
      'CHORUS JADE',
      'CHORUS TOPAZ',
      'ZIR+ SINGLE VISION',
      'ZIR+ DRIVEWEAR',
      'ZIR+ PROGRESSIVE',
      'VISION EASE FSV',
      'VISION EASE SVRX',
      'EVERYWHERE',
      'NARRATIVE',
      'NARRATIVE INDIVIDUAL',
      'VISUALEYES FSV',
      'KT BIFOCAL',
      'DIAMOND PLUS',
      'EMERALD PLUS',
      'RUBY PLUS',
      'SAPPHIRE DC',
      'SAPPHIRE PLUS',
      'D BIFOCAL',
      'DS BIFOCAL',
      'CHORUS OPAL',
      'SINGLE VISION',
      'VISUALEYES OFFICE PRO',
      'FUJI',
      'ASP FUJI',
      'FUJI FSV',
      'APEX LITE',
      'FUJI SV RX',
      'APEX',
      'CREST',
      'ZENITH',
      'PINNACLE',
      'FUJI SPORT TECH',
      'FUJI OFFICE',
      'FUJI SAFE RIDE',
      'SIGNATURE SV',
      'SIGNATURE SV-DS',
      'SIGNATURE SV NUPOLAR',
      'SV XTRACTIVES',
      'SIGN TX9 XTRACTIVES',
      'SIGN TX9 DRIVEWEAR',
      'IRIDIUM',
      'IRIDIUM NEOCHROME',
      'IRIDIUM NUPOLAR',
      'IRIDIUM XTRACTIVES',
      'IRIDIUM TX9 XTRACTIVES',
      'IRIDIUM TX9 DRIVEWEAR',
      'PALLADIUM',
      'PALLADIUM NEOCHROME',
      'PALLADIUM NUPOLAR',
      'PALLADIUM XTRACTIVES',
      'PALLADIUM TX9 XTRACTIVES',
      'PALLADIUM TX9 DRIVEWEAR',
      'GOLD',
      'GOLD NEOCHROME',
      'GOLD NUPOLAR',
      'GOLD XTRACTIVES',
      'GOLD TX9 XTRACTIVES',
      'GOLD TX9 DRIVEWEAR',
      'PLATINUM',
      'PLATINUM NEOCHROME',
      'PLATINUM NUPOLAR',
      'PLATINUM XTRACTIVES',
      'PLATINUM TX9 XTRACTIVES',
      'PLATINUM TX9 DRIVEWEAR',
      'RHODIUM',
      'RHODIUM NUPOLAR',
      'RHODIUM TX9 XTRACTIVES',
      'MYOPIA SV',
      'SPORT SV RX',
      'SPORT PAL',
      'DRIVE SV RX',
      'DRIVE PAL',
      'OFFICE',
      'PILOT',
      'PILOT NUPOLAR',
      'PILOT NEOCHROME',
      'PILOT XTRACTIVES',
      'NO LINE BIFOCAL',
      'NO LINE NUPOLAR',
      'ANTI-FATIGUE',
      'ANTI-FATIGUE NUPOLAR',
      'ANTI-FATIGUE NEOCHROME',
      'GLASS D BIFOCAL',
      'GLASS KT BIFOCAL',
      'GLASS RUBY',
      'GLASS SAPPHIRE',
      'GLASS SV',
      'LIFESTYLE PAL',
      'OCUMADE KT',
      'OCUMADE FSV',
      'OCUMADE DBF',
      'OCUMADE SV'
    ]
  },
  specificLab: {
    type: String,
    enum: [
      'KOLKATA STOCK',
      'STOCK ORDER',
      'VISUAL EYES LAB',
      'VE AHMEDABAD LAB',
      'VE CHENNAI LAB',
      'VE KOCHI LAB',
      'VE GURGAON LAB',
      'VE HYDERBAD LAB',
      'VE KOLKATTA LAB',
      'VE MUMBAI LAB',
      'VE TRIVANDRUM LAB',
      'SERVICE',
      'VE GLASS ORDER',
      'VE PUNE LAB',
      'VE NAGPUR LAB',
      'VE BENGALURU LAB'
    ]
  },
  approvalStatus: {
    type: String,
    enum: ['PENDING', 'FINANCE_APPROVED', 'SALES_APPROVED', 'REJECTED'],
    default: 'PENDING'
  },
  
  financeApproval: {
    status: {
      type: String,
      enum: ['PENDING', 'APPROVED', 'REJECTED'],
      default: 'PENDING'
    },
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'employee'
    },
    approvedAt: {
      type: Date
    },
    remarks: {
      type: String,
      maxlength: [500, 'Remarks cannot exceed 500 characters']
    }
  },
  
  salesApproval: {
    status: {
      type: String,
      enum: ['PENDING', 'APPROVED', 'REJECTED'],
      default: 'PENDING'
    },
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'employee'
    },
    approvedAt: {
      type: Date
    },
    remarks: {
      type: String,
      maxlength: [500, 'Remarks cannot exceed 500 characters']
    }
  },

  verification: {
    isVerified: {
      type: Boolean,
      default: false
    },
    verifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'employee'
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
      default: false
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
      ref: 'employee'
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
    enum: ['ONLINE', 'OFFLINE'],
    required: [true, 'Order mode is required']
  },
  billingMode: {
    type: String,
    trim: true
  },
  mobileNo1: {
    type: String,
    match: [/^[0-9]{10}$/, 'Please enter a valid 10-digit mobile number']
  },
  mobileNo2: {
    type: String,
    match: [/^[0-9]{10}$/, 'Please enter a valid 10-digit mobile number']
  },
  landlineNo: {
    type: String,
    trim: true
  },
  communicationMedium: {
    type: [String],
    enum: ['EMAIL', 'WHATSAPP', 'SMS', 'PHONE'],
    default: ['EMAIL']
  },
  
  userType: {
    type: String,
    default: 'CUSTOMER'
  },
  designation: {
    type: String,
    enum: [
      'OWNER',
      'MANAGER',
      'OPTOMETRIST',
      'SALES PERSON',
      'ACCOUNTANT',
      'STAFF',
      'OTHER'
    ]
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
    ref: 'employee',
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
  },
  emailOtp:{
    type:String
  },
  emailOtpExpires:{
    type:Date
  },
  mobileOtp:{
    type:String
  },
  mobileOtpExpires:{
    type:Date
  },
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