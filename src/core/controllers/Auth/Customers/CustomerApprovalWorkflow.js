import { sendErrorResponse, sendSuccessResponse } from "../../../../Utils/response/responseHandler.js";
import { sendEmail } from "../../../config/Email/emailService.js";
import Customer from "../../../../models/Auth/Customer.js";
import mongoose from "mongoose";

export const financeApproveCustomer = async (req, res) => {
  try {
    const { customerId } = req.params;
    const { action, remark, fieldsToCorrect } = req.body;
    const userId = req.user.id;
    const userDepartment = req.user?.Department?.name || req.user?.Department;

    if (userDepartment !== "FINANCE" && req.user?.EmployeeType !== "SUPERADMIN") {
      return sendErrorResponse(res,
        403,
        "FORBIDDEN",
        "Only Finance team can approve customers"
      );
    }

    if (!customerId || !mongoose.Types.ObjectId.isValid(customerId)) {
      return sendErrorResponse(
        res,
        400,
        "INVALID_ID",
        "Invalid customer ID"
      );
    }

    if (!action || !["APPROVE", "REQUEST_MODIFICATION"].includes(action)) {
      return sendErrorResponse(
        res,
        400,
        "VALIDATION_ERROR",
        "action must be either 'APPROVE' or 'REQUEST_MODIFICATION'"
      );
    }

    const customer = await Customer.findById(customerId);
    if (!customer) {
      return sendErrorResponse(
        res,
        404,
        "NOT_FOUND",
        "Customer not found"
      );
    }

    if (customer.approvalWorkflow.financeApprovalStatus !== "PENDING") {
      return sendErrorResponse(
        res,
        400,
        "INVALID_STATUS",
        "Customer is not pending finance approval"
      );
    }

    if (action === "APPROVE") {
      customer.approvalWorkflow.financeApprovalStatus = "APPROVED";
      customer.approvalWorkflow.financeApprovedBy = userId;
      customer.approvalWorkflow.financeApprovedAt = new Date();
      customer.approvalWorkflow.financeRemark = remark || "";
      customer.approvalWorkflow.salesHeadApprovalStatus = "PENDING";
    } else if (action === "REQUEST_MODIFICATION") {
      if (!fieldsToCorrect || !Array.isArray(fieldsToCorrect) || fieldsToCorrect.length === 0) {
        return sendErrorResponse(
          res,
          400,
          "VALIDATION_ERROR",
          "fieldsToCorrect array is required when requesting modifications"
        );
      }

      customer.approvalWorkflow.financeApprovalStatus = "MODIFICATION_REQUIRED";
      customer.correctionRequest = {
        fieldsToCorrect,
        remark: remark || "",
        requestedEmployeeName: req.user.employeeName,
        requestedBy: userId,
        requestedAt: new Date(),
        correctionNeededBy: 'SALES'
      };
    }

    await customer.save();

    const customerObj = customer.toObject();
    delete customerObj.password;

    return sendSuccessResponse(res, 200, { customer: customerObj }, `Customer ${action === "APPROVE" ? "approved" : "sent for modification"} by Finance team`);
  } catch (error) {
    console.error("Finance approval error:", error);
    return sendErrorResponse(res, 500, "INTERNAL_ERROR", "Finance approval failed");
  }
};

export const salesHeadApproveCustomer = async (req, res) => {
  try {
    const { customerId } = req.params;
    const { action, remark, blacklistReason } = req.body;
    const userId = req.user.id;
    const userDepartment = req.user?.Department?.name || req.user?.Department;

    if (userDepartment !== "SALES" && req.user?.EmployeeType !== "SUPERADMIN") {
      return sendErrorResponse(res, 403, "FORBIDDEN", "Only Sales Head can approve customers");
    }

    if (!customerId || !mongoose.Types.ObjectId.isValid(customerId)) {
      return sendErrorResponse(res, 400, "INVALID_ID", "Invalid customer ID");
    }

    if (!action || !["APPROVE", "REJECT", "BLACKLIST"].includes(action)) {
      return sendErrorResponse(res, 400, "VALIDATION_ERROR", "action must be 'APPROVE', 'REJECT', or 'BLACKLIST'");
    }

    const customer = await Customer.findById(customerId);
    if (!customer) {
      return sendErrorResponse(res, 404, "NOT_FOUND", "Customer not found");
    }

    if (customer.approvalWorkflow.financeApprovalStatus !== "APPROVED") {
      return sendErrorResponse(res, 400, "INVALID_STATUS", "Customer must be approved by Finance before Sales Head approval");
    }

    if (action === "APPROVE") {
      customer.approvalWorkflow.salesHeadApprovalStatus = "APPROVED";
      customer.approvalWorkflow.salesHeadApprovedBy = userId;
      customer.approvalWorkflow.salesHeadApprovedAt = new Date();
      customer.approvalWorkflow.salesHeadRemark = remark || "";
      customer.status.isActive = true;
    } else if (action === "REJECT") {
      if (!blacklistReason || blacklistReason.trim() === "") {
        return sendErrorResponse(res, 400, "VALIDATION_ERROR", "blacklistReason is required when blacklisting a customer");
      }
      customer.isBlacklisted = true;
      customer.blacklistReason = blacklistReason;
      customer.approvalWorkflow.salesHeadApprovalStatus = "REJECTED";
      customer.approvalWorkflow.salesHeadApprovedBy = userId;
      customer.approvalWorkflow.salesHeadApprovedAt = new Date();
      customer.status.isActive = false;
    } else if (action === "REQUEST_MODIFICATION") {
      if (!fieldsToCorrect || !Array.isArray(fieldsToCorrect) || fieldsToCorrect.length === 0) {
        return sendErrorResponse(res, 400, "VALIDATION_ERROR", "fieldsToCorrect array is required when requesting modifications");
      }
      customer.approvalWorkflow.financeApprovalStatus = "MODIFICATION_REQUIRED";
      customer.correctionRequest = {
        fieldsToCorrect,
        remark: remark || "",
        requestedEmployeeName: req.user.employeeName,
        requestedBy: userId,
        requestedAt: new Date(),
        correctionNeededBy: 'FINANCE'
      };
    }

    await customer.save();

    const customerObj = customer.toObject();
    delete customerObj.password;

    return sendSuccessResponse(res, 200, { customer: customerObj }, `Customer ${action.toLowerCase()} by Sales Head`);
  } catch (error) {
    console.error("Sales Head approval error:", error);
    return sendErrorResponse(res, 500, "INTERNAL_ERROR", "Sales Head approval failed");
  }
};

export const acceptTermsAndConditions = async (req, res) => {
  try {
    const { customerId } = req.params;
    const userId = req.user.id;

    if (!customerId || !mongoose.Types.ObjectId.isValid(customerId)) {
      return sendErrorResponse(res, 400, "INVALID_ID", "Invalid customer ID");
    }

    const customer = await Customer.findById(customerId);
    if (!customer) {
      return sendErrorResponse(res, 404, "NOT_FOUND", "Customer not found");
    }

    if (customer.approvalWorkflow.salesHeadApprovalStatus !== "APPROVED") {
      return sendErrorResponse(res, 400, "INVALID_STATUS", "Customer must be approved by Sales Head before accepting terms");
    }

    if (customer.isBlacklisted) {
      return sendErrorResponse(res, 403, "BLACKLISTED", "This customer is blacklisted and cannot proceed");
    }

    customer.termsAndConditionsAccepted = true;
    customer.termsAcceptedAt = new Date();
    customer.status.isActive = true;

    await customer.save();

    const customerObj = customer.toObject();
    delete customerObj.password;

    return sendSuccessResponse(
      res,
      200,
      { customer: customerObj },
      "Terms and conditions accepted. Customer is now finalized."
    );
  } catch (error) {
    console.error("Terms acceptance error:", error);
    return sendErrorResponse(
      res,
      500,
      "INTERNAL_ERROR",
      "Terms acceptance failed"
    );
  }
};

export const getPendingCustomersByStage = async (req, res) => {
  try {
    const { stage } = req.query;

    const page = Math.max(parseInt(req.query.page) || 1, 1);
    const limit = Math.min(parseInt(req.query.limit) || 10, 100);
    const skip = (page - 1) * limit;

    let query = {};

    if (stage === "finance") {
      query = { "approvalWorkflow.financeApprovalStatus": "PENDING" };
    } else if (stage === "salesHead") {
      query = { "approvalWorkflow.financeApprovalStatus": "APPROVED", "approvalWorkflow.salesHeadApprovalStatus": "PENDING" };
    } else if (stage === "salesCorrection") {
      query = { "approvalWorkflow.financeApprovalStatus": "MODIFICATION_REQUIRED", "correctionRequest.correctionNeededBy": "SALES" };
    } else if (stage === "financeCorrection") {
      query = { "approvalWorkflow.financeApprovalStatus": "PENDING", "correctionRequest.correctionNeededBy": "FINANCE" };
    } else {
      return sendErrorResponse(res, 400, "VALIDATION_ERROR", "stage must be one of: finance, salesHead, salesCorrection, financeCorrection");
    }

    const [customers, total] = await Promise.all([
      Customer.find(query)
        .select("-password -emailOtp -mobileOtp")
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

    return sendSuccessResponse(res, 200, { customers, pagination }, `Retrieved ${customers.length} customers pending at ${stage} stage`);
  } catch (error) {
    console.error("Get pending customers error:", error);
    return sendErrorResponse(
      res,
      500,
      "INTERNAL_ERROR",
      "Failed to retrieve pending customers"
    );
  }
};
