# Lens Manufacturing & Order Management ERP System

A comprehensive Enterprise Resource Planning (ERP) system designed specifically for lens manufacturing companies with **simplified 2-schema authentication** - one for platform users (SuperAdmin, SubAdmin, Supervisors, Users) and one for customers (retailers/end customers).

## 🏗️ System Architecture

### Simplified Authentication Structure
```
User Schema (All Platform Users)
├── SuperAdmin (Global access)
├── SubAdmin (Multi-department access)
├── Supervisor (Department + Region specific)
└── User (Role-based department access)

Customer Schema (External Users)
└── Customers (Retailers, Distributors, End Customers)
```

### Hierarchical Structure
```
Super Admin (Single User)
├── Sub Admin (Multiple)
    ├── Department: Lab
    │   ├── Region: North → Supervisor → Users
    │   ├── Region: South → Supervisor → Users
    │   ├── Region: East → Supervisor → Users
    │   └── Region: West → Supervisor → Users
    ├── Department: Store
    ├── Department: Dispatch
    ├── Department: Sales
    ├── Department: Finance
    └── Department: Customer Support
```

### Lab Production Workflow (Sequential & Mandatory)
```
Order → Job Card Print → Pick Ticket → Assign Tray → Production → 
Surfacing → Tint → Hardcoat → ARC → Quality Check → Fitting → 
Final QC → Dispatch
```

## 🚀 Features

### Core Features
- **Hierarchical Role-Based Access Control (RBAC)**
- **Regional Department Management** (North, South, East, West)
- **Sequential Lab Production Workflow** with mandatory steps
- **Complete Audit Trail** and order tracking
- **Customer Credit Management** and verification
- **Real-time Inventory** and production monitoring
- **Quality Control** with configurable parameters
- **Dispatch Management** with delivery tracking

### Security Features
- JWT-based authentication with refresh tokens
- Password encryption with bcrypt
- Rate limiting for API endpoints
- Input sanitization and XSS protection
- Account lockout after failed login attempts
- Comprehensive audit logging

### Business Features
- **Master Data Management**: Products, Suppliers, Customers
- **Order Lifecycle Management**: From creation to delivery
- **Workflow Management**: Step-by-step production tracking
- **Financial Management**: Credit limits, pricing, GST calculations
- **Reporting System**: Real-time dashboards and analytics
- **Notification System**: Real-time alerts and updates

## 🛠️ Technology Stack

- **Backend**: Node.js, Express.js
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT with role-based permissions
- **Security**: Helmet, XSS protection, rate limiting
- **Architecture**: RESTful API with modular structure

## 📋 Prerequisites

- Node.js (v18 or higher)
- MongoDB (v5.0 or higher)
- npm or yarn package manager

## 🔧 Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd lens-manufacturing-erp
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   ```
   Edit the `.env` file with your configuration:
   - MongoDB connection string
   - JWT secrets
   - Email configuration (for password reset)
   - Other environment-specific settings

4. **Start MongoDB**
   Make sure MongoDB is running on your system.

5. **Run the application**
   ```bash
   # Development mode
   npm run dev
   
   # Production mode
   npm start
   ```

## 📚 API Documentation

### Base URL
```
http://localhost:8080/api/v1
```

### Authentication Endpoints

#### User/Platform Login
```http
POST /auth/login
Content-Type: application/json

{
  "username": "superadmin",
  "password": "Admin@123",
  "accountType": "user"
}
```

#### Customer Login
```http
POST /auth/login
Content-Type: application/json

{
  "username": "customer@example.com",
  "password": "password123",
  "accountType": "customer"
}
```

#### Customer Registration (Self-Registration)
```http
POST /auth/register-customer
Content-Type: application/json

{
  "email": "customer@example.com",
  "password": "password123",
  "shopName": "Vision Optical Store",
  "ownerName": "John Doe",
  "phone": "9876543210",
  "address": {
    "street": "123 Main Street",
    "city": "Mumbai",
    "state": "Maharashtra",
    "pincode": "400001"
  },
  "gstNumber": "27ABCDE1234F1Z5",
  "region": "West"
}
```

#### Get Current User
```http
GET /auth/me
Authorization: Bearer <token>
```

#### Refresh Token
```http
POST /auth/refresh
Content-Type: application/json

{
  "refreshToken": "<refresh_token>"
}
```

### User Management Endpoints
- `GET /users` - Get all users (with pagination and filters)
- `POST /users` - Create new user
- `GET /users/:id` - Get user by ID
- `PUT /users/:id` - Update user
- `DELETE /users/:id` - Deactivate user

### Order Management Endpoints
- `GET /orders` - Get all orders (with filters)
- `POST /orders` - Create new order
- `GET /orders/:id` - Get order details
- `PUT /orders/:id` - Update order
- `POST /orders/:id/workflow/:step` - Process workflow step

## 🗄️ Database Schema

### Simplified 2-Schema Authentication
- **User Schema**: All platform users (SuperAdmin, SubAdmin, Supervisors, Users) with hierarchical permissions
- **Customer Schema**: External customers (Retailers, Distributors) with business information and credit management

### Core Collections
- **User**: Platform users with role-based hierarchy and permissions
- **Customer**: External customers with business details and verification status
- **Order**: Customer orders with complete lifecycle tracking
- **OrderWorkflow**: Production workflow step-by-step tracking
- **Product**: Lens products and specifications
- **Supplier**: Product suppliers and vendor management

## 🔐 Role-Permission Matrix

| Permission | Super Admin | Sub Admin | Supervisor | User |
|------------|-------------|-----------|------------|------|
| User Management | ✅ | ✅ | ✅* | ❌ |
| Order Management | ✅ | ✅ | ✅* | ✅* |
| Workflow Processing | ✅ | ✅ | ✅* | ✅* |
| Financial Management | ✅ | ✅ | ❌ | ❌ |
| System Settings | ✅ | ✅ | ❌ | ❌ |

*✅ = Full Access, ❌ = No Access, ✅* = Restricted Access (department/region specific)*

## 🔄 Workflow Logic

### Order Creation Flow
1. **Order Validation**: Customer verification, credit check, product availability
2. **Lab Assignment**: Automatic assignment based on customer mapping and capacity
3. **Production Queue**: Order enters sequential workflow

### Production Workflow Rules
- **Sequential Processing**: No step can be skipped
- **Quality Control**: Each step has configurable quality parameters
- **Rework Logic**: Failed steps return to previous step
- **Rejection Logic**: Rejected items return to store for new base

### Status Management
- **Order Status**: Pending → In Production → Completed → Dispatched → Delivered
- **Sub Status**: Tracks current workflow step
- **Priority Levels**: Normal, High, Urgent (affects delivery timelines)

## 📊 Reporting & Analytics

### Dashboard Metrics
- Total orders and revenue
- Department-wise performance
- Quality control statistics
- Delivery performance
- Customer satisfaction metrics

### Available Reports
- Order reports (by date, status, customer)
- Production reports (efficiency, quality)
- Financial reports (revenue, outstanding)
- Customer reports (activity, credit status)

## 🔧 Configuration

### Environment Variables
```env
# Server
NODE_ENV=development
PORT=8080

# Database
MONGODB_URI=mongodb://localhost:27017/lens-erp

# JWT
JWT_SECRET=your-secret-key
JWT_EXPIRE=24h
JWT_REFRESH_SECRET=your-refresh-secret
JWT_REFRESH_EXPIRE=7d

# Security
BCRYPT_ROUNDS=12
RATE_LIMIT_MAX=100
```

### Default System Settings
- **Credit Rules**: Configurable credit limits and terms
- **Quality Parameters**: Customizable quality standards
- **Workflow Steps**: Configurable production steps
- **Notification Rules**: Automated alert configurations

## 🚀 Deployment

### Production Deployment
1. Set `NODE_ENV=production` in environment variables
2. Use a process manager like PM2
3. Set up reverse proxy with Nginx
4. Configure SSL certificates
5. Set up database backups
6. Configure monitoring and logging

### Docker Deployment
```dockerfile
# Dockerfile example
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 8080
CMD ["npm", "start"]
```

## 🧪 Testing

```bash
# Run tests
npm test

# Run tests with coverage
npm run test:coverage

# Run integration tests
npm run test:integration
```

## 📝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the ISC License - see the LICENSE file for details.

## 🆘 Support

For support and questions:
- Create an issue in the repository
- Contact the development team
- Check the documentation in the `/docs` folder

## 🗺️ Roadmap

### Phase 1 (Current)
- ✅ Core authentication and authorization
- ✅ User management system
- ✅ Basic order management
- ✅ Workflow tracking

### Phase 2 (Upcoming)
- [ ] Advanced reporting and analytics
- [ ] Mobile application support
- [ ] Integration with external systems
- [ ] Advanced quality control features

### Phase 3 (Future)
- [ ] AI-powered demand forecasting
- [ ] IoT integration for production monitoring
- [ ] Advanced customer portal
- [ ] Multi-language support

---

**Built with ❤️ for the lens manufacturing industry**