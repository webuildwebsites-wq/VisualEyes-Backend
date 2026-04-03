import mongoose from "mongoose";
import dotenv from "dotenv";
import ProductTreatment from "../src/models/order/ProductTreatment.js";

dotenv.config();

const treatments = [
  "BlueCut", "Clear", "Neochrome", "Photo BlueCut", "Photochromic",
  "Polarised", "Premium Photochromic", "Sunsensors", "Transition", "Transition Polarised",
];

async function main() {
  await mongoose.connect(process.env.MONGODB_URL);
  console.log("✅ Connected to MongoDB");

  await ProductTreatment.deleteMany({});
  await ProductTreatment.insertMany(treatments.map((name) => ({ name })));

  console.log(`✅ Inserted ${treatments.length} product treatments`);
  await mongoose.disconnect();
  process.exit(0);
}

main().catch((err) => {
  console.error("❌ Fatal:", err);
  process.exit(1);
});
