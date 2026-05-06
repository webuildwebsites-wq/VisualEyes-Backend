import { sendErrorResponse, sendSuccessResponse } from "../../../Utils/response/responseHandler.js";
import VendorMaster from "../../../models/Vendor/VendorMaster.js";

export const registerVendorMaster = async (req, res) => {
  try {
    const {
      vendorName,
      address,
      city,
      state,
      country,
      language,
      contactNo,
      email,
      taxNo,
      accountingDetails,
      purchasingDetails,
      bankingDetails,
    } = req.body;

    if (!vendorName || vendorName.trim() === "") {
      return sendErrorResponse(
        res,
        400,
        "VALIDATION_ERROR",
        "Vendor name is required"
      );
    }

    if (email) {
      const emailRegex = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/;
      if (!emailRegex.test(email)) {
        return sendErrorResponse(
          res,
          400,
          "VALIDATION_ERROR",
          "Please provide a valid email address"
        );
      }

      const existingVendor = await VendorMaster.findOne({
        email: email.toLowerCase(),
        isDeleted: false,
      });
      if (existingVendor) {
        return sendErrorResponse(
          res,
          409,
          "DUPLICATE_EMAIL",
          "A vendor with this email already exists"
        );
      }
    }

    const vendorData = {
      // Vendor Details
      vendorName: vendorName.trim(),
      address: address?.trim(),
      city: city?.trim(),
      state: state?.trim(),
      country: country?.trim(),
      language: language?.trim(),
      contactNo: contactNo?.trim(),
      email: email ? email.toLowerCase().trim() : undefined,
      taxNo: taxNo?.trim(),

      // Accounting Details
      accountingDetails: accountingDetails
        ? {
            companyCode: accountingDetails.companyCode?.trim(),
            reconciliationAccount:
              accountingDetails.reconciliationAccount?.trim(),
            paymentMethod: accountingDetails.paymentMethod?.trim(),
            cashManagementGroup: accountingDetails.cashManagementGroup?.trim(),
            toleranceGroup: accountingDetails.toleranceGroup?.trim(),
            withholdingTaxType: accountingDetails.withholdingTaxType?.trim(),
            withholdingTaxCode: accountingDetails.withholdingTaxCode?.trim(),
          }
        : {},

      // Purchasing Details
      purchasingDetails: purchasingDetails
        ? {
            isMSME: purchasingDetails.isMSME ?? false,
            purchasingOrganisation:
              purchasingDetails.purchasingOrganisation?.trim(),
            orderCurrency: purchasingDetails.orderCurrency?.trim(),
            placeOfDelivery: purchasingDetails.placeOfDelivery?.trim(),
            deliveryTime: purchasingDetails.deliveryTime?.trim(),
            minimumOrderValue: purchasingDetails.minimumOrderValue,
            invoicingPartner: purchasingDetails.invoicingPartner?.trim(),
            vendorSchemaGroup: purchasingDetails.vendorSchemaGroup?.trim(),
          }
        : {},

      // Banking Details
      bankingDetails: bankingDetails
        ? {
            bankCountry: bankingDetails.bankCountry?.trim(),
            ifscRoutingNo: bankingDetails.ifscRoutingNo?.trim(),
            bankAccountNo: bankingDetails.bankAccountNo?.trim(),
            accountHolderName: bankingDetails.accountHolderName?.trim(),
            ibanSwift: bankingDetails.ibanSwift?.trim(),
          }
        : {},

      // Audit
      createdBy: req.user?.id,
    };

    const vendor = await VendorMaster.create(vendorData);

    return sendSuccessResponse(
      res,
      201,
      { vendor },
      "Vendor registered successfully"
    );
  } catch (error) {
    console.error("Register vendor error:", error);

    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors).map((e) => e.message);
      return sendErrorResponse(
        res,
        400,
        "MONGOOSE_VALIDATION_ERROR",
        messages.join(", ")
      );
    }
    if (error.code === 11000) {
      const field = Object.keys(error.keyValue)[0];
      return sendErrorResponse(
        res,
        409,
        "DUPLICATE_FIELD",
        `${field} already exists`
      );
    }
    return sendErrorResponse(
      res,
      500,
      "INTERNAL_ERROR",
      "Vendor registration failed"
    );
  }
};

export const getAllVendors = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      search = "",
      country,
      state,
    } = req.query;

    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit)));
    const skip = (pageNum - 1) * limitNum;

    const filter = { isDeleted: false };

    if (search) {
      filter.$or = [
        { vendorName: { $regex: search, $options: "i" } },
        { vendorId: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
        { city: { $regex: search, $options: "i" } },
        { taxNo: { $regex: search, $options: "i" } },
      ];
    }

    if (country) filter.country = { $regex: country, $options: "i" };
    if (state) filter.state = { $regex: state, $options: "i" };

    const [vendors, total] = await Promise.all([
      VendorMaster.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .populate("createdBy", "employeeName email")
        .lean(),
      VendorMaster.countDocuments(filter),
    ]);

    return sendSuccessResponse(
      res,
      200,
      {
        vendors,
        pagination: {
          total,
          page: pageNum,
          limit: limitNum,
          totalPages: Math.ceil(total / limitNum),
        },
      },
      "Vendors fetched successfully"
    );
  } catch (error) {
    console.error("Get all vendors error:", error);
    return sendErrorResponse(
      res,
      500,
      "INTERNAL_ERROR",
      "Failed to fetch vendors"
    );
  }
};


export const getVendorById = async (req, res) => {
  try {
    const { vendorId } = req.params;

    const isObjectId = /^[0-9a-fA-F]{24}$/.test(vendorId);
    const filter = isObjectId
      ? { _id: vendorId, isDeleted: false }
      : { vendorId: vendorId.toUpperCase(), isDeleted: false };

    const vendor = await VendorMaster.findOne(filter)
      .populate("createdBy", "employeeName email")
      .populate("updatedBy", "employeeName email")
      .lean();

    if (!vendor) {
      return sendErrorResponse(res, 404, "NOT_FOUND", "Vendor not found");
    }

    return sendSuccessResponse(
      res,
      200,
      { vendor },
      "Vendor fetched successfully"
    );
  } catch (error) {
    console.error("Get vendor by ID error:", error);
    return sendErrorResponse(
      res,
      500,
      "INTERNAL_ERROR",
      "Failed to fetch vendor"
    );
  }
};

export const updateVendorMaster = async (req, res) => {
  try {
    const { vendorId } = req.params;

    const isObjectId = /^[0-9a-fA-F]{24}$/.test(vendorId);
    const filter = isObjectId
      ? { _id: vendorId, isDeleted: false }
      : { vendorId: vendorId.toUpperCase(), isDeleted: false };

    const vendor = await VendorMaster.findOne(filter);
    if (!vendor) {
      return sendErrorResponse(res, 404, "NOT_FOUND", "Vendor not found");
    }

    const {
      vendorName,
      address,
      city,
      state,
      country,
      language,
      contactNo,
      email,
      taxNo,
      accountingDetails,
      purchasingDetails,
      bankingDetails,
    } = req.body;

    if (email && email.toLowerCase() !== vendor.email) {
      const emailRegex = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/;
      if (!emailRegex.test(email)) {
        return sendErrorResponse(
          res,
          400,
          "VALIDATION_ERROR",
          "Please provide a valid email address"
        );
      }
      const duplicate = await VendorMaster.findOne({
        email: email.toLowerCase(),
        isDeleted: false,
        _id: { $ne: vendor._id },
      });
      if (duplicate) {
        return sendErrorResponse(
          res,
          409,
          "DUPLICATE_EMAIL",
          "Another vendor with this email already exists"
        );
      }
    }

    const updateFields = { updatedBy: req.user?.id };

    if (vendorName !== undefined) updateFields.vendorName = vendorName.trim();
    if (address !== undefined) updateFields.address = address.trim();
    if (city !== undefined) updateFields.city = city.trim();
    if (state !== undefined) updateFields.state = state.trim();
    if (country !== undefined) updateFields.country = country.trim();
    if (language !== undefined) updateFields.language = language.trim();
    if (contactNo !== undefined) updateFields.contactNo = contactNo.trim();
    if (email !== undefined) updateFields.email = email.toLowerCase().trim();
    if (taxNo !== undefined) updateFields.taxNo = taxNo.trim();

    if (accountingDetails) {
      Object.entries(accountingDetails).forEach(([key, val]) => {
        updateFields[`accountingDetails.${key}`] =
          typeof val === "string" ? val.trim() : val;
      });
    }

    if (purchasingDetails) {
      Object.entries(purchasingDetails).forEach(([key, val]) => {
        updateFields[`purchasingDetails.${key}`] =
          typeof val === "string" ? val.trim() : val;
      });
    }

    if (bankingDetails) {
      Object.entries(bankingDetails).forEach(([key, val]) => {
        updateFields[`bankingDetails.${key}`] =
          typeof val === "string" ? val.trim() : val;
      });
    }

    const updatedVendor = await VendorMaster.findByIdAndUpdate(
      vendor._id,
      { $set: updateFields },
      { new: true, runValidators: true }
    ).lean();

    return sendSuccessResponse(
      res,
      200,
      { vendor: updatedVendor },
      "Vendor updated successfully"
    );
  } catch (error) {
    console.error("Update vendor error:", error);

    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors).map((e) => e.message);
      return sendErrorResponse(
        res,
        400,
        "MONGOOSE_VALIDATION_ERROR",
        messages.join(", ")
      );
    }
    if (error.code === 11000) {
      const field = Object.keys(error.keyValue)[0];
      return sendErrorResponse(
        res,
        409,
        "DUPLICATE_FIELD",
        `${field} already exists`
      );
    }
    return sendErrorResponse(
      res,
      500,
      "INTERNAL_ERROR",
      "Failed to update vendor"
    );
  }
};

export const deleteVendorMaster = async (req, res) => {
  try {
    const { vendorId } = req.params;

    const isObjectId = /^[0-9a-fA-F]{24}$/.test(vendorId);
    const filter = isObjectId
      ? { _id: vendorId, isDeleted: false }
      : { vendorId: vendorId.toUpperCase(), isDeleted: false };

    const vendor = await VendorMaster.findOne(filter);
    if (!vendor) {
      return sendErrorResponse(
        res,
        404,
        "NOT_FOUND",
        "Vendor not found or already deleted"
      );
    }

    vendor.isDeleted = true;
    vendor.deletedAt = new Date();
    vendor.deletedBy = req.user?.id;
    await vendor.save({ validateBeforeSave: false });

    return sendSuccessResponse(
      res,
      200,
      { vendorId: vendor.vendorId },
      "Vendor deleted successfully"
    );
  } catch (error) {
    console.error("Delete vendor error:", error);
    return sendErrorResponse(
      res,
      500,
      "INTERNAL_ERROR",
      "Failed to delete vendor"
    );
  }
};
