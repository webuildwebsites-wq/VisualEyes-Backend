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
      .populate('createdBy', 'employeeName email Department')
      .populate('financeCompletedBy', 'employeeName email')
      .populate('zone.refId')
      .populate('salesPerson.refId', 'employeeName email')
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

export const getPendingFinanceCustomers = async (req, res) => {
  try {
    const customers = await Customer.find({
      approvalStatus: 'PENDING_FINANCE',
      createdByDepartment: 'SALES'
    })
      .populate('createdBy', 'employeeName email Department')
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