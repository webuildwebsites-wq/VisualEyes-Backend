import { createOrderService, getOrderService, listOrdersService, updateOrderService, cancelOrderService, resolveProductService, getOrderDropdownsService, getProductFieldService, getProductNamesService } from "../../services/order/order.service.js";
import { sendSuccessResponse, sendErrorResponse } from "../../../Utils/response/responseHandler.js";

function handleError(res, err) {
  console.error("[Order]", err?.message || err);
  if (err?.statusCode) {
    return sendErrorResponse(res, err.statusCode, err.code, err.message);
  }
  return sendErrorResponse(res, 500, "INTERNAL_ERROR", err?.message || "Unexpected error");
}

export const createOrder = async (req, res) => {
  try {
    const order = await createOrderService(req.body, req.user?.id);
    return sendSuccessResponse(res, 201, order, "Order created successfully");
  } catch (err) {
    return handleError(res, err);
  }
};

export const getOrder = async (req, res) => {
  try {
    const order = await getOrderService(req.params.id);
    return sendSuccessResponse(res, 200, order);
  } catch (err) {
    return handleError(res, err);
  }
};

export const listOrders = async (req, res) => {
  try {
    const result = await listOrdersService(req.query);
    return sendSuccessResponse(res, 200, result);
  } catch (err) {
    return handleError(res, err);
  }
};

export const updateOrder = async (req, res) => {
  try {
    const order = await updateOrderService(req.params.id, req.body);
    return sendSuccessResponse(res, 200, order, "Order updated successfully");
  } catch (err) {
    return handleError(res, err);
  }
};

export const cancelOrder = async (req, res) => {
  try {
    const order = await cancelOrderService(req.params.id, req.body.reason);
    return sendSuccessResponse(res, 200, order, "Order cancelled");
  } catch (err) {
    return handleError(res, err);
  }
};

export const resolveProduct = async (req, res) => {
  try {
    const resolved = await resolveProductService(req.body);
    return sendSuccessResponse(res, 200, { resolved });
  } catch (err) {
    return handleError(res, err);
  }
};

export const getProductField = async (req, res) => {
  try {
    const allowed = ["brand", "category", "treatment", "index", "productType", "coating", "lab"];
    const { field } = req.params;

    if (!allowed.includes(field)) {
      return sendErrorResponse(res, 400, "INVALID_FIELD", `Invalid field. Allowed: ${allowed.join(", ")}`);
    }

    const values = await getProductFieldService(field);
    return sendSuccessResponse(res, 200, { field, values });
  } catch (err) {
    return handleError(res, err);
  }
};

export const getProductNames = async (req, res) => {
  try {
    const result = await getProductNamesService(req.query);
    return sendSuccessResponse(res, 200, result);
  } catch (err) {
    return handleError(res, err);
  }
};
