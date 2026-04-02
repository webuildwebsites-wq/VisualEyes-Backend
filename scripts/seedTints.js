import mongoose from "mongoose";
import dotenv from "dotenv";
import Tint from "../src/models/order/Tint.js";

dotenv.config();

const tintOptions = ["Solid", "Gradient", "No Tint", "Mirror-Solid", "Mirror-Gradient", "Sample"];

async function main() {
  await mongoose.connect(process.env.MONGODB_URL);
  console.log("✅ Connected to MongoDB");

  await Tint.deleteMany({});
  const docs = tintOptions.map((name) => ({ name }));
  await Tint.insertMany(docs);

  console.log(`✅ Inserted ${docs.length} tint options:`, tintOptions);
  await mongoose.disconnect();
  process.exit(0);
}

main().catch((err) => {
  console.error("❌ Fatal:", err);
  process.exit(1);
});
