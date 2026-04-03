import {
  createOrderService, getOrderService, listOrdersService, updateOrderService,
  cancelOrderService, resolveProductService,
  getProductNamesService, getTintOptionsService, updateDraftOrderService,
  getFrameTypesService,
  getProductBrandsService, getProductCategoriesService, getProductTreatmentsService,
  getProductIndexesService, getProductTypesService, getProductLabsService,
  getProductCoatingsService,
} from "../../services/order/order.service.js";
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

export const getProductNames = async (req, res) => {
  try {
    const result = await getProductNamesService(req.query);
    return sendSuccessResponse(res, 200, result);
  } catch (err) {
    return handleError(res, err);
  }
};

export const getTintOptions = async (req, res) => {
  try {
    const values = await getTintOptionsService();
    return sendSuccessResponse(res, 200, { field: "tint", values });
  } catch (err) {
    return handleError(res, err);
  }
};

export const updateDraftOrder = async (req, res) => {
  try {
    const order = await updateDraftOrderService(req.params.id, req.body);
    return sendSuccessResponse(res, 200, order, "Draft order updated successfully");
  } catch (err) {
    return handleError(res, err);
  }
};

export const getFrameTypes = async (req, res) => {
  try {
    const values = await getFrameTypesService();
    return sendSuccessResponse(res, 200, { field: "frameType", values });
  } catch (err) { return handleError(res, err); }
};

export const getProductBrands = async (req, res) => {
  try {
    const values = await getProductBrandsService();
    return sendSuccessResponse(res, 200, { field: "brand", values });
  } catch (err) { return handleError(res, err); }
};

export const getProductCategories = async (req, res) => {
  try {
    const values = await getProductCategoriesService();
    return sendSuccessResponse(res, 200, { field: "category", values });
  } catch (err) { return handleError(res, err); }
};

export const getProductTreatments = async (req, res) => {
  try {
    const values = await getProductTreatmentsService();
    return sendSuccessResponse(res, 200, { field: "treatment", values });
  } catch (err) { return handleError(res, err); }
};

export const getProductIndexes = async (req, res) => {
  try {
    const values = await getProductIndexesService();
    return sendSuccessResponse(res, 200, { field: "index", values });
  } catch (err) { return handleError(res, err); }
};

export const getProductTypes = async (req, res) => {
  try {
    const values = await getProductTypesService();
    return sendSuccessResponse(res, 200, { field: "productType", values });
  } catch (err) { return handleError(res, err); }
};

export const getProductLabs = async (req, res) => {
  try {
    const values = await getProductLabsService();
    return sendSuccessResponse(res, 200, { field: "lab", values });
  } catch (err) { return handleError(res, err); }
};

export const getProductCoatings = async (req, res) => {
  try {
    const values = await getProductCoatingsService();
    return sendSuccessResponse(res, 200, { field: "coating", values });
  } catch (err) { return handleError(res, err); }
};
