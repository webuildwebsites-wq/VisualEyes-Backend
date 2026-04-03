import mongoose from "mongoose";
import dotenv from "dotenv";
import ProductCategory from "../src/models/order/ProductCategory.js";

dotenv.config();

const categories = [
  "AL-Glass D BF","AL-Glass KT BF","AL-Glass Prog","AL-Glass SV","AURA","Anti-Fatigue",
  "AntiFatigue","Apex","Apex AI","Apex Lite","Asahi Advanced","Asahi D Bifocal",
  "Asahi Excecutive","Asahi FPAL","Asahi FSV","Asahi KT Bifocal","Asahi Myo Sharp",
  "Asahi Premier","Asahi SV Rx","Asahi Smart Bifocal","Asahi Standard","Aster Premium",
  "Budget Series","CLEON","Chorus Clear","Crest","D Bifocal","D-Bifocal","Diamond Plus",
  "Diva Prog","Divine Prog","Drive PAL","Drive SV RX","Ecoline DBF","Ecoline KT",
  "Ecoline SV","Emerald Plus","Finished KT","Finished Progressive","Finished SV",
  "Fuji FSV","Fuji SV RX","Fuji Safe Ride","Fuji Sport Tech","Garnet","Glass D Bifocal",
  "Glass KT Bifocal","Glass Ruby","Glass SV","Glass Sapphire","Gold","Individual",
  "Invisible BIF","Invisible Bifocal","Iridium","Jade","KT Bifocal","KT-Bifocal",
  "Lenticular-KT","Lenticular-SV","Lifestyle Pal","MARBAL BF","MARBAL PAL","Myo Smart",
  "Myopia SV","Ocumade DBF","Ocumade FSV","Ocumade KT","Ocumade No Line","Ocumade SV",
  "Office","Palladium","Pilot","Pinnacle","Pixel Bespoke","Pixel HD Wide","Pixel Prime HD",
  "Pixel Relax","Pixel SV","Pixel-Invisible","Platinum","Prestige Balanced","Prestige Wide",
  "Prime Easy Fit","Prime Max","Professional","Proxima-Office","R+ Wider","Rhodium",
  "Ruby Plus","S Wide","S+ Wider","SOLACE","Sapphire","Sapphire Plus","Signature FSV",
  "Signature Infinity","Signature Orbit","Signature SV RX","Single Vision","Smart BF",
  "Sport PAL","Sport SV RX","Super Fit","Tailormade","Titanium","Topaz","Ultima Elite",
  "VE Single Vision","VILITE SV","VISAO LITE","Veco 360 Flexi Advanced","Veco Customized SV",
  "Veco Phonix Advanced","Veco Serene Advanced","VisualEyes FSV","Vlite BF","Vlite DBF",
  "Zenith","Zircon D Bifocal","Zircon Exclusive FBF","Zircon Exclusive FPAL",
  "Zircon Exclusive FSV","Zircon Exclusive RX","Zircon KT Bifocal","Zircon Pearl","Zircon SVRx",
];

async function main() {
  await mongoose.connect(process.env.MONGODB_URL);
  console.log("✅ Connected to MongoDB");

  await ProductCategory.deleteMany({});
  await ProductCategory.insertMany(categories.map((name) => ({ name })));

  console.log(`✅ Inserted ${categories.length} product categories`);
  await mongoose.disconnect();
  process.exit(0);
}

main().catch((err) => {
  console.error("❌ Fatal:", err);
  process.exit(1);
});
