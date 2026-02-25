import mongoose from 'mongoose';
import dotenv from 'dotenv';
import employeeSchema from '../src/models/Auth/Employee.js';

dotenv.config();

const setupProject = async () => {
  try {
    console.log('Starting VisualEyes ERP Setup...\n');

    await mongoose.connect(process.env.MONGODB_URL);
    console.log('Connected to database');

    const existingSuperAdmin = await employeeSchema.findOne({ EmployeeType: 'SUPERADMIN' });

    // Create default superadmin details
    const superAdminData = {
      username: 'superadmin',
      employeeName: 'Anish Singh Rawat',
      email: 'anishsinghrawat5@gmail.com',
      password: 'anishsinghrawat5@gmail.com',
      phone: '6395607666',
      address: 'Admin Address, Admin City, Admin State',
      country: 'India',
      pincode: '123456',
      EmployeeType: 'SUPERADMIN',
      Department: {
        name: 'SUPERADMIN',
        refId: null
      },
      isActive: true,
      profile: {
        dateOfJoining: new Date()
      },
      permissions: {
        CanCreateEmployee: true,
        CanManageEmployee: true,
        CanManageDepartments: true,
        CanManageAllDepartments: true,
        CanCreateOrders: true,
        CanUpdateOrders: true,
        CanViewOrders: true,
        CanDeleteOrders: true,
        CanProcessWorkflow: true,
        CanApproveWorkflow: true,
        CanCreateCustomers: true,
        CanManageCustomers: true,
        CanManageProducts: true,
        CanViewFinancials: true,
        CanManageFinancials: true,
        CanManageSettings: true,
        CanViewReports: true,
        CanExportReports: true
      }
    };

    const superAdmin = new employeeSchema(superAdminData);
    await superAdmin.save();

    console.log('\n✓ Project setup completed successfully!');
    console.log('\nSuperAdmin Account Created:');
    console.log('Username:', superAdmin.username);
    console.log('Email:', superAdmin.email);
    console.log('Full Name:', superAdmin.employeeName);
    console.log('Phone:', superAdmin.phone);
    console.log('Password: anish@2026');

  } catch (error) {
    console.error('Setup failed:', error);
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      console.error('Validation errors:', messages.join(', '));
    }

    if (error.code === 11000) {
      console.error('✗ Duplicate key error: Employee with this email or username already exists');
    }
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('Database connection closed');
  }
};

setupProject();