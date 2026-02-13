import mongoose from 'mongoose';
import dotenv from 'dotenv';
import employeeSchema from '../src/models/Auth/Employee.js';
import connectDB from '../src/core/config/DB/connectDb.js';

dotenv.config();

const setupProject = async () => {
  try {
    console.log('Starting VisualEyes ERP Setup...\n');

    await connectDB();
    console.log('Connected to database');

    const existingSuperAdmin = await employeeSchema.findOne({ UserType: 'SUPERADMIN' });

    if (existingSuperAdmin) {
      console.log('\n✓ SuperAdmin already exists in the system');
      console.log('Email:', existingSuperAdmin.email);
      console.log('Username:', existingSuperAdmin.username);
      return;
    }

    // Create default superadmin details
    const superAdminData = {
      username: 'anish',
      email: 'anishsinghrawat5@gmail.com',
      password: 'anish@2026',
      phone: '6395607666',
      address: 'Admin Address, Admin City, Admin State',
      country: 'India',
      pincode: '123456',
      UserType: 'SUPERADMIN',
      isActive: true,
      profile: {
        dateOfJoining: new Date()
      },
      permissions: {
        CanCreateUsers: true,
        CanManageUsers: true,
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
    console.log('Email:', superAdmin.email);
    console.log('Username:', superAdmin.username);
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