import mongoose from "mongoose";
import dotenv from "dotenv";
import ProductCoating from "../src/models/order/ProductCoating.js";

dotenv.config();

const coatings = [
  "ACHROMATIC","ACROMA","ARC","ARMOR","BGC","BLUE","BLUEPROTECT","CYAN","DRIVE",
  "DRIVE COAT","DSC","DURATUFF","DURATUFF AQUA","DURATUFF BLUE","DURATUFF GREEN",
  "DURATUFF NIGHT","DURON","EMERY","GREEN","HC","HDC","HMC","LOW REFLECTION","LRC",
  "MAGENTA","NIGHT VISION","O2 DUAL","PEARLON","SHELL","SHIELD","SHMC","SILK PLUS",
  "TRUEBLUE","UC","ULTRON","UTC",
];

async function main() {
  await mongoose.connect(process.env.MONGODB_URL);
  console.log("✅ Connected to MongoDB");

  await ProductCoating.deleteMany({});
  await ProductCoating.insertMany(coatings.map((name) => ({ name })));

  console.log(`✅ Inserted ${coatings.length} product coatings`);
  await mongoose.disconnect();
  process.exit(0);
}

main().catch((err) => {
  console.error("❌ Fatal:", err);
  process.exit(1);
});
