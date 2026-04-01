import Order from "../../../models/order/customer.order.js";
import BaseGrid from "../../../models/Product/BaseGrid.js";
import Product from "../../../models/Product/Product.js";
import Customer from "../../../models/Auth/Customer.js";

function roundToStep(value, step = 0.25) {
  if (value == null || isNaN(Number(value))) return null;
  return Math.round(Number(value) / step) * step;
}

function findGridCell(grid, sph, axisValue) {
  const sphR = roundToStep(sph);
  const axR = roundToStep(axisValue);

  if (sphR != null && axR != null) {
    const exact = grid.find((g) => g.sphere === sphR && g.axisValue === axR);
    if (exact) return exact;
  }

  if (sphR != null) {
    const noAxis = grid.find((g) => g.sphere === sphR && g.axisValue === 0);
    if (noAxis) return noAxis;
  }

  if (sphR != null && grid.length > 0) {
    return [...grid].sort(
      (a, b) => Math.abs(a.sphere - sphR) - Math.abs(b.sphere - sphR)
    )[0];
  }

  return null;
}

function caseInsensitive(val) {
  return { $regex: "^" + (val || "").trim() + "$", $options: "i" };
}


export async function resolveEye({ brand, category, lensType, sph, cyl, add, productMode }) {
  const product = await Product.findOne({
    brand: caseInsensitive(brand),
    category: caseInsensitive(category),
    productName: caseInsensitive(lensType),
  }).lean();

  console.log("product. ", product);

  if (!product) {
    return { error: `Product not found for brand="${brand}", category="${category}", lensType="${lensType}"` };
  }

  const blankCode = (product.blankCode || "").trim().toUpperCase();
  if (!blankCode) {
    return { error: `No blank code defined for product "${lensType}"` };
  }

  console.log("product.suppliers : ", product.suppliers);
  const activeSuppliers = (product.suppliers || []).filter((s) => s.active).sort((a, b) => a.priority - b.priority);

  if (!activeSuppliers.length) {
    return { error: `No active supplier found for product "${lensType}"` };
  }

  const gridType = productMode === "Stock Lens" ? "FFGrid" : "RxGrid";
  let allGridDocs = await BaseGrid.find({
    productCode: caseInsensitive(blankCode),
    gridType,
  }).lean();

  console.log("allGridDocs : ", allGridDocs);

  if (!allGridDocs.length) {
    allGridDocs = await BaseGrid.find({
      productCode: caseInsensitive(blankCode),
    }).lean();
    console.log("Fall back all grids : ", allGridDocs);
  }

  if (!allGridDocs.length) {
    return { error: `No grid data found for blank code "${blankCode}"` };
  }

  let gridDoc = null;
  let chosenSupplier = null;

  for (const supplier of activeSuppliers) {
    const supplierName = supplier.name.trim().toUpperCase();
    const match = allGridDocs.find((g) => g.supplier.trim().toUpperCase() === supplierName);
    if (match) {
      gridDoc = match;
      chosenSupplier = supplier;
      break;
    }
  }

  console.log("gridDoc : ", gridDoc);

  if (!gridDoc) {
    gridDoc = allGridDocs[0];
    chosenSupplier = activeSuppliers[0];
  }

  const axisValue = gridDoc.axisType === "Minus cylinder" ? (cyl ?? 0) : (add ?? 0);
  const cell = findGridCell(gridDoc.grid, sph, axisValue);

  return {
    itemCode: product.itemCode,
    blankCode,
    supplier: chosenSupplier.name,
    productCode: blankCode,
    gridType: gridDoc.gridType,
    baseCurve: cell?.stock ?? null,
  };
}

export async function generateOrderNumber() {
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const prefix = "ORD-" + dateStr + "-";

  const last = await Order.findOne(
    { orderNumber: { $regex: "^" + prefix } },
    { orderNumber: 1 },
    { sort: { orderNumber: -1 } }
  ).lean();

  const seq = last?.orderNumber
    ? parseInt(last.orderNumber.split("-").pop(), 10) + 1
    : 1;

  return prefix + String(seq).padStart(4, "0");
}


export async function resolveAllEyes({ brand, category, lensType, productMode, powerType, powers = [] }) {
  const sides = powerType === "Both" ? ["R", "L"] : ["R"];
  const resolved = [];

  for (const side of sides) {
    const eye = powers.find((p) => p.side === side) || {};
    const result = await resolveEye({
      brand,
      category,
      lensType,
      sph: eye.sph,
      cyl: eye.cyl,
      add: eye.add,
      productMode: productMode || "Rx",
    });

    if (result.error) {
      throw { statusCode: 422, code: "RESOLUTION_ERROR", message: side + " eye: " + result.error };
    }

    resolved.push({
      side,
      itemCode: result.itemCode,
      supplier: result.supplier,
      baseCurve: result.baseCurve,
      diameter: eye.diameter ?? null,
    });
  }

  return resolved;
}


export async function createOrderService(data, userId) {
  const { brand, category, lensType, productMode, powerType, powers = [] } = data;

  if (!brand || !category || !lensType) {
    throw { statusCode: 400, code: "MISSING_FIELDS", message: "brand, category, and lensType are required" };
  }
  if (!data.customerId) {
    throw { statusCode: 400, code: "MISSING_FIELDS", message: "customerId is required" };
  }

  const customer = await Customer.findById(data.customerId).lean();
  if (!customer) {
    throw { statusCode: 404, code: "NOT_FOUND", message: "Customer not found" };
  }
  if (!customer.status?.isActive) {
    throw { statusCode: 403, code: "CUSTOMER_INACTIVE", message: "Customer account is not active" };
  }

  const resolved = await resolveAllEyes({ brand, category, lensType, productMode, powerType, powers });
  const orderNumber = await generateOrderNumber();

  const order = await Order.create({
    orderNumber,
    customerId: data.customerId,
    shipTo: data.shipTo,
    customerBalance: data.customerBalance,
    lab: data.lab,
    orderReference: data.orderReference,
    consumerCardName: data.consumerCardName,
    opticianName: data.opticianName,
    powerType: data.powerType,
    productMode: data.productMode,
    hasPrism: data.hasPrism ?? false,
    powers: data.powers ?? [],
    prisms: data.prisms ?? [],
    brand,
    category,
    index: data.index,
    lensType,
    coating: data.coating,
    treatment: data.treatment,
    tint: data.tint,
    tintDetails: data.tintDetails,
    remarks: data.remarks,
    mirror: data.mirror ?? false,
    resolved,
    centration: data.centration ?? [],
    fitting: data.fitting,
    lensData: data.lensData,
    directCustomer: data.directCustomer,
    shippingCharges: data.shippingCharges ?? 0,
    otherCharges: data.otherCharges ?? 0,
    status: "Draft",
    createdBy: userId,
  });

  return order;
}

export async function submitOrderService(orderId) {
  const order = await Order.findById(orderId);
  if (!order) throw { statusCode: 404, code: "NOT_FOUND", message: "Order not found" };

  if (order.status !== "Draft") {
    throw { statusCode: 400, code: "INVALID_STATUS", message: "Cannot submit an order with status: " + order.status };
  }

  order.status = "Submitted";
  order.submittedAt = new Date();
  await order.save();
  return order;
}

export async function getOrderService(orderId) {
  const order = await Order.findById(orderId)
    .populate("customerId", "shopName ownerName customerCode mobileNo1 businessEmail")
    .populate("createdBy", "name email EmployeeType")
    .lean();

  if (!order) throw { statusCode: 404, code: "NOT_FOUND", message: "Order not found" };
  return order;
}

export async function listOrdersService({ customerId, status, page = 1, limit = 20, search, fromDate, toDate }) {
  const filter = {};

  if (customerId) filter.customerId = customerId;
  if (status) filter.status = status;
  if (search) {
    filter.$or = [
      { orderNumber: { $regex: search, $options: "i" } },
      { opticianName: { $regex: search, $options: "i" } },
      { orderReference: { $regex: search, $options: "i" } },
    ];
  }

  if (fromDate || toDate) {
    filter.createdAt = {};
    if (fromDate) filter.createdAt.$gte = new Date(fromDate);
    if (toDate) {
      const end = new Date(toDate);
      end.setHours(23, 59, 59, 999);
      filter.createdAt.$lte = end;
    }
  }

  const skip = (parseInt(page) - 1) * parseInt(limit);
  const total = await Order.countDocuments(filter);

  const orders = await Order.find(filter)
    .populate("customerId", "shopName ownerName customerCode mobileNo1")
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(parseInt(limit))
    .lean();

  return {
    orders,
    pagination: {
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages: Math.ceil(total / parseInt(limit)),
    },
  };
}

export async function updateOrderService(orderId, data) {
  const order = await Order.findById(orderId);
  if (!order) throw { statusCode: 404, code: "NOT_FOUND", message: "Order not found" };

  if (order.status !== "Draft") {
    throw { statusCode: 400, code: "INVALID_STATUS", message: "Only Draft orders can be updated" };
  }

  const needsResolve = data.brand || data.category || data.lensType || data.powers || data.productMode || data.powerType;

  if (needsResolve) {
    const resolved = await resolveAllEyes({
      brand: data.brand || order.brand,
      category: data.category || order.category,
      lensType: data.lensType || order.lensType,
      productMode: data.productMode || order.productMode,
      powerType: data.powerType || order.powerType,
      powers: data.powers || order.powers,
    });
    data.resolved = resolved;
  }

  const UPDATABLE = [
    "shipTo", "customerBalance", "lab", "orderReference", "consumerCardName",
    "opticianName", "powerType", "productMode", "hasPrism", "powers", "prisms",
    "brand", "category", "index", "lensType", "coating", "treatment", "tint",
    "tintDetails", "remarks", "mirror", "resolved", "centration", "fitting",
    "lensData", "directCustomer", "shippingCharges", "otherCharges",
  ];

  UPDATABLE.forEach((key) => {
    if (data[key] !== undefined) order[key] = data[key];
  });

  await order.save();
  return order;
}

export async function cancelOrderService(orderId, reason) {
  const order = await Order.findById(orderId);
  if (!order) throw { statusCode: 404, code: "NOT_FOUND", message: "Order not found" };

  if (!["Draft", "Submitted"].includes(order.status)) {
    throw { statusCode: 400, code: "INVALID_STATUS", message: "Cannot cancel an order with status: " + order.status };
  }

  order.status = "Cancelled";
  order.cancelReason = reason || "";
  await order.save();
  return order;
}

export async function resolveProductService({ brand, category, lensType, productMode, powerType, powers }) {
  if (!brand || !category || !lensType) {
    throw { statusCode: 400, code: "MISSING_FIELDS", message: "brand, category, and lensType are required" };
  }
  return resolveAllEyes({
    brand,
    category,
    lensType,
    productMode,
    powerType: powerType || "Single",
    powers: powers || [],
  });
}

export async function getOrderDropdownsService({ brand, category }) {
  if (!brand && !category) {
    const brands = await Product.distinct("brand", { brand: { $ne: null } });
    return { brands: brands.filter(Boolean).sort() };
  }

  if (brand && !category) {
    const categories = await Product.distinct("category", {
      brand: caseInsensitive(brand),
      category: { $ne: null },
    });
    return { categories: categories.filter(Boolean).sort() };
  }

  if (brand && category) {
    const lensTypes = await Product.distinct("productName", {
      brand: caseInsensitive(brand),
      category: caseInsensitive(category),
      productName: { $ne: null },
    });
    return { lensTypes: lensTypes.filter(Boolean).sort() };
  }

  return {};
}
