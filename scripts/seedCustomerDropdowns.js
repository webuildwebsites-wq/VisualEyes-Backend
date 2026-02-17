import mongoose from 'mongoose';
import dotenv from 'dotenv';
import CustomerType from '../src/models/Product/CustomerType.js';
import OrderMode from '../src/models/Product/OrderMode.js';
import GSTType from '../src/models/Product/GSTType.js';
import Plant from '../src/models/Product/Plant.js';
import Lab from '../src/models/Product/Lab.js';
import FittingCenter from '../src/models/Product/FittingCenter.js';
import CreditDay from '../src/models/Product/CreditDay.js';
import CourierName from '../src/models/Product/CourierName.js';
import CourierTime from '../src/models/Product/CourierTime.js';
import SpecialCase from '../src/models/Product/SpecialCase.js';
import State from '../src/models/Product/State.js';
import Country from '../src/models/Product/Country.js';
import BillingCurrency from '../src/models/Product/BillingCurrency.js';
import SpecificLab from '../src/models/Product/SpecificLab.js';
import employeeSchema from '../src/models/Auth/Employee.js';

dotenv.config();

const seedData = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Find a super admin to use as createdBy
    const superAdmin = await employeeSchema.findOne({ UserType: 'SUPERADMIN' });
    if (!superAdmin) {
      console.error('No SUPERADMIN found. Please create a super admin first.');
      process.exit(1);
    }

    const createdBy = superAdmin._id;

    // Customer Types
    const customerTypes = [
      'Retailer',
      'Corporate Eye Hospital',
      'Distributor',
      'Wholesaler',
      'Dr. Agarwal EH',
      'Eye Clinic',
      'Retail Chain',
      'OEM'
    ];

    console.log('Seeding Customer Types...');
    for (const name of customerTypes) {
      await CustomerType.findOneAndUpdate(
        { name },
        { name, createdBy, isActive: true },
        { upsert: true, new: true }
      );
    }
    console.log(`✓ ${customerTypes.length} Customer Types seeded`);

    // Order Modes
    const orderModes = ['Online', 'Offline'];

    console.log('Seeding Order Modes...');
    for (const name of orderModes) {
      await OrderMode.findOneAndUpdate(
        { name },
        { name, createdBy, isActive: true },
        { upsert: true, new: true }
      );
    }
    console.log(`✓ ${orderModes.length} Order Modes seeded`);

    // GST Types
    const gstTypes = ['Regular', 'Composition', 'Unregistered', 'Consumer'];

    console.log('Seeding GST Types...');
    for (const name of gstTypes) {
      await GSTType.findOneAndUpdate(
        { name },
        { name, createdBy, isActive: true },
        { upsert: true, new: true }
      );
    }
    console.log(`✓ ${gstTypes.length} GST Types seeded`);

    // Plants
    const plants = [
      'VisualEyes Optik Technologies',
      'VisualEyes Rx Labs LLP'
    ];

    console.log('Seeding Plants...');
    for (const name of plants) {
      await Plant.findOneAndUpdate(
        { name },
        { name, createdBy, isActive: true },
        { upsert: true, new: true }
      );
    }
    console.log(`✓ ${plants.length} Plants seeded`);

    // Labs
    const labs = ['100', '101'];

    console.log('Seeding Labs...');
    for (const name of labs) {
      await Lab.findOneAndUpdate(
        { name },
        { name, createdBy, isActive: true },
        { upsert: true, new: true }
      );
    }
    console.log(`✓ ${labs.length} Labs seeded`);

    // Fitting Centers
    const fittingCenters = [
      'VisualEyes-Optik Technologies',
      'VisualEyes Rx Labs LLP'
    ];

    console.log('Seeding Fitting Centers...');
    for (const name of fittingCenters) {
      await FittingCenter.findOneAndUpdate(
        { name },
        { name, createdBy, isActive: true },
        { upsert: true, new: true }
      );
    }
    console.log(`✓ ${fittingCenters.length} Fitting Centers seeded`);

    // Credit Days
    const creditDays = [0, 30, 45, 60, 90, 120, 150];

    console.log('Seeding Credit Days...');
    for (const days of creditDays) {
      await CreditDay.findOneAndUpdate(
        { days },
        { days, createdBy, isActive: true },
        { upsert: true, new: true }
      );
    }
    console.log(`✓ ${creditDays.length} Credit Days seeded`);

    // Courier Names
    const courierNames = [
      'Jagdish',
      'SJ courier',
      'Verma Courier',
      'Bluedart',
      'Shyam',
      'Shree Raj Courier',
      'Tanveer',
      'Naveen',
      'Rahul Rao',
      'Chanchal',
      'Kamal',
      'Hari Ram',
      'Deepak',
      'Anjani Courier',
      'Trackon Courier',
      'Office'
    ];

    console.log('Seeding Courier Names...');
    for (const name of courierNames) {
      await CourierName.findOneAndUpdate(
        { name },
        { name, createdBy, isActive: true },
        { upsert: true, new: true }
      );
    }
    console.log(`✓ ${courierNames.length} Courier Names seeded`);

    // Courier Times
    const courierTimes = [
      { location: 'Delhi/NCR', time: '14:00PM' },
      { location: 'Delhi/NCR', time: '6:00PM' },
      { location: 'Delhi/NCR', time: '8:00PM' },
      { location: 'Delhi/NCR', time: '3:00AM' },
      { location: 'Delhi/NCR2', time: '3:00AM' },
      { location: 'Delhi/NCR2', time: '4:00PM' },
      { location: 'Delhi/NCR2', time: '6:00PM' },
      { location: 'Delhi/NCR2', time: '8:00PM' }
    ];

    console.log('Seeding Courier Times...');
    for (const { location, time } of courierTimes) {
      await CourierTime.findOneAndUpdate(
        { location, time },
        { location, time, createdBy, isActive: true },
        { upsert: true, new: true }
      );
    }
    console.log(`✓ ${courierTimes.length} Courier Times seeded`);

    // Special Cases
    const specialCases = [
      'Special Case index',
      'Special Case Tinting',
      'Special Case Fitting'
    ];

    console.log('Seeding Special Cases...');
    for (const name of specialCases) {
      await SpecialCase.findOneAndUpdate(
        { name },
        { name, createdBy, isActive: true },
        { upsert: true, new: true }
      );
    }
    console.log(`✓ ${specialCases.length} Special Cases seeded`);

    // States
    const states = [
      'Jammu & Kashmir',
      'Himachal Pradesh',
      'Punjab',
      'Chandigarh',
      'Uttarakhand',
      'Haryaana',
      'Delhi',
      'Rajasthan',
      'Uttar pradesh',
      'Bihar',
      'Sikkim',
      'Arunachal Pradesh',
      'Nagaland',
      'Manipur',
      'Mizoram',
      'Tripura',
      'Meghalaya',
      'Assam',
      'West Bengal',
      'Jharkhand',
      'Odisha',
      'Chhattisgarh',
      'Madhya Pradesh',
      'Gujarat',
      'Damman & Diu',
      'Dadra & Nagar Haveli',
      'Maharashtra',
      'Karnataka',
      'Goa',
      'Lakshdeep',
      'Kerala',
      'Tamil Nadu',
      'Puducherry',
      'Andaman & Nicobar Islands',
      'Telangana',
      'Andhra Pradesh',
      'Ladakh',
      'Others'
    ];

    console.log('Seeding States...');
    for (const name of states) {
      await State.findOneAndUpdate(
        { name },
        { name, createdBy, isActive: true },
        { upsert: true, new: true }
      );
    }
    console.log(`✓ ${states.length} States seeded`);

    // Countries
    const countries = ['India', 'Other'];

    console.log('Seeding Countries...');
    for (const name of countries) {
      await Country.findOneAndUpdate(
        { name },
        { name, createdBy, isActive: true },
        { upsert: true, new: true }
      );
    }
    console.log(`✓ ${countries.length} Countries seeded`);

    // Billing Currencies
    const billingCurrencies = ['Indian Rupees', 'USD'];

    console.log('Seeding Billing Currencies...');
    for (const name of billingCurrencies) {
      await BillingCurrency.findOneAndUpdate(
        { name },
        { name, createdBy, isActive: true },
        { upsert: true, new: true }
      );
    }
    console.log(`✓ ${billingCurrencies.length} Billing Currencies seeded`);

    // Specific Labs
    const specificLabs = [
      'KOLKATA STOCK',
      'STOCK ORDER',
      'VISUAL EYES LAB',
      'VE AHMEDABAD LAB',
      'VE CHENNAI LAB',
      'VE KOCHI LAB',
      'VE GURGAON LAB',
      'VE HYDERBAD LAB',
      'VE KOLKATTA LAB',
      'VE MUMBAI LAB',
      'VE TRIVANDRUM LAB',
      'SERVICE',
      'VE GLASS ORDER',
      'VE PUNE LAB',
      'VE NAGPUR LAB',
      'VE BENGALURU LAB'
    ];

    console.log('Seeding Specific Labs...');
    for (const name of specificLabs) {
      await SpecificLab.findOneAndUpdate(
        { name },
        { name, createdBy, isActive: true },
        { upsert: true, new: true }
      );
    }
    console.log(`✓ ${specificLabs.length} Specific Labs seeded`);

    console.log('\n✅ All customer dropdown data seeded successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding data:', error);
    process.exit(1);
  }
};

seedData();
