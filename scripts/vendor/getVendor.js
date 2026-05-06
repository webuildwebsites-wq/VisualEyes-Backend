import mongoose from "mongoose";
import dotenv from "dotenv";
import VendorMaster from "../../src/models/Vendor/VendorMaster.js";

dotenv.config();

const getVendor = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URL);
    console.log("✓ Connected to database\n");

    const arg = process.argv[2]; 

    if (arg) {
      const isObjectId = /^[0-9a-fA-F]{24}$/.test(arg);
      const filter = isObjectId
        ? { _id: arg, isDeleted: false }
        : { vendorId: arg.toUpperCase(), isDeleted: false };

      const vendor = await VendorMaster.findOne(filter)
        .populate("createdBy", "employeeName email")
        .populate("updatedBy", "employeeName email")
        .lean();

      if (!vendor) {
        console.log(`✗ No vendor found for identifier: ${arg}`);
        return;
      }

      console.log("✓ Vendor found:");
      console.log("─────────────────────────────────────────");
      console.log("Vendor ID          :", vendor.vendorId);
      console.log("MongoDB _id        :", vendor._id.toString());
      console.log("Vendor Name        :", vendor.vendorName);
      console.log("Email              :", vendor.email);
      console.log("Contact No         :", vendor.contactNo);
      console.log("Address            :", vendor.address);
      console.log("City               :", vendor.city);
      console.log("State              :", vendor.state);
      console.log("Country            :", vendor.country);
      console.log("Tax No             :", vendor.taxNo);
      console.log("\n── Accounting Details ──");
      console.log(JSON.stringify(vendor.accountingDetails, null, 2));
      console.log("\n── Purchasing Details ──");
      console.log(JSON.stringify(vendor.purchasingDetails, null, 2));
      console.log("\n── Banking Details ──");
      console.log(JSON.stringify(vendor.bankingDetails, null, 2));
      console.log("\nCreated At         :", vendor.createdAt);
      console.log(
        "Created By         :",
        vendor.createdBy?.employeeName || "N/A"
      );
      console.log("─────────────────────────────────────────");
    } else {
      const page = 1;
      const limit = 20;
      const skip = (page - 1) * limit;

      const [vendors, total] = await Promise.all([
        VendorMaster.find({ isDeleted: false })
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit)
          .lean(),
        VendorMaster.countDocuments({ isDeleted: false }),
      ]);

      if (vendors.length === 0) {
        console.log("No vendors found in the database.");
        return;
      }

      console.log(`✓ Found ${total} vendor(s). Showing page ${page} (${vendors.length} records):\n`);
      console.log(
        "─────────────────────────────────────────────────────────────────────"
      );
      console.log(
        `${"#".padEnd(5)} ${"Vendor ID".padEnd(12)} ${"Vendor Name".padEnd(30)} ${"City".padEnd(15)} ${"Email"}`
      );
      console.log(
        "─────────────────────────────────────────────────────────────────────"
      );

      vendors.forEach((v, i) => {
        console.log(
          `${String(i + 1).padEnd(5)} ${(v.vendorId || "N/A").padEnd(12)} ${(v.vendorName || "").padEnd(30)} ${(v.city || "").padEnd(15)} ${v.email || ""}`
        );
      });

      console.log(
        "─────────────────────────────────────────────────────────────────────"
      );
      console.log(`Total: ${total} | Page: ${page} | Limit: ${limit}`);
    }
  } catch (error) {
    console.error("✗ Get vendor failed:", error.message);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log("\nDatabase connection closed.");
  }
};

getVendor();
