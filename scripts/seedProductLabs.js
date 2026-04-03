import mongoose from "mongoose";
import dotenv from "dotenv";
import ProductLab from "../src/models/order/ProductLab.js";

dotenv.config();

const labs = [
  "Stock Order", "VE Glass Lab", "VisualEyes Lab",
  "VisualEyes Lab & Vrx All Labs", "Vrx All Labs",
];

async function main() {
  await mongoose.connect(process.env.MONGODB_URL);
  console.log("✅ Connected to MongoDB");

  await ProductLab.deleteMany({});
  await ProductLab.insertMany(labs.map((name) => ({ name })));

  console.log(`✅ Inserted ${labs.length} product labs`);
  await mongoose.disconnect();
  process.exit(0);
}

main().catch((err) => {
  console.error("❌ Fatal:", err);
  process.exit(1);
});
