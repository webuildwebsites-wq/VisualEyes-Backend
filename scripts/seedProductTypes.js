import mongoose from "mongoose";
import dotenv from "dotenv";
import ProductType from "../src/models/order/ProductType.js";

dotenv.config();

const productTypes = ["Rx Lens", "Stock Lens"];

async function main() {
  await mongoose.connect(process.env.MONGODB_URL);
  console.log("✅ Connected to MongoDB");

  await ProductType.deleteMany({});
  await ProductType.insertMany(productTypes.map((name) => ({ name })));

  console.log(`✅ Inserted ${productTypes.length} product types`);
  await mongoose.disconnect();
  process.exit(0);
}

main().catch((err) => {
  console.error("❌ Fatal:", err);
  process.exit(1);
});
