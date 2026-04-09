import mongoose from "mongoose";
import dotenv from "dotenv";
import ProductLab from "../src/models/order/ProductLab.js";

dotenv.config();

const labs = [
  "Stock Order", "VE Glass Lab", "VisualEyes Lab",
  "VisualEyes Lab & Vrx All Labs", "Vrx All Labs",
  "VE Nagpur Lab", "VE Bengaluru Lab", "VE Hyderabad Lab",
  "VE Kolkatta Lab", "VE Mumbai Lab", "VE Trivandrum Lab",
  "Service", "VE GLASS ORDER", "VE Pune Lab",
  "kolkata stock", "Visual Eyes Lab", "VE Ahmedabad Lab",
  "VE Chennai Lab", "VE Kochi Lab", "VE Gurgaon Lab",
];

async function main() {
  await mongoose.connect(process.env.MONGODB_URL);
  console.log("✅ Connected to MongoDB");

  let inserted = 0;
  for (const name of labs) {
    const result = await ProductLab.updateOne(
      { name },
      { $setOnInsert: { name } },
      { upsert: true }
    );
    if (result.upsertedCount) inserted++;
  }

  console.log(`✅ Done — ${inserted} new labs inserted, existing ones untouched`);
  await mongoose.disconnect();
  process.exit(0);
}

main().catch((err) => {
  console.error("❌ Fatal:", err);
  process.exit(1);
});
