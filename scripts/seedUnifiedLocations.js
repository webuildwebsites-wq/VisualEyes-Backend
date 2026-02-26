import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Location from '../src/models/Location/Location.js';
import employeeSchema from '../src/models/Auth/Employee.js';

dotenv.config();

const locationData = [
  {
    zone: 'NORTH',
    description: 'North Zone covering northern states including Delhi, Haryana, Punjab, Uttar Pradesh, Uttarakhand, Himachal Pradesh, and Jammu & Kashmir',
    states: [
      {
        name: 'Delhi',
        code: 'DEL',
        cities: [
          {
            name: 'New Delhi',
            code: 'NDEL',
            zipCodes: [
              { code: '110001', area: 'Connaught Place' },
              { code: '110002', area: 'Indraprastha Estate' },
              { code: '110003', area: 'Kamla Market' }
            ]
          },
          {
            name: 'North Delhi',
            code: 'NODEL',
            zipCodes: [
              { code: '110006', area: 'Kashmere Gate' },
              { code: '110007', area: 'Sadar Bazar' }
            ]
          }
        ]
      },
      {
        name: 'Haryana',
        code: 'HAR',
        cities: [
          {
            name: 'Gurgaon',
            code: 'GGN',
            zipCodes: [
              { code: '122001', area: 'Sector 1-15' },
              { code: '122002', area: 'Sector 16-30' },
              { code: '122003', area: 'DLF Phase 1-3' }
            ]
          },
          {
            name: 'Faridabad',
            code: 'FBD',
            zipCodes: [
              { code: '121001', area: 'Old Faridabad' },
              { code: '121002', area: 'New Industrial Town' }
            ]
          }
        ]
      },
      {
        name: 'Uttar Pradesh',
        code: 'UP',
        cities: [
          {
            name: 'Noida',
            code: 'NOI',
            zipCodes: [
              { code: '201301', area: 'Sector 1-50' },
              { code: '201302', area: 'Sector 51-100' },
              { code: '201310', area: 'Greater Noida' }
            ]
          },
          {
            name: 'Lucknow',
            code: 'LKO',
            zipCodes: [
              { code: '226001', area: 'Hazratganj' },
              { code: '226002', area: 'Gomti Nagar' },
              { code: '226003', area: 'Alambagh' }
            ]
          }
        ]
      }
    ]
  },
  {
    zone: 'SOUTH',
    description: 'South Zone covering southern states including Karnataka, Tamil Nadu, Kerala, Andhra Pradesh, and Telangana',
    states: [
      {
        name: 'Karnataka',
        code: 'KAR',
        cities: [
          {
            name: 'Bangalore',
            code: 'BLR',
            zipCodes: [
              { code: '560001', area: 'Bangalore City' },
              { code: '560002', area: 'Shivaji Nagar' },
              { code: '560066', area: 'Whitefield' },
              { code: '560100', area: 'Electronic City' }
            ]
          },
          {
            name: 'Mysore',
            code: 'MYS',
            zipCodes: [
              { code: '570001', area: 'Mysore City' },
              { code: '570002', area: 'Chamundi Hills' }
            ]
          }
        ]
      },
      {
        name: 'Tamil Nadu',
        code: 'TN',
        cities: [
          {
            name: 'Chennai',
            code: 'CHN',
            zipCodes: [
              { code: '600001', area: 'Parrys' },
              { code: '600002', area: 'Anna Salai' },
              { code: '600096', area: 'OMR' }
            ]
          },
          {
            name: 'Coimbatore',
            code: 'CBE',
            zipCodes: [
              { code: '641001', area: 'Coimbatore City' },
              { code: '641002', area: 'RS Puram' }
            ]
          }
        ]
      },
      {
        name: 'Kerala',
        code: 'KER',
        cities: [
          {
            name: 'Kochi',
            code: 'COK',
            zipCodes: [
              { code: '682001', area: 'Fort Kochi' },
              { code: '682002', area: 'Ernakulam' },
              { code: '682030', area: 'Kakkanad' }
            ]
          },
          {
            name: 'Thiruvananthapuram',
            code: 'TVM',
            zipCodes: [
              { code: '695001', area: 'Trivandrum City' },
              { code: '695002', area: 'Statue' }
            ]
          }
        ]
      },
      {
        name: 'Telangana',
        code: 'TEL',
        cities: [
          {
            name: 'Hyderabad',
            code: 'HYD',
            zipCodes: [
              { code: '500001', area: 'Abids' },
              { code: '500081', area: 'Hitech City' },
              { code: '500032', area: 'Gachibowli' }
            ]
          }
        ]
      }
    ]
  },
  {
    zone: 'EAST',
    description: 'East Zone covering eastern states including West Bengal, Odisha, Bihar, and Jharkhand',
    states: [
      {
        name: 'West Bengal',
        code: 'WB',
        cities: [
          {
            name: 'Kolkata',
            code: 'KOL',
            zipCodes: [
              { code: '700001', area: 'BBD Bagh' },
              { code: '700002', area: 'Howrah' },
              { code: '700091', area: 'Salt Lake' }
            ]
          },
          {
            name: 'Siliguri',
            code: 'SLG',
            zipCodes: [
              { code: '734001', area: 'Siliguri City' },
              { code: '734002', area: 'Matigara' }
            ]
          }
        ]
      },
      {
        name: 'Odisha',
        code: 'ORI',
        cities: [
          {
            name: 'Bhubaneswar',
            code: 'BBS',
            zipCodes: [
              { code: '751001', area: 'Bhubaneswar City' },
              { code: '751002', area: 'Kharavel Nagar' }
            ]
          }
        ]
      }
    ]
  },
  {
    zone: 'WEST',
    description: 'West Zone covering western states including Maharashtra, Gujarat, Rajasthan, and Goa',
    states: [
      {
        name: 'Maharashtra',
        code: 'MAH',
        cities: [
          {
            name: 'Mumbai',
            code: 'MUM',
            zipCodes: [
              { code: '400001', area: 'Fort' },
              { code: '400002', area: 'Kalbadevi' },
              { code: '400051', area: 'Bandra' },
              { code: '400093', area: 'Navi Mumbai' }
            ]
          },
          {
            name: 'Pune',
            code: 'PUN',
            zipCodes: [
              { code: '411001', area: 'Pune City' },
              { code: '411002', area: 'Shivaji Nagar' },
              { code: '411057', area: 'Hinjewadi' }
            ]
          }
        ]
      },
      {
        name: 'Gujarat',
        code: 'GUJ',
        cities: [
          {
            name: 'Ahmedabad',
            code: 'AMD',
            zipCodes: [
              { code: '380001', area: 'Ahmedabad City' },
              { code: '380002', area: 'Ellisbridge' },
              { code: '380015', area: 'Satellite' }
            ]
          },
          {
            name: 'Surat',
            code: 'SRT',
            zipCodes: [
              { code: '395001', area: 'Surat City' },
              { code: '395002', area: 'Athwa' }
            ]
          }
        ]
      },
      {
        name: 'Rajasthan',
        code: 'RAJ',
        cities: [
          {
            name: 'Jaipur',
            code: 'JPR',
            zipCodes: [
              { code: '302001', area: 'Pink City' },
              { code: '302002', area: 'Malviya Nagar' },
              { code: '302017', area: 'Vaishali Nagar' }
            ]
          }
        ]
      }
    ]
  },
  {
    zone: 'CENTRAL',
    description: 'Central Zone covering central states including Madhya Pradesh and Chhattisgarh',
    states: [
      {
        name: 'Madhya Pradesh',
        code: 'MP',
        cities: [
          {
            name: 'Bhopal',
            code: 'BPL',
            zipCodes: [
              { code: '462001', area: 'Bhopal City' },
              { code: '462002', area: 'MP Nagar' }
            ]
          },
          {
            name: 'Indore',
            code: 'IDR',
            zipCodes: [
              { code: '452001', area: 'Indore City' },
              { code: '452002', area: 'Vijay Nagar' }
            ]
          }
        ]
      },
      {
        name: 'Chhattisgarh',
        code: 'CHH',
        cities: [
          {
            name: 'Raipur',
            code: 'RPR',
            zipCodes: [
              { code: '492001', area: 'Raipur City' },
              { code: '492002', area: 'Civil Lines' }
            ]
          }
        ]
      }
    ]
  },
  {
    zone: 'NORTHEAST',
    description: 'Northeast Zone covering northeastern states including Assam, Arunachal Pradesh, Nagaland, Manipur, Mizoram, Tripura, Meghalaya, and Sikkim',
    states: [
      {
        name: 'Arunachal Pradesh',
        code: 'AP',
        cities: [
          {
            name: 'Itanagar',
            code: 'ITA',
            zipCodes: [
              { code: '791001', area: 'Itanagar City' },
              { code: '791002', area: 'Naharlagun' },
              { code: '791003', area: 'Nirjuli' }
            ]
          },
          {
            name: 'Tawang',
            code: 'TWG',
            zipCodes: [
              { code: '790104', area: 'Tawang Town' }
            ]
          }
        ]
      },
      {
        name: 'Assam',
        code: 'ASM',
        cities: [
          {
            name: 'Guwahati',
            code: 'GWH',
            zipCodes: [
              { code: '781001', area: 'Guwahati City' },
              { code: '781002', area: 'Panbazar' },
              { code: '781006', area: 'Paltan Bazar' }
            ]
          }
        ]
      }
    ]
  }
];

const seedUnifiedLocations = async () => {
  try {
    console.log('🔧 Starting unified location seeding...\n');

    await mongoose.connect(process.env.MONGODB_URI || process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB\n');

    // Find SuperAdmin
    const superAdmin = await employeeSchema.findOne({ EmployeeType: 'SUPERADMIN' });
    if (!superAdmin) {
      console.log('❌ SuperAdmin not found. Please create SuperAdmin first.');
      process.exit(1);
    }

    console.log(`✅ Found SuperAdmin: ${superAdmin.username} - ${superAdmin.employeeName}\n`);

    // Clear existing locations
    const existingCount = await Location.countDocuments();
    if (existingCount > 0) {
      console.log(`⚠️  Found ${existingCount} existing locations.`);
      console.log('   Clearing existing locations...');
      await Location.deleteMany({});
      console.log('✅ Cleared existing locations\n');
    }

    // Seed locations
    console.log('📋 Seeding locations...\n');
    
    let totalStates = 0;
    let totalCities = 0;
    let totalZipCodes = 0;

    for (const locationItem of locationData) {
      const location = new Location({
        ...locationItem,
        createdBy: superAdmin._id,
        isActive: true
      });

      await location.save();

      const statesCount = location.states.length;
      const citiesCount = location.states.reduce((sum, state) => sum + state.cities.length, 0);
      const zipCodesCount = location.states.reduce((sum, state) => 
        sum + state.cities.reduce((citySum, city) => citySum + city.zipCodes.length, 0), 0
      );

      totalStates += statesCount;
      totalCities += citiesCount;
      totalZipCodes += zipCodesCount;

      console.log(`✅ Created ${location.zone} Zone:`);
      console.log(`   - ${statesCount} states`);
      console.log(`   - ${citiesCount} cities`);
      console.log(`   - ${zipCodesCount} zip codes\n`);
    }

    console.log('='.repeat(60));
    console.log('✨ Seeding completed successfully!');
    console.log('='.repeat(60));
    console.log('\n📊 Summary:');
    console.log(`   Total Zones: ${locationData.length}`);
    console.log(`   Total States: ${totalStates}`);
    console.log(`   Total Cities: ${totalCities}`);
    console.log(`   Total Zip Codes: ${totalZipCodes}`);

    console.log('\n📋 Zones Created:');
    const locations = await Location.find({}).sort({ zone: 1 });
    locations.forEach(loc => {
      console.log(`   • ${loc.zone} - ${loc.statesCount} states, ${loc.citiesCount} cities, ${loc.zipCodesCount} zip codes`);
    });

    console.log('\n🎯 Next Steps:');
    console.log('   1. Assign regional managers to zones');
    console.log('   2. Update employee records to use zones');
    console.log('   3. Test location APIs');
    console.log('   4. Update frontend to use new structure\n');

    process.exit(0);
  } catch (error) {
    console.error('\n❌ Seeding failed:', error);
    process.exit(1);
  }
};

seedUnifiedLocations();
