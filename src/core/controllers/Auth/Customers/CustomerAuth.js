import {
  sendErrorResponse,
  sendTokenResponse,
  sendSuccessResponse,
} from "../../../../Utils/response/responseHandler.js";
import {
  generateToken,
  generateRefreshToken,
} from "../../../../Utils/Auth/tokenUtils.js";
import CredentialsTemplate from "../../../../Utils/Mail/CredentialsTemplate.js";
import { sendEmail } from "../../../config/Email/emailService.js";
import Customer from "../../../../models/Auth/Customer.js";
import customerDraftSchema from "../../../../models/Auth/CustomerDraft.js";
import Location from "../../../../models/Location/Location.js";
import SpecificLab from "../../../../models/Product/SpecificLab.js";
import Plant from "../../../../models/Product/Plant.js";
import FittingCenter from "../../../../models/Product/FittingCenter.js";
import CreditDay from "../../../../models/Product/CreditDay.js";
import CourierName from "../../../../models/Product/CourierName.js";
import CourierTime from "../../../../models/Product/CourierTime.js";
import customerTypeSchema from "../../../../models/Product/CustomerType.js"
import GSTType from "../../../../models/Product/GSTType.js";
import employeeSchema from "../../../../models/Auth/Employee.js";
import Brand from "../../../../models/Product/Brand.js";
import Category from "../../../../models/Product/Category.js";
import dotenv from "dotenv";
import crypto from "crypto";
import mongoose from "mongoose";
dotenv.config();

export const customerLogin = async (req, res) => {
  try {
    const { emailId, password } = req.body;

    if (!emailId || !password) {
      return sendErrorResponse(
        res,
        400,
        "VALIDATION_ERROR",
        "Please provide email and password",
      );
    }

    const customer = await Customer.findOne({ emailId, 'Status.isActive': true }).select("+password");

    if (!customer) {
      return sendErrorResponse(
        res,
        401,
        "INVALID_CREDENTIALS",
        "Invalid credentials or account is inactive",
      );
    }

    if (customer.isLocked) {
      return sendErrorResponse(
        res,
        423,
        "ACCOUNT_LOCKED",
        "Account is temporarily locked due to too many failed login attempts",
      );
    }

    if (customer.Status.isSuspended) {
      return sendErrorResponse(
        res,
        423,
        "ACCOUNT_SUSPENDED",
        `Account is suspended: ${customer.Status.suspensionReason}`,
      );
    }

    const isMatch = await customer.comparePassword(password);

    if (!isMatch) {
      return sendErrorResponse(
        res,
        401,
        "INVALID_CREDENTIALS",
        "Invalid credentials",
      );
    }
    customer.lastLogin = new Date();
    await customer.save({ validateBeforeSave: false });
    return sendTokenResponse(
      customer,
      200,
      res,
      "CUSTOMER",
      generateToken,
      generateRefreshToken,
    );
  } catch (error) {
    console.error("Customer login error:", error);
    return sendErrorResponse(
      res,
      500,
      "INTERNAL_ERROR",
      "Internal server error during login",
    );
  }
};

export const customerBasicRegistration = async (req, res) => {
  try {
    const {
      CustomerType,
      CustomerTypeRefId,
      zone,
      zoneRefId,
      brandCategories,
      specificLab,
      specificLabRefId,
      emailId,
      businessEmail,
      shopName,
      ownerName,
      orderMode,
      mobileNo1,
      mobileNo2,
      landlineNo,
      gstType,
      gstTypeRefId,
      plant,
      plantRefId,
      fittingCenter,
      fittingCenterRefId,
      creditDays,
      creditDaysRefId,
      creditLimit,
      courierName,
      courierNameRefId,
      courierTime,
      courierTimeRefId,
      address,
      IsGSTRegistered,
      GSTNumber,
      GSTCertificateImg,
      PANCard,
      AadharCard,
      PANCardImg,
      AadharCardImg,
      salesPerson,
      salesPersonRefId,
      customerpassword,
      draftCustomerId,
    } = req.body;

    const userEmployeeType = req.user?.EmployeeType;
    const userDepartment = userEmployeeType === "SUPERADMIN" ? "SUPERADMIN" : req.user?.Department?.name || req.user?.Department;
    const isSalesDepartment = userDepartment === "SALES";
    const isFinanceDepartment = userDepartment === "FINANCE" || userEmployeeType === "SUPERADMIN";

    if (draftCustomerId && !mongoose.Types.ObjectId.isValid(draftCustomerId)) {
      return sendErrorResponse(
        res,
        400,
        "INVALID_ID",
        "Invalid draft customer ID format",
      );
    }

    if (!CustomerType || !shopName || !ownerName || !emailId || !orderMode) {
      return sendErrorResponse(
        res,
        400,
        "VALIDATION_ERROR",
        "CustomerType, shopName, ownerName, emailId and orderMode are required",
      );
    }

    // if (
    //   (isFinanceDepartment || userEmployeeType === "SUPERADMIN") &&
    //   !salesPerson
    // ) {
    //   return sendErrorResponse(
    //     res,
    //     400,
    //     "VALIDATION_ERROR",
    //     "salesPerson is required for FINANCE department and SUPERADMIN Registraion",
    //   );
    // }

    if (!Array.isArray(address) || address.length === 0) {
      return sendErrorResponse(
        res,
        400,
        "VALIDATION_ERROR",
        "At least one address is required",
      );
    }

    for (const addr of address) {
      if (
        !addr.branchAddress ||
        !addr.contactPerson ||
        !addr.contactNumber ||
        !addr.country ||
        !addr.state ||
        !addr.city ||
        !addr.zipCode ||
        !addr.billingCurrency ||
        !addr.billingMode
      ) {
        return sendErrorResponse(
          res,
          400,
          "VALIDATION_ERROR",
          "All address fields are required",
        );
      }
    }

    if (IsGSTRegistered === true) {
      if (!GSTNumber || !gstType || !GSTCertificateImg) {
        return sendErrorResponse(
          res,
          400,
          "VALIDATION_ERROR",
          "GSTNumber, gstType and GSTCertificateImg are required when GST registered",
        );
      }
    } else {
      if (!PANCard || !AadharCard || !PANCardImg || !AadharCardImg) {
        return sendErrorResponse(
          res,
          400,
          "VALIDATION_ERROR",
          "PANCard, AadharCard and their images are required when not GST registered",
        );
      }
    }

    if (isFinanceDepartment || userEmployeeType === "SUPERADMIN") {
      const isValidObjectId = (id) => /^[0-9a-fA-F]{24}$/.test(id);

      const requiredRefIds = [
        { name: "CustomerTypeRefId", value: CustomerTypeRefId },
        { name: "salesPersonRefId", value: salesPersonRefId },
      ];

      for (const field of requiredRefIds) {
        if (!field.value) {
          return sendErrorResponse(
            res,
            400,
            "VALIDATION_ERROR",
            `${field.name} is required for FINANCE department`,
          );
        }
        if (!isValidObjectId(field.value)) {
          return sendErrorResponse(
            res,
            400,
            "VALIDATION_ERROR",
            `${field.name} must be a valid ObjectId (24 hex characters)`,
          );
        }
      }

      const optionalRefIds = [
        { name: "zoneRefId", value: zoneRefId },
        { name: "specificLabRefId", value: specificLabRefId },
        { name: "gstTypeRefId", value: gstTypeRefId },
        { name: "plantRefId", value: plantRefId },
        { name: "fittingCenterRefId", value: fittingCenterRefId },
        { name: "creditDaysRefId", value: creditDaysRefId },
        { name: "courierNameRefId", value: courierNameRefId },
        { name: "courierTimeRefId", value: courierTimeRefId },
      ];

      for (const field of optionalRefIds) {
        if (field.value && !isValidObjectId(field.value)) {
          return sendErrorResponse(
            res,
            400,
            "VALIDATION_ERROR",
            `${field.name} must be a valid ObjectId (24 hex characters)`,
          );
        }
      }

      if (!customerpassword) {
        return sendErrorResponse(
          res,
          400,
          "VALIDATION_ERROR",
          "Password is required for FINANCE department",
        );
      }

      if (
        !brandCategories ||
        !Array.isArray(brandCategories) ||
        brandCategories.length === 0
      ) {
        return sendErrorResponse(
          res,
          400,
          "VALIDATION_ERROR",
          "brandCategories array with at least one brand is required for FINANCE department",
        );
      }

      for (let i = 0; i < brandCategories.length; i++) {
        const brand = brandCategories[i];
        if (!brand.brandName || !brand.brandId) {
          return sendErrorResponse(
            res,
            400,
            "VALIDATION_ERROR",
            `brandCategories[${i}]: brandName and brandId are required`,
          );
        }
        if (!isValidObjectId(brand.brandId)) {
          return sendErrorResponse(
            res,
            400,
            "VALIDATION_ERROR",
            `brandCategories[${i}].brandId must be a valid ObjectId`,
          );
        }
        if (
          !brand.categories ||
          !Array.isArray(brand.categories) ||
          brand.categories.length === 0
        ) {
          return sendErrorResponse(
            res,
            400,
            "VALIDATION_ERROR",
            `brandCategories[${i}]: categories array with at least one category is required`,
          );
        }
        for (let j = 0; j < brand.categories.length; j++) {
          const category = brand.categories[j];
          if (!category.categoryName || !category.categoryId) {
            return sendErrorResponse(
              res,
              400,
              "VALIDATION_ERROR",
              `brandCategories[${i}].categories[${j}]: categoryName and categoryId are required`,
            );
          }
          if (!isValidObjectId(category.categoryId)) {
            return sendErrorResponse(
              res,
              400,
              "VALIDATION_ERROR",
              `brandCategories[${i}].categories[${j}].categoryId must be a valid ObjectId`,
            );
          }
        }
      }

      if (!salesPerson || !salesPersonRefId) {
        return sendErrorResponse(
          res,
          400,
          "VALIDATION_ERROR",
          "salesPerson and salesPersonRefId are required for FINANCE department",
        );
      }
    }

    if (isSalesDepartment) {
      const isValidObjectId = (id) => /^[0-9a-fA-F]{24}$/.test(id);

      if (CustomerTypeRefId && !isValidObjectId(CustomerTypeRefId)) {
        return sendErrorResponse(
          res,
          400,
          "VALIDATION_ERROR",
          `CustomerTypeRefId must be a valid ObjectId (24 hex characters)`,
        );
      }
    }

    const existingCustomer = await Customer.findOne({
      emailId: emailId.toLowerCase(),
    });
    if (existingCustomer) {
      return sendErrorResponse(
        res,
        409,
        "CUSTOMER_EXISTS",
        "Customer with this email already exists",
      );
    }

    // Validate CustomerType
    if (CustomerTypeRefId && CustomerType) {
      const customerType = await customerTypeSchema.findById(CustomerTypeRefId);
      if (!customerType) {
        return sendErrorResponse(
          res,
          404,
          "INVALID_REF_ID",
          `CustomerType with refId ${CustomerTypeRefId} does not exist`
        );
      }
      if (customerType.name !== CustomerType) {
        return sendErrorResponse(
          res,
          400,
          "NAME_MISMATCH",
          `Incorrect CustomerType name for refId ${CustomerTypeRefId}. Expected: ${customerType.name}, Received: ${CustomerType}`
        );
      }
    }

    // Validate zone
    if (zoneRefId && zone) {
      const location = await Location.findById(zoneRefId);
      if (!location) {
        return sendErrorResponse(
          res,
          404,
          "INVALID_REF_ID",
          `Zone with refId ${zoneRefId} does not exist`
        );
      }
      if (location.zone !== zone.toUpperCase()) {
        return sendErrorResponse(
          res,
          400,
          "NAME_MISMATCH",
          `Incorrect zone name for refId ${zoneRefId}. Expected: ${location.zone}, Received: ${zone}`
        );
      }
    }

    // Validate specificLab
    if (specificLabRefId && specificLab) {
      const specificLabDoc = await SpecificLab.findById(specificLabRefId);
      if (!specificLabDoc) {
        return sendErrorResponse(
          res,
          404,
          "INVALID_REF_ID",
          `SpecificLab with refId ${specificLabRefId} does not exist`
        );
      }
      if (specificLabDoc.name !== specificLab) {
        return sendErrorResponse(
          res,
          400,
          "NAME_MISMATCH",
          `Incorrect specificLab name for refId ${specificLabRefId}. Expected: ${specificLabDoc.name}, Received: ${specificLab}`
        );
      }
    }

    // Validate plant
    if (plantRefId && plant) {
      const plantDoc = await Plant.findById(plantRefId);
      if (!plantDoc) {
        return sendErrorResponse(
          res,
          404,
          "INVALID_REF_ID",
          `Plant with refId ${plantRefId} does not exist`
        );
      }
      if (plantDoc.name !== plant) {
        return sendErrorResponse(
          res,
          400,
          "NAME_MISMATCH",
          `Incorrect plant name for refId ${plantRefId}. Expected: ${plantDoc.name}, Received: ${plant}`
        );
      }
    }

    // Validate fittingCenter
    if (fittingCenterRefId && fittingCenter) {
      const fittingCenterDoc = await FittingCenter.findById(fittingCenterRefId);
      if (!fittingCenterDoc) {
        return sendErrorResponse(
          res,
          404,
          "INVALID_REF_ID",
          `FittingCenter with refId ${fittingCenterRefId} does not exist`
        );
      }
      if (fittingCenterDoc.name !== fittingCenter) {
        return sendErrorResponse(
          res,
          400,
          "NAME_MISMATCH",
          `Incorrect fittingCenter name for refId ${fittingCenterRefId}. Expected: ${fittingCenterDoc.name}, Received: ${fittingCenter}`
        );
      }
    }

    // Validate creditDays
    if (creditDaysRefId && creditDays) {
      const creditDayDoc = await CreditDay.findById(creditDaysRefId);
      if (!creditDayDoc) {
        return sendErrorResponse(
          res,
          404,
          "INVALID_REF_ID",
          `CreditDays with refId ${creditDaysRefId} does not exist`
        );
      }
      if (creditDayDoc.days.toString() !== creditDays.toString()) {
        return sendErrorResponse(
          res,
          400,
          "NAME_MISMATCH",
          `Incorrect creditDays value for refId ${creditDaysRefId}. Expected: ${creditDayDoc.days}, Received: ${creditDays}`
        );
      }
    }

    // Validate courierName
    if (courierNameRefId && courierName) {
      const courierNameDoc = await CourierName.findById(courierNameRefId);
      if (!courierNameDoc) {
        return sendErrorResponse(
          res,
          404,
          "INVALID_REF_ID",
          `CourierName with refId ${courierNameRefId} does not exist`
        );
      }
      if (courierNameDoc.name !== courierName) {
        return sendErrorResponse(
          res,
          400,
          "NAME_MISMATCH",
          `Incorrect courierName for refId ${courierNameRefId}. Expected: ${courierNameDoc.name}, Received: ${courierName}`
        );
      }
    }

    // Validate courierTime
    if (courierTimeRefId && courierTime) {
      const courierTimeDoc = await CourierTime.findById(courierTimeRefId);
      if (!courierTimeDoc) {
        return sendErrorResponse(
          res,
          404,
          "INVALID_REF_ID",
          `CourierTime with refId ${courierTimeRefId} does not exist`
        );
      }

      if (courierTimeDoc.time !== courierTime) {
        return sendErrorResponse(
          res,
          400,
          "NAME_MISMATCH",
          `Incorrect courierTime for refId ${courierTimeRefId}. Expected: ${courierTimeDoc.time}, Received: ${courierTime}`
        );
      }
    }

    // Validate gstType
    if (gstTypeRefId && gstType) {
      const gstTypeDoc = await GSTType.findById(gstTypeRefId);
      if (!gstTypeDoc) {
        return sendErrorResponse(
          res,
          404,
          "INVALID_REF_ID",
          `GSTType with refId ${gstTypeRefId} does not exist`
        );
      }
      if (gstTypeDoc.name !== gstType) {
        return sendErrorResponse(
          res,
          400,
          "NAME_MISMATCH",
          `Incorrect gstType name for refId ${gstTypeRefId}. Expected: ${gstTypeDoc.name}, Received: ${gstType}`
        );
      }
    }
    // Validate salesPerson
    if (salesPersonRefId && salesPerson) {
      const salesPersonDoc = await employeeSchema.findById(salesPersonRefId);
      if (!salesPersonDoc) {
        return sendErrorResponse(
          res,
          404,
          "INVALID_REF_ID",
          `SalesPerson with refId ${salesPersonRefId} does not exist`
        );
      }
      if (salesPersonDoc.employeeName !== salesPerson) {
        return sendErrorResponse(
          res,
          400,
          "NAME_MISMATCH",
          `Incorrect salesPerson name for refId ${salesPersonRefId}. Expected: ${salesPersonDoc.employeeName}, Received: ${salesPerson}`
        );
      }
    }

    // Validate brandCategories
    if (brandCategories && Array.isArray(brandCategories)) {
      
      for (let i = 0; i < brandCategories.length; i++) {
        const brand = brandCategories[i];
        
        // Validate brand
        const brandDoc = await Brand.findById(brand.brandId);
        if (!brandDoc) {
          return sendErrorResponse(
            res,
            404,
            "INVALID_REF_ID",
            `Brand with refId ${brand.brandId} does not exist in brandCategories[${i}]`
          );
        }
        if (brandDoc.name !== brand.brandName.toUpperCase()) {
          return sendErrorResponse(
            res,
            400,
            "NAME_MISMATCH",
            `Incorrect brand name for refId ${brand.brandId} in brandCategories[${i}]. Expected: ${brandDoc.name}, Received: ${brand.brandName}`
          );
        }

        // Validate categories
        if (brand.categories && Array.isArray(brand.categories)) {
          for (let j = 0; j < brand.categories.length; j++) {
            const category = brand.categories[j];
            
            const categoryDoc = await Category.findById(category.categoryId);
            if (!categoryDoc) {
              return sendErrorResponse(
                res,
                404,
                "INVALID_REF_ID",
                `Category with refId ${category.categoryId} does not exist in brandCategories[${i}].categories[${j}]`
              );
            }
            if (categoryDoc.name !== category.categoryName) {
              return sendErrorResponse(
                res,
                400,
                "NAME_MISMATCH",
                `Incorrect category name for refId ${category.categoryId} in brandCategories[${i}].categories[${j}]. Expected: ${categoryDoc.name}, Received: ${category.categoryName}`
              );
            }
            // Verify category belongs to the brand
            if (categoryDoc.brand.toString() !== brand.brandId) {
              return sendErrorResponse(
                res,
                400,
                "BRAND_CATEGORY_MISMATCH",
                `Category "${category.categoryName}" does not belong to brand "${brand.brandName}" in brandCategories[${i}].categories[${j}]`
              );
            }
          }
        }
      }
    }

    const EmailOtp = Math.floor(100000 + Math.random() * 800000).toString();
    const MobileOtp = Math.floor(100000 + Math.random() * 900000).toString();

    const customerData = {
      // Customer Info.
      shopName: shopName.trim(),
      ownerName: ownerName.trim(),
      CustomerType: CustomerTypeRefId
        ? {
          name: CustomerType,
          refId: CustomerTypeRefId,
        }
        : undefined,
      orderMode,
      mobileNo1,
      mobileNo2,
      landlineNo,
      emailId: emailId.toLowerCase().trim(),
      businessEmail: businessEmail
        ? businessEmail.toLowerCase().trim()
        : undefined,
      IsGSTRegistered,
      GSTNumber: IsGSTRegistered ? GSTNumber : undefined,
      gstType:
        IsGSTRegistered && gstType
          ? {
            name: gstType,
            refId: gstTypeRefId,
          }
          : undefined,
      GSTCertificateImg: IsGSTRegistered ? GSTCertificateImg : undefined,
      PANCard: !IsGSTRegistered ? PANCard : undefined,
      AadharCard: !IsGSTRegistered ? AadharCard : undefined,
      PANCardImg: !IsGSTRegistered ? PANCardImg : undefined,
      AadharCardImg: !IsGSTRegistered ? AadharCardImg : undefined,
      
      // Account Status
      Status: {
        isActive: isFinanceDepartment ? true : false,
        isSuspended: false,
      },

      // Address
      address: address.map((addr) => ({
        branchAddress: addr.branchAddress.trim(),
        contactPerson: addr.contactPerson.trim(),
        contactNumber: addr.contactNumber.trim(),
        country: addr.country,
        state: addr.state,
        zipCode: addr.zipCode,
        city: addr.city.trim(),
        billingCurrency: addr.billingCurrency,
        billingMode: addr.billingMode,
      })),

      // Customer Registration - Only for FINANCE department or SUPERADMIN
      password: isFinanceDepartment || userEmployeeType === "SUPERADMIN" ? customerpassword : undefined,
      brandCategories: (isFinanceDepartment || userEmployeeType === "SUPERADMIN") && brandCategories ? brandCategories : undefined,

      zone: (isFinanceDepartment || userEmployeeType === "SUPERADMIN") &&
        zone &&
        zoneRefId
        ? {
          name: zone,
          refId: zoneRefId,
        }
        : undefined,

      salesPerson:
        (isFinanceDepartment || userEmployeeType === "SUPERADMIN") &&
          salesPerson &&
          salesPersonRefId
          ? {
            name: salesPerson,
            refId: salesPersonRefId,
          }
          : undefined,

      specificLab:
        (isFinanceDepartment || userEmployeeType === "SUPERADMIN") &&
          specificLab &&
          specificLabRefId
          ? {
            name: specificLab,
            refId: specificLabRefId,
          }
          : undefined,

      fittingCenter:
        (isFinanceDepartment || userEmployeeType === "SUPERADMIN") &&
          fittingCenter &&
          fittingCenterRefId
          ? {
            name: fittingCenter,
            refId: fittingCenterRefId,
          }
          : undefined,

      plant:
        (isFinanceDepartment || userEmployeeType === "SUPERADMIN") &&
          plant &&
          plantRefId
          ? {
            name: plant,
            refId: plantRefId,
          }
          : undefined,

      creditLimit:
        isFinanceDepartment || userEmployeeType === "SUPERADMIN"
          ? creditLimit
          : null,

      creditDays:
        (isFinanceDepartment || userEmployeeType === "SUPERADMIN") &&
          creditDays &&
          creditDaysRefId
          ? {
            name: creditDays,
            refId: creditDaysRefId,
          }
          : undefined,

      courierName:
        (isFinanceDepartment || userEmployeeType === "SUPERADMIN") &&
          courierName &&
          courierNameRefId
          ? {
            name: courierName,
            refId: courierNameRefId,
          }
          : undefined,

      courierTime:
        (isFinanceDepartment || userEmployeeType === "SUPERADMIN") &&
          courierTime &&
          courierTimeRefId
          ? {
            name: courierTime,
            refId: courierTimeRefId,
          }
          : undefined,

      // System Internal details
      dcWithoutValue: false,
      designation: "Customer",
      createdBy: req.user.id,
      createdByDepartment: userDepartment,
      approvalStatus: isSalesDepartment ? "PENDING_FINANCE" : "APPROVED",
      emailOtp: EmailOtp,
      emailOtpExpires: new Date(Date.now() + 10 * 60 * 1000),
      mobileOtp: MobileOtp,
      mobileOtpExpires: new Date(Date.now() + 10 * 60 * 1000),
    };

    const customer = await Customer.create(customerData);
    
    if (draftCustomerId) {
      try {
        const deletedDraft = await customerDraftSchema.findByIdAndDelete(draftCustomerId);
        if (deletedDraft) {
          console.log(`Draft customer ${draftCustomerId} deleted successfully`);
        } else {
          console.warn(`Draft customer ${draftCustomerId} not found for deletion`);
        }
      } catch (draftError) {
        console.error(`Error deleting draft customer ${draftCustomerId}:`, draftError);
      }
    }

    // Only send credentials email if password was set (FINANCE department or SUPERADMIN)
    if (
      (isFinanceDepartment || userEmployeeType === "SUPERADMIN") &&
      customerpassword
    ) {
      sendEmail({
        to: emailId,
        subject: "Welcome Mail for choosing VISUAL EYES",
        html: CredentialsTemplate(ownerName, emailId, customerpassword),
      }).catch((err) => console.error("Background email error:", err));
    }

    const customerObj = customer.toObject();
    delete customerObj.password;
    delete customerObj.emailOtp;
    delete customerObj.mobileOtp;

    const message = isSalesDepartment
      ? "Customer registered successfully. Pending Finance approval."
      : "Customer registered and approved successfully.";

    return sendSuccessResponse(res, 201, { customer: customerObj }, message);
  } catch (error) {
    console.error("Customer registration error:", error);
    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors).map((err) => err.message);
      return sendErrorResponse(
        res,
        400,
        "MONGOOSE_VALIDATION_ERROR",
        messages.join(", "),
      );
    }
    if (error.code === 11000) {
      const field = Object.keys(error.keyValue)[0];
      return sendErrorResponse(
        res,
        409,
        "DUPLICATE_FIELD",
        `${field} already exists`,
      );
    }
    return sendErrorResponse(
      res,
      500,
      "INTERNAL_ERROR",
      "Customer registration failed",
    );
  }
};

export const customerForgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return sendErrorResponse(
        res,
        400,
        "VALIDATION_ERROR",
        "Please provide email address",
      );
    }

    const customer = await Customer.findOne({
      emailId: email,
      "Status.isActive": true,
    });

    if (!customer) {
      return sendErrorResponse(
        res,
        404,
        "USER_NOT_FOUND",
        "No customer found with that email address",
      );
    }

    const resetToken = crypto.randomBytes(20).toString("hex");
    customer.passwordResetToken = crypto
      .createHash("sha256")
      .update(resetToken)
      .digest("hex");

    customer.passwordResetExpires = Date.now() + 10 * 60 * 1000;

    await customer.save({ validateBeforeSave: false });

    const response = {
      message: "Password reset link sent to email",
      ...(process.env.NODE_ENV === "development" && { resetToken }),
    };

    return sendSuccessResponse(res, 200, null, response.message);
  } catch (error) {
    console.error("Customer forgot password error:", error);
    return sendErrorResponse(
      res,
      500,
      "INTERNAL_ERROR",
      "Email could not be sent",
    );
  }
};

export const customerResetPassword = async (req, res) => {
  try {
    const { password } = req.body;

    if (!password) {
      return sendErrorResponse(
        res,
        400,
        "VALIDATION_ERROR",
        "Please provide new password",
      );
    }

    const resetPasswordToken = crypto
      .createHash("sha256")
      .update(req.params.resettoken)
      .digest("hex");

    const customer = await Customer.findOne({
      passwordResetToken: resetPasswordToken,
      passwordResetExpires: { $gt: Date.now() },
    });

    if (!customer) {
      return sendErrorResponse(
        res,
        400,
        "INVALID_TOKEN",
        "Invalid or expired reset token",
      );
    }

    customer.password = password;
    customer.passwordResetToken = undefined;
    customer.passwordResetExpires = undefined;

    await customer.save();

    return sendTokenResponse(
      customer,
      200,
      res,
      "CUSTOMER",
      generateToken,
      generateRefreshToken,
    );
  } catch (error) {
    console.error("Customer reset password error:", error);
    return sendErrorResponse(
      res,
      500,
      "INTERNAL_ERROR",
      "Password could not be reset",
    );
  }
};

export const customerUpdatePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return sendErrorResponse(
        res,
        400,
        "VALIDATION_ERROR",
        "Please provide current password and new password",
      );
    }

    const customer = await Customer.findById(req.user.id).select("+password");

    if (!(await customer.comparePassword(currentPassword))) {
      return sendErrorResponse(
        res,
        401,
        "INVALID_PASSWORD",
        "Current password is incorrect",
      );
    }

    customer.password = newPassword;
    await customer.save();

    return sendTokenResponse(
      customer,
      200,
      res,
      "CUSTOMER",
      generateToken,
      generateRefreshToken,
    );
  } catch (error) {
    console.error("Customer update password error:", error);
    return sendErrorResponse(
      res,
      500,
      "INTERNAL_ERROR",
      "Password could not be updated",
    );
  }
};

export const financeCompleteCustomer = async (req, res) => {
  try {
    const { customerId } = req.params;
    const userDepartment = req.user.Department?.name || req.user.Department;

    if (userDepartment !== 'FINANCE' && userDepartment !== 'SUPERADMIN') {
      return sendErrorResponse(res, 403, "FORBIDDEN", "Only Finance department can complete customer registration");
    }

    const customer = await Customer.findById(customerId);

    if (!customer) {
      return sendErrorResponse(res, 404, "NOT_FOUND", "Customer not found");
    }

    if (customer.approvalStatus === "APPROVED") {
      return sendErrorResponse(
        res,
        400,
        "ALREADY_APPROVED",
        "Customer is already approved. Cannot update.",
      );
    }

    const requiredFinanceFields = [
      "zone",
      "plant",
      "fittingCenter",
      "creditDays",
      "courierName",
      "courierTime",
      "brandCategories",
      "specificLab",
      "salesPerson",
    ];

    const missingFields = requiredFinanceFields.filter((field) => !req.body[field],);

    if (missingFields.length > 0) {
      return sendErrorResponse(
        res,
        400,
        "VALIDATION_ERROR",
        `Missing required fields: ${missingFields.join(", ")}`,
      );
    }

    const { brandCategories } = req.body;
    const isValidObjectId = (id) => /^[0-9a-fA-F]{24}$/.test(id);

    if (!Array.isArray(brandCategories) || brandCategories.length === 0) {
      return sendErrorResponse(
        res,
        400,
        "VALIDATION_ERROR",
        "brandCategories must be an array with at least one brand",
      );
    }

    for (let i = 0; i < brandCategories.length; i++) {
      const brand = brandCategories[i];
      if (!brand.brandName || !brand.brandId) {
        return sendErrorResponse(
          res,
          400,
          "VALIDATION_ERROR",
          `brandCategories[${i}]: brandName and brandId are required`,
        );
      }
      if (!isValidObjectId(brand.brandId)) {
        return sendErrorResponse(
          res,
          400,
          "VALIDATION_ERROR",
          `brandCategories[${i}].brandId must be a valid ObjectId`,
        );
      }
      if (
        !brand.categories ||
        !Array.isArray(brand.categories) ||
        brand.categories.length === 0
      ) {
        return sendErrorResponse(
          res,
          400,
          "VALIDATION_ERROR",
          `brandCategories[${i}]: categories array with at least one category is required`,
        );
      }
      for (let j = 0; j < brand.categories.length; j++) {
        const category = brand.categories[j];
        if (!category.categoryName || !category.categoryId) {
          return sendErrorResponse(
            res,
            400,
            "VALIDATION_ERROR",
            `brandCategories[${i}].categories[${j}]: categoryName and categoryId are required`,
          );
        }
        if (!isValidObjectId(category.categoryId)) {
          return sendErrorResponse(
            res,
            400,
            "VALIDATION_ERROR",
            `brandCategories[${i}].categories[${j}].categoryId must be a valid ObjectId`,
          );
        }
      }
    }

    // Validate zone
    if (req.body.zone && req.body.zoneRefId) {
      const location = await Location.findById(req.body.zoneRefId);
      if (!location) {
        return sendErrorResponse(
          res,
          404,
          "INVALID_REF_ID",
          `Zone with refId ${req.body.zoneRefId} does not exist`
        );
      }
      if (location.zone !== req.body.zone.toUpperCase()) {
        return sendErrorResponse(
          res,
          400,
          "NAME_MISMATCH",
          `Incorrect zone name for refId ${req.body.zoneRefId}. Expected: ${location.zone}, Received: ${req.body.zone}`
        );
      }
    }

    // Validate specificLab
    if (req.body.specificLab && req.body.specificLabRefId) {
      const specificLabDoc = await SpecificLab.findById(req.body.specificLabRefId);
      if (!specificLabDoc) {
        return sendErrorResponse(
          res,
          404,
          "INVALID_REF_ID",
          `SpecificLab with refId ${req.body.specificLabRefId} does not exist`
        );
      }
      if (specificLabDoc.name !== req.body.specificLab) {
        return sendErrorResponse(
          res,
          400,
          "NAME_MISMATCH",
          `Incorrect specificLab name for refId ${req.body.specificLabRefId}. Expected: ${specificLabDoc.name}, Received: ${req.body.specificLab}`
        );
      }
    }

    // Validate plant
    if (req.body.plant && req.body.plantRefId) {
      const plantDoc = await Plant.findById(req.body.plantRefId);
      if (!plantDoc) {
        return sendErrorResponse(
          res,
          404,
          "INVALID_REF_ID",
          `Plant with refId ${req.body.plantRefId} does not exist`
        );
      }
      if (plantDoc.name !== req.body.plant) {
        return sendErrorResponse(
          res,
          400,
          "NAME_MISMATCH",
          `Incorrect plant name for refId ${req.body.plantRefId}. Expected: ${plantDoc.name}, Received: ${req.body.plant}`
        );
      }
    }

    // Validate fittingCenter
    if (req.body.fittingCenter && req.body.fittingCenterRefId) {
      const fittingCenterDoc = await FittingCenter.findById(req.body.fittingCenterRefId);
      if (!fittingCenterDoc) {
        return sendErrorResponse(
          res,
          404,
          "INVALID_REF_ID",
          `FittingCenter with refId ${req.body.fittingCenterRefId} does not exist`
        );
      }
      if (fittingCenterDoc.name !== req.body.fittingCenter) {
        return sendErrorResponse(
          res,
          400,
          "NAME_MISMATCH",
          `Incorrect fittingCenter name for refId ${req.body.fittingCenterRefId}. Expected: ${fittingCenterDoc.name}, Received: ${req.body.fittingCenter}`
        );
      }
    }

    // Validate creditDays
    if (req.body.creditDays && req.body.creditDaysRefId) {
      const creditDayDoc = await CreditDay.findById(req.body.creditDaysRefId);
      if (!creditDayDoc) {
        return sendErrorResponse(
          res,
          404,
          "INVALID_REF_ID",
          `CreditDays with refId ${req.body.creditDaysRefId} does not exist`
        );
      }
      if (creditDayDoc.days.toString() !== req.body.creditDays.toString()) {
        return sendErrorResponse(
          res,
          400,
          "NAME_MISMATCH",
          `Incorrect creditDays value for refId ${req.body.creditDaysRefId}. Expected: ${creditDayDoc.days}, Received: ${req.body.creditDays}`
        );
      }
    }

    // Validate courierName
    if (req.body.courierName && req.body.courierNameRefId) {
      const courierNameDoc = await CourierName.findById(req.body.courierNameRefId);
      if (!courierNameDoc) {
        return sendErrorResponse(
          res,
          404,
          "INVALID_REF_ID",
          `CourierName with refId ${req.body.courierNameRefId} does not exist`
        );
      }
      if (courierNameDoc.name !== req.body.courierName) {
        return sendErrorResponse(
          res,
          400,
          "NAME_MISMATCH",
          `Incorrect courierName for refId ${req.body.courierNameRefId}. Expected: ${courierNameDoc.name}, Received: ${req.body.courierName}`
        );
      }
    }

    // Validate courierTime
    if (req.body.courierTime && req.body.courierTimeRefId) {
      const courierTimeDoc = await CourierTime.findById(req.body.courierTimeRefId);
      if (!courierTimeDoc) {
        return sendErrorResponse(
          res,
          404,
          "INVALID_REF_ID",
          `CourierTime with refId ${req.body.courierTimeRefId} does not exist`
        );
      }

      if (courierTimeDoc.time !== req.body.courierTime) {
        return sendErrorResponse(
          res,
          400,
          "NAME_MISMATCH",
          `Incorrect courierTime for refId ${req.body.courierTimeRefId}. Expected: ${courierTimeDoc.time}, Received: ${req.body.courierTime}`
        );
      }
    }

    // Validate salesPerson
    if (req.body.salesPerson && req.body.salesPersonRefId) {
      const salesPersonDoc = await employeeSchema.findById(req.body.salesPersonRefId);
      if (!salesPersonDoc) {
        return sendErrorResponse(
          res,
          404,
          "INVALID_REF_ID",
          `SalesPerson with refId ${req.body.salesPersonRefId} does not exist`
        );
      }
      if (salesPersonDoc.employeeName !== req.body.salesPerson) {
        return sendErrorResponse(
          res,
          400,
          "NAME_MISMATCH",
          `Incorrect salesPerson name for refId ${req.body.salesPersonRefId}. Expected: ${salesPersonDoc.employeeName}, Received: ${req.body.salesPerson}`
        );
      }
    }

    for (let i = 0; i < brandCategories.length; i++) {
      const brand = brandCategories[i];
      
      // Validate brand
      const brandDoc = await Brand.findById(brand.brandId);
      if (!brandDoc) {
        return sendErrorResponse(
          res,
          404,
          "INVALID_REF_ID",
          `Brand with refId ${brand.brandId} does not exist in brandCategories[${i}]`
        );
      }
      if (brandDoc.name !== brand.brandName.toUpperCase()) {
        return sendErrorResponse(
          res,
          400,
          "NAME_MISMATCH",
          `Incorrect brand name for refId ${brand.brandId} in brandCategories[${i}]. Expected: ${brandDoc.name}, Received: ${brand.brandName}`
        );
      }

      // Validate categories
      if (brand.categories && Array.isArray(brand.categories)) {
        for (let j = 0; j < brand.categories.length; j++) {
          const category = brand.categories[j];
          
          const categoryDoc = await Category.findById(category.categoryId);
          if (!categoryDoc) {
            return sendErrorResponse(
              res,
              404,
              "INVALID_REF_ID",
              `Category with refId ${category.categoryId} does not exist in brandCategories[${i}].categories[${j}]`
            );
          }
          if (categoryDoc.name !== category.categoryName) {
            return sendErrorResponse(
              res,
              400,
              "NAME_MISMATCH",
              `Incorrect category name for refId ${category.categoryId} in brandCategories[${i}].categories[${j}]. Expected: ${categoryDoc.name}, Received: ${category.categoryName}`
            );
          }
          // Verify category belongs to the brand
          if (categoryDoc.brand.toString() !== brand.brandId) {
            return sendErrorResponse(
              res,
              400,
              "BRAND_CATEGORY_MISMATCH",
              `Category "${category.categoryName}" does not belong to brand "${brand.brandName}" in brandCategories[${i}].categories[${j}]`
            );
          }
        }
      }
    }

    const updateData = {
      password: req.body.password,
      zone: req.body.zone,
      brandCategories: req.body.brandCategories,
      specificLab: req.body.specificLab,
      salesPerson: req.body.salesPerson,
      plant: req.body.plant,
      fittingCenter: req.body.fittingCenter,
      creditDays: req.body.creditDays,
      creditLimit: req.body.creditLimit,
      courierName: req.body.courierName,
      courierTime: req.body.courierTime,
      approvalStatus: "APPROVED",
      financeCompletedBy: req.user.id,
      financeCompletedAt: new Date(),
      Status : {
        isActive : true,
        isSuspended : false,
      }
    };

    Object.assign(customer, updateData);
    await customer.save();

    return sendSuccessResponse(
      res,
      200,
      customer,
      "Customer completed and approved by Finance successfully",
    );
  } catch (error) {
    console.error("Finance complete customer error:", error);

    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors).map((err) => err.message);
      return sendErrorResponse(
        res,
        400,
        "VALIDATION_ERROR",
        messages.join(", "),
      );
    }

    return sendErrorResponse(
      res,
      500,
      "INTERNAL_ERROR",
      "Internal server error during customer completion",
    );
  }
};

export const updateCustomerProfile = async (req, res) => {
  try {
    const customerId = req.params.customerId;
    const updateData = req.body;

    const customer = await Customer.findById(customerId);
    console.log("customer : ", customer);

    if (!customer) {
      return sendErrorResponse(res, 404, "NOT_FOUND", "Customer not found");
    }

    const updateFields = {};

    if (updateData.shopName) updateFields.shopName = updateData.shopName;
    if (updateData.ownerName) updateFields.ownerName = updateData.ownerName;
    if (updateData.mobileNo1) updateFields.mobileNo1 = updateData.mobileNo1;
    if (updateData.mobileNo2) updateFields.mobileNo2 = updateData.mobileNo2;
    if (updateData.landlineNo) updateFields.landlineNo = updateData.landlineNo;
    if (updateData.creditUsed) updateFields.creditUsed = updateData.creditUsed;
    if (updateData.businessEmail)
      updateFields.businessEmail = updateData.businessEmail;

    // Validate CustomerType
    if (updateData.CustomerType && updateData.CustomerTypeRefId) {
      const customerType = await customerTypeSchema.findById(updateData.CustomerTypeRefId);
      if (!customerType) {
        return sendErrorResponse(
          res,
          404,
          "INVALID_REF_ID",
          `CustomerType with refId ${updateData.CustomerTypeRefId} does not exist`
        );
      }
      if (customerType.name !== updateData.CustomerType) {
        return sendErrorResponse(
          res,
          400,
          "NAME_MISMATCH",
          `Incorrect CustomerType name for refId ${updateData.CustomerTypeRefId}. Expected: ${customerType.name}, Received: ${updateData.CustomerType}`
        );
      }
      updateFields.CustomerType = {
        name: updateData.CustomerType,
        refId: updateData.CustomerTypeRefId,
      };
    }

    // Validate zone
    if (updateData.zone && updateData.zoneRefId) {
      const location = await Location.findById(updateData.zoneRefId);
      if (!location) {
        return sendErrorResponse(
          res,
          404,
          "INVALID_REF_ID",
          `Zone with refId ${updateData.zoneRefId} does not exist`
        );
      }
      if (location.zone !== updateData.zone.toUpperCase()) {
        return sendErrorResponse(
          res,
          400,
          "NAME_MISMATCH",
          `Incorrect zone name for refId ${updateData.zoneRefId}. Expected: ${location.zone}, Received: ${updateData.zone}`
        );
      }
      updateFields.zone = {
        name: updateData.zone.toUpperCase(),
        refId: updateData.zoneRefId,
      };
    }

    // Validate specificLab
    if (updateData.specificLab && updateData.specificLabRefId) {
      const specificLab = await SpecificLab.findById(updateData.specificLabRefId);
      if (!specificLab) {
        return sendErrorResponse(
          res,
          404,
          "INVALID_REF_ID",
          `SpecificLab with refId ${updateData.specificLabRefId} does not exist`
        );
      }
      if (specificLab.name !== updateData.specificLab) {
        return sendErrorResponse(
          res,
          400,
          "NAME_MISMATCH",
          `Incorrect specificLab name for refId ${updateData.specificLabRefId}. Expected: ${specificLab.name}, Received: ${updateData.specificLab}`
        );
      }
      updateFields.specificLab = {
        name: updateData.specificLab,
        refId: updateData.specificLabRefId,
      };
    }

    // Validate plant
    if (updateData.plant && updateData.plantRefId) {
      const plant = await Plant.findById(updateData.plantRefId);
      if (!plant) {
        return sendErrorResponse(
          res,
          404,
          "INVALID_REF_ID",
          `Plant with refId ${updateData.plantRefId} does not exist`
        );
      }
      if (plant.name !== updateData.plant) {
        return sendErrorResponse(
          res,
          400,
          "NAME_MISMATCH",
          `Incorrect plant name for refId ${updateData.plantRefId}. Expected: ${plant.name}, Received: ${updateData.plant}`
        );
      }
      updateFields.plant = {
        name: updateData.plant,
        refId: updateData.plantRefId,
      };
    }

    // Validate fittingCenter
    if (updateData.fittingCenter && updateData.fittingCenterRefId) {
      const fittingCenter = await FittingCenter.findById(updateData.fittingCenterRefId);
      if (!fittingCenter) {
        return sendErrorResponse(
          res,
          404,
          "INVALID_REF_ID",
          `FittingCenter with refId ${updateData.fittingCenterRefId} does not exist`
        );
      }
      if (fittingCenter.name !== updateData.fittingCenter) {
        return sendErrorResponse(
          res,
          400,
          "NAME_MISMATCH",
          `Incorrect fittingCenter name for refId ${updateData.fittingCenterRefId}. Expected: ${fittingCenter.name}, Received: ${updateData.fittingCenter}`
        );
      }
      updateFields.fittingCenter = {
        name: updateData.fittingCenter,
        refId: updateData.fittingCenterRefId,
      };
    }

    // Validate creditDays
    if (updateData.creditDays && updateData.creditDaysRefId) {
      const creditDay = await CreditDay.findById(updateData.creditDaysRefId);
      if (!creditDay) {
        return sendErrorResponse(
          res,
          404,
          "INVALID_REF_ID",
          `CreditDays with refId ${updateData.creditDaysRefId} does not exist`
        );
      }
      if (creditDay.days.toString() !== updateData.creditDays.toString()) {
        return sendErrorResponse(
          res,
          400,
          "NAME_MISMATCH",
          `Incorrect creditDays value for refId ${updateData.creditDaysRefId}. Expected: ${creditDay.days}, Received: ${updateData.creditDays}`
        );
      }
      updateFields.creditDays = {
        name: updateData.creditDays,
        refId: updateData.creditDaysRefId,
      };
    }

    // Validate courierName
    if (updateData.courierName && updateData.courierNameRefId) {
      const courierName = await CourierName.findById(updateData.courierNameRefId);
      if (!courierName) {
        return sendErrorResponse(
          res,
          404,
          "INVALID_REF_ID",
          `CourierName with refId ${updateData.courierNameRefId} does not exist`
        );
      }
      if (courierName.name !== updateData.courierName) {
        return sendErrorResponse(
          res,
          400,
          "NAME_MISMATCH",
          `Incorrect courierName for refId ${updateData.courierNameRefId}. Expected: ${courierName.name}, Received: ${updateData.courierName}`
        );
      }
      updateFields.courierName = {
        name: updateData.courierName,
        refId: updateData.courierNameRefId,
      };
    }

    // Validate courierTime
    if (updateData.courierTime && updateData.courierTimeRefId) {
      const courierTime = await CourierTime.findById(updateData.courierTimeRefId);
      if (!courierTime) {
        return sendErrorResponse(
          res,
          404,
          "INVALID_REF_ID",
          `CourierTime with refId ${updateData.courierTimeRefId} does not exist`
        );
      }

      if (courierTime.time !== updateData.courierTime) {
        return sendErrorResponse(
          res,
          400,
          "NAME_MISMATCH",
          `Incorrect courierTime for refId ${updateData.courierTimeRefId}. Expected: ${courierTime.time}, Received: ${updateData.courierTime}`
        );
      }
      updateFields.courierTime = {
        name: updateData.courierTime,
        refId: updateData.courierTimeRefId,
      };
    }

    if (updateData.address) {
      if (!Array.isArray(updateData.address) || updateData.address.length === 0) {
        return sendErrorResponse(
          res,
          400,
          "VALIDATION_ERROR",
          "Address must be    an array with at least one address",
        );
      }
      for (const addr of updateData.address) {
        if (
          !addr.branchAddress ||
          !addr.contactPerson ||
          !addr.contactNumber ||
          !addr.country ||
          !addr.state ||
          !addr.city ||
          !addr.zipCode ||
          !addr.billingCurrency ||
          !addr.billingMode
        ) {
          return sendErrorResponse(
            res,
            400,
            "VALIDATION_ERROR",
            "All address fields are required",
          );
        }
      }
      updateFields.address = updateData.address.map((addr) => ({
        branchAddress: addr.branchAddress.trim(),
        contactPerson: addr.contactPerson.trim(),
        contactNumber: addr.contactNumber.trim(),
        country: addr.country,
        state: addr.state,
        zipCode: addr.zipCode,
        city: addr.city.trim(),
        billingCurrency: addr.billingCurrency,
        billingMode: addr.billingMode,
      }));
    }

    if (updateData.emailId) {
      const existingCustomer = await Customer.findOne({
        emailId: updateData.emailId.toLowerCase(),
        _id: { $ne: customerId },
      });
      if (existingCustomer) {
        return sendErrorResponse(
          res,
          409,
          "EMAIL_EXISTS",
          "Another customer with this email already exists",
        );
      }
      updateFields.emailId = updateData.emailId.toLowerCase().trim();
    }

    Object.assign(customer, updateFields);
    await customer.save();

    const customerObj = customer.toObject();
    delete customerObj.password;
    delete customerObj.emailOtp;
    delete customerObj.mobileOtp;

    return sendSuccessResponse(res, 200, { customer: customerObj }, "Customer profile updated successfully");
  } catch (error) {
    console.error("Update customer profile error:", error);
    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors).map((err) => err.message);
      return sendErrorResponse(res, 400, "VALIDATION_ERROR", messages.join(", "));
    }
    if (error.code === 11000) {
      return sendErrorResponse(res, 409, "DUPLICATE_FIELD", "Email already exists");
    }
    return sendErrorResponse(res, 500, "INTERNAL_ERROR", "Internal server error during profile update");
  }
};

export const resetCustomerCredit = async (req, res) => {
  try {
    const { customerId, creditUsed=0 } = req.params;
    const userDepartment = req.user.Department?.name || req.user.Department;
    const userEmployeeType = req.user.EmployeeType;

    if (userEmployeeType !== 'SUPERADMIN' && userDepartment !== 'FINANCE') {
      return sendErrorResponse(
        res,
        403,
        'FORBIDDEN',
        'Only Finance department or SuperAdmin can reset customer credit'
      );
    }

    if (!mongoose.Types.ObjectId.isValid(customerId)) {
      return sendErrorResponse(res, 400, 'INVALID_ID', 'Invalid customer ID');
    }

    const customer = await Customer.findById(customerId);
    if (!customer) {
      return sendErrorResponse(res, 404, 'NOT_FOUND', 'Customer not found');
    }

    if (customer.isDeleted) {
      return sendErrorResponse(res, 400, 'CUSTOMER_DELETED', 'Cannot reset credit for deleted customer');
    }

    const oldCreditUsed = customer.creditUsed;

    customer.creditUsed = creditUsed;
    await customer.save();

    console.log(`Credit reset for customer ${customer.shopName} (${customerId}): ${oldCreditUsed} -> 0 by ${req.user.employeeName}`);

    return sendSuccessResponse(
      res,
      200,
      {
        customerId: customer._id,
        shopName: customer.shopName,
        previousCreditUsed: oldCreditUsed,
        currentCreditUsed: customer.creditUsed,
        creditLimit: customer.creditLimit,
        resetBy: req.user.employeeName,
        resetAt: new Date()
      },
      'Customer credit reset successfully'
    );
  } catch (error) {
    console.error('Reset customer credit error:', error);
    return sendErrorResponse(
      res,
      500,
      'INTERNAL_ERROR',
      'Failed to reset customer credit'
    );
  }
};

export const sendCustomerForCorrection = async (req, res) => {
  try {
    const { customerId } = req.params;
    const { fieldsToCorrect, remark } = req.body;
    
    const userDepartment = req.user.Department?.name || req.user.Department;
    const userEmployeeType = req.user.EmployeeType;

    if (userEmployeeType !== 'SUPERADMIN' && userDepartment !== 'FINANCE') {
      return sendErrorResponse(
        res,
        403,
        'FORBIDDEN',
        'Only Finance department or SuperAdmin can send customer data back for corrections'
      );
    }

    if (!mongoose.Types.ObjectId.isValid(customerId)) {
      return sendErrorResponse(res, 400, 'INVALID_ID', 'Invalid customer ID format');
    }

    if (!fieldsToCorrect || !Array.isArray(fieldsToCorrect) || fieldsToCorrect.length === 0) {
      return sendErrorResponse(
        res,
        400,
        'VALIDATION_ERROR',
        'fieldsToCorrect must be an array with at least one field name'
      );
    }

    if (!remark || remark.trim() === '') {
      return sendErrorResponse(
        res,
        400,
        'VALIDATION_ERROR',
        'remark is required to explain what needs to be corrected'
      );
    }

    const customer = await Customer.findById(customerId);

    if (!customer) {
      return sendErrorResponse(res, 404, 'NOT_FOUND', 'Customer not found');
    }

    if (customer.approvalStatus === 'APPROVED') {
      return sendErrorResponse(
        res,
        400,
        'ALREADY_APPROVED',
        'Customer is already approved. Cannot send back for corrections.'
      );
    }

    if (customer.approvalStatus !== 'PENDING_FINANCE') {
      return sendErrorResponse(
        res,
        400,
        'INVALID_STATUS',
        'Customer must be in PENDING_FINANCE status to send back for corrections'
      );
    }

    const allowedFields = [
      'shopName',
      'ownerName',
      'CustomerType',
      'CustomerTypeRefId',
      'orderMode',
      'mobileNo1',
      'mobileNo2',
      'landlineNo',
      'emailId',
      'businessEmail',
      'address',
      'IsGSTRegistered',
      'GSTNumber',
      'gstType',
      'gstTypeRefId',
      'GSTCertificateImg',
      'PANCard',
      'AadharCard',
      'PANCardImg',
      'AadharCardImg',
      // 'zone',
      // 'zoneRefId',
      // 'specificLab',
      // 'specificLabRefId',
      // 'plant',
      // 'plantRefId',
      // 'fittingCenter',
      // 'fittingCenterRefId',
      // 'creditDays',
      // 'creditDaysRefId',
      // 'creditLimit',
      // 'courierName',
      // 'courierNameRefId',
      // 'courierTime',
      // 'courierTimeRefId',
      // 'brandCategories',
      // 'salesPerson',
      // 'salesPersonRefId'
    ];

    const invalidFields = fieldsToCorrect.filter(field => !allowedFields.includes(field));
    if (invalidFields.length > 0) {
      return sendErrorResponse(
        res,
        400,
        'INVALID_FIELDS',
        `Invalid field names: ${invalidFields.join(', ')}. Allowed fields are: ${allowedFields.join(', ')}`
      );
    }

    console.log("Anish : ",req.user);

    customer.approvalStatus = 'CORRECTION_REQUIRED';
    customer.correctionRequest = {
      fieldsToCorrect: fieldsToCorrect,
      remark: remark.trim(),
      requestedBy: req.user.id,
      requestedEmployeeName : req.user.employeeName,
      requestedAt: new Date()
    };

    await customer.save();

    const customerObj = customer.toObject();
    delete customerObj.password;
    delete customerObj.emailOtp;
    delete customerObj.mobileOtp;

    return sendSuccessResponse(
      res,
      200,
      {
        customer: customerObj,
        correctionRequest: {
          fieldsToCorrect: fieldsToCorrect,
          remark: remark.trim(),
          requestedBy: req.user.employeeName || req.user.email,
          requestedAt: customer.correctionRequest.requestedAt
        }
      },
      'Customer sent back to sales for corrections successfully'
    );
  } catch (error) {
    console.error('Send customer for correction error:', error);
    
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map((err) => err.message);
      return sendErrorResponse(
        res,
        400,
        'VALIDATION_ERROR',
        messages.join(', ')
      );
    }

    return sendErrorResponse(
      res,
      500,
      'INTERNAL_ERROR',
      'Failed to send customer for corrections'
    );
  }
};

export const resubmitCorrectedCustomer = async (req, res) => {
  try {
    const { customerId } = req.params;
    const updateData = req.body;

    const userDepartment = req.user?.Department?.name || req.user?.Department;
    const userEmployeeType = req.user?.EmployeeType;

    if (!mongoose.Types.ObjectId.isValid(customerId)) {
      return sendErrorResponse(res, 400, 'INVALID_ID', 'Invalid customer ID format');
    }

    const customer = await Customer.findById(customerId);

    if (!customer) {
      return sendErrorResponse(res, 404, 'NOT_FOUND', 'Customer not found');
    }

    if (customer.approvalStatus !== 'CORRECTION_REQUIRED') {
      return sendErrorResponse(
        res,
        400,
        'INVALID_STATUS',
        'Customer is not in CORRECTION_REQUIRED status'
      );
    }

    if (userDepartment !== 'SALES' && userEmployeeType !== 'SUPERADMIN') {
      if (customer.createdBy.toString() !== req.user.id.toString()) {
        return sendErrorResponse(
          res,
          403,
          'FORBIDDEN',
          'You can only resubmit customers you created'
        );
      }
    }

    const fieldsToCorrect = customer.correctionRequest?.fieldsToCorrect || [];

    if (fieldsToCorrect.length === 0) {
      return sendErrorResponse(
        res,
        400,
        'NO_CORRECTION_REQUEST',
        'No correction request found for this customer'
      );
    }

    const providedFields = Object.keys(updateData);
    const hasRelevantUpdate = fieldsToCorrect.some(field => providedFields.includes(field));

    if (!hasRelevantUpdate) {
      return sendErrorResponse(
        res,
        400,
        'MISSING_CORRECTIONS',
        `Please update at least one of the requested fields: ${fieldsToCorrect.join(', ')}`
      );
    }

    const updateFields = {};

    if (updateData.shopName) updateFields.shopName = updateData.shopName.trim();
    if (updateData.ownerName) updateFields.ownerName = updateData.ownerName.trim();
    if (updateData.orderMode) updateFields.orderMode = updateData.orderMode;
    if (updateData.mobileNo1) updateFields.mobileNo1 = updateData.mobileNo1;
    if (updateData.mobileNo2) updateFields.mobileNo2 = updateData.mobileNo2;
    if (updateData.landlineNo) updateFields.landlineNo = updateData.landlineNo;
    if (updateData.businessEmail) updateFields.businessEmail = updateData.businessEmail.toLowerCase().trim();
    if (updateData.IsGSTRegistered !== undefined) updateFields.IsGSTRegistered = updateData.IsGSTRegistered;
    if (updateData.GSTNumber) updateFields.GSTNumber = updateData.GSTNumber;
    if (updateData.GSTCertificateImg) updateFields.GSTCertificateImg = updateData.GSTCertificateImg;
    if (updateData.PANCard) updateFields.PANCard = updateData.PANCard;
    if (updateData.AadharCard) updateFields.AadharCard = updateData.AadharCard;
    if (updateData.PANCardImg) updateFields.PANCardImg = updateData.PANCardImg;
    if (updateData.AadharCardImg) updateFields.AadharCardImg = updateData.AadharCardImg;

    if (updateData.CustomerType && updateData.CustomerTypeRefId) {
      const customerType = await customerTypeSchema.findById(updateData.CustomerTypeRefId);
      if (!customerType) {
        return sendErrorResponse(
          res,
          404,
          'INVALID_REF_ID',
          `CustomerType with refId ${updateData.CustomerTypeRefId} does not exist`
        );
      }
      if (customerType.name !== updateData.CustomerType) {
        return sendErrorResponse(
          res,
          400,
          'NAME_MISMATCH',
          `Incorrect CustomerType name for refId ${updateData.CustomerTypeRefId}`
        );
      }
      updateFields.CustomerType = {
        name: updateData.CustomerType,
        refId: updateData.CustomerTypeRefId,
      };
    }
    
    // Validate gstType
    if (updateData.gstType && updateData.gstTypeRefId) {
      const gstTypeDoc = await GSTType.findById(updateData.gstTypeRefId);
      if (!gstTypeDoc) {
        return sendErrorResponse(
          res,
          404,
          'INVALID_REF_ID',
          `GSTType with refId ${updateData.gstTypeRefId} does not exist`
        );
      }
      if (gstTypeDoc.name !== updateData.gstType) {
        return sendErrorResponse(
          res,
          400,
          'NAME_MISMATCH',
          `Incorrect gstType name for refId ${updateData.gstTypeRefId}`
        );
      }
      updateFields.gstType = {
        name: updateData.gstType,
        refId: updateData.gstTypeRefId,
      };
    }

    // Handle address updates
    if (updateData.address) {
      if (!Array.isArray(updateData.address) || updateData.address.length === 0) {
        return sendErrorResponse(
          res,
          400,
          'VALIDATION_ERROR',
          'Address must be an array with at least one address'
        );
      }
      for (const addr of updateData.address) {
        if (
          !addr.branchAddress ||
          !addr.contactPerson ||
          !addr.contactNumber ||
          !addr.country ||
          !addr.state ||
          !addr.city ||
          !addr.zipCode ||
          !addr.billingCurrency ||
          !addr.billingMode
        ) {
          return sendErrorResponse(
            res,
            400,
            'VALIDATION_ERROR',
            'All address fields are required'
          );
        }
      }
      updateFields.address = updateData.address.map((addr) => ({
        branchAddress: addr.branchAddress.trim(),
        contactPerson: addr.contactPerson.trim(),
        contactNumber: addr.contactNumber.trim(),
        country: addr.country,
        state: addr.state,
        zipCode: addr.zipCode,
        city: addr.city.trim(),
        billingCurrency: addr.billingCurrency,
        billingMode: addr.billingMode,
      }));
    }

    // Handle email update
    if (updateData.emailId) {
      const existingCustomer = await Customer.findOne({
        emailId: updateData.emailId.toLowerCase(),
        _id: { $ne: customerId },
      });
      if (existingCustomer) {
        return sendErrorResponse(
          res,
          409,
          'EMAIL_EXISTS',
          'Another customer with this email already exists'
        );
      }
      updateFields.emailId = updateData.emailId.toLowerCase().trim();
    }

    Object.assign(customer, updateFields);
    customer.approvalStatus = 'PENDING_FINANCE';
    customer.correctionRequest = undefined;
    await customer.save();

    const customerObj = customer.toObject();
    delete customerObj.password;
    delete customerObj.emailOtp;
    delete customerObj.mobileOtp;

    return sendSuccessResponse(
      res,
      200,
      { customer: customerObj },
      'Customer corrections submitted successfully. Pending Finance approval.'
    );
  } catch (error) {
    console.error('Resubmit corrected customer error:', error);
    
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map((err) => err.message);
      return sendErrorResponse(
        res,
        400,
        'VALIDATION_ERROR',
        messages.join(', ')
      );
    }

    if (error.code === 11000) {
      return sendErrorResponse(
        res,
        409,
        'DUPLICATE_FIELD',
        'Email already exists'
      );
    }

    return sendErrorResponse(
      res,
      500,
      'INTERNAL_ERROR',
      'Failed to resubmit customer corrections'
    );
  }
};
