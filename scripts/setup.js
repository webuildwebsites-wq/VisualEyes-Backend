import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../src/models/Auth/User.js';
import connectDB from '../src/core/config/DB/connectDb.js';

dotenv.config();

const setupProject = async () => {
  try {
    console.log('🚀 Starting VisualEyes ERP Setup...\n');

    // Connect to database
    await connectDB();
    console.log('✅ Connected to database');

    // Check if any superadmin exists
    const existingSuperAdmin = await User.findOne({ userType: 'superadmin' });

    if (existingSuperAdmin) {
      console.log('⚠️  SuperAdmin already exists in the system');
      console.log('📧 Email:', existingSuperAdmin.email);
      console.log('👤 Username:', existingSuperAdmin.username);
      console.log('\n✅ Setup completed - System is ready to use!');
      return;
    }

    // Create default superadmin
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
      }
    };

    const superAdmin = new User(superAdminData);
    await superAdmin.save();

    console.log('\n🎉 Project setup completed successfully!');
    console.log('\n👤 SuperAdmin Account Created:');
    console.log('📧 Email:', superAdmin.email);
    console.log('👤 Username:', superAdmin.username);
    console.log('🆔 Employee ID:', superAdmin.employeeId);
    console.log('📱 Phone:', superAdmin.phone);
    console.log('🔐 Password: anish@2026');
    
    console.log('\n🚀 Next Steps:');
    console.log('1. Start the server: npm run dev');
    console.log('2. Login with the SuperAdmin credentials');
    console.log('3. Create SubAdmins and other users as needed');
    console.log('\n✅ VisualEyes ERP is ready to use!');

  } catch (error) {
    console.error('❌ Setup failed:', error);
    
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
    console.log('\n🔌 Database connection closed');
  }
};

setupProject();