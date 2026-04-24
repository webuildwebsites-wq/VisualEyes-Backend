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

  const supplierFilePath = path.join(FILES_DIR, "Supplier name.xlsx");
  const supplierMap = new Map(); 

  if (fs.existsSync(supplierFilePath)) {
    console.log("📄 Reading:", path.basename(supplierFilePath));
    const wbSup  = XLSX.readFile(supplierFilePath);
    const wsSup  = wbSup.Sheets[wbSup.SheetNames[0]];
    const supRows = XLSX.utils.sheet_to_json(wsSup, { defval: null });
    console.log(`   Found ${supRows.length} rows`);

    for (const row of supRows) {
      const key = String(row["Product Code"] ?? "").trim();
      if (!key) continue;

      const suppliers = [];
      for (let i = 1; i <= 4; i++) {
        const name = toStr(row[`Supplier ${i}`]);
        if (name) suppliers.push({ name: name.toUpperCase(), priority: i, active: true });
      }

      supplierMap.set(key, {
        gstPercentage:    toNum(row["GST Percentage"] ?? row["GST Per"]),
        hsnCode:          toUpper(row["HSN Code"]),
        thirdParty:       toStr(row["Third Party Product Name"] ?? row["Third Part"]),
        productShortCode: toUpper(row["Product Short Code"]),
        suppliers,
      });
    }
    console.log(`   Supplier entries mapped: ${supplierMap.size}\n`);
  } else {
    console.warn("⚠️  Supplier name.xlsx not found — products will have empty suppliers\n");
  }

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
    const productName = toStr(row["Product Name/ Description"]);
    const itemCode    = toUpper(String(row["Item Code"] ?? "")) || null;

    if (!productName && !itemCode) { nullCount++; continue; }

    const dedupKey = productName ? productName.toUpperCase() : itemCode;

    if (seen.has(dedupKey)) { dupCount++; continue; }
    seen.add(dedupKey);

    const productCode = toUpper(row["PRODUCT CODE"]);
    const sup = supplierMap.get(String(row["Item Code"] ?? "").trim()) || {};

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
      gstPercentage:    sup.gstPercentage ?? null,
      hsnCode:          sup.hsnCode       ?? null,
      thirdParty:       sup.thirdParty    ?? null,
      productShortCode: sup.productShortCode ?? null,
      suppliers:        sup.suppliers     ?? [],
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

  const withSuppliers    = docs.filter(d => d.suppliers.length > 0).length;
  const withoutSuppliers = docs.filter(d => d.suppliers.length === 0).length;

  console.log("─────────────────────────────────────────────────────────────");
  console.log(`✅ Products inserted    : ${inserted}`);
  console.log(`🔗 With suppliers      : ${withSuppliers}`);
  console.log(`❓ Without suppliers   : ${withoutSuppliers}`);
  console.log(`📦 Total in DB         : ${await Product.countDocuments()}`);
  console.log("\n📊 By Product Type:");
  for (const [type, count] of Object.entries(byType)) {
    console.log(`   ${type.padEnd(15)} : ${count}`);
  }

  const logLines = [
    "=".repeat(60),
    `Seed completed: ${inserted} products inserted`,
    `Source: ${path.basename(filePath)} — Sheet1`,
    `Duplicates skipped (same Product Name): ${dupCount}`,
    `Rows skipped (no key): ${nullCount}`,
    `With suppliers: ${withSuppliers}`,
    `Without suppliers: ${withoutSuppliers}`,
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
