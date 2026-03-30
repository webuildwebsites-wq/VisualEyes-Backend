import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import XLSX from "xlsx";
import BaseGrid from "../src/models/Product/BaseGrid.js";

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const GRIDS_DIR = path.join(__dirname, "../src/Files/Base Grid Tables_Supplier Wise");

function parseFileName(fileName) {
  const base = path.basename(fileName, ".xlsx").replace(/[\s_]+/g, "_").replace(/\.+/g, "");

  const match = base.match(/^([A-Z]+)_([A-Z0-9]+)_(FF_?Grid|Rx_?Grid|BaseGrid)/i);
  if (!match) return null;

  return {
    supplier:    match[1].toUpperCase(),
    productCode: match[2].toUpperCase(),
    gridType:    match[3].replace("_", "").replace(/grid/i, "Grid"), // normalise casing
  };
}

function parseGridFile(filePath, fileName, supplier, productCode, gridType) {
  const sheetName = path.basename(fileName, ".xlsx");

  const wb   = XLSX.readFile(filePath);
  const ws   = wb.Sheets[wb.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: null });

  const productTitle = rows[0]?.[0] ? String(rows[0][0]).trim() : "";

  const axisLabel = rows[2]?.[1] ? String(rows[2][1]).trim() : "Addition";
  const axisType  = axisLabel.toLowerCase().includes("minus") ? "Minus cylinder" : "Addition";

  const axisValues = (rows[3] ?? [])
    .slice(1)
    .map((v) => (v != null ? parseFloat(v) : null))
    .filter((v) => v !== null && !isNaN(v));

  const grid = [];

  for (let i = 4; i < rows.length; i++) {
    const row = rows[i];
    if (!row || row[0] == null) continue;

    const sphere = parseFloat(row[0]);
    if (isNaN(sphere)) continue;

    axisValues.forEach((axisValue, idx) => {
      const raw   = row[idx + 1];
      const stock = raw != null && raw !== "" ? parseFloat(raw) : null;
      grid.push({
        sphere,
        axisValue,
        stock: isNaN(stock) ? null : stock,
      });
    });
  }

  return {
    supplier,
    productCode,
    gridType,
    sheetName,
    productTitle,
    axisType,
    grid,
  };
}

async function main() {
  await mongoose.connect(process.env.MONGODB_URL);
  console.log("✅ Connected to MongoDB\n");

  console.log("🗑️  Dropping existing BaseGrid collection...");
  // await BaseGrid.deleteMany({});
  console.log("   Done.\n");

  const files = fs.readdirSync(GRIDS_DIR).filter((f) => f.endsWith(".xlsx"));
  console.log(`📂 Found ${files.length} xlsx files\n`);

  let totalFiles = 0, skipped = 0;
  const seen = new Set(); 

  for (const file of files) {
    const meta = parseFileName(file);
    if (!meta) {
      console.warn(`⚠️  Skipping unrecognised filename: ${file}`);
      skipped++;
      continue;
    }

    const { supplier, productCode, gridType } = meta;
    const key = `${supplier}_${productCode}_${gridType}`;

    if (seen.has(key)) {
      console.warn(`⚠️  Duplicate skipped: ${file}`);
      skipped++;
      continue;
    }
    seen.add(key);

    const filePath = path.join(GRIDS_DIR, file);

    try {
      const doc = parseGridFile(filePath, file, supplier, productCode, gridType);
      await BaseGrid.create(doc);
      console.log(`✅ ${file.padEnd(48)} → cells: ${doc.grid.length}`);
      totalFiles++;
    } catch (err) {
      console.error(`❌ Error processing ${file}:`, err.message);
    }
  }

  console.log("\n─────────────────────────────────────────────────────");
  console.log(`🎉 Done! Documents inserted: ${totalFiles} | Skipped: ${skipped}`);
  await mongoose.disconnect();
  process.exit(0);
}

main().catch((err) => {
  console.error("❌ Fatal:", err);
  process.exit(1);
});
