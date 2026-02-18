# User Hierarchy Implementation

## Overview
The system now implements a clear 4-level hierarchy as requested:

```
Super Admin
    ↓
Sub Admin (manages all departments)
    ↓
Supervisor (manages department users, not Sub Admin)
    ↓
Department Users
```

## Hierarchy Details

### 1. Super Admin
- **Scope**: System-wide access
- **Can Create**: Sub Admin, Supervisor, Department Users
- **Can Manage**: All users except other Super Admins
- **Department/Region**: Not required (system-wide)
- **Restrictions**: Cannot deactivate other Super Admins

### 2. Sub Admin
- **Scope**: All departments and regions
- **Can Create**: Supervisor, Department Users
- **Can Manage**: All users except Super Admin
- **Department/Region**: Not required (manages all departments)
- **Restrictions**: Cannot view/manage Super Admin accounts

### 3. Supervisor
- **Scope**: Specific department and region only
- **Can Create**: Department Users only (cannot create other Supervisors)
- **Can Manage**: Department Users in their department/region
- **Department/Region**: Required and restricts their access
- **Restrictions**: 
  - Cannot create other Supervisors
  - Can only assign themselves as supervisor to new users
  - Limited to their own department/region

### 4. Department Users
- **Scope**: Own profile and colleagues in same department
- **Can Create**: Nothing
- **Can Manage**: Own profile only
- **Department/Region**: Required
- **Restrictions**: Very limited access, mostly read-only

## Key Changes Made

### User Model (`src/models/Auth/User.js`)
- Updated Department/Region requirements (not required for SUPERADMIN and SUBADMIN)
- Added supervisor validation to ensure only SUPERVISOR type users can be assigned as supervisors
- Added `CanManageAllDepartments` permission for Sub Admins

### User Management Controller (`src/core/controllers/Auth/User/UserManagement.js`)
- **createSubAdmin**: Only SUPERADMIN can create, no department/region required
- **createSupervisorOrUser**: Enhanced hierarchy validation
- **getUsersByHierarchy**: Proper filtering based on user type
- **updateUser**: Hierarchy-based access control
- **deactivateUser**: Proper restrictions for each level
- **getUserDetails**: Access control based on hierarchy
- Added **getDepartmentStatistics**: Department overview with hierarchy filtering
- Added **getSupervisorsByDepartment**: Get supervisors for user assignment

### Role Middleware (`src/middlewares/Auth/AdminMiddleware/roleMiddleware.js`)
- Updated `validateDepartmentAccess` for new hierarchy
- Added `validateUserCreationHierarchy` to enforce creation rules

### Routes (`src/routes/Auth/UserManagement.js`)
- Added new middleware for proper validation
- Added new endpoints for statistics and supervisor listing

## API Endpoints

### User Creation
- `POST /create-subadmin` - Super Admin only
- `POST /create-supervisor-user` - Sub Admin or higher

### User Management
- `GET /get-users` - List users based on hierarchy
- `GET /get-user/:userId` - Get user details
- `PUT /update-user/:userId` - Update user
- `DELETE /delete-user/:userId` - Deactivate user

### New Endpoints
- `GET /department-statistics` - Department overview (Supervisor or higher)
- `GET /supervisors` - List supervisors for assignment (Sub Admin or higher)

## Usage Examples

### Creating a Sub Admin (Super Admin only)
```json
POST /create-subadmin
{
  "username": "subadmin1",
  "email": "subadmin@company.com",
  "password": "securepassword",
  "firstName": "John",
  "lastName": "Doe",
  "phone": "1234567890",
  "employeeId": "SA001"
}
```

### Creating a Supervisor (Sub Admin or Super Admin)
```json
POST /create-supervisor-user
{
  "username": "supervisor1",
  "email": "supervisor@company.com",
  "password": "securepassword",
  "firstName": "Jane",
  "lastName": "Smith",
  "phone": "1234567890",
  "employeeId": "SUP001",
  "EmployeeType": "SUPERVISOR",
  "department": "SALES",
  "region": "NORTH"
}
```

### Creating a Department User (Supervisor, Sub Admin, or Super Admin)
```json
POST /create-supervisor-user
{
  "username": "user1",
  "email": "user@company.com",
  "password": "securepassword",
  "firstName": "Bob",
  "lastName": "Johnson",
  "phone": "1234567890",
  "employeeId": "USR001",
  "EmployeeType": "EMPLOYEE",
  "department": "SALES",
  "region": "NORTH",
  "role": "SALES",
  "supervisor": "supervisor_id_here"
}
```

## Security Features

1. **Strict Hierarchy Enforcement**: Each level can only manage users below them
2. **Department/Region Isolation**: Supervisors are restricted to their department
3. **Creation Validation**: Users can only create specific types based on their level
4. **Access Control**: Viewing and editing permissions based on hierarchy
5. **Supervisor Validation**: Only SUPERVISOR type users can be assigned as supervisors

The implementation ensures that the hierarchy is strictly enforced while maintaining flexibility for different organizational structures.