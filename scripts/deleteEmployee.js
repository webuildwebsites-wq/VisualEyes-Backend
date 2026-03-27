import mongoose from 'mongoose';
import dotenv from 'dotenv';
import employeeSchema from '../src/models/Auth/Employee.js';

dotenv.config();

const EMAIL = 'ruchica@digibysr.com';

const deleteEmployee = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URL);
    console.log('Connected to database');

    const result = await employeeSchema.findOneAndDelete({ email: EMAIL });

    if (!result) {
      console.log(`No employee found with email: ${EMAIL}`);
    } else {
      console.log(`✓ Employee deleted: ${result.employeeName} (${result.email})`);
    }
  } catch (error) {
    console.error('Delete failed:', error.message);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('Database connection closed');
  }
};

deleteEmployee();
