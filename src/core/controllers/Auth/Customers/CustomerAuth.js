import { sendErrorResponse, sendTokenResponse, sendSuccessResponse } from "../../../../Utils/response/responseHandler.js";
import { generateToken, generateRefreshToken } from "../../../../Utils/Auth/tokenUtils.js";
import CredentialsTemplate from "../../../../Utils/Mail/CredentialsTemplate.js";
import { sendEmail } from "../../../config/Email/emailService.js";
import Customer from "../../../../models/Auth/Customer.js";
import dotenv from "dotenv";
import crypto from "crypto";
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

    const customer = await Customer.findOne({ emailId }).select("+password")

    if (!customer) {
      return sendErrorResponse(
        res,
        401,
        "INVALID_CREDENTIALS",
        "Invalid credentials",
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
    } = req.body;

    const userEmployeeType = req.user?.EmployeeType;
    const userDepartment = userEmployeeType === 'SUPERADMIN' ? 'SUPERADMIN' : req.user?.Department?.name || req.user?.Department;
    const isSalesDepartment = userDepartment === "SALES";
    const isFinanceDepartment = userDepartment === "FINANCE" || userEmployeeType === "SUPERADMIN";

    // Check if user is from Sales or Finance department
    // if (!['SALES', 'FINANCE'].includes(userDepartment)) {
    //   return sendErrorResponse(
    //     res,
    //     403,
    //     "FORBIDDEN",
    //     "Only Sales or Finance department can register customers"
    //   );
    // }

    if (!CustomerType || !shopName || !ownerName || !emailId || !orderMode) {
      return sendErrorResponse(res, 400,
        "VALIDATION_ERROR", "CustomerType, shopName, ownerName, emailId and orderMode are required");
    }

    // salesPerson is only required for Finance department and SUPERADMIN
    if ((isFinanceDepartment || userEmployeeType === 'SUPERADMIN') && !salesPerson) {
      return sendErrorResponse(res, 400,
        "VALIDATION_ERROR", "salesPerson is required for FINANCE department and SUPERADMIN");
    }

    if (!Array.isArray(address) || address.length === 0) {
      return sendErrorResponse(res, 400, "VALIDATION_ERROR", "At least one address is required");
    }

    for (const addr of address) {
      if (!addr.branchAddress || !addr.contactPerson || !addr.contactNumber || !addr.country || !addr.state || !addr.city || !addr.zipCode || !addr.billingCurrency || !addr.billingMode) {
        return sendErrorResponse(res, 400, "VALIDATION_ERROR", "All address fields are required");
      }
    }

    if (IsGSTRegistered === true) {
      if (!GSTNumber || !gstType || !GSTCertificateImg) {
        return sendErrorResponse(
          res,
          400,
          "VALIDATION_ERROR",
          "GSTNumber, gstType and GSTCertificateImg are required when GST registered"
        );
      }
    } else {
      if (!PANCard || !AadharCard || !PANCardImg || !AadharCardImg) {
        return sendErrorResponse(
          res,
          400,
          "VALIDATION_ERROR",
          "PANCard, AadharCard and their images are required when not GST registered"
        );
      }
    }

    if (isFinanceDepartment || userEmployeeType === 'SUPERADMIN') {
      const isValidObjectId = (id) => /^[0-9a-fA-F]{24}$/.test(id);

      const requiredRefIds = [
        { name: 'CustomerTypeRefId', value: CustomerTypeRefId },
        { name: 'salesPersonRefId', value: salesPersonRefId },
      ];

      for (const field of requiredRefIds) {
        if (!field.value) {
          return sendErrorResponse(res, 400, "VALIDATION_ERROR", `${field.name} is required for FINANCE department`);
        }
        if (!isValidObjectId(field.value)) {
          return sendErrorResponse(res, 400, "VALIDATION_ERROR",
            `${field.name} must be a valid ObjectId (24 hex characters)`);
        }
      }

      const optionalRefIds = [
        { name: 'zoneRefId', value: zoneRefId },
        { name: 'specificLabRefId', value: specificLabRefId },
        { name: 'gstTypeRefId', value: gstTypeRefId },
        { name: 'plantRefId', value: plantRefId },
        { name: 'fittingCenterRefId', value: fittingCenterRefId },
        { name: 'creditDaysRefId', value: creditDaysRefId },
        { name: 'courierNameRefId', value: courierNameRefId },
        { name: 'courierTimeRefId', value: courierTimeRefId },
      ];

      for (const field of optionalRefIds) {
        if (field.value && !isValidObjectId(field.value)) {
          return sendErrorResponse(res, 400, "VALIDATION_ERROR",
            `${field.name} must be a valid ObjectId (24 hex characters)`);
        }
      }

      if (!customerpassword) {
        return sendErrorResponse(res, 400, "VALIDATION_ERROR", "Password is required for FINANCE department");
      }

      if (!brandCategories || !Array.isArray(brandCategories) || brandCategories.length === 0) {
        return sendErrorResponse(res, 400, "VALIDATION_ERROR", "brandCategories array with at least one brand is required for FINANCE department");
      }

      for (let i = 0; i < brandCategories.length; i++) {
        const brand = brandCategories[i];
        if (!brand.brandName || !brand.brandId) {
          return sendErrorResponse(res, 400, "VALIDATION_ERROR", `brandCategories[${i}]: brandName and brandId are required`);
        }
        if (!isValidObjectId(brand.brandId)) {
          return sendErrorResponse(res, 400, "VALIDATION_ERROR", `brandCategories[${i}].brandId must be a valid ObjectId`);
        }
        if (!brand.categories || !Array.isArray(brand.categories) || brand.categories.length === 0) {
          return sendErrorResponse(res, 400, "VALIDATION_ERROR", `brandCategories[${i}]: categories array with at least one category is required`);
        }
        for (let j = 0; j < brand.categories.length; j++) {
          const category = brand.categories[j];
          if (!category.categoryName || !category.categoryId) {
            return sendErrorResponse(res, 400, "VALIDATION_ERROR", `brandCategories[${i}].categories[${j}]: categoryName and categoryId are required`);
          }
          if (!isValidObjectId(category.categoryId)) {
            return sendErrorResponse(res, 400, "VALIDATION_ERROR", `brandCategories[${i}].categories[${j}].categoryId must be a valid ObjectId`);
          }
        }
      }

      if (!salesPerson || !salesPersonRefId) {
        return sendErrorResponse(res, 400, "VALIDATION_ERROR", "salesPerson and salesPersonRefId are required for FINANCE department");
      }
    }

    if (isSalesDepartment) {
      const isValidObjectId = (id) => /^[0-9a-fA-F]{24}$/.test(id);

      if (CustomerTypeRefId && !isValidObjectId(CustomerTypeRefId)) {
        return sendErrorResponse(res, 400, "VALIDATION_ERROR",
          `CustomerTypeRefId must be a valid ObjectId (24 hex characters)`);
      }
    }

    const existingCustomer = await Customer.findOne({ emailId: emailId.toLowerCase() });
    if (existingCustomer) {
      return sendErrorResponse(
        res,
        409,
        "CUSTOMER_EXISTS",
        "Customer with this email already exists",
      );
    }

    const EmailOtp = Math.floor(100000 + Math.random() * 800000).toString();
    const MobileOtp = Math.floor(100000 + Math.random() * 900000).toString();

    const customerData = {
      // Customer Info.
      shopName: shopName.trim(),
      ownerName: ownerName.trim(),
      CustomerType: CustomerTypeRefId ? {
        name: CustomerType,
        refId: CustomerTypeRefId
      } : undefined,
      orderMode,
      mobileNo1,
      mobileNo2,
      landlineNo,
      emailId: emailId.toLowerCase().trim(),
      businessEmail: businessEmail ? businessEmail.toLowerCase().trim() : undefined,
      IsGSTRegistered,
      GSTNumber: IsGSTRegistered ? GSTNumber : undefined,
      gstType: IsGSTRegistered && gstType ? {
        name: gstType,
        refId: gstTypeRefId
      } : undefined,
      GSTCertificateImg: IsGSTRegistered ? GSTCertificateImg : undefined,
      PANCard: !IsGSTRegistered ? PANCard : undefined,
      AadharCard: !IsGSTRegistered ? AadharCard : undefined,
      PANCardImg: !IsGSTRegistered ? PANCardImg : undefined,
      AadharCardImg: !IsGSTRegistered ? AadharCardImg : undefined,

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
      password: (isFinanceDepartment || userEmployeeType === 'SUPERADMIN') ? customerpassword : undefined,
      brandCategories: (isFinanceDepartment || userEmployeeType === 'SUPERADMIN') && brandCategories ? brandCategories : undefined,

      zone: (isFinanceDepartment || userEmployeeType === 'SUPERADMIN') && zone && zoneRefId ? {
        name: zone,
        refId: zoneRefId
      } : undefined,
      
      salesPerson: (isFinanceDepartment || userEmployeeType === 'SUPERADMIN') && salesPerson && salesPersonRefId ? {
        name: salesPerson,
        refId: salesPersonRefId
      } : undefined,
      
      specificLab: (isFinanceDepartment || userEmployeeType === 'SUPERADMIN') && specificLab && specificLabRefId ? {
        name: specificLab,
        refId: specificLabRefId
      } : undefined,

      fittingCenter: (isFinanceDepartment || userEmployeeType === 'SUPERADMIN') && fittingCenter && fittingCenterRefId ? {
        name: fittingCenter,
        refId: fittingCenterRefId
      } : undefined,

      plant: (isFinanceDepartment || userEmployeeType === 'SUPERADMIN') && plant && plantRefId ? {
        name: plant,
        refId: plantRefId
      } : undefined,

      creditLimit: (isFinanceDepartment || userEmployeeType === 'SUPERADMIN') ? creditLimit : null,

      creditDays: (isFinanceDepartment || userEmployeeType === 'SUPERADMIN') && creditDays && creditDaysRefId ? {
        name: creditDays,
        refId: creditDaysRefId
      } : undefined,

      courierName: (isFinanceDepartment || userEmployeeType === 'SUPERADMIN') && courierName && courierNameRefId ? {
        name: courierName,
        refId: courierNameRefId
      } : undefined,

      courierTime: (isFinanceDepartment || userEmployeeType === 'SUPERADMIN') && courierTime && courierTimeRefId ? {
        name: courierTime,
        refId: courierTimeRefId
      } : undefined,

      // System Internal details
      dcWithoutValue: false,
      designation: "Customer",
      createdBy: req.user.id,
      createdByDepartment: userDepartment,
      approvalStatus: isSalesDepartment ? 'PENDING_FINANCE' : 'APPROVED',
      emailOtp: EmailOtp,
      emailOtpExpires: new Date(Date.now() + 10 * 60 * 1000),
      mobileOtp: MobileOtp,
      mobileOtpExpires: new Date(Date.now() + 10 * 60 * 1000),
    };

    const customer = await Customer.create(customerData);

    // Only send credentials email if password was set (FINANCE department or SUPERADMIN)
    if ((isFinanceDepartment || userEmployeeType === 'SUPERADMIN') && customerpassword) {
      sendEmail({
        to: emailId,
        subject: "Welcome Mail for choosing VISUAL EYES",
        html: CredentialsTemplate(ownerName, emailId, customerpassword),
      }).catch(err => console.error("Background email error:", err));
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
      return sendErrorResponse(res,
        400,
        "VALIDATION_ERROR",
        "Please provide email address",);
    }

    const customer = await Customer.findOne({ emailId: email, "Status.isActive": true });

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
    // if (userDepartment !== 'FINANCE') {
    //   return sendErrorResponse(res, 403, "FORBIDDEN", "Only Finance department can complete customer registration");
    // }

    const customer = await Customer.findById(customerId);

    if (!customer) {
      return sendErrorResponse(res, 404, "NOT_FOUND", "Customer not found");
    }

    if (customer.approvalStatus === 'APPROVED') {
      return sendErrorResponse(res, 400, "ALREADY_APPROVED", "Customer is already approved. Cannot update.");
    }

    const requiredFinanceFields = [
      'password', 'zone', 'plant', 'fittingCenter',
      'creditDays', 'courierName', 'courierTime',
      'brandCategories', 'specificLab', 'salesPerson'
    ];

    const missingFields = requiredFinanceFields.filter(field => !req.body[field]);

    if (missingFields.length > 0) {
      return sendErrorResponse(res, 400, "VALIDATION_ERROR", `Missing required fields: ${missingFields.join(', ')}`);
    }

    const { brandCategories } = req.body;
    const isValidObjectId = (id) => /^[0-9a-fA-F]{24}$/.test(id);

    if (!Array.isArray(brandCategories) || brandCategories.length === 0) {
      return sendErrorResponse(res, 400, "VALIDATION_ERROR", "brandCategories must be an array with at least one brand");
    }

    for (let i = 0; i < brandCategories.length; i++) {
      const brand = brandCategories[i];
      if (!brand.brandName || !brand.brandId) {
        return sendErrorResponse(res, 400, "VALIDATION_ERROR", `brandCategories[${i}]: brandName and brandId are required`);
      }
      if (!isValidObjectId(brand.brandId)) {
        return sendErrorResponse(res, 400, "VALIDATION_ERROR", `brandCategories[${i}].brandId must be a valid ObjectId`);
      }
      if (!brand.categories || !Array.isArray(brand.categories) || brand.categories.length === 0) {
        return sendErrorResponse(res, 400, "VALIDATION_ERROR", `brandCategories[${i}]: categories array with at least one category is required`);
      }
      for (let j = 0; j < brand.categories.length; j++) {
        const category = brand.categories[j];
        if (!category.categoryName || !category.categoryId) {
          return sendErrorResponse(res, 400, "VALIDATION_ERROR", `brandCategories[${i}].categories[${j}]: categoryName and categoryId are required`);
        }
        if (!isValidObjectId(category.categoryId)) {
          return sendErrorResponse(res, 400, "VALIDATION_ERROR", `brandCategories[${i}].categories[${j}].categoryId must be a valid ObjectId`);
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
      approvalStatus: 'APPROVED',
      financeCompletedBy: req.user._id,
      financeCompletedAt: new Date(),
    };

    Object.assign(customer, updateData);
    await customer.save();

    return sendSuccessResponse(res, 200, customer, "Customer completed and approved by Finance successfully");
  } catch (error) {
    console.error("Finance complete customer error:", error);

    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return sendErrorResponse(
        res,
        400,
        "VALIDATION_ERROR",
        messages.join(', ')
      );
    }

    return sendErrorResponse(
      res,
      500,
      "INTERNAL_ERROR",
      "Internal server error during customer completion"
    );
  }
};