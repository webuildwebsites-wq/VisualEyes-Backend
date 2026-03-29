import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import XLSX from "xlsx";
import Product from "../src/models/Product/Product.js";
import Supplier from "../src/models/Product/Supplier.js";

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FILES_DIR = path.join(__dirname, "../src/Files");


function readSheet(filePath) {
  const workbook = XLSX.readFile(filePath);
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  return XLSX.utils.sheet_to_json(sheet, { defval: null });
}

function toNum(val) {
  const n = parseFloat(val);
  return isNaN(n) ? null : n;
}

function toStr(val) {
  return val != null ? String(val).trim() : null;
}


async function seedProductMaster(filePath) {
  console.log("\n📄 Reading:", path.basename(filePath));
  const rows = readSheet(filePath);
  console.log(`   Found ${rows.length} rows`);

  console.log("   🗑️  Clearing existing Product collection...");
  await Product.deleteMany({});

  const docs = rows.map((row) => ({
    itemCode:         toStr(row["Item Code"]),
    productName:      toStr(row["Product Name"]),
    coating:          toStr(row["Coating"]),
    index:            toNum(row["Index"]),
    productShortCode: toStr(row["Product Short Code"]),
    brand:            toStr(row["Brand"]),
    productType:      toStr(row["Product Type"]),
    category:         toStr(row["Category"]),
    treatment:        toStr(row["treatment"]),
    price:            toNum(row["Price"]),
    status:           toStr(row["Status"]),
    lab:              toStr(row["Lab"]),
    blankCode:        toStr(row["Blank Code"]),
  }));

  await Product.insertMany(docs, { ordered: false });
  console.log(`   ✅ Inserted: ${docs.length} products`);
}

async function seedSuppliers(filePath) {
  console.log("\n📄 Reading:", path.basename(filePath));
  const rows = readSheet(filePath);
  console.log(`   Found ${rows.length} rows`);

  let inserted = 0, updated = 0, skipped = 0;

  for (const row of rows) {
    const productCode = toStr(row["Product Code"]);
    if (!productCode) { skipped++; continue; }

    const suppliers = [];
    let i = 1;
    while (row[`Supplier ${i}`] != null) {
      const s = toStr(row[`Supplier ${i}`]);
      if (s) suppliers.push(s);
      i++;
    }

    const doc = {
      productCode,
      productName:      toStr(row["Product Name"]),
      brand:            toStr(row["Brand"]),
      productType:      toStr(row["Product Type"]),
      category:         toStr(row["Category"]),
      treatment:        toStr(row["treatment"]),
      gstPercentage:    toNum(row["GST Percentage"]),
      hsnCode:          toStr(row["HSN Code"]),
      productShortCode: toStr(row["Product Short Code"]),
      thirdParty:       toStr(row["Third Party"]),
      price:            toNum(row["Price"]),
      status:           toStr(row["Status"]),
      suppliers,
    };

    const result = await Supplier.updateOne(
      { productCode },
      { $set: doc },
      { upsert: true }
    );

    if (result.upsertedCount) inserted++;
    else if (result.modifiedCount) updated++;
  }

  console.log(`   ✅ Inserted: ${inserted} | Updated: ${updated} | Skipped (no key): ${skipped}`);
}


const FILE_HANDLERS = {
  "Product Master, lab and blank data.xlsx": seedProductMaster,
  "Supplier name.xlsx": seedSuppliers,
};


async function main() {
  await mongoose.connect(process.env.MONGODB_URL);
  console.log("✅ Connected to MongoDB");

  for (const [fileName, handler] of Object.entries(FILE_HANDLERS)) {
    const filePath = path.join(FILES_DIR, fileName);
    await handler(filePath);
  }

  console.log("\n🎉 All files processed successfully!");
  await mongoose.disconnect();
  process.exit(0);
}

main().catch((err) => {
  console.error("❌ Error:", err);
  process.exit(1);
});
