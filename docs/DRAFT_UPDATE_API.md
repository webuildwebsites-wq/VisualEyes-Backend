# Draft Update API Documentation

## Overview
APIs to update draft records for both customer and employee registration.

## Customer Draft Update API

### Endpoint
```
PUT /api/customer/management/update-draft-customer/:draftId
```

### Authentication
- Requires authentication token
- Requires SALES, FINANCE department or SUPERADMIN role

### Authorization
- Creator of the draft can update basic fields
- FINANCE department or SUPERADMIN can update all fields including finance-specific fields

### Path Parameters
- `draftId` (required): MongoDB ObjectId of the draft customer

### Request Body
```json
{
  "shopName": "string",
  "ownerName": "string",
  "CustomerType": "string",
  "CustomerTypeRefId": "ObjectId",
  "orderMode": "string",
  "mobileNo1": "string",
  "mobileNo2": "string",
  "emailId": "string",
  "businessEmail": "string",
  "IsGSTRegistered": "boolean",
  "GSTNumber": "string",
  "gstType": "string",
  "gstTypeRefId": "ObjectId",
  "GSTCertificateImg": "string",
  "PANCard": "string",
  "AadharCard": "string",
  "PANCardImg": "string",
  "AadharCardImg": "string",
  "address": [
    {
      "branchAddress": "string",
      "contactPerson": "string",
      "contactNumber": "string",
      "country": "string",
      "state": "string",
      "zipCode": "string",
      "city": "string",
      "billingCurrency": "string",
      "billingMode": "string"
    }
  ],
  "customerpassword": "string (FINANCE only)",
  "brandCategories": "array (FINANCE only)",
  "zone": "string (FINANCE only)",
  "zoneRefId": "ObjectId (FINANCE only)",
  "salesPerson": "string (FINANCE only)",
  "salesPersonRefId": "ObjectId (FINANCE only)",
  "specificLab": "string (FINANCE only)",
  "specificLabRefId": "ObjectId (FINANCE only)",
  "fittingCenter": "string (FINANCE only)",
  "fittingCenterRefId": "ObjectId (FINANCE only)",
  "plant": "string (FINANCE only)",
  "plantRefId": "ObjectId (FINANCE only)",
  "creditLimit": "number (FINANCE only)",
  "creditDays": "string (FINANCE only)",
  "creditDaysRefId": "ObjectId (FINANCE only)",
  "courierName": "string (FINANCE only)",
  "courierNameRefId": "ObjectId (FINANCE only)",
  "courierTime": "string (FINANCE only)",
  "courierTimeRefId": "ObjectId (FINANCE only)"
}
```

### Response
```json
{
  "success": true,
  "message": "Draft customer updated successfully",
  "data": {
    "customer": {
      // Updated customer draft object
    }
  }
}
```

### Error Responses
- `404 NOT_FOUND`: Draft customer not found
- `403 FORBIDDEN`: No permission to update this draft
- `409 EMAIL_EXISTS`: Email already exists
- `400 VALIDATION_ERROR`: Validation failed
- `409 DUPLICATE_FIELD`: Duplicate field value
- `500 INTERNAL_ERROR`: Server error

---

## Employee Draft Update API

### Endpoint
```
PUT /api/employee/management/update-draft-employee/:draftId
```

### Authentication
- Requires authentication token
- Requires SUBADMIN or higher role

### Authorization
- Creator of the draft can update
- SUPERADMIN can update any draft

### Path Parameters
- `draftId` (required): MongoDB ObjectId of the draft employee

### Request Body
```json
{
  "employeeName": "string",
  "username": "string",
  "email": "string",
  "password": "string",
  "phone": "string",
  "address": "string",
  "country": "string",
  "pincode": "string",
  "EmployeeType": "string",
  "ProfilePicture": "string",
  "Department": "string",
  "DepartmentRefId": "ObjectId",
  "subRoles": [
    {
      "name": "string",
      "refId": "ObjectId"
    }
  ],
  "lab": "string",
  "labRefId": "ObjectId",
  "zone": "string",
  "zoneRefId": "ObjectId",
  "aadharCard": "string",
  "panCard": "string",
  "aadharCardImg": "string",
  "panCardImg": "string",
  "supervisor": "string",
  "supervisorRefId": "ObjectId",
  "teamLead": "string",
  "teamLeadRefId": "ObjectId",
  "dateOfJoining": "Date",
  "dateOfBirth": "Date",
  "emergencyContact": {
    "name": "string",
    "phone": "string",
    "relation": "string"
  },
  "isActive": "boolean"
}
```

### Response
```json
{
  "success": true,
  "message": "Draft employee updated successfully",
  "data": {
    "employee": {
      // Updated employee draft object
    }
  }
}
```

### Error Responses
- `404 NOT_FOUND`: Draft employee not found
- `403 FORBIDDEN`: No permission to update this draft
- `409 DUPLICATE`: Email or username already exists
- `400 VALIDATION_ERROR`: Validation failed
- `409 DUPLICATE_FIELD`: Duplicate field value
- `500 INTERNAL_ERROR`: Server error

---

## Notes

### Customer Draft Update
1. Only the creator or FINANCE department/SUPERADMIN can update a draft
2. Email uniqueness is checked across both Customer and CustomerDraft collections
3. Finance-specific fields (brandCategories, zone, salesPerson, etc.) can only be updated by FINANCE department or SUPERADMIN
4. When `IsGSTRegistered` changes, appropriate fields are cleared automatically

### Employee Draft Update
1. Only the creator or SUPERADMIN can update a draft
2. Email and username uniqueness is checked across both Employee and EmployeeDraft collections
3. Password will be hashed automatically if updated
4. All fields are optional in the update request

### Common Features
- Partial updates supported (only send fields you want to update)
- Validation runs on update
- Timestamps are automatically updated
- Password fields are excluded from responses
