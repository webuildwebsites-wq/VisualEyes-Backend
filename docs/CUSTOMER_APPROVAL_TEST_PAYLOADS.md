# Customer Approval Workflow - Test Payloads

## Complete Testing Guide for Postman

### Prerequisites
You need three different employee tokens:
1. **Any Employee Token** (for registration)
2. **Finance Department Employee Token** (Department: F&A, F&A CFO, or ACCOUNTING MODULE)
3. **Sales Head Token** (Department: SALES HEAD or SALES EXECUTIVE)

---

## Test Scenario 1: Complete Approval Flow

### Step 1: Register Customer
**Endpoint:** `POST /api/customer/register`  
**Authorization:** Bearer `<any_employee_token>`

**Payload:**
```json
{
  "username": "approvaltest001",
  "CustomerType": "RETAILER",
  "designation": "OWNER",
  "salePerson": "GIRDHARI LAL ARORA",
  "zone": "NORTH",
  "hasFlatFitting": "YES",
  "specificBrand": "VISUALEYES",
  "specificCategory": "ZIRCON FSV",
  "specificLab": "VISUAL EYES LAB",
  "emailId": "approvaltest001@example.com",
  "shopName": "Approval Test Optical Store",
  "ownerName": "Test Owner",
  "orderMode": "ONLINE",
  "billingMode": "Monthly",
  "mobileNo1": "9876543210",
  "mobileNo2": "9876543211",
  "landlineNo": "011-12345678",
  "gstType": "REGULAR",
  "plant": "VISUALEYES OPTIK TECHNOLOGIES",
  "lab": "100",
  "fittingCenter": "VISUALEYES-OPTIK TECHNOLOGIES",
  "creditDays": 30,
  "creditLimit": 50000,
  "dcWithoutValue": "NO",
  "courierName": "BLUEDART",
  "courierTime": "6:00PM",
  "billingCurrency": "INDIAN RUPEES",
  "hasMultipleStores": "NO",
  "address": {
    "address1": "123 Test Street",
    "address2": "Near Test Mall",
    "city": "New Delhi",
    "state": "DELHI",
    "zipCode": "110001",
    "country": "INDIA"
  },
  "createdBy": "YOUR_EMPLOYEE_ID_HERE"
}
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Customer registration successful. Verification email will be sent shortly.",
  "data": {
    "customer": {
      "_id": "CUSTOMER_ID_HERE",
      "approvalStatus": "PENDING",
      "financeApproval": {
        "status": "PENDING"
      },
      "salesApproval": {
        "status": "PENDING"
      },
      "status": {
        "isActive": false
      }
    }
  }
}
```

**Note:** Save the `_id` from response for next steps.

---

### Step 2: Get Pending Finance Approvals
**Endpoint:** `GET /api/customer/pending-finance-approvals`  
**Authorization:** Bearer `<finance_employee_token>`

**Expected Response:**
```json
{
  "success": true,
  "message": "Pending finance approvals retrieved successfully",
  "data": {
    "customers": [
      {
        "_id": "CUSTOMER_ID",
        "username": "approvaltest001",
        "shopName": "Approval Test Optical Store",
        "approvalStatus": "PENDING",
        "createdBy": {
          "username": "creator_username",
          "email": "creator@example.com",
          "Department": "SALES EXECUTIVE"
        }
      }
    ],
    "count": 1
  }
}
```

---

### Step 3: Finance Approve Customer
**Endpoint:** `PUT /api/customer/finance-approve/:customerId`  
**Authorization:** Bearer `<finance_employee_token>`

**Payload (Approve):**
```json
{
  "status": "APPROVED",
  "remarks": "All financial documents verified. Credit limit approved."
}
```

**Payload (Reject):**
```json
{
  "status": "REJECTED",
  "remarks": "Incomplete GST documentation. Please resubmit."
}
```

**Expected Response (Approved):**
```json
{
  "success": true,
  "message": "Customer approved by Finance department",
  "data": {
    "customer": {
      "_id": "CUSTOMER_ID",
      "approvalStatus": "FINANCE_APPROVED",
      "financeApproval": {
        "status": "APPROVED",
        "approvedBy": "FINANCE_EMPLOYEE_ID",
        "approvedAt": "2026-02-14T10:30:00.000Z",
        "remarks": "All financial documents verified. Credit limit approved."
      }
    }
  }
}
```

---

### Step 4: Get Pending Sales Approvals
**Endpoint:** `GET /api/customer/pending-sales-approvals`  
**Authorization:** Bearer `<sales_head_token>`

**Expected Response:**
```json
{
  "success": true,
  "message": "Pending sales approvals retrieved successfully",
  "data": {
    "customers": [
      {
        "_id": "CUSTOMER_ID",
        "username": "approvaltest001",
        "shopName": "Approval Test Optical Store",
        "approvalStatus": "FINANCE_APPROVED",
        "financeApproval": {
          "status": "APPROVED",
          "approvedBy": {
            "username": "finance_user",
            "email": "finance@example.com"
          },
          "approvedAt": "2026-02-14T10:30:00.000Z"
        }
      }
    ],
    "count": 1
  }
}
```

---

### Step 5: Sales Head Final Approval
**Endpoint:** `PUT /api/customer/sales-approve/:customerId`  
**Authorization:** Bearer `<sales_head_token>`

**Payload (Approve):**
```json
{
  "status": "APPROVED",
  "remarks": "Customer verified. Good business potential. Approved for operations."
}
```

**Payload (Reject):**
```json
{
  "status": "REJECTED",
  "remarks": "Customer location not in our service area."
}
```

**Expected Response (Approved):**
```json
{
  "success": true,
  "message": "Customer approved by Sales Head",
  "data": {
    "customer": {
      "_id": "CUSTOMER_ID",
      "approvalStatus": "SALES_APPROVED",
      "status": {
        "isActive": true
      },
      "salesApproval": {
        "status": "APPROVED",
        "approvedBy": "SALES_HEAD_ID",
        "approvedAt": "2026-02-14T11:00:00.000Z",
        "remarks": "Customer verified. Good business potential. Approved for operations."
      }
    }
  }
}
```

---

## Test Scenario 2: Error Cases

### Error 1: Sales Approval Before Finance Approval
**Endpoint:** `PUT /api/customer/sales-approve/:customerId`  
**Authorization:** Bearer `<sales_head_token>`  
**Condition:** Customer is still in PENDING status

**Payload:**
```json
{
  "status": "APPROVED",
  "remarks": "Approved"
}
```

**Expected Error:**
```json
{
  "success": false,
  "error": {
    "code": "INVALID_STATUS",
    "message": "Customer must be approved by Finance department first"
  }
}
```

---

### Error 2: Unauthorized Finance Approval
**Endpoint:** `PUT /api/customer/finance-approve/:customerId`  
**Authorization:** Bearer `<sales_employee_token>` (Not from Finance dept)

**Expected Error:**
```json
{
  "success": false,
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Only Finance/Accounts department can perform this action"
  }
}
```

---

### Error 3: Unauthorized Sales Approval
**Endpoint:** `PUT /api/customer/sales-approve/:customerId`  
**Authorization:** Bearer `<finance_employee_token>` (Not from Sales dept)

**Expected Error:**
```json
{
  "success": false,
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Only Sales Head/Executive can perform this action"
  }
}
```

---

### Error 4: Invalid Status Value
**Endpoint:** `PUT /api/customer/finance-approve/:customerId`  
**Authorization:** Bearer `<finance_employee_token>`

**Payload:**
```json
{
  "status": "PENDING",
  "remarks": "Test"
}
```

**Expected Error:**
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Status must be either APPROVED or REJECTED"
  }
}
```

---

### Error 5: Double Approval Attempt
**Endpoint:** `PUT /api/customer/finance-approve/:customerId`  
**Authorization:** Bearer `<finance_employee_token>`  
**Condition:** Customer already FINANCE_APPROVED

**Expected Error:**
```json
{
  "success": false,
  "error": {
    "code": "INVALID_STATUS",
    "message": "Customer is already FINANCE_APPROVED"
  }
}
```

---

## Test Scenario 3: Admin View All Customers

### Get All Customers with Filters
**Endpoint:** `GET /api/customer/all-with-approval-status`  
**Authorization:** Bearer `<admin_token>`

**Query Parameters Examples:**

1. **All pending customers:**
   ```
   GET /api/customer/all-with-approval-status?approvalStatus=PENDING&page=1&limit=10
   ```

2. **All finance approved customers:**
   ```
   GET /api/customer/all-with-approval-status?approvalStatus=FINANCE_APPROVED&page=1&limit=10
   ```

3. **All fully approved customers:**
   ```
   GET /api/customer/all-with-approval-status?approvalStatus=SALES_APPROVED&page=1&limit=10
   ```

4. **All rejected customers:**
   ```
   GET /api/customer/all-with-approval-status?approvalStatus=REJECTED&page=1&limit=10
   ```

5. **All customers (no filter):**
   ```
   GET /api/customer/all-with-approval-status?page=1&limit=10
   ```

**Expected Response:**
```json
{
  "success": true,
  "message": "Customers retrieved successfully",
  "data": {
    "customers": [...],
    "totalPages": 5,
    "currentPage": 1,
    "totalCustomers": 50
  }
}
```

---

## Quick Reference: Approval Status Values

| Status | Description |
|--------|-------------|
| `PENDING` | Waiting for Finance approval |
| `FINANCE_APPROVED` | Finance approved, waiting for Sales approval |
| `SALES_APPROVED` | Fully approved and active |
| `REJECTED` | Rejected by Finance or Sales |

---

## Department Values for Testing

### Finance Departments:
- `F&A`
- `F&A CFO`
- `ACCOUNTING MODULE`

### Sales Departments:
- `SALES HEAD`
- `SALES EXECUTIVE`

---

## Testing Checklist

- [ ] Register customer with all required fields
- [ ] Verify customer is created with PENDING status
- [ ] Finance employee can view pending approvals
- [ ] Finance employee can approve customer
- [ ] Sales employee cannot approve before finance approval
- [ ] Sales employee can view finance-approved customers
- [ ] Sales employee can approve customer
- [ ] Customer becomes active after sales approval
- [ ] Finance employee cannot approve sales stage
- [ ] Sales employee cannot approve finance stage
- [ ] Admin can view all customers with filters
- [ ] Rejection at finance stage prevents sales approval
- [ ] Rejection at sales stage deactivates customer
