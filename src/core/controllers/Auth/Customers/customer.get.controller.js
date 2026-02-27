import { sendErrorResponse,sendSuccessResponse } from "../../../../Utils/response/responseHandler.js";
import Customer from "../../../../models/Auth/Customer.js";
import dotenv from "dotenv";
dotenv.config();

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

    return sendSuccessResponse(res, 200, customer, "customer profile fetch successfully");
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

export const getCustomerById = async (req, res) => {
  try {
    const { customerId } = req.params;
    const customer = await Customer.findById(customerId);

    if (!customer) {
      return sendErrorResponse( res, 404, "USER_NOT_FOUND", "Customer not found");
    }

    return sendSuccessResponse(res, 200, customer, "customer profile fetch successfully");
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

export const getAllCustomers = async (req, res) => {
  try {
    const { status } = req.query;

    let filter = {};
    if (status && ['PENDING_FINANCE', 'APPROVED'].includes(status)) {
      filter.approvalStatus = status;
    }

    const customers = await Customer.find(filter)
      .populate('createdBy', 'username employeeName email Department')
      .populate('financeCompletedBy', 'username employeeName email')
      .populate('zone.refId')
      .populate('salesPerson.refId', 'username employeeName email')
      .sort({ createdAt: -1 });

    return sendSuccessResponse(
      res,
      200,
      {
        count: customers.length,
        customers
      },
      "Customers retrieved successfully"
    );
  } catch (error) {
    console.error("Get all customers error:", error);
    return sendErrorResponse(
      res,
      500,
      "INTERNAL_ERROR",
      "Internal server error while fetching customers"
    );
  }
};

export const getFilteredCustomers = async (req, res) => {
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
      Customer
        .find(query)
        .select('-password -emailOtp -emailOtpExpires -mobileOtp -mobileOtpExpires')
        .populate('CustomerType.refId', 'name')
        .populate('zone.refId', 'name')
        .populate('brandCategories.brandId', 'name')
        .populate('brandCategories.categories.categoryId', 'name')
        .populate('salesPerson.refId', 'username employeeName emailId')
        .populate('createdBy', 'username employeeName emailId Department')
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

export const getPendingFinanceCustomers = async (req, res) => {
  try {
    const customers = await Customer.find({
      approvalStatus: 'PENDING_FINANCE',
      createdByDepartment: 'SALES'
    })
      .populate('createdBy', 'username employeeName employeeName email Department')
      .sort({ createdAt: -1 });

    return sendSuccessResponse(
      res,
      200,
      {
        count: customers.length,
        customers
      },
      "Pending Finance approval customers retrieved successfully"
    );
  } catch (error) {
    console.error("Get pending finance customers error:", error);
    return sendErrorResponse(
      res,
      500,
      "INTERNAL_ERROR",
      "Internal server error while fetching pending customers"
    );
  }
};