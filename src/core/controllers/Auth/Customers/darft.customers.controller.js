import { sendErrorResponse, sendSuccessResponse } from "../../../../Utils/response/responseHandler.js";
import CredentialsTemplate from "../../../../Utils/Mail/CredentialsTemplate.js";
import { sendEmail } from "../../../config/Email/emailService.js";
import Customer from "../../../../models/Auth/Customer.js";
import customerDraftSchema from "../../../../models/Auth/CustomerDraft.js";
import dotenv from "dotenv";
dotenv.config();

export const customerDraftRegistration = async (req, res) => {
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


    const [existingCustomer, existingDraft] = await Promise.all([
      Customer.findOne({ emailId: emailId.toLowerCase() }),
      customerDraftSchema.findOne({ emailId: emailId.toLowerCase() })
    ]);

    if (existingCustomer) {
      return sendErrorResponse(
        res,
        409,
        "CUSTOMER_EXISTS",
        "Customer with this email already exists",
      );
    }

    if (existingDraft) {
      return sendErrorResponse(
        res,
        409,
        "DRAFT_EXISTS",
        "Draft customer with this email already exists",
      );
    }
    
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
      brandCategories: (isFinanceDepartment || userEmployeeType === 'SUPERADMIN') && brandCategories 
        ? brandCategories
            .filter(bc => bc.brandId && bc.brandId.trim() !== '')
            .map(bc => ({
              brandName: bc.brandName,
              brandId: bc.brandId,
              categories: bc.categories
                .filter(cat => cat.categoryId && cat.categoryId.trim() !== '')
                .map(cat => ({
                  categoryName: cat.categoryName,
                  categoryId: cat.categoryId
                }))
            }))
        : undefined,

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
    };

    const customer = await customerDraftSchema.create(customerData);

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

export const getAllDraftCustomers = async (req, res) => {
  try {
    const page = Math.max(parseInt(req.query.page) || 1, 1);
    const limit = Math.min(parseInt(req.query.limit) || 10, 100);
    const skip = (page - 1) * limit;

    const { 
      shopName, 
      customerType, 
      status, 
      createdByDepartment, 
      zone, 
      specificBrand, 
      specificCategory, 
      fromDate, 
      toDate 
    } = req.query;

    let query = {};

    if (shopName) {
      query.shopName = { $regex: shopName, $options: 'i' };
    }

    if (customerType) {
      query['CustomerType.refId'] = customerType;
    }

    if (status) {
      if (status.toLowerCase() === 'active') {
        query['Status.isActive'] = true;
        query['Status.isSuspended'] = false;
      } else if (status.toLowerCase() === 'suspended') {
        query['Status.isSuspended'] = true;
      } else if (status.toLowerCase() === 'inactive') {
        query['Status.isActive'] = false;
      }
    }

    if (createdByDepartment) {
      query.createdByDepartment = createdByDepartment.toUpperCase();
    }

    if (zone) {
      query['zone.refId'] = zone;
    }

    if (specificBrand) {
      query['brandCategories.brandId'] = specificBrand;
    }

    if (specificCategory) {
      query['brandCategories.categories.categoryId'] = specificCategory;
    }

    if (fromDate || toDate) {
      query.createdAt = {};
      
      if (fromDate) {
        const startDate = new Date(fromDate);
        startDate.setHours(0, 0, 0, 0);
        query.createdAt.$gte = startDate;
      }
      
      if (toDate) {
        const endDate = new Date(toDate);
        endDate.setHours(23, 59, 59, 999);
        query.createdAt.$lte = endDate;
      }
    }

    const [customers, total] = await Promise.all([
      customerDraftSchema
        .find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      customerDraftSchema.countDocuments(query)
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

export const getMyDraftCustomers = async (req, res) => {
  try {
    const page = Math.max(parseInt(req.query.page) || 1, 1);
    const limit = Math.min(parseInt(req.query.limit) || 10, 100);
    const skip = (page - 1) * limit;
    const userId = req.user.id;

    const { 
      shopName, 
      customerType, 
      status, 
      createdByDepartment, 
      zone, 
      specificBrand, 
      specificCategory, 
      fromDate, 
      toDate 
    } = req.query;

    let query = { createdBy: userId };

    if (shopName) {
      query.shopName = { $regex: shopName, $options: 'i' };
    }

    if (customerType) {
      query['CustomerType.refId'] = customerType;
    }

    if (status) {
      if (status.toLowerCase() === 'active') {
        query['Status.isActive'] = true;
        query['Status.isSuspended'] = false;
      } else if (status.toLowerCase() === 'suspended') {
        query['Status.isSuspended'] = true;
      } else if (status.toLowerCase() === 'inactive') {
        query['Status.isActive'] = false;
      }
    }

    if (createdByDepartment) {
      query.createdByDepartment = createdByDepartment.toUpperCase();
    }

    if (zone) {
      query['zone.refId'] = zone;
    }

    if (specificBrand) {
      query['brandCategories.brandId'] = specificBrand;
    }

    if (specificCategory) {
      query['brandCategories.categories.categoryId'] = specificCategory;
    }

    if (fromDate || toDate) {
      query.createdAt = {};
      
      if (fromDate) {
        const startDate = new Date(fromDate);
        startDate.setHours(0, 0, 0, 0);
        query.createdAt.$gte = startDate;
      }
      
      if (toDate) {
        const endDate = new Date(toDate);
        endDate.setHours(23, 59, 59, 999);
        query.createdAt.$lte = endDate;
      }
    }

    const [customers, total] = await Promise.all([
      customerDraftSchema
        .find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      customerDraftSchema.countDocuments(query)
    ]);

    const totalPages = Math.ceil(total / limit);

    const pagination = {
      currentPage: page,
      totalPages,
      totalCustomers: total,
      hasNext: page < totalPages,
      hasPrev: page > 1
    };

    return sendSuccessResponse(res, 200, { customers, pagination }, 'Draft customers retrieved successfully');

  } catch (error) {
    console.error('Get draft customers error:', error);
    return sendErrorResponse(res, 500, 'INTERNAL_ERROR', 'Failed to retrieve draft customers');
  }
};