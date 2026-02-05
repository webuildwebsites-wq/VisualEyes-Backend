import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../src/models/Auth/User.js';
import connectDB from '../src/core/config/DB/connectDb.js';

dotenv.config();

const setupProject = async () => {
  try {
    console.log('Starting VisualEyes ERP Setup...\n');

    await connectDB();
    console.log('Connected to database');

    const existingSuperAdmin = await User.findOne({ userType: 'superadmin' });

    if (existingSuperAdmin) {
      console.log('SuperAdmin already exists in the system');
      console.log('Email:', existingSuperAdmin.email);
      console.log('Username:', existingSuperAdmin.username);
      return;
    }

    // Create default superadmin details
    const superAdminData = {
      username: 'anish',
      email: 'anishsinghrawat5@gmail.com',
      password: 'anish@2026',
      firstName: 'Anish',
      lastName: 'Singh Rawat',
      phone: '6395607666',
      employeeId: 'SA001',
      userType: 'superadmin',
      isActive: true,
      profile: {
        dateOfJoining: new Date(),
        address: {
          street: 'Admin Address',
          city: 'Admin City',
          state: 'Admin State',
          pincode: '123456'
        }
      },
      permissions: {
        canCreateUsers: true,
        canManageUsers: true,
        canManageDepartments: true,
        canCreateOrders: true,
        canUpdateOrders: true,
        canViewOrders: true,
        canDeleteOrders: true,
        canProcessWorkflow: true,
        canApproveWorkflow: true,
        canCreateCustomers: true,
        canManageCustomers: true,
        canManageProducts: true,
        canViewFinancials: true,
        canManageFinancials: true,
        canManageSettings: true,
        canViewReports: true,
        canExportReports: true
      }
    };

    const superAdmin = new User(superAdminData);
    await superAdmin.save();

    console.log('Project setup completed successfully!');
    console.log('SuperAdmin Account Created:');
    console.log('mail:', superAdmin.email);
    console.log('sername:', superAdmin.username);
    console.log('mployee ID:', superAdmin.employeeId);
    console.log('hone:', superAdmin.phone);
    console.log('assword: anish@2026');

  } catch (error) {
    console.error('Setup failed:', error);
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      console.error('Validation errors:', messages.join(', '));
    }

    if (error.code === 11000) {
      console.error('Duplicate key error: User with this email, username, or employee ID already exists');
    }
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('Database connection closed');
  }
};

setupProject();