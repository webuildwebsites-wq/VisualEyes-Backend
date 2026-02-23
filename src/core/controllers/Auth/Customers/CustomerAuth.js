import crypto from "crypto";
import Customer from "../../../../models/Auth/Customer.js";
import {
  sendErrorResponse,
  sendTokenResponse,
  sendSuccessResponse,
} from "../../../../Utils/response/responseHandler.js";
import {
  generateToken,
  generateRefreshToken,
} from "../../../../Utils/Auth/tokenUtils.js";
import dotenv from "dotenv";
import { sendEmail } from "../../../config/Email/emailService.js";
import CredentialsTemplate from "../../../../Utils/Mail/CredentialsTemplate.js";
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
    console.error("Customer login error:", error);
    return sendErrorResponse(
      res,
      500,
      "INTERNAL_ERROR",
      "Internal server error during login",
    );
  }
};

export const customerRegister = async (req, res) => {
  try {
    const {
      CustomerType,
      CustomerTypeRefId,
      zone,
      zoneRefId,
      hasFlatFitting,
      specificBrand,
      specificBrandRefId,
      specificCategory,
      specificCategoryRefId,
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
      flatFittingData,
    } = req.body;

    if (!CustomerType || !shopName || !ownerName || !salesPerson || !emailId || !orderMode) {
      return sendErrorResponse(res, 400,
        "VALIDATION_ERROR", "CustomerType, shopName, ownerName, salesPerson, emailId and orderMode are required");
    }

    if (!Array.isArray(address) || address.length === 0) {
      return sendErrorResponse(res, 400, "VALIDATION_ERROR", "At least one address is required");
    }

    for (const addr of address) {
      if (!addr.branchAddress || !addr.contactPerson || !addr.contactNumber || !addr.country || !addr.state || !addr.city || !addr.zipCode || !addr.billingCurrency || !addr.billingMode) {
        return sendErrorResponse(res, 400, "VALIDATION_ERROR", "All address fields are required");
      }
    }

    if (hasFlatFitting === true) {
      if (!Array.isArray(flatFittingData) || flatFittingData.length === 0) {
        return sendErrorResponse(res, 400, "VALIDATION_ERROR", "flatFittingData is required when hasFlatFitting is true");
      }

      for (const item of flatFittingData) {
        if (!item.selectType || !item.selectType.name || !item.selectType.refId || !item.index || !item.index.name || !item.index.refId || item.price === undefined) {
          return sendErrorResponse(res, 400, "VALIDATION_ERROR", "Each flatFittingData item must contain selectType, index and price");
        }
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
      CustomerType: {
        name: CustomerType,
        refId: CustomerTypeRefId
      },
      orderMode,
      mobileNo1,
      mobileNo2,
      landlineNo,
      emailId: emailId.toLowerCase().trim(),
      businessEmail: businessEmail.toLowerCase().trim(),
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


      // Customer Regn. 
      password: customerpassword,
      zone: zone ? {
        name: zone,
        refId: zoneRefId
      } : undefined,
      hasFlatFitting,
      
      flatFittingData: hasFlatFitting ? flatFittingData.map((item) => ({
        selectType: {
          name: item.selectType.name,
          refId: item.selectType.refId,
        },
        index: {
          name: item.index.name,
          refId: item.index.refId,
        },
        price: item.price,
      })) : [],

      specificBrand: {
        name: specificBrand,
        refId: specificBrandRefId
      },
      specificCategory: {
        name: specificCategory,
        refId: specificCategoryRefId
      },
      specificLab: specificLab ? {
        name: specificLab,
        refId: specificLabRefId
      } : undefined,
      salesPerson: salesPerson ? {
        name: salesPerson,
        refId: salesPersonRefId
      } : undefined,
      plant: plant ? {
        name: plant,
        refId: plantRefId
      } : undefined,
      fittingCenter: fittingCenter ? {
        name: fittingCenter,
        refId: fittingCenterRefId
      } : undefined,
      creditDays: creditDays ? {
        name: creditDays,
        refId: creditDaysRefId
      } : undefined,
      creditLimit,
      courierName: courierName ? {
        name: courierName,
        refId: courierNameRefId
      } : undefined,
      courierTime: courierTime ? {
        name: courierTime,
        refId: courierTimeRefId
      } : undefined,

      // System Internall details
      dcWithoutValue: false,
      designation: "Customer",
      createdBy: req.user.id,
      emailOtp: EmailOtp,
      emailOtpExpires: new Date(Date.now() + 10 * 60 * 1000),
      mobileOtp: MobileOtp,
      mobileOtpExpires: new Date(Date.now() + 10 * 60 * 1000),
    };

    const customer = await Customer.create(customerData);

    sendEmail({
      to: emailId,
      subject: "Welcome Mail for choosing VISUAL EYES",
      html: CredentialsTemplate(ownerName, emailId, customerpassword),
    }).catch(err => console.error("Background email error:", err));

    const customerObj = customer.toObject();
    delete customerObj.password;
    delete customerObj.emailOtp;
    delete customerObj.mobileOtp;

    return sendSuccessResponse(res, 201,
      { customer: customerObj }, "Customer registration successful. Credentials sent on email successfully.",);
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

export const getCustomerProfile = async (req, res) => {
  try {
    const customer = await Customer.findById(req.user.id);

    if (!customer) {
      return sendErrorResponse(
        res,
        404,
        "USER_NOT_FOUND",
        "Customer not found",
      );
    }

    const customerData = {
      user: {
        ...customer.toObject(),
        CustomerType: req.user.CustomerType,
        AccountType: req.user.AccountType,
      },
    };

    return sendSuccessResponse(res, 200, customerData);
  } catch (error) {
    console.error("Get customer profile error:", error);
    return sendErrorResponse(
      res,
      500,
      "INTERNAL_ERROR",
      "Internal server error",
    );
  }
};

// Finance Department Approval
export const financeApproveCustomer = async (req, res) => {
  try {
    const { customerId } = req.params;
    const { status, remarks } = req.body;

    // Check if user is from Finance department
    const employee = await employeeSchema.findById(req.user.id);
    if (!employee || !['F&A', 'F&A CFO', 'ACCOUNTING MODULE'].includes(employee.Department?.name)) {
      return sendErrorResponse(
        res,
        403,
        "UNAUTHORIZED",
        "Only Finance/Accounts department can perform this action",
      );
    }

    if (!['APPROVED', 'REJECTED'].includes(status)) {
      return sendErrorResponse(
        res,
        400,
        "VALIDATION_ERROR",
        "Status must be either APPROVED or REJECTED",
      );
    }

    const customer = await Customer.findById(customerId);
    if (!customer) {
      return sendErrorResponse(
        res,
        404,
        "CUSTOMER_NOT_FOUND",
        "Customer not found",
      );
    }

    if (customer.approvalStatus !== 'PENDING') {
      return sendErrorResponse(
        res,
        400,
        "INVALID_STATUS",
        `Customer is already ${customer.approvalStatus}`,
      );
    }

    // Update finance approval
    customer.financeApproval = {
      status: status,
      approvedBy: req.user.id,
      approvedAt: new Date(),
      remarks: remarks || ''
    };

    if (status === 'APPROVED') {
      customer.approvalStatus = 'FINANCE_APPROVED';
    } else {
      customer.approvalStatus = 'REJECTED';
      customer.Status.isActive = false;
    }

    await customer.save();

    return sendSuccessResponse(
      res,
      200,
      { customer },
      `Customer ${status.toLowerCase()} by Finance department`,
    );

  } catch (error) {
    console.error("Finance approval error:", error);
    return sendErrorResponse(
      res,
      500,
      "INTERNAL_ERROR",
      "Finance approval failed",
    );
  }
};

// Sales Head Final Approval
export const salesApproveCustomer = async (req, res) => {
  try {
    const { customerId } = req.params;
    const { status, remarks } = req.body;

    // Check if user is from Sales department with appropriate role
    const employee = await employeeSchema.findById(req.user.id);
    if (!employee || !['SALES HEAD', 'SALES EXECUTIVE'].includes(employee.Department?.name)) {
      return sendErrorResponse(
        res,
        403,
        "UNAUTHORIZED",
        "Only Sales Head/Executive can perform this action",
      );
    }

    if (!['APPROVED', 'REJECTED'].includes(status)) {
      return sendErrorResponse(
        res,
        400,
        "VALIDATION_ERROR",
        "Status must be either APPROVED or REJECTED",
      );
    }

    const customer = await Customer.findById(customerId);
    if (!customer) {
      return sendErrorResponse(
        res,
        404,
        "CUSTOMER_NOT_FOUND",
        "Customer not found",
      );
    }

    if (customer.approvalStatus !== 'FINANCE_APPROVED') {
      return sendErrorResponse(
        res,
        400,
        "INVALID_STATUS",
        "Customer must be approved by Finance department first",
      );
    }

    // Update sales approval
    customer.salesApproval = {
      status: status,
      approvedBy: req.user.id,
      approvedAt: new Date(),
      remarks: remarks || ''
    };

    if (status === 'APPROVED') {
      customer.approvalStatus = 'SALES_APPROVED';
      customer.Status.isActive = true;
    } else {
      customer.approvalStatus = 'REJECTED';
      customer.Status.isActive = false;
    }

    await customer.save();

    return sendSuccessResponse(
      res,
      200,
      { customer },
      `Customer ${status.toLowerCase()} by Sales Head`,
    );

  } catch (error) {
    console.error("Sales approval error:", error);
    return sendErrorResponse(
      res,
      500,
      "INTERNAL_ERROR",
      "Sales approval failed",
    );
  }
};

// Get Pending Approvals for Finance
export const getPendingFinanceApprovals = async (req, res) => {
  try {
    const employee = await employeeSchema.findById(req.user.id);
    if (!employee || !['F&A', 'F&A CFO', 'ACCOUNTING MODULE'].includes(employee.Department?.name)) {
      return sendErrorResponse(
        res,
        403,
        "UNAUTHORIZED",
        "Only Finance/Accounts department can view this",
      );
    }

    const customers = await Customer.find({
      approvalStatus: 'PENDING',
      'financeApproval.status': 'PENDING'
    })
      .populate('createdBy', 'username emailId Department')
      .sort({ createdAt: -1 });

    return sendSuccessResponse(
      res,
      200,
      { customers, count: customers.length },
      "Pending finance approvals retrieved successfully",
    );

  } catch (error) {
    console.error("Get pending finance approvals error:", error);
    return sendErrorResponse(
      res,
      500,
      "INTERNAL_ERROR",
      "Failed to retrieve pending approvals",
    );
  }
};

// Get Pending Approvals for Sales
export const getPendingSalesApprovals = async (req, res) => {
  try {
    const employee = await employeeSchema.findById(req.user.id);
    if (!employee || !['SALES HEAD', 'SALES EXECUTIVE'].includes(employee.Department?.name)) {
      return sendErrorResponse(
        res,
        403,
        "UNAUTHORIZED",
        "Only Sales Head/Executive can view this",
      );
    }

    const customers = await Customer.find({
      approvalStatus: 'FINANCE_APPROVED',
      'salesApproval.status': 'PENDING'
    })
      .populate('createdBy', 'username emailId Department')
      .populate('financeApproval.approvedBy', 'username emailId')
      .sort({ 'financeApproval.approvedAt': -1 });

    return sendSuccessResponse(
      res,
      200,
      { customers, count: customers.length },
      "Pending sales approvals retrieved successfully",
    );

  } catch (error) {
    console.error("Get pending sales approvals error:", error);
    return sendErrorResponse(
      res,
      500,
      "INTERNAL_ERROR",
      "Failed to retrieve pending approvals",
    );
  }
};

// Get All Customers with Approval Status (for Admin/SuperAdmin)
export const getAllCustomersWithApprovalStatus = async (req, res) => {
  try {
    const employee = await employeeSchema.findById(req.user.id);
    if (!employee || !['SUPERADMIN', 'ADMIN'].includes(employee.EmployeeType?.name)) {
      return sendErrorResponse(
        res,
        403,
        "UNAUTHORIZED",
        "Only Admin/SuperAdmin can view all customers",
      );
    }

    const { approvalStatus, page = 1, limit = 10 } = req.query;

    const query = {};
    if (approvalStatus) {
      query.approvalStatus = approvalStatus;
    }

    const customers = await Customer.find(query)
      .populate('createdBy', 'username emailId Department')
      .populate('financeApproval.approvedBy', 'username emailId')
      .populate('salesApproval.approvedBy', 'username emailId')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const count = await Customer.countDocuments(query);

    return sendSuccessResponse(
      res,
      200,
      {
        customers,
        totalPages: Math.ceil(count / limit),
        currentPage: page,
        totalCustomers: count
      },
      "Customers retrieved successfully",
    );

  } catch (error) {
    console.error("Get all customers error:", error);
    return sendErrorResponse(
      res,
      500,
      "INTERNAL_ERROR",
      "Failed to retrieve customers",
    );
  }
};

export const getAllCustomers = async (req, res) => {
  try {
    const page = Math.max(parseInt(req.query.page) || 1, 1);
    const limit = Math.min(parseInt(req.query.limit) || 10, 100);
    const skip = (page - 1) * limit;
    const query = {};

    const [customers, total] = await Promise.all([
      Customer
        .find(query)
        .select('-password -emailOtp -emailOtpExpires -mobileOtp -mobileOtpExpires')
        .populate('CustomerType', 'name')
        .populate('zone', 'name')
        .populate('specificBrand', 'name')
        .populate('specificCategory', 'name')
        .populate('salesPerson', 'employeeName emailId')
        .populate('createdBy', 'employeeName emailId')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Customer.countDocuments(query)
    ]);

    const totalPages = Math.ceil(total / limit);
    const pagination = {
      currentPage: page,
      totalPages,
      totalCustomers: total,
      hasNext: page < totalPages,
      hasPrev: page > 1
    };

    return sendSuccessResponse(res, 200, { customers, pagination }, 'Customers retrieved successfully');

  } catch (error) {
    console.error('Get all customers error:', error);
    return sendErrorResponse(res, 500, 'INTERNAL_ERROR', 'Failed to retrieve customers');
  }
};

export const getFilteredCustomers = async (req, res) => {
  try {
    const page = Math.max(parseInt(req.query.page) || 1, 1);
    const limit = Math.min(parseInt(req.query.limit) || 10, 100);
    const skip = (page - 1) * limit;

    const { customerType, zone, specificBrand, specificCategory, search } = req.query;

    let query = {};

    if (customerType) query.CustomerType = customerType;
    if (zone) query.zone = zone;
    if (specificBrand) query.specificBrand = specificBrand;
    if (specificCategory) query.specificCategory = specificCategory;

    if (search) {
      const searchQuery = {
        $or: [
          { shopName: { $regex: search, $options: 'i' } },
          { ownerName: { $regex: search, $options: 'i' } },
          { emailId: { $regex: search, $options: 'i' } },
          { username: { $regex: search, $options: 'i' } }
        ]
      };
      query = { $and: [query, searchQuery] };
    }

    const [customers, total] = await Promise.all([
      Customer
        .find(query)
        .select('-password -emailOtp -emailOtpExpires -mobileOtp -mobileOtpExpires')
        .populate('CustomerType', 'name')
        .populate('zone', 'name')
        .populate('specificBrand', 'name')
        .populate('specificCategory', 'name')
        .populate('salesPerson', 'employeeName emailId')
        .populate('createdBy', 'employeeName emailId')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Customer.countDocuments(query)
    ]);

    const totalPages = Math.ceil(total / limit);

    const pagination = {
      currentPage: page,
      totalPages,
      totalCustomers: total,
      hasNext: page < totalPages,
      hasPrev: page > 1
    };

    return sendSuccessResponse(res, 200, { customers, pagination }, 'Customers retrieved successfully');

  } catch (error) {
    console.error('Get filtered customers error:', error);
    return sendErrorResponse(res, 500, 'INTERNAL_ERROR', 'Failed to retrieve customers');
  }
};

export const getCustomerDetails = async (req, res) => {
  try {
    const { userId } = req.params;
    const user = await Customer.findOne({ _id: userId })
      .select('-password -emailOtp -emailOtpExpires -mobileOtp -mobileOtpExpires')
      .populate('CustomerType', 'name')
      .populate('zone', 'name')
      .populate('specificBrand', 'name')
      .populate('specificCategory', 'name')
      .populate('specificLab', 'name')
      .populate('salesPerson', 'employeeName emailId')
      .populate('gstType', 'name')
      .populate('plant', 'name')
      .populate('lab', 'name')
      .populate('fittingCenter', 'name')
      .populate('creditLimit', 'name')
      .populate('creditDays', 'name')
      .populate('courierName', 'name')
      .populate('courierTime', 'name')
      .populate('selectType', 'name')
      .populate('createdBy', 'employeeName emailId');

    if (!user) {
      return sendErrorResponse(res, 404, 'USER_NOT_FOUND', 'Customer not found');
    }

    return sendSuccessResponse(res, 200, { user }, 'Customer details retrieved successfully');

  } catch (error) {
    console.error('Get customer details error:', error);
    return sendErrorResponse(res, 500, 'INTERNAL_ERROR', 'Failed to retrieve customer details');
  }
};