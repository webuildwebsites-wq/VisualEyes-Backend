import mongoose from 'mongoose';
import dotenv from 'dotenv';
import SystemConfig from '../src/models/Auth/SystemConfig.js';
import Employee from '../src/models/Auth/Employee.js';

dotenv.config();

const seedData = {
  EmployeeType: ['SUPERADMIN', 'ADMIN', 'SUPERVISOR', 'EMPLOYEE'],
  
  Role: [
    'ADMIN',
    'BRANCH USER',
    'PRIORITY ORDER',
    'CUSTOMER',
    'ACCOUNTING MODULE',
    'SALES EXECUTIVE',
    'OTHER ADMIN',
    'STOCK POINT USER',
    'CUSTOMER CARE',
    'STORES',
    'PRODUCTION',
    'SUPERVISOR',
    'FITTING CENTER',
    'F&A',
    'DISTRIBUTOR',
    'DISPATCH',
    'STORES ADMIN',
    'BELOW ADMIN',
    'INVESTOR PROFILE',
    'AUDITOR',
    'CUSTOMER CARE (DB)',
    'BELOW ADMIN (FITTING CENTER)',
    'FITTING CENTER-V2',
    'DISPATCH-KOLKATTA',
    'SALES HEAD',
    'CUSTOM PROFILE',
    'F&A CFO'
  ],
  
  Department: [
    'LAB',
    'STORE',
    'DISPATCH',
    'SALES',
    'FINANCE',
    'CUSTOMER_SUPPORT'
  ],
  
  Lab: [
    'KOLKATA STOCK',
    'STOCK ORDER',
    'VISUAL EYES LAB',
    'VE AHMEDABAD LAB',
    'VE CHENNAI LAB',
    'VE KOCHI LAB',
    'VE GURGAON LAB',
    'VE MUMBAI LAB',
    'VE TRIVANDRUM LAB',
    'SERVICE',
    'VE GLASS ORDER',
    'VE PUNE LAB',
    'VE NAGPUR LAB',
    'VE BENGALURU LAB',
    'VE HYDERBAD LAB',
    'VE KOLKATTA LAB'
  ],

  Region: [
    'NORTH',
    'SOUTH',
    'EAST',
    'WEST',
    'CENTRAL'
  ]
};

const seedSystemConfig = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    const superAdmin = await Employee.findOne({ EmployeeType: 'SUPERADMIN' });
    
    if (!superAdmin) {
      console.log('No SUPERADMIN found. Please create a SUPERADMIN first.');
      process.exit(1);
    }

    console.log(`Using SUPERADMIN: ${superAdmin.employeeName} (${superAdmin._id})`);

    await SystemConfig.deleteMany({});
    console.log('Cleared existing system configurations');

    const configDocuments = Object.entries(seedData).map(([configType, values]) => ({
      configType,
      values,
      createdBy: superAdmin._id
    }));

    const result = await SystemConfig.insertMany(configDocuments);
    console.log(`Successfully seeded ${result.length} system configuration types`);

    console.log('\nSeeding Summary:');
    result.forEach(config => {
      console.log(`  ${config.configType}: ${config.values.length} values`);
    });

    process.exit(0);
  } catch (error) {
    console.error('Seeding error:', error);
    process.exit(1);
  }
};

seedSystemConfig();


