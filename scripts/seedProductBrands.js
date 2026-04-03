import mongoose from "mongoose";
import dotenv from "dotenv";
import ProductBrand from "../src/models/order/ProductBrand.js";

dotenv.config();

const brands = [
  "ASAHI-LITE", "ASDOL-OEM", "DIVA-RETAIL", "DIVA-WHL", "FRAMESKRAFT-OEM",
  "LITHOUS-OEM", "O2 Lens", "PIXEL", "VE-Dubai", "VE-FUJI", "VE-SIGNATURE",
  "VISUALEYES", "WINGS-OEM", "ZIRCON", "ZIRCON EXCLUSIVE",
];

async function main() {
  await mongoose.connect(process.env.MONGODB_URL);
  console.log("✅ Connected to MongoDB");

  await ProductBrand.deleteMany({});
  await ProductBrand.insertMany(brands.map((name) => ({ name })));

  console.log(`✅ Inserted ${brands.length} product brands`);
  await mongoose.disconnect();
  process.exit(0);
}

main().catch((err) => {
  console.error("❌ Fatal:", err);
  process.exit(1);
});
