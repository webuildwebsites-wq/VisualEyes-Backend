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
      UserType: 'SUPERADMIN',
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
        CanCreateUsers: true,
        CanManageUsers: true,
        CanManageDepartments: true,
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
      console.error('Duplicate key error: Employee with this email, username, or employee ID already exists');
    }
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('Database connection closed');
  }
};

setupProject();