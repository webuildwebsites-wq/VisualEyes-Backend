import mongoose from 'mongoose';
import dotenv from 'dotenv';
import SystemConfig from '../src/models/Auth/SystemConfig.js';

dotenv.config();

const updateEmployeeTypeOrder = async () => {
  try {
    console.log('Connected to MongoDB');

    const config = await SystemConfig.findOne({ configType: 'EmployeeType' });
    
    if (!config) {
      console.log('EmployeeType configuration not found');
      process.exit(1);
    }

    console.log('Current order:', config.values);

    // Update to the correct order
    config.values = ['SUPERADMIN', 'ADMIN', 'SUPERVISOR', 'TEAMLEAD', 'EMPLOYEE'];
    
    await config.save();

    console.log('Updated order:', config.values);
    console.log('✓ EmployeeType order updated successfully!');

    process.exit(0);
  } catch (error) {
    console.error('Update error:', error);
    process.exit(1);
  }
};

updateEmployeeTypeOrder();
