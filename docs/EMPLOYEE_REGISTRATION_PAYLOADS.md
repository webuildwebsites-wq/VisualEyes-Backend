# Employee Registration Payloads

This document provides corrected payload examples for employee registration based on the schema and function requirements.

## Prerequisites

Before registering employees, ensure:
1. Departments are seeded (run `node scripts/seedDepartments.js`)
2. You have the Department `_id` values
3. You have the sub-role `_id` values from the department document
4. SuperAdmin or Admin is authenticated

---

## 1. Register Admin of Finance Department

**Endpoint:** `POST /api/employee/create`

**Headers:**
```json
{
  "Authorization": "Bearer <SUPERADMIN_TOKEN>",
  "Content-Type": "application/json"
}
```

**Payload:**
```json
{
  "employeeType": "ADMIN",
  "employeeName": "John Finance Admin",
  "email": "john.finance@company.com",
  "password": "SecurePass123!",
  "phone": "9876543210",
  "address": "123 Finance Street, Business District",
  "country": "India",
  "pincode": "400001",
  "department": "ACCOUNT & FINANCE",
  "departmentRefId": "65f1234567890abcdef12345",
  "aadharCard": "123456789012",
  "panCard": "ABCDE1234F"
}
```

**Notes:**
- Only SUPERADMIN can create ADMIN
- Admin can manage all employees in their assigned department
- `departmentRefId` must be the actual MongoDB ObjectId of the "ACCOUNT & FINANCE" department

---

## 2. Register Supervisor of Finance Department (New Account Creation Sub-Role)

**Endpoint:** `POST /api/employee/create`

**Headers:**
```json
{
  "Authorization": "Bearer <SUPERADMIN_OR_ADMIN_TOKEN>",
  "Content-Type": "application/json"
}
```

**Payload:**
```json
{
  "employeeType": "SUPERVISOR",
  "employeeName": "Sarah Account Supervisor",
  "email": "sarah.supervisor@company.com",
  "password": "SecurePass123!",
  "phone": "9876543211",
  "address": "456 Supervisor Lane, Finance Block",
  "country": "India",
  "pincode": "400002",
  "department": "ACCOUNT & FINANCE",
  "departmentRefId": "65f1234567890abcdef12345",
  "subRoles": [
    {
      "name": "New Account Creation",
      "refId": "65f1234567890abcdef12346"
    }
  ],
  "aadharCard": "234567890123",
  "panCard": "BCDEF2345G"
}
```

**Notes:**
- SUPERADMIN or ADMIN can create SUPERVISOR
- `subRoles[].refId` must be the actual `_id` of the sub-role from the department's `subRoles` array
- Supervisor can create and manage employees with the same sub-role

---

## 3. Register Team Lead of Finance Department (New Account Creation Sub-Role)

**Endpoint:** `POST /api/employee/create`

**Headers:**
```json
{
  "Authorization": "Bearer <SUPERADMIN_OR_ADMIN_TOKEN>",
  "Content-Type": "application/json"
}
```

**Payload:**
```json
{
  "employeeType": "TEAMLEAD",
  "employeeName": "Michael Account TeamLead",
  "email": "michael.teamlead@company.com",
  "password": "SecurePass123!",
  "phone": "9876543212",
  "address": "789 TeamLead Avenue, Finance Tower",
  "country": "India",
  "pincode": "400003",
  "department": "ACCOUNT & FINANCE",
  "departmentRefId": "65f1234567890abcdef12345",
  "subRoles": [
    {
      "name": "New Account Creation",
      "refId": "65f1234567890abcdef12346"
    }
  ],
  "aadharCard": "345678901234",
  "panCard": "CDEFG3456H"
}
```

**Notes:**
- SUPERADMIN or ADMIN can create TEAMLEAD
- Team Lead will be automatically assigned to employees with matching sub-roles
- Must have the same sub-role as the employees they will lead

---

## 4. Register Employee of Finance Department (New Account Creation Sub-Role)

**Endpoint:** `POST /api/employee/create`

**Headers:**
```json
{
  "Authorization": "Bearer <SUPERADMIN_OR_ADMIN_OR_SUPERVISOR_TOKEN>",
  "Content-Type": "application/json"
}
```

**Payload:**
```json
{
  "employeeType": "EMPLOYEE",
  "employeeName": "Emily Account Employee",
  "email": "emily.employee@company.com",
  "password": "SecurePass123!",
  "phone": "9876543213",
  "address": "321 Employee Road, Finance Building",
  "country": "India",
  "pincode": "400004",
  "department": "ACCOUNT & FINANCE",
  "departmentRefId": "65f1234567890abcdef12345",
  "subRoles": [
    {
      "name": "New Account Creation",
      "refId": "65f1234567890abcdef12346"
    }
  ],
  "aadharCard": "456789012345",
  "panCard": "DEFGH4567I"
}
```

**Notes:**
- SUPERADMIN, ADMIN, or SUPERVISOR can create EMPLOYEE
- Supervisor and Team Lead are **automatically assigned** based on matching sub-roles
- The system will find an active SUPERVISOR with the same department and sub-role
- The system will find an active TEAMLEAD with the same department and sub-role
- If no matching supervisor is found, registration will fail

---

## Additional Examples

### 5. Register Supervisor with Multiple Sub-Roles (Credit Note + Receipts)

```json
{
  "employeeType": "SUPERVISOR",
  "employeeName": "David Multi Supervisor",
  "email": "david.supervisor@company.com",
  "password": "SecurePass123!",
  "phone": "9876543214",
  "address": "555 Multi Role Street",
  "country": "India",
  "pincode": "400005",
  "department": "ACCOUNT & FINANCE",
  "departmentRefId": "65f1234567890abcdef12345",
  "subRoles": [
    {
      "name": "Credit Note",
      "refId": "65f1234567890abcdef12347"
    },
    {
      "name": "Receipts",
      "refId": "65f1234567890abcdef12348"
    }
  ],
  "aadharCard": "567890123456",
  "panCard": "EFGHI5678J"
}
```

### 6. Register Employee with Multiple Sub-Roles

```json
{
  "employeeType": "EMPLOYEE",
  "employeeName": "Lisa Multi Employee",
  "email": "lisa.employee@company.com",
  "password": "SecurePass123!",
  "phone": "9876543215",
  "address": "666 Multi Task Lane",
  "country": "India",
  "pincode": "400006",
  "department": "ACCOUNT & FINANCE",
  "departmentRefId": "65f1234567890abcdef12345",
  "subRoles": [
    {
      "name": "Credit Note",
      "refId": "65f1234567890abcdef12347"
    },
    {
      "name": "Receipts",
      "refId": "65f1234567890abcdef12348"
    }
  ],
  "aadharCard": "678901234567",
  "panCard": "FGHIJ6789K"
}
```

**Note:** This employee will be assigned to a supervisor who has at least one matching sub-role.

---

## Sales Department Examples (with Region)

### 7. Register Admin of Sales Department

```json
{
  "employeeType": "ADMIN",
  "employeeName": "Robert Sales Admin",
  "email": "robert.sales@company.com",
  "password": "SecurePass123!",
  "phone": "9876543216",
  "address": "777 Sales Boulevard",
  "country": "India",
  "pincode": "400007",
  "department": "SALES",
  "departmentRefId": "65f1234567890abcdef12349",
  "aadharCard": "789012345678",
  "panCard": "GHIJK7890L"
}
```

### 8. Register Region Manager of Sales Department

```json
{
  "employeeType": "REGIONMANAGER",
  "employeeName": "Patricia Region Manager",
  "email": "patricia.rm@company.com",
  "password": "SecurePass123!",
  "phone": "9876543217",
  "address": "888 Regional Office",
  "country": "India",
  "pincode": "400008",
  "department": "SALES",
  "departmentRefId": "65f1234567890abcdef12349",
  "region": "North Region",
  "regionRefId": "65f1234567890abcdef1234a",
  "aadharCard": "890123456789",
  "panCard": "HIJKL8901M"
}
```

### 9. Register Supervisor of Sales Department (with Region)

```json
{
  "employeeType": "SUPERVISOR",
  "employeeName": "James Sales Supervisor",
  "email": "james.supervisor@company.com",
  "password": "SecurePass123!",
  "phone": "9876543218",
  "address": "999 Sales Territory",
  "country": "India",
  "pincode": "400009",
  "department": "SALES",
  "departmentRefId": "65f1234567890abcdef12349",
  "region": "North Region",
  "regionRefId": "65f1234567890abcdef1234a",
  "aadharCard": "901234567890",
  "panCard": "IJKLM9012N"
}
```

### 10. Register Employee of Sales Department (with Region)

```json
{
  "employeeType": "EMPLOYEE",
  "employeeName": "Jennifer Sales Employee",
  "email": "jennifer.employee@company.com",
  "password": "SecurePass123!",
  "phone": "9876543219",
  "address": "111 Sales Field Office",
  "country": "India",
  "pincode": "400010",
  "department": "SALES",
  "departmentRefId": "65f1234567890abcdef12349",
  "region": "North Region",
  "regionRefId": "65f1234567890abcdef1234a",
  "aadharCard": "012345678901",
  "panCard": "JKLMN0123O"
}
```

**Notes for Sales Department:**
- Region is **required** for EMPLOYEE, SUPERVISOR, TEAMLEAD, and REGIONMANAGER in SALES department
- Employee will be automatically assigned to Region Manager if one exists for the region
- Supervisor and Team Lead assignment follows the same sub-role matching logic

---

## How to Get Department and Sub-Role IDs

### Method 1: Query Database Directly
```javascript
// Get all departments with sub-roles
const departments = await Department.find({});
departments.forEach(dept => {
  console.log(`Department: ${dept.name} - ID: ${dept._id}`);
  dept.subRoles.forEach(sr => {
    console.log(`  Sub-role: ${sr.name} - ID: ${sr._id}`);
  });
});
```

### Method 2: Use API Endpoint
```bash
GET /api/departments
```

---

## Validation Rules Summary

1. **Required Fields (All):** employeeType, employeeName, email, password, phone, address, country
2. **Department Required:** For all except SUPERADMIN
3. **Sub-Roles:** Optional but recommended for proper hierarchy
4. **Region Required:** For SALES department employees (EMPLOYEE, SUPERVISOR, TEAMLEAD, REGIONMANAGER)
5. **Auto-Assignment:**
   - EMPLOYEE → Automatically gets Supervisor and Team Lead based on matching sub-roles
   - EMPLOYEE in SALES → Also gets Region Manager based on region
6. **Permissions:**
   - SUPERADMIN → Can create ADMIN
   - ADMIN → Can create SUPERVISOR, TEAMLEAD, REGIONMANAGER, EMPLOYEE in their department
   - SUPERVISOR → Can create EMPLOYEE (will be assigned to themselves)

---

## Common Errors and Solutions

### Error: "No active supervisor found for this department and sub-role(s)"
**Solution:** Create a SUPERVISOR with the same sub-role first before creating EMPLOYEE

### Error: "Sub-role does not belong to department"
**Solution:** Verify the sub-role `refId` exists in the department's `subRoles` array

### Error: "Only SuperAdmin can create Admin"
**Solution:** Use SUPERADMIN token to create ADMIN users

### Error: "Region is required for SALES department"
**Solution:** Add `region` and `regionRefId` fields for SALES department employees

### Error: "No active region manager found for this region"
**Solution:** Create a REGIONMANAGER for the region first before creating EMPLOYEE in SALES

---

## Testing Workflow

1. **Create Admin** (as SUPERADMIN)
2. **Create Supervisor with sub-role** (as SUPERADMIN or ADMIN)
3. **Create Team Lead with same sub-role** (as SUPERADMIN or ADMIN)
4. **Create Employee with same sub-role** (as SUPERADMIN, ADMIN, or SUPERVISOR)
   - Employee will automatically get assigned to the Supervisor and Team Lead

This ensures proper hierarchy and automatic assignment based on sub-roles.
