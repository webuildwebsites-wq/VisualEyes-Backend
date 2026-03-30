import Order from "../../../models/order/customer.order.js";
import BaseGrid from "../../../models/Product/BaseGrid.js";
import Product from "../../../models/Product/Product.js";
import { sendSuccessResponse, sendErrorResponse } from "../../../Utils/response/responseHandler.js";

function roundToStep(value, step = 0.25) {
  if (value == null || isNaN(value)) return null;
  return Math.round(value / step) * step;
}


async function resolveEye({ brand, category, lensType, sph, cyl, productMode }) {
  const product = await Product.findOne({
    brand:       brand?.trim(),
    category:    category?.trim(),
    productName: lensType?.trim(),
  }).lean();

  if (!product) return { error: "Product not found" };
  console.log("Product : ", product);

  const activeSupplier = (product.suppliers || []).filter((s) => s.active).sort((a, b) => a.priority - b.priority)[0];
  if (!activeSupplier) return { error: "No active supplier found for this product" };

  const gridType = productMode === "Stock Lens" ? "FFGrid" : "RxGrid";

  const gridDoc = await BaseGrid.findOne({
    supplier:    activeSupplier.name.toUpperCase(),
    productCode: product.productShortCode?.toUpperCase() || product.itemCode?.toUpperCase(),
    gridType,
  }).lean();

  const gridDocFallback = gridDoc || await BaseGrid.findOne({
    supplier:    activeSupplier.name.toUpperCase(),
    productCode: product.productShortCode?.toUpperCase() || product.itemCode?.toUpperCase(),
  }).lean();

  if (!gridDocFallback) return { error: "No grid data found for supplier" };

  const sphRounded = roundToStep(sph);
  const cylRounded = roundToStep(cyl);

  let cell = null;

  if (cylRounded != null) {
    cell = gridDocFallback.grid.find(
      (g) => g.sphere === sphRounded && g.axisValue === cylRounded
    );
  }

  if (!cell) {
    cell = gridDocFallback.grid.find(
      (g) => g.sphere === sphRounded && g.axisValue === 0
    );
  }

  if (!cell && gridDocFallback.grid.length > 0) {
    const sorted = [...gridDocFallback.grid].sort(
      (a, b) => Math.abs(a.sphere - sphRounded) - Math.abs(b.sphere - sphRounded)
    );
    cell = sorted[0];
  }

  return {
    itemCode:  product.itemCode,
    supplier:  activeSupplier.name,
    baseCurve: cell?.stock ?? null,
    diameter:  null, 
  };
}


async function generateOrderNumber() {
  const today = new Date();
  const dateStr = today.toISOString().slice(0, 10).replace(/-/g, "");
  const prefix = `ORD-${dateStr}-`;

  const last = await Order.findOne(
    { orderNumber: { $regex: `^${prefix}` } },
    { orderNumber: 1 },
    { sort: { orderNumber: -1 } }
  ).lean();

  let seq = 1;
  if (last?.orderNumber) {
    const parts = last.orderNumber.split("-");
    seq = parseInt(parts[parts.length - 1], 10) + 1;
  }

  return `${prefix}${String(seq).padStart(4, "0")}`;
}


export const createOrder = async (req, res) => {
  try {
    const data = req.body;
    const { brand, category, lensType, productMode, powers = [] } = data;

    if (!brand || !category || !lensType) {
      return sendErrorResponse(res, 400, "MISSING_FIELDS", "brand, category, and lensType are required");
    }

    if (!data.customerId) {
      return sendErrorResponse(res, 400, "MISSING_FIELDS", "customerId is required");
    }

    const resolved = [];
    const sidesNeeded = data.powerType === "Both" ? ["R", "L"] : ["R"];

    for (const side of sidesNeeded) {
      const eyePower = powers.find((p) => p.side === side);
      const result = await resolveEye({
        brand,
        category,
        lensType,
        sph:         eyePower?.sph,
        cyl:         eyePower?.cyl,
        productMode: productMode || "Rx",
      });

      if (result.error) {
        return sendErrorResponse(res, 422, "RESOLUTION_ERROR", `${side} eye: ${result.error}`);
      }

      resolved.push({
        side,
        itemCode:  result.itemCode,
        supplier:  result.supplier,
        baseCurve: result.baseCurve,
        diameter:  eyePower?.diameter ?? null,
      });
    }

    const orderNumber = await generateOrderNumber();

    const order = await Order.create({
      orderNumber,
      customerId:       data.customerId,
      shipTo:           data.shipTo,
      customerBalance:  data.customerBalance,
      lab:              data.lab,
      orderReference:   data.orderReference,
      consumerCardName: data.consumerCardName,
      opticianName:     data.opticianName,
      powerType:        data.powerType,
      productMode:      data.productMode,
      hasPrism:         data.hasPrism,
      powers:           data.powers,
      prisms:           data.prisms,
      brand,
      category,
      index:            data.index,
      lensType,
      coating:          data.coating,
      treatment:        data.treatment,
      tint:             data.tint,
      tintDetails:      data.tintDetails,
      remarks:          data.remarks,
      mirror:           data.mirror,
      resolved,
      centration:       data.centration,
      fitting:          data.fitting,
      lensData:         data.lensData,
      directCustomer:   data.directCustomer,
      shippingCharges:  data.shippingCharges,
      otherCharges:     data.otherCharges,
      status:           "Draft",
      createdBy:        req.user?.id,
    });

    return sendSuccessResponse(res, 201, order, "Order created successfully");
  } catch (err) {
    console.error("createOrder error:", err);
    return sendErrorResponse(res, 500, "INTERNAL_ERROR", err.message);
  }
};


export const submitOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return sendErrorResponse(res, 404, "NOT_FOUND", "Order not found");

    if (order.status !== "Draft") {
      return sendErrorResponse(res, 400, "INVALID_STATUS", `Cannot submit an order with status: ${order.status}`);
    }

    order.status = "Submitted";
    order.submittedAt = new Date();
    await order.save();

    return sendSuccessResponse(res, 200, order, "Order submitted successfully");
  } catch (err) {
    console.error("submitOrder error:", err);
    return sendErrorResponse(res, 500, "INTERNAL_ERROR", err.message);
  }
};


export const getOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate("customerId", "shopName ownerName customerCode mobileNo1")
      .lean();

    if (!order) return sendErrorResponse(res, 404, "NOT_FOUND", "Order not found");

    return sendSuccessResponse(res, 200, order);
  } catch (err) {
    console.error("getOrder error:", err);
    return sendErrorResponse(res, 500, "INTERNAL_ERROR", err.message);
  }
};



export const listOrders = async (req, res) => {
  try {
    const { customerId, status, page = 1, limit = 20, search } = req.query;

    const filter = {};
    if (customerId) filter.customerId = customerId;
    if (status)     filter.status = status;
    if (search)     filter.orderNumber = { $regex: search, $options: "i" };

    const skip  = (parseInt(page) - 1) * parseInt(limit);
    const total = await Order.countDocuments(filter);

    const orders = await Order.find(filter)
      .populate("customerId", "shopName ownerName customerCode")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .lean();

    return sendSuccessResponse(res, 200, {
      orders,
      pagination: {
        total,
        page:       parseInt(page),
        limit:      parseInt(limit),
        totalPages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (err) {
    console.error("listOrders error:", err);
    return sendErrorResponse(res, 500, "INTERNAL_ERROR", err.message);
  }
};


export const updateOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return sendErrorResponse(res, 404, "NOT_FOUND", "Order not found");

    if (order.status !== "Draft") {
      return sendErrorResponse(res, 400, "INVALID_STATUS", "Only Draft orders can be updated");
    }

    const data = req.body;
    const { brand, category, lensType, productMode, powers } = data;

    if (brand || category || lensType) {
      const resolvedBrand    = brand    || order.brand;
      const resolvedCategory = category || order.category;
      const resolvedLensType = lensType || order.lensType;
      const resolvedMode     = productMode || order.productMode || "Rx";
      const resolvedPowers   = powers || order.powers;

      const resolved = [];
      const sidesNeeded = (data.powerType || order.powerType) === "Both" ? ["R", "L"] : ["R"];

      for (const side of sidesNeeded) {
        const eyePower = resolvedPowers.find((p) => p.side === side);
        const result = await resolveEye({
          brand:       resolvedBrand,
          category:    resolvedCategory,
          lensType:    resolvedLensType,
          sph:         eyePower?.sph,
          cyl:         eyePower?.cyl,
          productMode: resolvedMode,
        });

        if (result.error) {
          return sendErrorResponse(res, 422, "RESOLUTION_ERROR", `${side} eye: ${result.error}`);
        }

        resolved.push({
          side,
          itemCode:  result.itemCode,
          supplier:  result.supplier,
          baseCurve: result.baseCurve,
          diameter:  eyePower?.diameter ?? null,
        });
      }

      data.resolved = resolved;
    }

    const allowed = [
      "shipTo", "customerBalance", "lab", "orderReference", "consumerCardName",
      "opticianName", "powerType", "productMode", "hasPrism", "powers", "prisms",
      "brand", "category", "index", "lensType", "coating", "treatment", "tint",
      "tintDetails", "remarks", "mirror", "resolved", "centration", "fitting",
      "lensData", "directCustomer", "shippingCharges", "otherCharges",
    ];

    allowed.forEach((key) => {
      if (data[key] !== undefined) order[key] = data[key];
    });

    await order.save();
    return sendSuccessResponse(res, 200, order, "Order updated successfully");
  } catch (err) {
    console.error("updateOrder error:", err);
    return sendErrorResponse(res, 500, "INTERNAL_ERROR", err.message);
  }
};


export const cancelOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return sendErrorResponse(res, 404, "NOT_FOUND", "Order not found");

    if (!["Draft", "Submitted"].includes(order.status)) {
      return sendErrorResponse(res, 400, "INVALID_STATUS", `Cannot cancel an order with status: ${order.status}`);
    }

    order.status = "Cancelled";
    order.cancelReason = req.body.reason || "";
    await order.save();

    return sendSuccessResponse(res, 200, order, "Order cancelled");
  } catch (err) {
    console.error("cancelOrder error:", err);
    return sendErrorResponse(res, 500, "INTERNAL_ERROR", err.message);
  }
};


export const resolveProduct = async (req, res) => {
  try {
    const { brand, category, lensType, productMode, powers = [] } = req.body;

    if (!brand || !category || !lensType) {
      return sendErrorResponse(res, 400, "MISSING_FIELDS", "brand, category, and lensType are required");
    }

    const powerType = req.body.powerType || "Single";
    const sidesNeeded = powerType === "Both" ? ["R", "L"] : ["R"];
    const resolved = [];

    for (const side of sidesNeeded) {
      const eyePower = powers.find((p) => p.side === side);
      const result = await resolveEye({
        brand,
        category,
        lensType,
        sph:         eyePower?.sph,
        cyl:         eyePower?.cyl,
        productMode: productMode || "Rx",
      });

      if (result.error) {
        return sendErrorResponse(res, 422, "RESOLUTION_ERROR", `${side} eye: ${result.error}`);
      }

      resolved.push({ side, ...result, diameter: eyePower?.diameter ?? null });
    }

    return sendSuccessResponse(res, 200, { resolved });
  } catch (err) {
    console.error("resolveProduct error:", err);
    return sendErrorResponse(res, 500, "INTERNAL_ERROR", err.message);
  }
};