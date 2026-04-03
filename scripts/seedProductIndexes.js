import mongoose from "mongoose";
import dotenv from "dotenv";
import ProductIndex from "../src/models/order/ProductIndex.js";

dotenv.config();

const indexes = [1.5, 1.53, 1.55, 1.56, 1.59, 1.6, 1.67, 1.7, 1.74, 1.8, 1.9];

async function main() {
  await mongoose.connect(process.env.MONGODB_URL);
  console.log("✅ Connected to MongoDB");

  await ProductIndex.deleteMany({});
  await ProductIndex.insertMany(indexes.map((value) => ({ value })));

  console.log(`✅ Inserted ${indexes.length} product indexes`);
  await mongoose.disconnect();
  process.exit(0);
}

main().catch((err) => {
  console.error("❌ Fatal:", err);
  process.exit(1);
});
