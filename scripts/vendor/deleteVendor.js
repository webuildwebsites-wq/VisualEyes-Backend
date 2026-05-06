import mongoose from "mongoose";
import dotenv from "dotenv";
import VendorMaster from "../../src/models/Vendor/VendorMaster.js";

dotenv.config();

const HARD_DELETE = false; // set true for permanent deletion (use with caution!)

const deleteVendor = async () => {
  const arg = process.argv[2];

  if (!arg) {
    console.error(
      "✗ Please provide a vendorId or MongoDB _id as an argument.\n" +
        "  Example: node scripts/vendor/deleteVendor.js VEN-1001"
    );
    process.exit(1);
  }

  try {
    await mongoose.connect(process.env.MONGODB_URL);
    console.log("✓ Connected to database\n");

    const isObjectId = /^[0-9a-fA-F]{24}$/.test(arg);
    const filter = isObjectId
      ? { _id: arg, isDeleted: false }
      : { vendorId: arg.toUpperCase(), isDeleted: false };

    const vendor = await VendorMaster.findOne(filter);

    if (!vendor) {
      console.error(
        `✗ Vendor not found or already deleted for identifier: ${arg}`
      );
      process.exit(1);
    }

    console.log(`Found vendor: ${vendor.vendorName} (${vendor.vendorId})`);

    if (HARD_DELETE) {
      await VendorMaster.findByIdAndDelete(vendor._id);
      console.log(
        `\n✓ Vendor "${vendor.vendorName}" (${vendor.vendorId}) permanently deleted.`
      );
    } else {
      vendor.isDeleted = true;
      vendor.deletedAt = new Date();
      await vendor.save({ validateBeforeSave: false });

      console.log(
        `\n✓ Vendor "${vendor.vendorName}" (${vendor.vendorId}) soft-deleted successfully.`
      );
      console.log("─────────────────────────────────────────");
      console.log("Vendor ID    :", vendor.vendorId);
      console.log("Deleted At   :", vendor.deletedAt);
      console.log(
        "\nNote: Record is still in the database with isDeleted = true."
      );
      console.log(
        "      To restore, update isDeleted to false via the database or add a restore endpoint."
      );
      console.log("─────────────────────────────────────────");
    }
  } catch (error) {
    console.error("✗ Delete vendor failed:", error.message);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log("\nDatabase connection closed.");
  }
};

deleteVendor();
