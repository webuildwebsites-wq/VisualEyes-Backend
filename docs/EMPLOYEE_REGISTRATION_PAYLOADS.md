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
  "username": "johnadmin",
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
  "username": "sarahsup",
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
  "username": "michaeltl",
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
  "username": "emilyemp",
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
- For SALES department: Supervisor and Team Lead are **automatically assigned based on zone**
- For other departments: Supervisor and Team Lead are **automatically assigned based on matching sub-roles**
- The system will find an active SUPERVISOR with the same department and zone (SALES) or sub-role (other departments)
- The system will find an active TEAMLEAD with the same department and sub-role
- If no matching supervisor is found, registration will fail

---

## Additional Examples

### 5. Register Supervisor with Multiple Sub-Roles (Credit Note + Receipts)

```json
{
  "employeeType": "SUPERVISOR",
  "username": "davidsup",
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
  "username": "lisaemp",
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
  "username": "robertadm",
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

### 8. Register Supervisor of Sales Department (with Zone)

```json
{
  "employeeType": "SUPERVISOR",
  "username": "jamessup",
  "employeeName": "James Sales Supervisor",
  "email": "james.supervisor@company.com",
  "password": "SecurePass123!",
  "phone": "9876543218",
  "address": "999 Sales Territory",
  "country": "India",
  "pincode": "400009",
  "department": "SALES",
  "departmentRefId": "65f1234567890abcdef12349",
  "zone": "NORTH ZONE",
  "zoneRefId": "65f1234567890abcdef1234a",
  "aadharCard": "901234567890",
  "panCard": "IJKLM9012N"
}
```

**Notes:**
- SUPERVISOR in SALES manages employees within their assigned zone
- Zone assignment determines their area of responsibility

### 9. Register Employee of Sales Department (with Zone)

```json
{
  "employeeType": "EMPLOYEE",
  "username": "jenniferemp",
  "employeeName": "Jennifer Sales Employee",
  "email": "jennifer.employee@company.com",
  "password": "SecurePass123!",
  "phone": "9876543219",
  "address": "111 Sales Field Office",
  "country": "India",
  "pincode": "400010",
  "department": "SALES",
  "departmentRefId": "65f1234567890abcdef12349",
  "zone": "NORTH ZONE",
  "zoneRefId": "65f1234567890abcdef1234a",
  "aadharCard": "012345678901",
  "panCard": "JKLMN0123O"
}
```

**Notes for Sales Department:**
- Zone is **required** for EMPLOYEE, SUPERVISOR, and TEAMLEAD in SALES department
- SUPERVISOR and TEAMLEAD are **automatically assigned to employees based on zone ID** (not sub-roles)
- Each zone should have its own SUPERVISOR who manages all employees in that zone
- When creating an EMPLOYEE in SALES, the system finds a SUPERVISOR with matching zone
- This zone-based assignment ensures proper geographical hierarchy

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

1. **Required Fields (All):** employeeType, username, employeeName, email, password, phone, address, country
2. **Department Required:** For all except SUPERADMIN
3. **Sub-Roles:** Optional but recommended for proper hierarchy
4. **Zone Required:** For SALES department employees (EMPLOYEE, SUPERVISOR, TEAMLEAD)
5. **Auto-Assignment:**
   - SALES Department: EMPLOYEE → Automatically gets Supervisor and Team Lead based on zone ID
   - Other Departments: EMPLOYEE → Automatically gets Supervisor and Team Lead based on matching sub-roles
   - SUPERVISOR in SALES → Manages all employees within their assigned zone
6. **Permissions:**
   - SUPERADMIN → Can create ADMIN
   - ADMIN → Can create SUPERVISOR, TEAMLEAD, EMPLOYEE in their department
   - SUPERVISOR → Can create EMPLOYEE (will be assigned to themselves)

---

## Common Errors and Solutions

### Error: "No active supervisor found for this zone in SALES department"
**Solution:** Create a SUPERVISOR with the same zone first before creating EMPLOYEE in SALES department

### Error: "No active supervisor found for this department and sub-role(s)"
**Solution:** For non-SALES departments, create a SUPERVISOR with the same sub-role first before creating EMPLOYEE

### Error: "Sub-role does not belong to department"
**Solution:** Verify the sub-role `refId` exists in the department's `subRoles` array

### Error: "Only SuperAdmin can create Admin"
**Solution:** Use SUPERADMIN token to create ADMIN users

### Error: "Zone is required for SALES department"
**Solution:** Add `zone` and `zoneRefId` fields for SALES department employees

---

## Testing Workflow

1. **Create Admin** (as SUPERADMIN)
2. **Create Supervisor with sub-role** (as SUPERADMIN or ADMIN)
3. **Create Team Lead with same sub-role** (as SUPERADMIN or ADMIN)
4. **Create Employee with same sub-role** (as SUPERADMIN, ADMIN, or SUPERVISOR)
   - Employee will automatically get assigned to the Supervisor and Team Lead

This ensures proper hierarchy and automatic assignment based on sub-roles.
