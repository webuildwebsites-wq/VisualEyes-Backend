import mongoose from "mongoose";
import dotenv from "dotenv";
import FrameType from "../src/models/order/FrameType.js";

dotenv.config();

const frameTypes = ["Rimless", "Supra", "Full"];

async function main() {
  await mongoose.connect(process.env.MONGODB_URL);
  console.log("✅ Connected to MongoDB");

  await FrameType.deleteMany({});
  await FrameType.insertMany(frameTypes.map((name) => ({ name })));

  console.log(`✅ Inserted ${frameTypes.length} frame types:`, frameTypes);
  await mongoose.disconnect();
  process.exit(0);
}

main().catch((err) => {
  console.error("❌ Fatal:", err);
  process.exit(1);
});
