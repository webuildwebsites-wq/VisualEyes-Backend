import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../src/models/Auth/User.js';
import connectDB from '../src/core/config/DB/connectDb.js';

dotenv.config();

const createSuperAdmin = async () => {
  try {
    // Connect to database
    await connectDB();
    console.log('Connected to database');

    // Check if superadmin already exists
    const existingSuperAdmin = await User.findOne({ 
      userType: 'superadmin',
      $or: [
        { email: 'anishsinghrawat5@gmail.com' },
        { username: 'anish' }
      ]
    });

    if (existingSuperAdmin) {
      console.log('SuperAdmin already exists with this email or username');
      process.exit(1);
    }

    // Create superadmin user
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

    console.log('✅ SuperAdmin created successfully!');
    console.log('📧 Email:', superAdmin.email);
    console.log('👤 Username:', superAdmin.username);
    console.log('🆔 Employee ID:', superAdmin.employeeId);
    console.log('📱 Phone:', superAdmin.phone);
    console.log('🔐 Password: anish@2026');
    console.log('\n🚀 You can now login with these credentials');

  } catch (error) {
    console.error('❌ Error creating SuperAdmin:', error);
    
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      console.error('Validation errors:', messages.join(', '));
    }
    
    if (error.code === 11000) {
      console.error('Duplicate key error: User with this email, username, or employee ID already exists');
    }
    
    process.exit(1);
  } finally {
    // Close database connection
    await mongoose.connection.close();
    console.log('Database connection closed');
  }
};

// Run the script
createSuperAdmin();