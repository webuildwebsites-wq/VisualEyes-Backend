import CustomerType from "../../../models/Product/CustomerType.js";
import { sendErrorResponse, sendSuccessResponse } from "../../../Utils/response/responseHandler.js";

export const createCustomerType = async (req, res) => {
  try {
    const { name, description } = req.body;

    if (!name) {
      return sendErrorResponse(res, 400, "VALIDATION_ERROR", "Customer type name is required");
    }

    const existingCustomerType = await CustomerType.findOne({ name: name.trim() });
    if (existingCustomerType) {
      return sendErrorResponse(res, 409, "DUPLICATE_ERROR", "Customer type already exists");
    }

    const customerType = await CustomerType.create({
      name: name.trim(),
      description,
      createdBy: req.user._id,
    });

    return sendSuccessResponse(res, 201, customerType, "Customer type created successfully");
  } catch (error) {
    console.error("Create Customer Type Error:", error);
    return sendErrorResponse(res, 500, "INTERNAL_ERROR", "Failed to create customer type");
  }
};

export const getAllCustomerTypes = async (req, res) => {
  try {
    const { isActive } = req.query;
    
    const filter = {};
    if (isActive !== undefined) {
      filter.isActive = isActive === 'true';
    }

    const customerTypes = await CustomerType.find(filter).sort({ name: 1 });

    return sendSuccessResponse(res, 200, customerTypes, "Customer types retrieved successfully");
  } catch (error) {
    console.error("Get All Customer Types Error:", error);
    return sendErrorResponse(res, 500, "INTERNAL_ERROR", "Failed to retrieve customer types");
  }
};

export const getCustomerTypeById = async (req, res) => {
  try {
    const { id } = req.params;

    const customerType = await CustomerType.findById(id);

    if (!customerType) {
      return sendErrorResponse(res, 404, "NOT_FOUND", "Customer type not found");
    }

    return sendSuccessResponse(res, 200, customerType, "Customer type retrieved successfully");
  } catch (error) {
    console.error("Get Customer Type Error:", error);
    return sendErrorResponse(res, 500, "INTERNAL_ERROR", "Failed to retrieve customer type");
  }
};

export const updateCustomerType = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, isActive } = req.body;

    const customerType = await CustomerType.findById(id);
    if (!customerType) {
      return sendErrorResponse(res, 404, "NOT_FOUND", "Customer type not found");
    }

    if (name && name.trim() !== customerType.name) {
      const existingCustomerType = await CustomerType.findOne({ name: name.trim() });
      if (existingCustomerType) {
        return sendErrorResponse(res, 409, "DUPLICATE_ERROR", "Customer type name already exists");
      }
      customerType.name = name.trim();
    }

    if (description !== undefined) customerType.description = description;
    if (isActive !== undefined) customerType.isActive = isActive;

    await customerType.save();

    return sendSuccessResponse(res, 200, customerType, "Customer type updated successfully");
  } catch (error) {
    console.error("Update Customer Type Error:", error);
    return sendErrorResponse(res, 500, "INTERNAL_ERROR", "Failed to update customer type");
  }
};

export const deleteCustomerType = async (req, res) => {
  try {
    const { id } = req.params;

    const customerType = await CustomerType.findById(id);
    if (!customerType) {
      return sendErrorResponse(res, 404, "NOT_FOUND", "Customer type not found");
    }

    await CustomerType.findByIdAndDelete(id);

    return sendSuccessResponse(res, 200, null, "Customer type deleted successfully");
  } catch (error) {
    console.error("Delete Customer Type Error:", error);
    return sendErrorResponse(res, 500, "INTERNAL_ERROR", "Failed to delete customer type");
  }
};
