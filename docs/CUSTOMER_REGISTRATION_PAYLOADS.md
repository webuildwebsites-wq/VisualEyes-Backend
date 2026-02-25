# Customer Registration Test Payloads

This document contains sample payloads for testing customer registration across different scenarios.

**Note:** Replace the `refId` values with actual ObjectIds from your database. You can get these by querying the respective collections.

---

## 1. Sales Person - GST Registered Customer

**Endpoint:** `POST /api/customers/register`

**Headers:**
```json
{
  "Authorization": "Bearer <SALES_PERSON_TOKEN>",
  "Content-Type": "application/json"
}
```

**Payload:**
```json
{
  "CustomerType": "Retailer",
  "CustomerTypeRefId": "507f1f77bcf86cd799439011",
  "shopName": "Vision Optics Store",
  "ownerName": "Rajesh Kumar",
  "orderMode": "ONLINE",
  "mobileNo1": "9876543210",
  "mobileNo2": "9876543211",
  "landlineNo": "0112345678",
  "emailId": "rajesh.kumar@visionoptics.com",
  "businessEmail": "business@visionoptics.com",
  "IsGSTRegistered": true,
  "GSTNumber": "29ABCDE1234F1Z5",
  "gstType": "Regular",
  "gstTypeRefId": "507f1f77bcf86cd799439012",
  "GSTCertificateImg": "https://storage.googleapis.com/bucket/gst-cert-123.pdf",
  "address": [
    {
      "branchAddress": "123 MG Road, Connaught Place",
      "contactPerson": "Rajesh Kumar",
      "contactNumber": "9876543210",
      "city": "New Delhi",
      "state": "Delhi",
      "zipCode": "110001",
      "country": "INDIA",
      "billingCurrency": "INR",
      "billingMode": "CREDIT"
    },
    {
      "branchAddress": "456 Nehru Place, South Delhi",
      "contactPerson": "Amit Sharma",
      "contactNumber": "9876543212",
      "city": "New Delhi",
      "state": "Delhi",
      "zipCode": "110019",
      "country": "INDIA",
      "billingCurrency": "INR",
      "billingMode": "CASH"
    }
  ]
}
```

**Expected Response:**
- Status: `201 Created`
- Customer created with `approvalStatus: "PENDING_FINANCE"`
- No password set (Finance will complete registration)
- No credentials email sent

---

## 2. Sales Person - Non-GST Customer

**Endpoint:** `POST /api/customers/register`

**Headers:**
```json
{
  "Authorization": "Bearer <SALES_PERSON_TOKEN>",
  "Content-Type": "application/json"
}
```

**Payload:**
```json
{
  "CustomerType": "Wholesaler",
  "CustomerTypeRefId": "507f1f77bcf86cd799439013",
  "shopName": "Sharma Optical House",
  "ownerName": "Priya Sharma",
  "orderMode": "OFFLINE",
  "mobileNo1": "9123456789",
  "mobileNo2": "9123456790",
  "emailId": "priya.sharma@sharmaoptical.com",
  "businessEmail": "info@sharmaoptical.com",
  "IsGSTRegistered": false,
  "PANCard": "ABCDE1234F",
  "AadharCard": "123456789012",
  "PANCardImg": "https://storage.googleapis.com/bucket/pan-card-456.jpg",
  "AadharCardImg": "https://storage.googleapis.com/bucket/aadhar-card-456.jpg",
  "address": [
    {
      "branchAddress": "789 Commercial Street, Bangalore",
      "contactPerson": "Priya Sharma",
      "contactNumber": "9123456789",
      "city": "Bangalore",
      "state": "Karnataka",
      "zipCode": "560001",
      "country": "INDIA",
      "billingCurrency": "INR",
      "billingMode": "CREDIT"
    }
  ]
}
```

**Expected Response:**
- Status: `201 Created`
- Customer created with `approvalStatus: "PENDING_FINANCE"`
- No password set
- No credentials email sent

---

## 3. Finance Person - GST Registered Customer (Complete Registration)

**Endpoint:** `POST /api/customers/register`

**Headers:**
```json
{
  "Authorization": "Bearer <FINANCE_PERSON_TOKEN>",
  "Content-Type": "application/json"
}
```

**Payload:**
```json
{
  "CustomerType": "Distributor",
  "CustomerTypeRefId": "507f1f77bcf86cd799439014",
  "zone": "North Zone",
  "zoneRefId": "507f1f77bcf86cd799439015",
  "shopName": "Elite Eye Care Center",
  "ownerName": "Vikram Singh",
  "orderMode": "BOTH",
  "mobileNo1": "9988776655",
  "mobileNo2": "9988776656",
  "landlineNo": "0114567890",
  "emailId": "vikram.singh@eliteeyecare.com",
  "businessEmail": "orders@eliteeyecare.com",
  "IsGSTRegistered": true,
  "GSTNumber": "27XYZAB5678C1D9",
  "gstType": "Composite",
  "gstTypeRefId": "507f1f77bcf86cd799439016",
  "GSTCertificateImg": "https://storage.googleapis.com/bucket/gst-cert-789.pdf",
  "hasFlatFitting": true,
  "flatFittingData": [
    {
      "selectType": {
        "name": "Premium Fitting",
        "refId": "507f1f77bcf86cd799439017"
      },
      "index": {
        "name": "Index 1.67",
        "refId": "507f1f77bcf86cd799439018"
      },
      "price": 2500
    },
    {
      "selectType": {
        "name": "Standard Fitting",
        "refId": "507f1f77bcf86cd799439019"
      },
      "index": {
        "name": "Index 1.56",
        "refId": "507f1f77bcf86cd799439020"
      },
      "price": 1500
    }
  ],
  "specificBrand": "ESSILOR",
  "specificBrandRefId": "507f1f77bcf86cd799439021",
  "specificCategory": "Progressive Lenses",
  "specificCategoryRefId": "507f1f77bcf86cd799439022",
  "specificLab": "Mumbai Lab",
  "specificLabRefId": "507f1f77bcf86cd799439023",
  "salesPerson": "Rahul Verma",
  "salesPersonRefId": "507f1f77bcf86cd799439024",
  "plant": "Delhi Plant",
  "plantRefId": "507f1f77bcf86cd799439025",
  "fittingCenter": "Central Fitting Center",
  "fittingCenterRefId": "507f1f77bcf86cd799439026",
  "creditDays": "30 Days",
  "creditDaysRefId": "507f1f77bcf86cd799439027",
  "creditLimit": {
    "name": "500000",
    "refId": "507f1f77bcf86cd799439028"
  },
  "courierName": "Blue Dart",
  "courierNameRefId": "507f1f77bcf86cd799439029",
  "courierTime": "2-3 Days",
  "courierTimeRefId": "507f1f77bcf86cd799439030",
  "customerpassword": "SecurePass@123",
  "address": [
    {
      "branchAddress": "101 Business Park, Sector 18",
      "contactPerson": "Vikram Singh",
      "contactNumber": "9988776655",
      "city": "Noida",
      "state": "Uttar Pradesh",
      "zipCode": "201301",
      "country": "INDIA",
      "billingCurrency": "INR",
      "billingMode": "CREDIT"
    }
  ]
}
```

**Expected Response:**
- Status: `201 Created`
- Customer created with `approvalStatus: "APPROVED"`
- Password is set and hashed
- Credentials email sent to customer

---

## 4. Finance Person - Non-GST Customer (Complete Registration)

**Endpoint:** `POST /api/customers/register`

**Headers:**
```json
{
  "Authorization": "Bearer <FINANCE_PERSON_TOKEN>",
  "Content-Type": "application/json"
}
```

**Payload:**
```json
{
  "CustomerType": "Retailer",
  "CustomerTypeRefId": "507f1f77bcf86cd799439031",
  "zone": "South Zone",
  "zoneRefId": "507f1f77bcf86cd799439032",
  "shopName": "Modern Vision Center",
  "ownerName": "Anita Desai",
  "orderMode": "ONLINE",
  "mobileNo1": "9876501234",
  "mobileNo2": "9876501235",
  "emailId": "anita.desai@modernvision.com",
  "businessEmail": "contact@modernvision.com",
  "IsGSTRegistered": false,
  "PANCard": "FGHIJ5678K",
  "AadharCard": "987654321098",
  "PANCardImg": "https://storage.googleapis.com/bucket/pan-card-101.jpg",
  "AadharCardImg": "https://storage.googleapis.com/bucket/aadhar-card-101.jpg",
  "hasFlatFitting": false,
  "specificBrand": "ZEISS",
  "specificBrandRefId": "507f1f77bcf86cd799439033",
  "specificCategory": "Single Vision",
  "specificCategoryRefId": "507f1f77bcf86cd799439034",
  "specificLab": "Chennai Lab",
  "specificLabRefId": "507f1f77bcf86cd799439035",
  "salesPerson": "Suresh Kumar",
  "salesPersonRefId": "507f1f77bcf86cd799439036",
  "plant": "Bangalore Plant",
  "plantRefId": "507f1f77bcf86cd799439037",
  "fittingCenter": "South Fitting Center",
  "fittingCenterRefId": "507f1f77bcf86cd799439038",
  "creditDays": "45 Days",
  "creditDaysRefId": "507f1f77bcf86cd799439039",
  "creditLimit": {
    "name": "300000",
    "refId": "507f1f77bcf86cd799439040"
  },
  "courierName": "DTDC",
  "courierNameRefId": "507f1f77bcf86cd799439041",
  "courierTime": "3-4 Days",
  "courierTimeRefId": "507f1f77bcf86cd799439042",
  "customerpassword": "AnitaPass@456",
  "address": [
    {
      "branchAddress": "55 Anna Salai, T Nagar",
      "contactPerson": "Anita Desai",
      "contactNumber": "9876501234",
      "city": "Chennai",
      "state": "Tamil Nadu",
      "zipCode": "600017",
      "country": "INDIA",
      "billingCurrency": "INR",
      "billingMode": "CASH"
    },
    {
      "branchAddress": "88 Mount Road, Guindy",
      "contactPerson": "Ravi Kumar",
      "contactNumber": "9876501236",
      "city": "Chennai",
      "state": "Tamil Nadu",
      "zipCode": "600032",
      "country": "INDIA",
      "billingCurrency": "INR",
      "billingMode": "CREDIT"
    }
  ]
}
```

**Expected Response:**
- Status: `201 Created`
- Customer created with `approvalStatus: "APPROVED"`
- Password is set and hashed
- Credentials email sent to customer

---

## Getting Reference IDs from Database

To get actual ObjectIds for testing, run these queries in MongoDB:

```javascript
// Get Customer Types
db.customertypes.find({}, { _id: 1, name: 1 })

// Get Zones
db.zones.find({}, { _id: 1, name: 1 })

// Get Brands
db.brands.find({}, { _id: 1, name: 1 })

// Get Categories
db.categories.find({}, { _id: 1, name: 1 })

// Get GST Types
db.gsttypes.find({}, { _id: 1, name: 1 })

// Get Plants
db.plants.find({}, { _id: 1, name: 1 })

// Get Fitting Centers
db.fittingcenters.find({}, { _id: 1, name: 1 })

// Get Credit Days
db.creditdays.find({}, { _id: 1, name: 1 })

// Get Courier Names
db.couriernames.find({}, { _id: 1, name: 1 })

// Get Courier Times
db.couriertimes.find({}, { _id: 1, name: 1 })

// Get Specific Labs
db.specificlabs.find({}, { _id: 1, name: 1 })

// Get Sales Persons (Employees)
db.employees.find({ "Department.name": "SALES" }, { _id: 1, username: 1, employeeName: 1 })
```

---

## Key Differences Between Sales and Finance Registration

### Sales Department Registration:
- ✅ Basic customer info required
- ✅ Address details required
- ✅ GST/PAN documentation required
- ❌ No password set
- ❌ No operational details (zone, plant, fitting center, etc.)
- ❌ No credentials email sent
- 📋 Status: `PENDING_FINANCE`

### Finance Department Registration:
- ✅ All Sales requirements
- ✅ Password required
- ✅ Zone, plant, fitting center required
- ✅ Credit days, credit limit required
- ✅ Courier details required
- ✅ Specific brand, category, lab required
- ✅ Sales person assignment required
- ✅ Optional flat fitting configuration
- ✅ Credentials email sent
- 📋 Status: `APPROVED`

---

## Testing Workflow

1. **Sales Registration → Finance Completion:**
   - Use payload #1 or #2 (Sales person)
   - Customer created with `PENDING_FINANCE` status
   - Use `financeCompleteCustomer` endpoint to complete registration

2. **Direct Finance Registration:**
   - Use payload #3 or #4 (Finance person)
   - Customer created with `APPROVED` status
   - Ready to login immediately

---

## Common Validation Errors

### Missing Required Fields (Sales):
- `CustomerType`, `shopName`, `ownerName`, `emailId`, `orderMode`
- At least one address
- GST details (if `IsGSTRegistered: true`)
- PAN/Aadhar details (if `IsGSTRegistered: false`)

### Missing Required Fields (Finance):
- All Sales requirements
- `customerpassword`
- `zone`, `zoneRefId`
- `specificBrand`, `specificBrandRefId`
- `specificCategory`, `specificCategoryRefId`
- `specificLab`, `specificLabRefId`
- `salesPerson`, `salesPersonRefId`
- `plant`, `plantRefId`
- `fittingCenter`, `fittingCenterRefId`
- `creditDays`, `creditDaysRefId`
- `creditLimit` (object with name and refId)
- `courierName`, `courierNameRefId`
- `courierTime`, `courierTimeRefId`

### Invalid ObjectId Format:
- All `refId` fields must be 24 character hex strings
- Example valid: `"507f1f77bcf86cd799439011"`
- Example invalid: `"123"`, `"invalid-id"`
