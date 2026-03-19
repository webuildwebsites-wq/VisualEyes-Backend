import {
  sendErrorResponse,
  sendSuccessResponse,
} from "../../../../Utils/response/responseHandler.js";
import { sendEmail } from "../../../config/Email/emailService.js";
import Customer from "../../../../models/Auth/Customer.js";
import employeeSchema from "../../../../models/Auth/Employee.js";
import mongoose from "mongoose";

/**
 * Finance Team: Approve or Request Modifications
 * After Sales Person submits customer registration
 */
export const financeApproveCustomer = async (req, res) => {
  try {
    const { customerId } = req.params;
    const { action, remark, fieldsToCorrect } = req.body;
    const userId = req.user.id;
    const userDepartment = req.user?.Department?.name || req.user?.Department;

    if (userDepartment !== "FINANCE" && req.user?.EmployeeType !== "SUPERADMIN") {
      return sendErrorResponse(
        res,
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
        requestedAt: new Date()
      };
    }

    await customer.save();

    const customerObj = customer.toObject();
    delete customerObj.password;

    return sendSuccessResponse(
      res,
      200,
      { customer: customerObj },
      `Customer ${action === "APPROVE" ? "approved" : "sent for modification"} by Finance team`
    );
  } catch (error) {
    console.error("Finance approval error:", error);
    return sendErrorResponse(
      res,
      500,
      "INTERNAL_ERROR",
      "Finance approval failed"
    );
  }
};

/**
 * Sales Head: Approve or Reject after Finance approval
 * Sends credentials email on approval
 */
export const salesHeadApproveCustomer = async (req, res) => {
  try {
    const { customerId } = req.params;
    const { action, remark, blacklistReason } = req.body;
    const userId = req.user.id;
    const userDepartment = req.user?.Department?.name || req.user?.Department;

    if (userDepartment !== "SALES" && req.user?.EmployeeType !== "SUPERADMIN") {
      return sendErrorResponse(
        res,
        403,
        "FORBIDDEN",
        "Only Sales Head can approve customers"
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

    if (!action || !["APPROVE", "REJECT", "BLACKLIST"].includes(action)) {
      return sendErrorResponse(
        res,
        400,
        "VALIDATION_ERROR",
        "action must be 'APPROVE', 'REJECT', or 'BLACKLIST'"
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

    if (customer.approvalWorkflow.financeApprovalStatus !== "APPROVED") {
      return sendErrorResponse(
        res,
        400,
        "INVALID_STATUS",
        "Customer must be approved by Finance before Sales Head approval"
      );
    }

    if (action === "APPROVE") {
      customer.approvalWorkflow.salesHeadApprovalStatus = "APPROVED";
      customer.approvalWorkflow.salesHeadApprovedBy = userId;
      customer.approvalWorkflow.salesHeadApprovedAt = new Date();
      customer.approvalWorkflow.salesHeadRemark = remark || "";
      customer.status.isActive = true;

      // Send credentials email to customer
      const CredentialsTemplate = (await import("../../../../Utils/Mail/CredentialsTemplate.js")).default;
      sendEmail({
        to: customer.businessEmail,
        subject: "Your Account Approved - Welcome to VISUAL EYES",
        html: CredentialsTemplate(
          customer.ownerName,
          customer.businessEmail,
          customer.password
        ),
      }).catch((err) => console.error("Background email error:", err));

    } else if (action === "REJECT") {
      customer.approvalWorkflow.salesHeadApprovalStatus = "REJECTED";
      customer.approvalWorkflow.salesHeadApprovedBy = userId;
      customer.approvalWorkflow.salesHeadApprovedAt = new Date();
      customer.approvalWorkflow.salesHeadRemark = remark || "";
      customer.approvalWorkflow.financeApprovalStatus = "PENDING";

    } else if (action === "BLACKLIST") {
      if (!blacklistReason || blacklistReason.trim() === "") {
        return sendErrorResponse(
          res,
          400,
          "VALIDATION_ERROR",
          "blacklistReason is required when blacklisting a customer"
        );
      }

      customer.isBlacklisted = true;
      customer.blacklistReason = blacklistReason;
      customer.approvalWorkflow.salesHeadApprovalStatus = "APPROVED";
      customer.approvalWorkflow.salesHeadApprovedBy = userId;
      customer.approvalWorkflow.salesHeadApprovedAt = new Date();
      customer.status.isActive = false;
    }

    await customer.save();

    const customerObj = customer.toObject();
    delete customerObj.password;

    return sendSuccessResponse(
      res,
      200,
      { customer: customerObj },
      `Customer ${action.toLowerCase()} by Sales Head`
    );
  } catch (error) {
    console.error("Sales Head approval error:", error);
    return sendErrorResponse(
      res,
      500,
      "INTERNAL_ERROR",
      "Sales Head approval failed"
    );
  }
};

/**
 * Customer: Accept Terms & Conditions
 * Becomes a final customer after this
 */
export const acceptTermsAndConditions = async (req, res) => {
  try {
    const { customerId } = req.params;
    const userId = req.user.id;

    if (!customerId || !mongoose.Types.ObjectId.isValid(customerId)) {
      return sendErrorResponse(
        res,
        400,
        "INVALID_ID",
        "Invalid customer ID"
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

    if (customer.approvalWorkflow.salesHeadApprovalStatus !== "APPROVED") {
      return sendErrorResponse(
        res,
        400,
        "INVALID_STATUS",
        "Customer must be approved by Sales Head before accepting terms"
      );
    }

    if (customer.isBlacklisted) {
      return sendErrorResponse(
        res,
        403,
        "BLACKLISTED",
        "This customer is blacklisted and cannot proceed"
      );
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

/**
 * CS Team: Complete customer setup
 * Fill Specific Lab, Fitting Center, Plant, Courier Name, Courier Time
 */
export const csTeamCompleteCustomer = async (req, res) => {
  try {
    const { customerId } = req.params;
    const {
      specificLab,
      specificLabRefId,
      fittingCenter,
      fittingCenterRefId,
      plant,
      plantRefId,
      courierName,
      courierNameRefId,
      courierTime,
      courierTimeRefId,
    } = req.body;
    const userId = req.user.id;
    const userDepartment = req.user?.Department?.name || req.user?.Department;

    if (userDepartment !== "CS" && req.user?.EmployeeType !== "SUPERADMIN") {
      return sendErrorResponse(
        res,
        403,
        "FORBIDDEN",
        "Only CS team can complete customer setup"
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

    const customer = await Customer.findById(customerId);
    if (!customer) {
      return sendErrorResponse(
        res,
        404,
        "NOT_FOUND",
        "Customer not found"
      );
    }

    if (!customer.termsAndConditionsAccepted) {
      return sendErrorResponse(
        res,
        400,
        "INVALID_STATUS",
        "Customer must accept terms and conditions before CS team completion"
      );
    }

    // Validate and update CS team fields
    if (specificLab && specificLabRefId) {
      customer.specificLab = {
        name: specificLab,
        refId: specificLabRefId,
      };
    }

    if (fittingCenter && fittingCenterRefId) {
      customer.fittingCenter = {
        name: fittingCenter,
        refId: fittingCenterRefId,
      };
    }

    if (plant && plantRefId) {
      customer.plant = {
        name: plant,
        refId: plantRefId,
      };
    }

    if (courierName && courierNameRefId) {
      customer.courierName = {
        name: courierName,
        refId: courierNameRefId,
      };
    }

    if (courierTime && courierTimeRefId) {
      customer.courierTime = {
        name: courierTime,
        refId: courierTimeRefId,
      };
    }

    customer.approvalWorkflow.csTeamCompletionStatus = "COMPLETED";
    customer.approvalWorkflow.csTeamCompletedBy = userId;
    customer.approvalWorkflow.csTeamCompletedAt = new Date();

    await customer.save();

    const customerObj = customer.toObject();
    delete customerObj.password;

    return sendSuccessResponse(
      res,
      200,
      { customer: customerObj },
      "Customer setup completed by CS team"
    );
  } catch (error) {
    console.error("CS team completion error:", error);
    return sendErrorResponse(
      res,
      500,
      "INTERNAL_ERROR",
      "CS team completion failed"
    );
  }
};

/**
 * Get customers pending at each stage
 */
export const getPendingCustomersByStage = async (req, res) => {
  try {
    const { stage } = req.query;
    const userDepartment = req.user?.Department?.name || req.user?.Department;

    let query = {};

    if (stage === "finance") {
      query = { "approvalWorkflow.financeApprovalStatus": "PENDING" };
    } else if (stage === "salesHead") {
      query = { "approvalWorkflow.salesHeadApprovalStatus": "PENDING" };
    } else if (stage === "csTeam") {
      query = {
        termsAndConditionsAccepted: true,
        "approvalWorkflow.csTeamCompletionStatus": "PENDING",
      };
    } else if (stage === "correction") {
      query = { "approvalWorkflow.financeApprovalStatus": "MODIFICATION_REQUIRED" };
    } else {
      return sendErrorResponse(
        res,
        400,
        "VALIDATION_ERROR",
        "stage must be one of: finance, salesHead, csTeam, correction"
      );
    }

    const customers = await Customer.find(query)
      .select("-password -emailOtp -mobileOtp")
      .populate("createdBy", "employeeName")
      .populate("approvalWorkflow.financeApprovedBy", "employeeName")
      .populate("approvalWorkflow.salesHeadApprovedBy", "employeeName")
      .populate("approvalWorkflow.csTeamCompletedBy", "employeeName")
      .sort({ createdAt: -1 });

    return sendSuccessResponse(
      res,
      200,
      { customers, count: customers.length },
      `Retrieved ${customers.length} customers pending at ${stage} stage`
    );
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
