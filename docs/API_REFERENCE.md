# API Reference - Location & Hierarchy System

## Base URL
```
http://localhost:PORT/api
```

All endpoints require authentication via Bearer token unless specified otherwise.

---

## Location APIs

### Regions

#### Create Region
```http
POST /regions
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "NCR",
  "code": "NCR",
  "description": "National Capital Region"
}
```

**Response (201)**:
```json
{
  "success": true,
  "message": "Region created successfully",
  "data": {
    "_id": "regionId",
    "name": "NCR",
    "code": "NCR",
    "description": "National Capital Region",
    "isActive": true,
    "createdBy": "employeeId",
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
}
```

#### Get All Regions
```http
GET /regions?isActive=true&search=NCR
Authorization: Bearer <token>
```

**Query Parameters**:
- `isActive` (optional): Filter by active status (true/false)
- `search` (optional): Search by name or code

**Response (200)**:
```json
{
  "success": true,
  "message": "Regions fetched successfully",
  "data": [
    {
      "_id": "regionId",
      "name": "NCR",
      "code": "NCR",
      "isActive": true,
      "createdBy": {
        "_id": "employeeId",
        "employeeName": "Admin",
        "email": "admin@example.com"
      }
    }
  ]
}
```

#### Get Region by ID
```http
GET /regions/:id
Authorization: Bearer <token>
```

**Response (200)**: Region with populated cities

#### Update Region
```http
PUT /regions/:id
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "NCR Updated",
  "description": "Updated description",
  "isActive": true
}
```

#### Delete Region
```http
DELETE /regions/:id
Authorization: Bearer <token>
```

**Note**: Cannot delete if region has associated cities

---

### Cities

#### Create City
```http
POST /cities
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Delhi",
  "code": "DEL",
  "regionId": "regionObjectId",
  "description": "Delhi City"
}
```

#### Get All Cities
```http
GET /cities?regionId=xxx&isActive=true&search=Delhi
Authorization: Bearer <token>
```

**Query Parameters**:
- `regionId` (optional): Filter by region
- `isActive` (optional): Filter by active status
- `search` (optional): Search by name or code

#### Get Cities by Region
```http
GET /cities/region/:regionId
Authorization: Bearer <token>
```

#### Get City by ID
```http
GET /cities/:id
Authorization: Bearer <token>
```

**Response**: City with populated zones

#### Update City
```http
PUT /cities/:id
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Delhi Updated",
  "regionId": "newRegionId",
  "isActive": true
}
```

#### Delete City
```http
DELETE /cities/:id
Authorization: Bearer <token>
```

**Note**: Cannot delete if city has associated zones

---

### Zones

#### Create Zone
```http
POST /zones
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "West Delhi",
  "code": "WDEL",
  "cityId": "cityObjectId",
  "description": "West Delhi Zone"
}
```

#### Get All Zones
```http
GET /zones?cityId=xxx&isActive=true&search=West
Authorization: Bearer <token>
```

**Query Parameters**:
- `cityId` (optional): Filter by city
- `isActive` (optional): Filter by active status
- `search` (optional): Search by name or code

#### Get Zones by City
```http
GET /zones/city/:cityId
Authorization: Bearer <token>
```

#### Get Zone by ID
```http
GET /zones/:id
Authorization: Bearer <token>
```

**Response**: Zone with populated city and region

#### Update Zone
```http
PUT /zones/:id
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "West Delhi Updated",
  "cityId": "newCityId",
  "isActive": true
}
```

#### Delete Zone
```http
DELETE /zones/:id
Authorization: Bearer <token>
```

---

## Role & Department APIs

### Roles

#### Create Role
```http
POST /roles
Authorization: Bearer <token> (SuperAdmin only)
Content-Type: application/json

{
  "name": "MANAGER",
  "level": 6,
  "description": "Manager role"
}
```

#### Get All Roles
```http
GET /roles?isActive=true
Authorization: Bearer <token>
```

#### Get Role by ID
```http
GET /roles/:id
Authorization: Bearer <token>
```

#### Update Role
```http
PUT /roles/:id
Authorization: Bearer <token> (SuperAdmin only)
Content-Type: application/json

{
  "description": "Updated description",
  "isActive": true
}
```

---

### Departments

#### Create Department
```http
POST /departments
Authorization: Bearer <token> (Admin+)
Content-Type: application/json

{
  "name": "MARKETING",
  "code": "MKT",
  "requiresRegionManager": false,
  "description": "Marketing Department"
}
```

#### Get All Departments
```http
GET /departments?isActive=true&requiresRegionManager=true
Authorization: Bearer <token>
```

**Query Parameters**:
- `isActive` (optional): Filter by active status
- `requiresRegionManager` (optional): Filter by region manager requirement

#### Get Department by ID
```http
GET /departments/:id
Authorization: Bearer <token>
```

#### Update Department
```http
PUT /departments/:id
Authorization: Bearer <token> (Admin+)
Content-Type: application/json

{
  "name": "MARKETING",
  "requiresRegionManager": true,
  "isActive": true
}
```

#### Delete Department
```http
DELETE /departments/:id
Authorization: Bearer <token> (Admin+)
```

---

## Enhanced Employee APIs

### Create Employee with Hierarchy
```http
POST /employees/enhanced/hierarchy
Authorization: Bearer <token> (Admin+)
Content-Type: application/json

{
  "employeeName": "John Doe",
  "email": "john@example.com",
  "password": "password123",
  "phone": "9876543210",
  "address": "123 Street",
  "country": "India",
  "pincode": "110001",
  "employeeType": "EMPLOYEE",
  "role": "EMPLOYEE",
  "department": "SALES",
  "region": "regionObjectId",
  "supervisor": "supervisorObjectId",
  "lab": "LAB_NAME",
  "aadharCard": "1234-5678-9012",
  "panCard": "ABCDE1234F"
}
```

**Response (201)**:
```json
{
  "success": true,
  "message": "Employee created successfully",
  "data": {
    "employee": {
      "_id": "employeeId",
      "employeeName": "John Doe",
      "email": "john@example.com",
      "EmployeeType": {
        "name": "EMPLOYEE",
        "refId": "roleId"
      },
      "Department": {
        "name": "SALES",
        "refId": "deptId"
      },
      "region": {
        "name": "NCR",
        "refId": "regionId"
      },
      "supervisor": {
        "name": "Supervisor Name",
        "refId": "supervisorId"
      },
      "regionManager": "regionManagerId"
    }
  }
}
```

### Get Region Managers by Region
```http
GET /employees/enhanced/region-managers/:regionId
Authorization: Bearer <token>
```

**Response (200)**:
```json
{
  "success": true,
  "message": "Region Managers fetched successfully",
  "data": {
    "regionManagers": [
      {
        "_id": "managerId",
        "employeeName": "Region Manager",
        "email": "manager@example.com",
        "phone": "9876543210",
        "region": {
          "name": "NCR",
          "refId": "regionId"
        }
      }
    ]
  }
}
```

### Get Supervisors by Department and Region
```http
GET /employees/enhanced/supervisors?departmentId=xxx&regionId=yyy
Authorization: Bearer <token>
```

**Query Parameters**:
- `departmentId` (optional): Filter by department
- `regionId` (optional): Filter by region

**Response (200)**:
```json
{
  "success": true,
  "message": "Supervisors fetched successfully",
  "data": {
    "supervisors": [
      {
        "_id": "supervisorId",
        "employeeName": "Supervisor Name",
        "email": "supervisor@example.com",
        "phone": "9876543210",
        "Department": {
          "name": "SALES",
          "refId": "deptId"
        },
        "region": {
          "name": "NCR",
          "refId": "regionId"
        }
      }
    ]
  }
}
```

### Get Employee Hierarchy
```http
GET /employees/enhanced/hierarchy/:employeeId
Authorization: Bearer <token>
```

**Response (200)**:
```json
{
  "success": true,
  "message": "Employee hierarchy fetched successfully",
  "data": {
    "hierarchy": {
      "employee": {
        "id": "employeeId",
        "name": "John Doe",
        "email": "john@example.com",
        "type": "EMPLOYEE",
        "department": "SALES",
        "region": "NCR"
      },
      "supervisor": {
        "id": "supervisorId",
        "name": "Supervisor Name",
        "email": "supervisor@example.com",
        "type": "SUPERVISOR"
      },
      "regionManager": {
        "id": "managerId",
        "name": "Region Manager",
        "email": "manager@example.com",
        "type": "REGIONMANAGER"
      },
      "createdBy": {
        "id": "adminId",
        "name": "Admin",
        "email": "admin@example.com"
      }
    }
  }
}
```

---

## Error Responses

### 400 Bad Request
```json
{
  "success": false,
  "message": "Validation error message",
  "error": "VALIDATION_ERROR"
}
```

### 401 Unauthorized
```json
{
  "success": false,
  "message": "Authentication required",
  "error": "UNAUTHORIZED"
}
```

### 403 Forbidden
```json
{
  "success": false,
  "message": "Insufficient permissions",
  "error": "FORBIDDEN"
}
```

### 404 Not Found
```json
{
  "success": false,
  "message": "Resource not found",
  "error": "NOT_FOUND"
}
```

### 409 Conflict
```json
{
  "success": false,
  "message": "Resource already exists",
  "error": "CONFLICT"
}
```

### 500 Internal Server Error
```json
{
  "success": false,
  "message": "Internal server error",
  "error": "INTERNAL_ERROR"
}
```

---

## Data Models

### Region
```typescript
{
  _id: ObjectId,
  name: string,
  code: string,
  description?: string,
  isActive: boolean,
  createdBy: ObjectId,
  createdAt: Date,
  updatedAt: Date
}
```

### City
```typescript
{
  _id: ObjectId,
  name: string,
  code: string,
  regionId: ObjectId,
  description?: string,
  isActive: boolean,
  createdBy: ObjectId,
  createdAt: Date,
  updatedAt: Date
}
```

### Zone
```typescript
{
  _id: ObjectId,
  name: string,
  code: string,
  cityId: ObjectId,
  description?: string,
  isActive: boolean,
  createdBy: ObjectId,
  createdAt: Date,
  updatedAt: Date
}
```

### Employee (Dual Storage Fields)
```typescript
{
  _id: ObjectId,
  employeeName: string,
  email: string,
  EmployeeType: {
    name: string,
    refId?: ObjectId
  },
  Role: {
    name: string,
    refId?: ObjectId
  },
  Department: {
    name: string,
    refId?: ObjectId
  },
  region: {
    name: string,
    refId?: ObjectId
  },
  supervisor: {
    name: string,
    refId?: ObjectId
  },
  regionManager?: ObjectId,
  lab: {
    name: string,
    refId?: ObjectId
  },
  // ... other fields
}
```

### Customer (Dual Storage Fields)
```typescript
{
  _id: ObjectId,
  shopName: string,
  ownerName: string,
  zone: {
    name: string,
    refId?: ObjectId
  },
  specificBrand: {
    name: string,
    refId: ObjectId
  },
  specificCategory: {
    name: string,
    refId: ObjectId
  },
  salesPerson: {
    name: string,
    refId?: ObjectId
  },
  // ... other dual storage fields
}
```

---

## Business Rules

### Location Hierarchy
1. Region → City → Zone (strict hierarchy)
2. Cannot delete Region with Cities
3. Cannot delete City with Zones
4. Unique names within parent scope

### Employee Hierarchy
1. SuperAdmin → Admin → Supervisor → Employee
2. Sales Department: Supervisor → Region Manager → Employee
3. Non-Sales: Supervisor → Employee
4. Region Manager required for Sales employees
5. Supervisor must be from same department

### Validation Rules
1. All codes are uppercase
2. Email must be unique
3. Phone must be 10 digits
4. Region required for Sales department
5. Supervisor required for all employees (except SuperAdmin)

---

## Rate Limiting

All endpoints are subject to rate limiting:
- 100 requests per 15 minutes per IP
- 1000 requests per hour per authenticated user

---

## Pagination

List endpoints support pagination:
```http
GET /regions?page=1&limit=10
```

**Response includes**:
```json
{
  "data": [...],
  "pagination": {
    "currentPage": 1,
    "totalPages": 5,
    "totalItems": 50,
    "hasNext": true,
    "hasPrev": false
  }
}
```

---

## Postman Collection

Import the Postman collection for easy testing:
- Collection file: `postman/Location_Hierarchy_System.json`
- Environment: `postman/environment.json`

---

## Support

For API support:
- Documentation: `/docs`
- Issues: GitHub Issues
- Email: dev-team@example.com
