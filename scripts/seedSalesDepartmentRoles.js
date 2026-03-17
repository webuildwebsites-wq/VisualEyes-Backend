import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Department from '../src/models/Auth/Department.js';

dotenv.config();

const seedSalesDepartmentRoles = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URL);
    console.log('Connected to MongoDB');

    // Find the SALES department
    const salesDept = await Department.findOne({ code: 'SALES' });
    
    if (!salesDept) {
      console.error('SALES department not found. Please run seedDepartments.js first.');
      process.exit(1);
    }

    console.log('Found SALES department');

    // Define the roles for Sales department
    const salesRoles = [
      {
        name: 'Sales Head',
        code: 'SALES_HEAD',
        description: 'Most senior role - overall sales department leadership',
        isActive: true
      },
      {
        name: 'Regional Head',
        code: 'REGIONAL_HEAD',
        description: 'Second most senior role - manages regional operations',
        isActive: true
      },
     {
        name: 'Cluster Head',
        code: 'CLUSTER_HEAD',
        description: 'Third senior role - manages cluster of sales executives',
        isActive: true
      },
      {
        name: 'Sales Executive',
        code: 'SALES_EXECUTIVE',
        description: 'Most junior role - handles day-to-day sales activities',
        isActive: true
      },
    ];

    // Clear existing sub-roles and add new ones
    salesDept.subRoles = salesRoles;
    await salesDept.save();

    console.log('\n✅ Sales department roles seeded successfully!');
    console.log('\nSales Department Roles (Hierarchy - Junior to Senior):');
    console.log('1. Sales Executive (Most Junior)');
    console.log('2. Cluster Head (Third Senior)');
    console.log('3. Regional Head (Second Most Senior)');
    console.log('4. Sales Head (Most Senior)');

    process.exit(0);
  } catch (error) {
    console.error('Error seeding sales department roles:', error);
    process.exit(1);
  }
};

seedSalesDepartmentRoles();
