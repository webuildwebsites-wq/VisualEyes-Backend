# Folder Structure Documentation - VisualEyes ERP

## 📁 Complete Project Structure

```
visualeyes/
├── 📄 index.js                    # Main server entry point & configuration
├── 📄 package.json                # Dependencies, scripts, and project metadata
├── 📄 package-lock.json           # Locked dependency versions
├── 📄 README.md                   # Project documentation and setup guide
├── 📄 .env                        # Environment variables (not in version control)
├── 📄 .env.example               # Environment variables template
├── 📄 .gitignore                 # Git ignore rules
├── 📁 .git/                      # Git version control data
├── 📁 node_modules/              # NPM dependencies (auto-generated)
├── 📁 docs/                      # 📚 Project documentation
│   ├── 📄 PROJECT_OVERVIEW.md    # Business problems and solutions
│   ├── 📄 DEVELOPMENT_GUIDE.md   # Development patterns and practices
│   └── 📄 FOLDER_STRUCTURE.md    # This file - project organization
└── 📁 src/                       # 🏗️ Source code directory
    ├── 📁 Utils/                 # 🔧 Utility functions and helpers
    │   ├── 📁 Auth/
    │   │   └── 📄 tokenUtils.js  # JWT token management utilities
    │   ├── 📁 Mail/
    │   │   └── 📄 verifyEmailTemplate.js # Email templates for verification
    │   └── 📁 response/
    │       └── 📄 responseHandler.js # Standardized API response formatting
    ├── 📁 core/                  # 🎯 Core system components
    │   ├── 📁 config/            # ⚙️ Configuration files
    │   │   ├── 📁 DB/
    │   │   │   └── 📄 connectDb.js # MongoDB connection configuration
    │   │   └── 📁 Email/
    │   │       ├── 📄 emailService.js # Email service configuration
    │   │       └── 📄 sendEmail.js    # Email sending utilities
    │   └── 📁 controllers/       # 🎮 Business logic controllers
    │       └── 📁 Auth/
    │           ├── 📁 Customers/
    │           │   └── 📄 CustomerAuth.js # Customer authentication logic
    │           └── 📁 User/
    │               └── 📄 UserAuth.js     # User authentication logic
    ├── 📁 middlewares/           # 🛡️ Request processing middleware
    │   └── 📁 Auth/
    │       ├── 📁 AdminMiddleware/
    │       │   └── 📄 adminMiddleware.js     # Admin authorization middleware
    │       └── 📁 CustomerMiddleware/
    │           └── 📄 customerMiddleware.js  # Customer authorization middleware
    ├── 📁 models/                # 🗃️ Database models and schemas
    │   └── 📁 Auth/
    │       ├── 📄 Customer.js    # Customer data model with business logic
    │       └── 📄 User.js        # User data model with role-based permissions
    └── 📁 routes/                # 🛣️ API route definitions
        └── 📁 Auth/              # Authentication-related routes
            ├── 📄 CustomerAuth.js # Customer authentication endpoints
            └── 📄 UserAuth.js     # User authentication endpoints
```

## 🏗️ Architecture Explanation

### **Root Level Files**

#### **`index.js` - Application Entry Point**
```javascript
// Main server configuration and startup
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
// ... security middleware setup
// ... route mounting
// ... error handling
// ... database connection and server startup
```

**Responsibilities:**
- Server initialization and configuration
- Security middleware setup (CORS, Helmet, sanitization)
- Route mounting and API versioning
- Global error handling
- Database connection management
- Server startup and port binding

#### **`package.json` - Project Configuration**
```json
{
  "name": "visualeyes",
  "type": "module",           // ES6 modules enabled
  "main": "index.js",
  "scripts": {
    "start": "nodemon index.js",  // Development with auto-reload
    "dev": "nodemon index.js"     // Development alias
  }
}
```

**Key Features:**
- ES6 module support (`"type": "module"`)
- Development scripts with auto-reload
- Production-ready dependency management
- Security-focused package selection

### **Source Code Organization (`src/`)**

#### **1. Utils Directory (`src/Utils/`) - Shared Utilities**

```
src/Utils/
├── Auth/tokenUtils.js          # JWT token operations
├── Mail/verifyEmailTemplate.js # Email template generation
└── response/responseHandler.js # API response standardization
```

**Purpose & Design:**
- **Reusability**: Functions used across multiple modules
- **Consistency**: Standardized operations (responses, tokens, emails)
- **Maintainability**: Single source of truth for common operations
- **Testing**: Easy to unit test isolated utility functions

**Example Usage:**
```javascript
// tokenUtils.js
export const generateToken = (payload) => { ... };
export const verifyToken = (token) => { ... };

// responseHandler.js  
export const successResponse = (res, data, message) => { ... };
export const errorResponse = (res, error, statusCode) => { ... };
```

#### **2. Core Directory (`src/core/`) - System Foundation**

```
src/core/
├── config/                 # System configuration
│   ├── DB/connectDb.js    # Database connection
│   └── Email/             # Email service setup
└── controllers/           # Business logic
    └── Auth/              # Authentication controllers
```

**Design Philosophy:**
- **Separation of Concerns**: Configuration separate from business logic
- **Environment Awareness**: Different configs for dev/prod
- **Service Abstraction**: Database and email as services
- **Controller Pattern**: Business logic separated from routes

**Configuration Examples:**
```javascript
// connectDb.js
export default async function connectDB() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('MongoDB connected successfully');
  } catch (error) {
    console.error('Database connection failed:', error);
    process.exit(1);
  }
}
```

#### **3. Models Directory (`src/models/`) - Data Layer**

```
src/models/Auth/
├── Customer.js             # Customer business entity
└── User.js                # User/Staff entity
```

**Schema Design Patterns:**
- **Validation-Heavy**: Extensive field validation
- **Business Logic Integration**: Computed fields and methods
- **Relationship Modeling**: Proper references between entities
- **Security**: Sensitive fields marked with `select: false`

**Advanced Features:**
```javascript
// User.js - Dynamic permissions based on user type
permissions: {
  canCreateUsers: {
    type: Boolean,
    default: function() {
      return ['superadmin', 'subadmin', 'supervisor'].includes(this.userType);
    }
  }
}

// Customer.js - Business validation
gstNumber: {
  type: String,
  match: [/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/, 'Invalid GST format']
}
```

#### **4. Middlewares Directory (`src/middlewares/`) - Security Layer**

```
src/middlewares/Auth/
├── AdminMiddleware/adminMiddleware.js         # Admin-specific checks
└── CustomerMiddleware/customerMiddleware.js   # Customer-specific checks
```

**Middleware Responsibilities:**
- **Authentication**: Token validation and user identification
- **Authorization**: Role-based access control
- **Request Validation**: Input sanitization and validation
- **Rate Limiting**: API abuse prevention
- **Audit Logging**: Request tracking and logging

**Implementation Pattern:**
```javascript
// adminMiddleware.js
export const requireAdmin = (req, res, next) => {
  // 1. Verify JWT token
  // 2. Check user type/role
  // 3. Validate permissions
  // 4. Attach user to request
  // 5. Call next() or return error
};
```

#### **5. Routes Directory (`src/routes/`) - API Layer**

```
src/routes/Auth/
├── CustomerAuth.js         # Customer API endpoints
└── UserAuth.js            # User/Staff API endpoints
```

**Route Organization:**
- **Feature-Based**: Routes grouped by business domain
- **RESTful Design**: Standard HTTP methods and patterns
- **Middleware Integration**: Authentication and validation
- **Version Control**: Ready for API versioning

**Route Structure Example:**
```javascript
// CustomerAuth.js
import express from 'express';
import { register, login, getProfile } from '../../core/controllers/Auth/Customers/CustomerAuth.js';
import { authenticateCustomer } from '../../middlewares/Auth/CustomerMiddleware/customerMiddleware.js';

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.get('/profile', authenticateCustomer, getProfile);

export default router;
```

## 🔄 Data Flow Architecture

### **Request Processing Flow**
```
1. Client Request
   ↓
2. Express Server (index.js)
   ↓
3. Security Middleware (helmet, cors, sanitization)
   ↓
4. Route Matching (src/routes/)
   ↓
5. Authentication Middleware (src/middlewares/)
   ↓
6. Controller Logic (src/core/controllers/)
   ↓
7. Model Operations (src/models/)
   ↓
8. Database (MongoDB)
   ↓
9. Response Formatting (src/Utils/response/)
   ↓
10. Client Response
```

### **Authentication Flow**
```
User/Customer Login Request
   ↓
Route Handler (UserAuth.js/CustomerAuth.js)
   ↓
Controller (UserAuth.js/CustomerAuth.js)
   ↓
Model Validation (User.js/Customer.js)
   ↓
Password Verification (bcryptjs)
   ↓
Token Generation (tokenUtils.js)
   ↓
Response (responseHandler.js)
```

## 🚀 Scalability Features

### **1. Modular Design Benefits**
- **Team Collaboration**: Multiple developers can work on different modules
- **Feature Isolation**: Changes in one module don't affect others
- **Testing**: Easy to unit test individual components
- **Deployment**: Potential for microservices architecture

### **2. Configuration Management**
- **Environment-Based**: Different configs for different environments
- **Externalized**: Sensitive data in environment variables
- **Service-Oriented**: Database, email, etc., as configurable services

### **3. Security Architecture**
- **Layered Security**: Multiple security layers (middleware, validation, sanitization)
- **Role-Based Access**: Hierarchical permission system
- **Token-Based Auth**: Stateless authentication for horizontal scaling

### **4. Future Expansion Ready**
```
Planned Structure Expansion:
src/
├── modules/              # Feature modules (Orders, Inventory, etc.)
├── services/            # External service integrations
├── jobs/                # Background job processing
├── websockets/          # Real-time communication
├── tests/               # Test suites
└── migrations/          # Database migrations
```

## 📋 Development Guidelines

### **File Naming Conventions**
- **PascalCase**: Model files (User.js, Customer.js)
- **camelCase**: Utility files (tokenUtils.js, responseHandler.js)
- **kebab-case**: Configuration files (connect-db.js) - if needed
- **Descriptive Names**: Clear purpose indication

### **Import/Export Patterns**
```javascript
// ES6 modules with named exports
export const functionName = () => { ... };
export default ClassName;

// Import patterns
import express from 'express';
import { functionName } from './utils/helpers.js';
import Model from './models/Model.js';
```

### **Directory Expansion Rules**
1. **Feature-First**: Group by business domain, not technical layer
2. **Consistent Depth**: Avoid deeply nested directories (max 3-4 levels)
3. **Clear Separation**: Keep models, controllers, routes, and middleware separate
4. **Shared Resources**: Common utilities in Utils directory

This folder structure provides a solid foundation for a scalable, maintainable ERP system while following modern Node.js development best practices.