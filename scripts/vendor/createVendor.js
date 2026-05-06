import mongoose from "mongoose";
import dotenv from "dotenv";
import VendorMaster from "../../src/models/Vendor/VendorMaster.js";

dotenv.config();

const createVendor = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URL);
    console.log("✓ Connected to database\n");

    const vendorPayload = {
      // Vendor Details
      vendorName: "Acme Optics Pvt. Ltd.",
      address: "Plot No. 12, Industrial Area Phase-2",
      city: "Gurugram",
      state: "Haryana",
      country: "India",
      language: "English",
      contactNo: "+91-9876543210",
      email: "procurement@acmeoptics.com",
      taxNo: "06AABCA1234C1Z5",

      // Accounting Details
      accountingDetails: {
        companyCode: "COMP001",
        reconciliationAccount: "RECON-4001",
        paymentMethod: "NEFT",
        cashManagementGroup: "CMG-A",
        toleranceGroup: "TG-01",
        withholdingTaxType: "TDS",
        withholdingTaxCode: "194C",
      },

      // Purchasing Details
      purchasingDetails: {
        isMSME: true,
        purchasingOrganisation: "PO-INDIA",
        orderCurrency: "INR",
        placeOfDelivery: "Delhi Warehouse",
        deliveryTime: "7 Days",
        minimumOrderValue: 5000,
        invoicingPartner: "Acme Finance Dept.",
        vendorSchemaGroup: "VSG-STANDARD",
      },

      // Banking Details
      bankingDetails: {
        bankCountry: "India",
        ifscRoutingNo: "HDFC0001234",
        bankAccountNo: "50100123456789",
        accountHolderName: "Acme Optics Pvt. Ltd.",
        ibanSwift: "HDFCINBB",
      },
    };

    const vendor = await VendorMaster.create(vendorPayload);

    console.log("✓ Vendor created successfully!");
    console.log("─────────────────────────────────────────");
    console.log("Vendor ID      :", vendor.vendorId);
    console.log("MongoDB _id    :", vendor._id.toString());
    console.log("Vendor Name    :", vendor.vendorName);
    console.log("Email          :", vendor.email);
    console.log("City           :", vendor.city);
    console.log("Serial Number  :", vendor.serialNumber);
    console.log("Created At     :", vendor.createdAt);
    console.log("─────────────────────────────────────────");
  } catch (error) {
    console.error("✗ Create vendor failed:", error.message);

    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors).map((e) => e.message);
      console.error("Validation errors:", messages.join(", "));
    }
    if (error.code === 11000) {
      console.error(
        "Duplicate key error:",
        JSON.stringify(error.keyValue)
      );
    }
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log("\nDatabase connection closed.");
  }
};

createVendor();
