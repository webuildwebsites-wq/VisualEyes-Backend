import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Brand from '../src/models/Product/Brand.js';
import Category from '../src/models/Product/Category.js';
import Employee from '../src/models/Auth/Employee.js';

dotenv.config();

const brandCategoryData = [
  { brand: "ASAHI-LITE", categories: ["AL-Glass SV", "AL-Glass Prog", "AL-Glass KT BF", "AL-Glass D BF", "Asahi Premier", "Asahi Smart Bifocal", "Asahi D Bifocal", "Asahi Excecutive", "Asahi KT Bifocal", "Asahi SV Rx", "Asahi Myo Sharp", "Asahi Standard", "Asahi Advanced", "Asahi FPAL", "Asahi FSV"] },
  { brand: "ASDOL-OEM", categories: ["SOLACE", "Vlite BF", "Vlite DBF", "VISAO LITE", "CLEON", "AURA", "VILITE SV"] },
  { brand: "DIVA", categories: ["Diva KT Bifocal", "Diva Prog"] },
  { brand: "DIVA-RETAIL", categories: ["Diva Prog"] },
  { brand: "DIVA-WHL", categories: ["Diva Prog"] },
  { brand: "LITHOUS-OEM", categories: ["Signature Infinity", "Signature Orbit", "Individual", "Prestige Wide", "Ecoline SV", "Prestige Balanced", "Prime Max", "Prime Easy Fit", "Budget Series", "Anti-Fatigue", "Ecoline DBF", "Ecoline KT", "Smart BF", "Myo Smart", "Apex AI"] },
  { brand: "O2 Lens", categories: ["Divine Prog", "Veco 360 Flexi Advanced", "Veco Phonix Advanced", "Veco Serene Advanced", "Veco Customized SV", "Ultima Elite", "Professional", "Aster Premium", "Super Fit"] },
  { brand: "PIXEL", categories: ["Pixel Prime HD", "Pixel HD Wide", "Pixel Bespoke", "Pixel-Invisible", "KT-Bifocal", "D-Bifocal", "Pixel Relax", "Pixel SV"] },
  { brand: "VE-Dubai", categories: ["VE Single Vision", "Proxima-Office", "Platinum", "Palladium", "KT Bifocal", "Iridium", "Invisible Bifocal", "Gold", "D Bifocal", "AntiFatigue", "Finished SV", "Finished Progressive", "Finished KT"] },
  { brand: "VE-FUJI", categories: ["Pinnacle", "Zenith", "Crest", "Apex", "Apex Lite", "Fuji Sport Tech", "Fuji SV RX", "Fuji Safe Ride", "Fuji Office", "Fuji FSV"] },
  { brand: "VE-SIGNATURE", categories: ["Signature SV RX", "Sport SV RX", "Drive SV RX", "Anti-Fatigue", "Myopia SV", "Invisible BIF", "Sport PAL", "Office", "Pilot", "Drive PAL", "Iridium", "Palladium", "Gold", "Platinum", "Titanium", "Rhodium", "Signature FSV"] },
  { brand: "VISION EASE", categories: ["Narrative Individual", "Narrative", "Everywhere", "Vision Ease SVRx", "Vision Ease FSV"] },
  { brand: "VISUALEYES", categories: ["R+ Wider", "Ocumade SV", "S Wide", "Tailormade", "S+ Wider", "Ocumade No Line", "Ocumade KT", "Ocumade DBF", "Glass Ruby", "Glass Sapphire", "Glass D Bifocal", "Glass KT Bifocal", "Glass SV", "ZIR+ SV-DS", "Sapphire", "Diamond Plus", "Emerald Plus", "Ruby Plus", "Sapphire Plus", "D Bifocal", "Single Vision", "DS Bifocal", "Chorus Opal", "KT Bifocal", "Visualeyes Office Pro", "Ocumade FSV", "VisualEyes FSV"] },
  { brand: "ZIRCON", categories: ["Chorus Clear", "Zircon SVRx", "Zircon Pearl", "Zircon D Bifocal", "Ocumade SV", "Ocumade DBF", "Lifestyle Pal", "Ocumade KT", "Zircon KT Bifocal", "SIGHTX PAL", "SIGHTX BF", "MARBAL PAL", "MARBAL BF", "MARCO PAL", "MARCO BF", "Ocumade FSV"] },
  { brand: "ZIRCON EXCLUSIVE", categories: ["Topaz", "Jade", "Garnet", "Zircon Exclusive RX", "Ocumade SV", "Zircon Exclusive FSV", "Zircon Exclusive FBF", "Zircon Exclusive FPAL", "Ocumade FSV"] }
];

async function seedBrandsAndCategories() {
  try {
    await mongoose.connect(process.env.MONGODB_URL);
    console.log('Connected to MongoDB');

    const adminUser = await Employee.findOne({ 
      $or: [{ email: 'anishsinghrawat5@gmail.com' }, { username: 'anish' }] 
    });

    if (!adminUser) {
      console.error('No admin user found. Please create an admin user first.');
      process.exit(1);
    }

    console.log(`Using admin user: ${adminUser.username} as creator`);

    console.log('Clearing existing brands and categories...');
    await Category.deleteMany({});
    await Brand.deleteMany({});

    let totalBrands = 0;
    let totalCategories = 0;

    // Seed brands and categories
    for (const item of brandCategoryData) {
      // Create brand
      const brand = await Brand.create({
        name: item.brand,
        createdBy: adminUser._id,
        isActive: true
      });
      totalBrands++;
      console.log(`Created brand: ${brand.name}`);

      // Create categories for this brand
      for (const categoryName of item.categories) {
        await Category.create({
          name: categoryName,
          brand: brand._id,
          createdBy: adminUser._id,
          isActive: true
        });
        totalCategories++;
      }
      console.log(`  Added ${item.categories.length} categories`);
    }

    console.log('\n✅ Seeding completed successfully!');
    console.log(`Total Brands: ${totalBrands}`);
    console.log(`Total Categories: ${totalCategories}`);

    process.exit(0);
  } catch (error) {
    console.error('Error seeding data:', error);
    process.exit(1);
  }
}

seedBrandsAndCategories();
