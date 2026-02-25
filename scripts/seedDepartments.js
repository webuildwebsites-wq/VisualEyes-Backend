import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Department from '../src/models/Auth/Department.js';
import employeeSchema from '../src/models/Auth/Employee.js';

dotenv.config();

const departmentsData = [
  {
    name: 'ACCOUNT & FINANCE',
    code: 'ACC_FIN',
    description: 'Handles accounting, finance, and credit management',
    subRoles: [
      {
        name: 'New Account Creation',
        code: 'NEW_ACC',
        description: 'Create and manage new customer accounts',
        isActive: true
      },
      {
        name: 'Credit Note',
        code: 'CREDIT_NOTE',
        description: 'Manage credit notes and adjustments',
        isActive: true
      },
      {
        name: 'Receipts',
        code: 'RECEIPTS',
        description: 'Handle payment receipts and processing',
        isActive: true
      }
    ]
  },
  {
    name: 'LAB',
    code: 'LAB',
    description: 'Laboratory operations and quality control',
    subRoles: [
      {
        name: 'Surfacing',
        code: 'SURFACING',
        description: 'Lens surfacing operations',
        isActive: true
      },
      {
        name: 'Q1',
        code: 'Q1',
        description: 'Quality check stage 1',
        isActive: true
      },
      {
        name: 'Tint',
        code: 'TINT',
        description: 'Lens tinting operations',
        isActive: true
      },
      {
        name: 'Hardcoat',
        code: 'HARDCOAT',
        description: 'Hardcoat application',
        isActive: true
      },
      {
        name: 'HMC',
        code: 'HMC',
        description: 'Hard Multi Coating operations',
        isActive: true
      },
      {
        name: 'FQC + Fitting QC',
        code: 'FQC_FITTING',
        description: 'Final quality control and fitting quality check',
        isActive: true
      },
      {
        name: 'Fitting',
        code: 'FITTING',
        description: 'Lens fitting operations',
        isActive: true
      }
    ]
  },
  {
    name: 'DISPATCH',
    code: 'DISPATCH',
    description: 'Order dispatch and logistics',
    subRoles: [
      {
        name: 'Challan Creation & Print',
        code: 'CHALLAN',
        description: 'Create and print delivery challans',
        isActive: true
      },
      {
        name: 'Card Print',
        code: 'CARD_PRINT',
        description: 'Print customer cards',
        isActive: true
      },
      {
        name: 'Address Label',
        code: 'ADDRESS_LABEL',
        description: 'Generate and print address labels',
        isActive: true
      },
      {
        name: 'Orders Report Access',
        code: 'ORDERS_REPORT',
        description: 'Access to orders reports',
        isActive: true
      },
      {
        name: 'Invoice Excel',
        code: 'INVOICE_EXCEL',
        description: 'Generate invoice Excel reports',
        isActive: true
      }
    ]
  },
  {
    name: 'SALES',
    code: 'SALES',
    description: 'Sales operations and customer management',
    subRoles: []
  },
  {
    name: 'STORE',
    code: 'STORE',
    description: 'Inventory and store management',
    subRoles: []
  },
  {
    name: 'CUSTOMER SUPPORT TEAM',
    code: 'CST',
    description: 'Customer support and service',
    subRoles: []
  }
];

const seedDepartments = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    // Find SuperAdmin to use as createdBy
    const superAdmin = await employeeSchema.findOne({ EmployeeType: 'SUPERADMIN' });
    
    if (!superAdmin) {
      console.error('SuperAdmin not found. Please create a SuperAdmin first.');
      process.exit(1);
    }

    console.log('Found SuperAdmin:', superAdmin.employeeName);

    // Clear existing departments
    await Department.deleteMany({});
    console.log('Cleared existing departments');

    // Create departments with sub-roles
    for (const deptData of departmentsData) {
      const department = await Department.create({
        ...deptData,
        createdBy: superAdmin._id
      });
      console.log(`Created department: ${department.name} with ${department.subRoles.length} sub-roles`);
    }

    console.log('\n✅ Departments seeded successfully!');
    console.log('\nDepartments created:');
    const departments = await Department.find({});
    departments.forEach(dept => {
      console.log(`\n${dept.name} (${dept.code})`);
      if (dept.subRoles.length > 0) {
        console.log('  Sub-roles:');
        dept.subRoles.forEach(sr => {
          console.log(`    - ${sr.name} (${sr.code})`);
        });
      } else {
        console.log('  Sub-roles: (To be added later)');
      }
    });

    process.exit(0);
  } catch (error) {
    console.error('Error seeding departments:', error);
    process.exit(1);
  }
};

seedDepartments();
