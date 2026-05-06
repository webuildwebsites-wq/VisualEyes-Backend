import mongoose from "mongoose";
import dotenv from "dotenv";
import VendorMaster from "../../src/models/Vendor/VendorMaster.js";

dotenv.config();
const vendorIdentifier = "VEN-1"; 

const updatePayload = {
  city: "Noida",
  state: "Uttar Pradesh",
  // contactNo: "+91-9999999999",
  // email: "newemail@acmeoptics.com",
  // taxNo: "09AABCA1234C1Z5",

  accountingDetails: {
    paymentMethod: "RTGS",
    toleranceGroup: "TG-02",
  },

  purchasingDetails: {
    minimumOrderValue: 10000,
    deliveryTime: "5 Days",
  },

  // bankingDetails: {
  //   bankAccountNo: "50100987654321",
  //   ifscRoutingNo: "ICIC0001234",
  // },
};

const updateVendor = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URL);
    console.log("✓ Connected to database\n");
    const isObjectId = /^[0-9a-fA-F]{24}$/.test(vendorIdentifier);
    const filter = isObjectId
      ? { _id: vendorIdentifier, isDeleted: false }
      : { vendorId: vendorIdentifier.toUpperCase(), isDeleted: false };

    const vendor = await VendorMaster.findOne(filter);
    if (!vendor) {
      console.error(`✗ Vendor not found for identifier: ${vendorIdentifier}`);
      process.exit(1);
    }

    console.log(`Found vendor: ${vendor.vendorName} (${vendor.vendorId})`);
    console.log("Applying updates...\n");

    const setFields = {};

    const topLevelFields = [
      "vendorName",
      "address",
      "city",
      "state",
      "country",
      "language",
      "contactNo",
      "email",
      "taxNo",
    ];

    topLevelFields.forEach((field) => {
      if (updatePayload[field] !== undefined) {
        setFields[field] =
          typeof updatePayload[field] === "string"
            ? updatePayload[field].trim()
            : updatePayload[field];
      }
    });

    // Nested sections
    ["accountingDetails", "purchasingDetails", "bankingDetails"].forEach(
      (section) => {
        if (updatePayload[section]) {
          Object.entries(updatePayload[section]).forEach(([key, val]) => {
            setFields[`${section}.${key}`] =
              typeof val === "string" ? val.trim() : val;
          });
        }
      }
    );

    const updatedVendor = await VendorMaster.findByIdAndUpdate(
      vendor._id,
      { $set: setFields },
      { new: true, runValidators: true }
    ).lean();

    console.log("✓ Vendor updated successfully!");
    console.log("─────────────────────────────────────────");
    console.log("Vendor ID      :", updatedVendor.vendorId);
    console.log("Vendor Name    :", updatedVendor.vendorName);
    console.log("City           :", updatedVendor.city);
    console.log("State          :", updatedVendor.state);
    console.log("Updated At     :", updatedVendor.updatedAt);
    console.log("\nFull updated record:");
    console.log(JSON.stringify(updatedVendor, null, 2));
    console.log("─────────────────────────────────────────");
  } catch (error) {
    console.error("✗ Update vendor failed:", error.message);

    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors).map((e) => e.message);
      console.error("Validation errors:", messages.join(", "));
    }
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log("\nDatabase connection closed.");
  }
};

updateVendor();
