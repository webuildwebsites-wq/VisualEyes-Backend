import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Region from '../src/models/Location/Region.js';
import City from '../src/models/Location/City.js';
import Zone from '../src/models/Location/Zone.js';
import employeeSchema from '../src/models/Auth/Employee.js';

dotenv.config();

const seedLocations = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URL);
    console.log('✅ Connected to MongoDB');

    // Find SuperAdmin to use as createdBy
    const superAdmin = await employeeSchema.findOne({ 
      $or: [
        { 'EmployeeType.name': 'SUPERADMIN' },
        { 'EmployeeType.name': 'SUPERADMIN' }
      ]
    });

    if (!superAdmin) {
      console.log('❌ SuperAdmin not found. Please create SuperAdmin first.');
      process.exit(1);
    }

    console.log('✅ Found SuperAdmin:', superAdmin.employeeName);

    // Define location data structure
    const locationData = [
      {
        region: { name: 'NCR', code: 'NCR', description: 'National Capital Region' },
        cities: [
          {
            city: { name: 'Delhi', code: 'DEL', description: 'Delhi' },
            zones: [
              { name: 'North Delhi', code: 'NDEL', description: 'North Delhi Zone' },
              { name: 'South Delhi', code: 'SDEL', description: 'South Delhi Zone' },
              { name: 'East Delhi', code: 'EDEL', description: 'East Delhi Zone' },
              { name: 'West Delhi', code: 'WDEL', description: 'West Delhi Zone' },
              { name: 'Central Delhi', code: 'CDEL', description: 'Central Delhi Zone' }
            ]
          },
          {
            city: { name: 'Noida', code: 'NOI', description: 'Noida' },
            zones: [
              { name: 'Sector 1-50', code: 'NOI1', description: 'Noida Sector 1-50' },
              { name: 'Sector 51-100', code: 'NOI2', description: 'Noida Sector 51-100' },
              { name: 'Greater Noida', code: 'GNOI', description: 'Greater Noida' }
            ]
          },
          {
            city: { name: 'Gurgaon', code: 'GGN', description: 'Gurgaon (Gurugram)' },
            zones: [
              { name: 'Old Gurgaon', code: 'OGGN', description: 'Old Gurgaon Area' },
              { name: 'New Gurgaon', code: 'NGGN', description: 'New Gurgaon Area' },
              { name: 'DLF Phase', code: 'DLFG', description: 'DLF Phase Areas' }
            ]
          },
          {
            city: { name: 'Faridabad', code: 'FBD', description: 'Faridabad' },
            zones: [
              { name: 'Old Faridabad', code: 'OFBD', description: 'Old Faridabad' },
              { name: 'New Faridabad', code: 'NFBD', description: 'New Faridabad' }
            ]
          },
          {
            city: { name: 'Ghaziabad', code: 'GZB', description: 'Ghaziabad' },
            zones: [
              { name: 'Indirapuram', code: 'INDP', description: 'Indirapuram Area' },
              { name: 'Vaishali', code: 'VASH', description: 'Vaishali Area' },
              { name: 'Crossings Republik', code: 'CREP', description: 'Crossings Republik' }
            ]
          }
        ]
      },
      {
        region: { name: 'Mumbai Metropolitan', code: 'MMR', description: 'Mumbai Metropolitan Region' },
        cities: [
          {
            city: { name: 'Mumbai', code: 'MUM', description: 'Mumbai' },
            zones: [
              { name: 'South Mumbai', code: 'SMUM', description: 'South Mumbai' },
              { name: 'Central Mumbai', code: 'CMUM', description: 'Central Mumbai' },
              { name: 'Western Suburbs', code: 'WMUM', description: 'Western Suburbs' },
              { name: 'Eastern Suburbs', code: 'EMUM', description: 'Eastern Suburbs' },
              { name: 'Navi Mumbai', code: 'NMUM', description: 'Navi Mumbai' }
            ]
          },
          {
            city: { name: 'Thane', code: 'THN', description: 'Thane' },
            zones: [
              { name: 'Thane East', code: 'ETHN', description: 'Thane East' },
              { name: 'Thane West', code: 'WTHN', description: 'Thane West' }
            ]
          },
          {
            city: { name: 'Pune', code: 'PUN', description: 'Pune' },
            zones: [
              { name: 'Pune City', code: 'PCTY', description: 'Pune City' },
              { name: 'Pimpri-Chinchwad', code: 'PCWD', description: 'Pimpri-Chinchwad' },
              { name: 'Hinjewadi', code: 'HINJ', description: 'Hinjewadi IT Park' }
            ]
          }
        ]
      },
      {
        region: { name: 'Bangalore Urban', code: 'BLR', description: 'Bangalore Urban Region' },
        cities: [
          {
            city: { name: 'Bangalore', code: 'BLR', description: 'Bangalore (Bengaluru)' },
            zones: [
              { name: 'North Bangalore', code: 'NBLR', description: 'North Bangalore' },
              { name: 'South Bangalore', code: 'SBLR', description: 'South Bangalore' },
              { name: 'East Bangalore', code: 'EBLR', description: 'East Bangalore' },
              { name: 'West Bangalore', code: 'WBLR', description: 'West Bangalore' },
              { name: 'Central Bangalore', code: 'CBLR', description: 'Central Bangalore' },
              { name: 'Whitefield', code: 'WHTF', description: 'Whitefield Area' },
              { name: 'Electronic City', code: 'ECTY', description: 'Electronic City' }
            ]
          }
        ]
      },
      {
        region: { name: 'Chennai Metropolitan', code: 'CHN', description: 'Chennai Metropolitan Area' },
        cities: [
          {
            city: { name: 'Chennai', code: 'CHN', description: 'Chennai' },
            zones: [
              { name: 'North Chennai', code: 'NCHN', description: 'North Chennai' },
              { name: 'South Chennai', code: 'SCHN', description: 'South Chennai' },
              { name: 'Central Chennai', code: 'CCHN', description: 'Central Chennai' },
              { name: 'West Chennai', code: 'WCHN', description: 'West Chennai' },
              { name: 'OMR', code: 'OMR', description: 'Old Mahabalipuram Road' }
            ]
          }
        ]
      },
      {
        region: { name: 'Hyderabad Metropolitan', code: 'HYD', description: 'Hyderabad Metropolitan Region' },
        cities: [
          {
            city: { name: 'Hyderabad', code: 'HYD', description: 'Hyderabad' },
            zones: [
              { name: 'Old City', code: 'OHYD', description: 'Old City Hyderabad' },
              { name: 'Secunderabad', code: 'SECD', description: 'Secunderabad' },
              { name: 'Hitech City', code: 'HITC', description: 'Hitech City' },
              { name: 'Gachibowli', code: 'GACH', description: 'Gachibowli' },
              { name: 'Madhapur', code: 'MADH', description: 'Madhapur' }
            ]
          }
        ]
      },
      {
        region: { name: 'Kolkata Metropolitan', code: 'KOL', description: 'Kolkata Metropolitan Area' },
        cities: [
          {
            city: { name: 'Kolkata', code: 'KOL', description: 'Kolkata' },
            zones: [
              { name: 'North Kolkata', code: 'NKOL', description: 'North Kolkata' },
              { name: 'South Kolkata', code: 'SKOL', description: 'South Kolkata' },
              { name: 'East Kolkata', code: 'EKOL', description: 'East Kolkata' },
              { name: 'Central Kolkata', code: 'CKOL', description: 'Central Kolkata' },
              { name: 'Salt Lake', code: 'SALT', description: 'Salt Lake City' }
            ]
          },
          {
            city: { name: 'Howrah', code: 'HWH', description: 'Howrah' },
            zones: [
              { name: 'Howrah North', code: 'NHWH', description: 'North Howrah' },
              { name: 'Howrah South', code: 'SHWH', description: 'South Howrah' }
            ]
          }
        ]
      },
      {
        region: { name: 'Ahmedabad Urban', code: 'AMD', description: 'Ahmedabad Urban Region' },
        cities: [
          {
            city: { name: 'Ahmedabad', code: 'AMD', description: 'Ahmedabad' },
            zones: [
              { name: 'East Ahmedabad', code: 'EAMD', description: 'East Ahmedabad' },
              { name: 'West Ahmedabad', code: 'WAMD', description: 'West Ahmedabad' },
              { name: 'North Ahmedabad', code: 'NAMD', description: 'North Ahmedabad' },
              { name: 'South Ahmedabad', code: 'SAMD', description: 'South Ahmedabad' }
            ]
          }
        ]
      },
      {
        region: { name: 'Jaipur Urban', code: 'JPR', description: 'Jaipur Urban Region' },
        cities: [
          {
            city: { name: 'Jaipur', code: 'JPR', description: 'Jaipur' },
            zones: [
              { name: 'Pink City', code: 'PINK', description: 'Pink City (Old Jaipur)' },
              { name: 'Malviya Nagar', code: 'MLVY', description: 'Malviya Nagar' },
              { name: 'Vaishali Nagar', code: 'VJPR', description: 'Vaishali Nagar' },
              { name: 'Mansarovar', code: 'MANS', description: 'Mansarovar' }
            ]
          }
        ]
      },
      {
        region: { name: 'Lucknow Urban', code: 'LKO', description: 'Lucknow Urban Region' },
        cities: [
          {
            city: { name: 'Lucknow', code: 'LKO', description: 'Lucknow' },
            zones: [
              { name: 'Gomti Nagar', code: 'GOMT', description: 'Gomti Nagar' },
              { name: 'Hazratganj', code: 'HZRT', description: 'Hazratganj' },
              { name: 'Alambagh', code: 'ALMB', description: 'Alambagh' },
              { name: 'Indira Nagar', code: 'ILKO', description: 'Indira Nagar' }
            ]
          }
        ]
      },
      {
        region: { name: 'Kochi Urban', code: 'COK', description: 'Kochi Urban Region' },
        cities: [
          {
            city: { name: 'Kochi', code: 'COK', description: 'Kochi (Cochin)' },
            zones: [
              { name: 'Ernakulam', code: 'ERNK', description: 'Ernakulam' },
              { name: 'Fort Kochi', code: 'FCOK', description: 'Fort Kochi' },
              { name: 'Kakkanad', code: 'KAKK', description: 'Kakkanad' },
              { name: 'Edappally', code: 'EDAP', description: 'Edappally' }
            ]
          }
        ]
      }
    ];

    console.log('\n📋 Starting Location Seeding...\n');

    let regionCount = 0;
    let cityCount = 0;
    let zoneCount = 0;

    // Seed each region with its cities and zones
    for (const regionData of locationData) {
      // Check if region already exists
      let region = await Region.findOne({ code: regionData.region.code });
      
      if (region) {
        console.log(`⚠️  Region "${regionData.region.name}" already exists, using existing...`);
      } else {
        region = await Region.create({
          ...regionData.region,
          createdBy: superAdmin._id
        });
        regionCount++;
        console.log(`✅ Created Region: ${region.name} (${region.code})`);
      }

      // Seed cities for this region
      for (const cityData of regionData.cities) {
        let city = await City.findOne({ 
          code: cityData.city.code,
          regionId: region._id 
        });

        if (city) {
          console.log(`   ⚠️  City "${cityData.city.name}" already exists, using existing...`);
        } else {
          city = await City.create({
            ...cityData.city,
            regionId: region._id,
            createdBy: superAdmin._id
          });
          cityCount++;
          console.log(`   ✅ Created City: ${city.name} (${city.code}) under ${region.name}`);
        }

        // Seed zones for this city
        for (const zoneData of cityData.zones) {
          const existingZone = await Zone.findOne({ 
            code: zoneData.code,
            cityId: city._id 
          });

          if (existingZone) {
            console.log(`      ⚠️  Zone "${zoneData.name}" already exists, skipping...`);
          } else {
            const zone = await Zone.create({
              ...zoneData,
              cityId: city._id,
              createdBy: superAdmin._id
            });
            zoneCount++;
            console.log(`      ✅ Created Zone: ${zone.name} (${zone.code}) under ${city.name}`);
          }
        }
      }

      console.log(''); // Empty line between regions
    }

    console.log('\n✅ Location Seeding Completed Successfully!\n');
    console.log('📊 Summary:');
    console.log(`   New Regions Created: ${regionCount}`);
    console.log(`   New Cities Created: ${cityCount}`);
    console.log(`   New Zones Created: ${zoneCount}`);
    console.log(`\n   Total Regions: ${await Region.countDocuments()}`);
    console.log(`   Total Cities: ${await City.countDocuments()}`);
    console.log(`   Total Zones: ${await Zone.countDocuments()}`);

    console.log('\n📍 Location Hierarchy:');
    const regions = await Region.find().sort({ name: 1 });
    for (const region of regions) {
      const cities = await City.find({ regionId: region._id }).sort({ name: 1 });
      console.log(`\n   ${region.name} (${region.code})`);
      for (const city of cities) {
        const zones = await Zone.find({ cityId: city._id }).sort({ name: 1 });
        console.log(`      └── ${city.name} (${city.code}) - ${zones.length} zones`);
      }
    }

    process.exit(0);

  } catch (error) {
    console.error('❌ Error seeding locations:', error);
    process.exit(1);
  }
};

seedLocations();
