import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import XLSX from "xlsx";
import fs from "fs";
import Product from "../src/models/Product/Product.js";

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FILES_DIR = path.join(__dirname, "../src/Files");

function toStr(val) {
  const s = val != null ? String(val).trim() : null;
  return s || null;
}

function toUpper(val) {
  const s = toStr(val);
  return s ? s.toUpperCase() : null;
}

function toNum(val) {
  const n = parseFloat(val);
  return isNaN(n) ? null : n;
}

async function main() {
  await mongoose.connect(process.env.MONGODB_URL);
  console.log("✅ Connected to MongoDB\n");

  console.log("🗑️  Dropping old Product collection...");
  await mongoose.connection.db.dropCollection("products").catch(() => {});
  console.log("   Done.\n");

  const filePath = path.join(FILES_DIR, "ProductWithSuppliers.xlsx");
  if (!fs.existsSync(filePath)) {
    console.error("❌ File not found:", filePath);
    process.exit(1);
  }

  console.log("📄 Reading:", path.basename(filePath));
  const wb   = XLSX.readFile(filePath);
  const ws   = wb.Sheets[wb.SheetNames[0]]; 
  const rows = XLSX.utils.sheet_to_json(ws, { defval: null });
  console.log(`   Total rows in sheet: ${rows.length}\n`);


  const seen    = new Set(); 
  const docs    = [];
  let dupCount  = 0;
  let nullCount = 0;

  for (const row of rows) {
    const productCode = toUpper(row["PRODUCT CODE"]);
    const itemCode    = toUpper(String(row["Item Code"] ?? "")) || null;

    const dedupKey = productCode ?? itemCode;
    if (!dedupKey) { nullCount++; continue; }

    if (seen.has(dedupKey)) { dupCount++; continue; }
    seen.add(dedupKey);

    docs.push({
      itemCode,
      productName:  toStr(row["Product Name/ Description"]),
      coating:      toStr(row["Coating"]),
      index:        toNum(row["Index"]),
      productCode:  productCode,   
      brand:        toStr(row["Brand"]),
      productType:  toStr(row["Product Type"]),
      category:     toStr(row["Category"]),
      blankType:    toStr(row["Blank type"]),
      price:        toNum(row["Price"]),
      status:       toStr(row["Status"]),
      lab:          toStr(row["Lab"]),
      blankCode:    toUpper(row["BLANK CODE"]),
      suppliers:    [],
    });
  }

  console.log(`   Unique products to insert : ${docs.length}`);
  console.log(`   Duplicates skipped        : ${dupCount}`);
  console.log(`   Rows with no key skipped  : ${nullCount}\n`);

  let inserted = 0;
  if (docs.length > 0) {
    const result = await Product.insertMany(docs, { ordered: false });
    inserted = result.length;
  }

  const byType = {};
  for (const d of docs) {
    const t = d.productType || "Unknown";
    byType[t] = (byType[t] || 0) + 1;
  }

  console.log("─────────────────────────────────────────────────────────────");
  console.log(`✅ Products inserted : ${inserted}`);
  console.log(`📦 Total in DB      : ${await Product.countDocuments()}`);
  console.log("\n📊 By Product Type:");
  for (const [type, count] of Object.entries(byType)) {
    console.log(`   ${type.padEnd(15)} : ${count}`);
  }

  const logLines = [
    "=".repeat(60),
    `Seed completed: ${inserted} products inserted`,
    `Source: ${path.basename(filePath)} — Sheet1`,
    `Duplicates skipped (same PRODUCT CODE): ${dupCount}`,
    `Rows skipped (no key): ${nullCount}`,
    "",
    "By Product Type:",
    ...Object.entries(byType).map(([t, c]) => `  ${t}: ${c}`),
    "=".repeat(60),
  ];
  fs.writeFileSync(path.join(__dirname, "../logs.txt"), logLines.join("\n"), "utf8");
  console.log("\n📝 Summary written to logs.txt");

  await mongoose.disconnect();
  process.exit(0);
}

main().catch((err) => {
  console.error("❌ Fatal:", err);
  process.exit(1);
});
