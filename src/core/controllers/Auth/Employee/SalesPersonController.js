import employeeSchema from "../../../../models/Auth/Employee.js";
import { sendErrorResponse, sendSuccessResponse } from "../../../../Utils/response/responseHandler.js";

export const getAllSalesPersons = async (req, res) => {
  try {    
    const filter = {
      Department: 'SALES',
      UserType: { $in: ['EMPLOYEE', 'SUPERVISOR'] }
    };
    const salesPersons = await employeeSchema.find(filter).select('username email phone Department UserType Role region lab isActive');
    return sendSuccessResponse(res, 200, salesPersons, "Sales persons retrieved successfully");
  } catch (error) {
    console.error("Get All Sales Persons Error:", error);
    return sendErrorResponse(res, 500, "INTERNAL_ERROR", "Failed to retrieve sales persons");
  }
};

export const getSalesPersonById = async (req, res) => {
  try {
    const { id } = req.params;

    const salesPerson = await employeeSchema.findOne({ 
        _id: id, 
        Department: 'SALES',
        UserType: { $in: ['EMPLOYEE', 'SUPERVISOR'] }
      }).select('username email phone Department UserType Role region lab isActive profile');

    if (!salesPerson) {
      return sendErrorResponse(res, 404, "NOT_FOUND", "Sales person not found");
    }

    return sendSuccessResponse(res, 200, salesPerson, "Sales person retrieved successfully");
  } catch (error) {
    console.error("Get Sales Person Error:", error);
    return sendErrorResponse(res, 500, "INTERNAL_ERROR", "Failed to retrieve sales person");
  }
};
