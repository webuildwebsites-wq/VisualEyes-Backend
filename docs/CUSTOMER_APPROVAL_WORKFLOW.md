# Customer Approval Workflow

## Overview
Customer registration requires a two-stage approval process:
1. **Finance Department Approval** (First Stage)
2. **Sales Head Approval** (Final Stage)

## Workflow Stages

### Stage 1: Customer Registration
**Who can register customers:**
- SUPERADMIN
- ADMIN
- Sales Team Employees (SALES EXECUTIVE, SALES HEAD)
- Finance/Accounts Team (F&A, F&A CFO, ACCOUNTING MODULE)

**Initial Status:**
- `approvalStatus`: PENDING
- `financeApproval.status`: PENDING
- `salesApproval.status`: PENDING
- `status.isActive`: false

### Stage 2: Finance Department Approval
**Who can approve:**
- Employees with Department: `F&A`, `F&A CFO`, or `ACCOUNTING MODULE`

**Actions:**
- Approve or Reject the customer registration
- Add remarks/comments

**After Finance Approval:**
- If APPROVED: `approvalStatus` → FINANCE_APPROVED
- If REJECTED: `approvalStatus` → REJECTED, `status.isActive` → false

### Stage 3: Sales Head Final Approval
**Who can approve:**
- Employees with Department: `SALES HEAD` or `SALES EXECUTIVE`

**Prerequisites:**
- Customer must be FINANCE_APPROVED

**Actions:**
- Approve or Reject the customer registration
- Add remarks/comments

**After Sales Approval:**
- If APPROVED: `approvalStatus` → SALES_APPROVED, `status.isActive` → true
- If REJECTED: `approvalStatus` → REJECTED, `status.isActive` → false

## API Endpoints

### 1. Register Customer
```
POST /api/customer/register
Authorization: Bearer <employee_token>
```

**Request Body:**
```json
{
  "username": "testcustomer123",
  "CustomerType": "RETAILER",
  "emailId": "test@example.com",
  "shopName": "Test Store",
  "ownerName": "John Doe",
  "orderMode": "ONLINE",
  "createdBy": "employee_id",
  // ... other fields
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "customer": {
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

### 2. Finance Approve Customer
```
PUT /api/customer/finance-approve/:customerId
Authorization: Bearer <finance_employee_token>
```

**Request Body:**
```json
{
  "status": "APPROVED",
  "remarks": "All financial documents verified"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Customer approved by Finance department",
  "data": {
    "customer": {
      "approvalStatus": "FINANCE_APPROVED",
      "financeApproval": {
        "status": "APPROVED",
        "approvedBy": "finance_employee_id",
        "approvedAt": "2026-02-14T10:30:00.000Z",
        "remarks": "All financial documents verified"
      }
    }
  }
}
```

### 3. Sales Approve Customer
```
PUT /api/customer/sales-approve/:customerId
Authorization: Bearer <sales_head_token>
```

**Request Body:**
```json
{
  "status": "APPROVED",
  "remarks": "Customer verified and approved for business"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Customer approved by Sales Head",
  "data": {
    "customer": {
      "approvalStatus": "SALES_APPROVED",
      "status": {
        "isActive": true
      },
      "salesApproval": {
        "status": "APPROVED",
        "approvedBy": "sales_head_id",
        "approvedAt": "2026-02-14T11:00:00.000Z",
        "remarks": "Customer verified and approved for business"
      }
    }
  }
}
```

### 4. Get Pending Finance Approvals
```
GET /api/customer/pending-finance-approvals
Authorization: Bearer <finance_employee_token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "customers": [...],
    "count": 5
  }
}
```

### 5. Get Pending Sales Approvals
```
GET /api/customer/pending-sales-approvals
Authorization: Bearer <sales_head_token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "customers": [...],
    "count": 3
  }
}
```

### 6. Get All Customers with Approval Status (Admin Only)
```
GET /api/customer/all-with-approval-status?approvalStatus=PENDING&page=1&limit=10
Authorization: Bearer <admin_token>
```

**Query Parameters:**
- `approvalStatus` (optional): PENDING, FINANCE_APPROVED, SALES_APPROVED, REJECTED
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10)

**Response:**
```json
{
  "success": true,
  "data": {
    "customers": [...],
    "totalPages": 5,
    "currentPage": 1,
    "totalCustomers": 50
  }
}
```

## Approval Status Flow

```
PENDING → FINANCE_APPROVED → SALES_APPROVED (Active Customer)
   ↓              ↓
REJECTED      REJECTED
```

## Database Schema Changes

### Customer Model - New Fields

```javascript
approvalStatus: {
  type: String,
  enum: ['PENDING', 'FINANCE_APPROVED', 'SALES_APPROVED', 'REJECTED'],
  default: 'PENDING'
}

financeApproval: {
  status: { type: String, enum: ['PENDING', 'APPROVED', 'REJECTED'], default: 'PENDING' },
  approvedBy: { type: ObjectId, ref: 'employee' },
  approvedAt: { type: Date },
  remarks: { type: String }
}

salesApproval: {
  status: { type: String, enum: ['PENDING', 'APPROVED', 'REJECTED'], default: 'PENDING' },
  approvedBy: { type: ObjectId, ref: 'employee' },
  approvedAt: { type: Date },
  remarks: { type: String }
}
```

## Authorization Matrix

| Action | SUPERADMIN | ADMIN | Finance Dept | Sales Head | Sales Executive |
|--------|------------|-------|--------------|------------|-----------------|
| Register Customer | ✅ | ✅ | ✅ | ✅ | ✅ |
| Finance Approve | ✅ | ✅ | ✅ | ❌ | ❌ |
| Sales Approve | ✅ | ✅ | ❌ | ✅ | ✅ |
| View All Customers | ✅ | ✅ | ❌ | ❌ | ❌ |
| View Pending Finance | ✅ | ✅ | ✅ | ❌ | ❌ |
| View Pending Sales | ✅ | ✅ | ❌ | ✅ | ✅ |

## Testing Workflow

### Step 1: Create Customer (Any authorized employee)
```bash
POST /api/customer/register
# Customer created with approvalStatus: PENDING
```

### Step 2: Finance Approval (Finance department employee)
```bash
PUT /api/customer/finance-approve/:customerId
Body: { "status": "APPROVED", "remarks": "Verified" }
# Customer status changes to FINANCE_APPROVED
```

### Step 3: Sales Approval (Sales head)
```bash
PUT /api/customer/sales-approve/:customerId
Body: { "status": "APPROVED", "remarks": "Approved for business" }
# Customer status changes to SALES_APPROVED and becomes active
```

## Error Scenarios

1. **Finance approval without proper department:**
   - Error: "Only Finance/Accounts department can perform this action"

2. **Sales approval before finance approval:**
   - Error: "Customer must be approved by Finance department first"

3. **Attempting to approve already processed customer:**
   - Error: "Customer is already FINANCE_APPROVED/SALES_APPROVED/REJECTED"

4. **Invalid status value:**
   - Error: "Status must be either APPROVED or REJECTED"
