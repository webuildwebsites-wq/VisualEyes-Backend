import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import XLSX from "xlsx";
import Product from "../src/models/Product/Product.js";

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FILES_DIR = path.join(__dirname, "../src/Files");


function readSheet(filePath) {
  const wb = XLSX.readFile(filePath);
  const ws = wb.Sheets[wb.SheetNames[0]];
  return XLSX.utils.sheet_to_json(ws, { defval: null });
}

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

  console.log("🗑️  Dropping old Product and Supplier collections...");
  await mongoose.connection.db.dropCollection("products").catch(() => {});
  await mongoose.connection.db.dropCollection("suppliers").catch(() => {});
  console.log("   Done.\n");

  const supplierFilePath = path.join(FILES_DIR, "Supplier name.xlsx");
  console.log("📄 Reading:", path.basename(supplierFilePath));
  const supplierRows = readSheet(supplierFilePath);
  console.log(`   Found ${supplierRows.length} rows`);

  const supplierMap = new Map();

  for (const row of supplierRows) {
    const itemCode = toUpper(row["Product Code"]);
    if (!itemCode) continue;

    const suppliers = [];
    for (let i = 1; i <= 4; i++) {
      const name = toStr(row[`Supplier ${i}`] ?? row[`Supplier${i}`]);
      if (name) suppliers.push({ name: name.toUpperCase(), priority: i, active: true });
    }

    supplierMap.set(itemCode, {
      gstPercentage: toNum(row["GST Per"] ?? row["GST Percentage"]),
      hsnCode:       toUpper(row["HSN Code"]),
      thirdParty:    toStr(row["Third Part"] ?? row["Third Party"]),
      suppliers,
    });
  }

  console.log(`   Unique item codes mapped: ${supplierMap.size}\n`);

  const productFilePath = path.join(FILES_DIR, "Product Master, lab and blank data.xlsx");
  console.log("📄 Reading:", path.basename(productFilePath));
  const productRows = readSheet(productFilePath);
  console.log(`   Found ${productRows.length} rows\n`);

  const docs      = [];
  const seenCodes = new Set();
  let skipped     = 0;

  for (const row of productRows) {
    const itemCode = toUpper(row["Item Code"]);

    if (!itemCode) {
      skipped++;
      continue;
    }

    if (seenCodes.has(itemCode)) {
      skipped++;
      continue;
    }
    seenCodes.add(itemCode);

    const sup = supplierMap.get(itemCode) || {};

    docs.push({
      itemCode,

      productName:      toStr(row["Product Name"]),
      brand:            toStr(row["Brand"]),
      productType:      toStr(row["Product Type"]),
      category:         toStr(row["Category"]),
      treatment:        toStr(row["treatment"]),
      price:            toNum(row["Price"]),
      status:           toStr(row["Status"]),
      productShortCode: toUpper(row["Product Short Code"]),

      coating:   toStr(row["Coating"]),
      index:     toNum(row["Index"]),
      lab:       toStr(row["Lab"]),
      blankCode: toStr(row["Blank Code"]),

      gstPercentage: sup.gstPercentage ?? null,
      hsnCode:       sup.hsnCode       ?? null,
      thirdParty:    sup.thirdParty    ?? null,
      suppliers:     sup.suppliers     ?? [],
    });
  }

  let inserted = 0;
  if (docs.length > 0) {
    const result = await Product.insertMany(docs, { ordered: false });
    inserted = result.length;
  }

  // ── 4. Summary ───────────────────────────────────────────────────────────
  const withSuppliers    = docs.filter((d) => d.suppliers.length > 0).length;
  const withoutSuppliers = docs.filter((d) => d.suppliers.length === 0).length;

  console.log("─────────────────────────────────────────────────────────────");
  console.log(`✅ Products inserted     : ${inserted}`);
  console.log(`⚠️  Rows skipped         : ${skipped}  (no itemCode or duplicate in Excel)`);
  console.log(`🔗 With supplier data   : ${withSuppliers}`);
  console.log(`❓ Without supplier data : ${withoutSuppliers}  (itemCode not found in Supplier file)`);
  console.log(`📦 Total in DB          : ${await Product.countDocuments()}`);

  await mongoose.disconnect();
  process.exit(0);
}

main().catch((err) => {
  console.error("❌ Fatal:", err);
  process.exit(1);
});
