# Customer Correction Workflow API

## Overview
This API allows the Finance team or SuperAdmin to send customer registration data back to the Sales team for corrections when incorrect information is detected during the approval process.

## Workflow

1. **Sales Person** creates a customer account using `customerBasicRegistration`
2. Customer goes to **Finance team** for approval (status: `PENDING_FINANCE`)
3. **Finance/SuperAdmin** reviews and finds errors in fields like GSTNumber, PANCardImg, ownerName, etc.
4. **Finance/SuperAdmin** sends customer back for corrections using the new API
5. Customer status changes to `CORRECTION_REQUIRED`
6. **Sales Person** views customers requiring corrections
7. **Sales Person** updates the incorrect fields and resubmits
8. Customer status changes back to `PENDING_FINANCE`
9. **Finance/SuperAdmin** reviews again and approves

## API Endpoints

### 1. Send Customer for Correction
**Endpoint:** `PUT /api/customer/:customerId/send-for-correction`

**Access:** Finance Department, SuperAdmin only

**Description:** Sends a customer registration back to sales for corrections with specific field names and remarks.

**Request Body:**
```json
{
  "fieldsToCorrect": [
    "GSTNumber",
    "PANCardImg",
    "ownerName",
    "CustomerType"
  ],
  "remark": "GST Number format is incorrect. PAN Card image is not clear. Owner name spelling needs correction."
}
```

**Allowed Fields for Correction:**
- `shopName`
- `ownerName`
- `CustomerType`, `CustomerTypeRefId`
- `orderMode`
- `mobileNo1`, `mobileNo2`, `landlineNo`
- `emailId`, `businessEmail`
- `address`
- `IsGSTRegistered`
- `GSTNumber`, `gstType`, `gstTypeRefId`, `GSTCertificateImg`
- `PANCard`, `AadharCard`, `PANCardImg`, `AadharCardImg`
- `zone`, `zoneRefId`
- `specificLab`, `specificLabRefId`
- `plant`, `plantRefId`
- `fittingCenter`, `fittingCenterRefId`
- `creditDays`, `creditDaysRefId`, `creditLimit`
- `courierName`, `courierNameRefId`
- `courierTime`, `courierTimeRefId`
- `brandCategories`
- `salesPerson`, `salesPersonRefId`

**Response (Success - 200):**
```json
{
  "success": true,
  "message": "Customer sent back to sales for corrections successfully",
  "data": {
    "customer": {
      "_id": "65f1234567890abcdef12345",
      "shopName": "ABC Opticals",
      "ownerName": "John Doe",
      "approvalStatus": "CORRECTION_REQUIRED",
      "correctionRequest": {
        "fieldsToCorrect": ["GSTNumber", "PANCardImg"],
        "remark": "GST Number format is incorrect. PAN Card image is not clear.",
        "requestedBy": "Jane Smith",
        "requestedAt": "2024-03-08T10:30:00.000Z"
      }
    }
  }
}
```

**Error Responses:**
- `403 FORBIDDEN` - Only Finance/SuperAdmin can send for corrections
- `400 INVALID_ID` - Invalid customer ID format
- `400 VALIDATION_ERROR` - Missing or invalid fieldsToCorrect or remark
- `404 NOT_FOUND` - Customer not found
- `400 ALREADY_APPROVED` - Customer is already approved
- `400 INVALID_STATUS` - Customer must be in PENDING_FINANCE status
- `400 INVALID_FIELDS` - Invalid field names provided

---

### 2. Get Customers Requiring Corrections
**Endpoint:** `GET /api/customer/customer/correction-required`

**Access:** All authenticated employees (Sales sees only their own, Finance/SuperAdmin see all)

**Description:** Retrieves list of customers that require corrections.

**Query Parameters:**
- `page` (optional, default: 1) - Page number
- `limit` (optional, default: 10, max: 100) - Items per page

**Response (Success - 200):**
```json
{
  "success": true,
  "message": "Customers requiring corrections retrieved successfully",
  "data": {
    "customers": [
      {
        "_id": "65f1234567890abcdef12345",
        "shopName": "ABC Opticals",
        "ownerName": "John Doe",
        "emailId": "john@abcopticals.com",
        "approvalStatus": "CORRECTION_REQUIRED",
        "correctionRequest": {
          "fieldsToCorrect": ["GSTNumber", "PANCardImg", "ownerName"],
          "remark": "GST Number format is incorrect. PAN Card image is not clear. Owner name spelling needs correction.",
          "requestedBy": {
            "_id": "65f9876543210fedcba98765",
            "employeeName": "Jane Smith",
            "email": "jane@company.com",
            "Department": "FINANCE"
          },
          "requestedAt": "2024-03-08T10:30:00.000Z"
        },
        "createdBy": {
          "_id": "65f1111111111111111111111",
          "employeeName": "Sales Person",
          "email": "sales@company.com",
          "Department": "SALES"
        },
        "createdAt": "2024-03-07T09:00:00.000Z"
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 3,
      "totalCustomers": 25,
      "hasNext": true,
      "hasPrev": false
    }
  }
}
```

---

### 3. Resubmit Corrected Customer
**Endpoint:** `PUT /api/customer/:customerId/resubmit-correction`

**Access:** Sales Department (only their own customers), Finance, SuperAdmin

**Description:** Sales person updates the incorrect fields and resubmits the customer for Finance approval.

**Request Body:**
```json
{
  "GSTNumber": "22AAAAA0000A1Z5",
  "PANCardImg": "https://storage.googleapis.com/bucket/new-pan-card.jpg",
  "ownerName": "John Doe (Corrected)",
  "CustomerType": "RETAILER",
  "CustomerTypeRefId": "65f2222222222222222222222"
}
```

**Notes:**
- You must update at least one of the fields that were requested to be corrected
- You can update multiple fields in a single request
- All validations (RefId matching, format checks, etc.) are performed
- After successful resubmission, status changes back to `PENDING_FINANCE`
- The `correctionRequest` field is cleared

**Response (Success - 200):**
```json
{
  "success": true,
  "message": "Customer corrections submitted successfully. Pending Finance approval.",
  "data": {
    "customer": {
      "_id": "65f1234567890abcdef12345",
      "shopName": "ABC Opticals",
      "ownerName": "John Doe (Corrected)",
      "GSTNumber": "22AAAAA0000A1Z5",
      "PANCardImg": "https://storage.googleapis.com/bucket/new-pan-card.jpg",
      "approvalStatus": "PENDING_FINANCE",
      "correctionRequest": null
    }
  }
}
```

**Error Responses:**
- `400 INVALID_ID` - Invalid customer ID format
- `404 NOT_FOUND` - Customer not found
- `400 INVALID_STATUS` - Customer is not in CORRECTION_REQUIRED status
- `403 FORBIDDEN` - Sales can only resubmit customers they created
- `400 NO_CORRECTION_REQUEST` - No correction request found
- `400 MISSING_CORRECTIONS` - Must update at least one requested field
- `400 VALIDATION_ERROR` - Field validation errors
- `404 INVALID_REF_ID` - Referenced ID does not exist
- `400 NAME_MISMATCH` - Name doesn't match the RefId
- `409 EMAIL_EXISTS` - Email already exists for another customer

---

## Customer Model Changes

### New Approval Status
The `approvalStatus` field now supports three values:
- `PENDING_FINANCE` - Waiting for Finance approval
- `APPROVED` - Approved by Finance
- `CORRECTION_REQUIRED` - Sent back to Sales for corrections

### New Field: correctionRequest
```javascript
correctionRequest: {
  fieldsToCorrect: [String],  // Array of field names to correct
  remark: String,              // Explanation of what needs correction
  requestedBy: ObjectId,       // Employee who requested corrections
  requestedAt: Date            // When correction was requested
}
```

## Usage Examples

### Example 1: Finance sends customer back for GST correction
```bash
curl -X PUT http://localhost:3000/api/customer/65f1234567890abcdef12345/send-for-correction \
  -H "Authorization: Bearer <finance_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "fieldsToCorrect": ["GSTNumber", "GSTCertificateImg"],
    "remark": "GST Number format is invalid. Certificate image is not readable."
  }'
```

### Example 2: Sales person views corrections needed
```bash
curl -X GET http://localhost:3000/api/customer/customer/correction-required?page=1&limit=10 \
  -H "Authorization: Bearer <sales_token>"
```

### Example 3: Sales person resubmits with corrections
```bash
curl -X PUT http://localhost:3000/api/customer/65f1234567890abcdef12345/resubmit-correction \
  -H "Authorization: Bearer <sales_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "GSTNumber": "22AAAAA0000A1Z5",
    "GSTCertificateImg": "https://storage.googleapis.com/bucket/corrected-gst-cert.jpg"
  }'
```

## Benefits

1. **Clear Communication**: Finance can specify exactly which fields need correction
2. **Audit Trail**: Track who requested corrections and when
3. **Flexible**: Can request corrections for single or multiple fields
4. **Validation**: All field validations are maintained during resubmission
5. **Access Control**: Sales can only resubmit their own customers
6. **Status Tracking**: Clear status transitions (PENDING_FINANCE → CORRECTION_REQUIRED → PENDING_FINANCE → APPROVED)

## Notes

- Only customers in `PENDING_FINANCE` status can be sent back for corrections
- Customers in `APPROVED` status cannot be sent back for corrections
- Sales persons can only view and resubmit customers they created
- Finance and SuperAdmin can view all customers requiring corrections
- The correction request is cleared once the customer is resubmitted
