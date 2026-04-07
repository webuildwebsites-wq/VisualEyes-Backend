import Order from "../../../models/order/customer.order.js";
import BaseGrid from "../../../models/Product/BaseGrid.js";
import Product from "../../../models/Product/Product.js";
import Customer from "../../../models/Auth/Customer.js";
import Tint from "../../../models/order/Tint.js";
import FrameType from "../../../models/order/FrameType.js";
import ProductBrand from "../../../models/order/ProductBrand.js";
import ProductCategory from "../../../models/order/ProductCategory.js";
import ProductTreatment from "../../../models/order/ProductTreatment.js";
import ProductIndex from "../../../models/order/ProductIndex.js";
import ProductType from "../../../models/order/ProductType.js";
import ProductLab from "../../../models/order/ProductLab.js";
import ProductCoating from "../../../models/order/ProductCoating.js";

function roundToStep(value, step = 0.25) {
  if (value == null || isNaN(Number(value))) return null;
  return Math.round(Number(value) / step) * step;
}

function findGridCell(grid, sph, axisValue) {
  const sphR = roundToStep(sph);
  const axR = roundToStep(axisValue);

  if (sphR == null) return null;

  if (axR != null) {
    return grid.find((g) => g.sphere === sphR && g.axisValue === axR) ?? null;
  }

  return grid.find((g) => g.sphere === sphR && g.axisValue === 0) ?? null;
}

function caseInsensitive(val) {
  const normalized = (val || "").replace(/\s+/g, " ").trim();
  const escaped = normalized.replace(/[.*+?^${}()|[\]\\]/g, "\\$&").replace(/ /g, "\\s+");
  return { $regex: `^${escaped}$`, $options: "i" };
}

export async function resolveEye({ brand, category, productName, sph, cyl, add, productMode }) {
  console.log("caseInsensitive(brand) : ", caseInsensitive(brand));
  console.log("category : ", caseInsensitive(category));
  console.log("productName : ", productName);
  console.log("productName : ", caseInsensitive(productName))
  const product = await Product.findOne({
    brand: caseInsensitive(brand),
    category: caseInsensitive(category),
    productName: caseInsensitive(productName),
  }).lean();

  if (!product) {
    return { error: `Product not found for brand="${brand}", category="${category}", productName="${productName}"` };
  }

  const blankCode = (product.blankCode || "").trim().toUpperCase();
  if (!blankCode) {
    return { error: `No blank code defined for product "${productName}"` };
  }

  const activeSuppliers = (product.suppliers || []).filter((s) => s.active).sort((a, b) => a.priority - b.priority);

  if (!activeSuppliers.length) {
    return { error: `No active supplier found for product "${productName}"` };
  }

  const gridType = productMode === "Stock Lens" ? "FFGrid" : "RxGrid";
  
  let allGridDocs = await BaseGrid.find({
    productCode: caseInsensitive(blankCode),
    gridType,
  }).lean();

  console.log("gridType : ",gridType);
  console.log("blankCode : ", caseInsensitive(blankCode));

  console.log("allGridDocs : ", allGridDocs.length);


  if (!allGridDocs.length) {
    allGridDocs = await BaseGrid.find({
      productCode: caseInsensitive(blankCode),
    }).lean();
    console.log("Fall back all grids : ", allGridDocs);
  }

  if (!allGridDocs.length) {
    return { error: `No grid data found for blank code "${blankCode}"` };
  }

  const gridDoc = allGridDocs[0];
  const chosenSupplier = (product.suppliers || []).filter((s) => s.active).sort((a, b) => a.priority - b.priority)[0];


  if (gridDoc.axisType.toUpperCase() !== "Minus cylinder".toLocaleUpperCase() && (add == null)) {
    return { error: `This is a Stock Lens product. Please provide "add" value in powers (e.g. "add": 0.25)` };
  }

  const axisValue = gridDoc.axisType === "Minus cylinder" ? (cyl ?? 0) : add;
  const cell = findGridCell(gridDoc.grid, sph, axisValue);

  return {
    itemCode: product.itemCode,
    blankCode,
    supplier: chosenSupplier.name,
    productCode: blankCode,
    gridType: gridDoc.gridType,
    baseCurve: cell?.stock ?? null,
    allSuppliers: activeSuppliers.map((s) => ({
      name: s.name,
      priority: s.priority,
      active: s.active,
    })),
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

async function resolveDropdownField(Model, value, fieldLabel, nameField = "name") {
  if (!value) return null;

  if (value && typeof value === "object" && value.id) {
    const doc = await Model.findById(value.id).lean();
    if (!doc) throw { statusCode: 404, code: "NOT_FOUND", message: `${fieldLabel} with id "${value.id}" not found` };
    return { id: doc._id, name: doc[nameField] };
  }

  if (typeof value === "string") {
    const doc = await Model.findOne({ [nameField]: { $regex: `^${value.trim()}$`, $options: "i" } }).lean();
    if (!doc) throw { statusCode: 404, code: "NOT_FOUND", message: `${fieldLabel} "${value}" not found` };
    return { id: doc._id, name: doc[nameField] };
  }

  return null;
}

export async function resolveAllEyes({ brand, category, productName, productMode, powerType, powers = [] }) {
  const requestedSides = powers.map((p) => p.side).filter(Boolean);
  const sides = requestedSides.length > 0 ? requestedSides : (powerType === "Both" ? ["R", "L"] : ["R"]);
  const resolved = [];
  let suppliers = [];

  for (const side of sides) {
    const eye = powers.find((p) => p.side === side) || {};
    const result = await resolveEye({
      brand,
      category,
      productName,
      sph: eye.sph,
      cyl: eye.cyl,
      add: eye.add,
      productMode: productMode || "Rx",
    });

    if (result.error) {
      throw { statusCode: 422, code: "RESOLUTION_ERROR", message: side + " eye: " + result.error };
    }

    if (suppliers.length === 0 && result.allSuppliers?.length) {
      suppliers = result.allSuppliers;
    }

    resolved.push({
      side,
      itemCode: result.itemCode,
      blankCode: result.blankCode,
      supplier: result.supplier,
      baseCurve: result.baseCurve,
      diameter: eye.diameter ?? null,
    });
  }

  return { resolved, suppliers};
}


export async function createOrderService(data, userId) {
  const isDraft = data.status === "Draft";
  const { productMode, powerType, powers = [] } = data;

  const [labResolved, brandResolved, categoryResolved, productNameResolved, coatingResolved, treatmentResolved, tintResolved] = await Promise.all([
    data.lab       ? resolveDropdownField(ProductLab,       data.lab,       "Lab")         : null,
    data.brand     ? resolveDropdownField(ProductBrand,     data.brand,     "Brand")       : null,
    data.category  ? resolveDropdownField(ProductCategory,  data.category,  "Category")    : null,
    data.productName ? resolveDropdownField(Product, data.productName, "Product", "productName") : null,
    data.coating   ? resolveDropdownField(ProductCoating,   data.coating,   "Coating")     : null,
    data.treatment ? resolveDropdownField(ProductTreatment, data.treatment, "Treatment")   : null,
    data.tint      ? resolveDropdownField(Tint,             data.tint,      "Tint")        : null,
  ]);

  const brand       = brandResolved?.name;
  const category    = categoryResolved?.name;
  const productName = productNameResolved?.name;

  const missing = [];
  if (!data.customer?.customerId) missing.push("customer.customerId");
  if (!data.customer?.customerShipToId) missing.push("customer.customerShipToId");
  if (missing.length) {
    throw { statusCode: 400, code: "MISSING_FIELDS", message: `Missing required fields: ${missing.join(", ")}` };
  }

  if (!isDraft) {
    const submitMissing = [];
    if (!brand) submitMissing.push("brand");
    if (!category) submitMissing.push("category");
    if (!productName) submitMissing.push("productName");
    if (!productMode) submitMissing.push("productMode");
    if (!powerType) submitMissing.push("powerType");
    if (!powers.length) submitMissing.push("powers (at least one eye required)");

    if (submitMissing.length) {
      throw { statusCode: 400, code: "MISSING_FIELDS", message: `Missing required fields for submission: ${submitMissing.join(", ")}` };
    }

    if (!["Stock Lens", "Rx"].includes(productMode)) {
      throw { statusCode: 400, code: "INVALID_VALUE", message: `productMode must be "Stock Lens" or "Rx"` };
    }
    if (!["Single", "Both"].includes(powerType)) {
      throw { statusCode: 400, code: "INVALID_VALUE", message: `powerType must be "Single" or "Both"` };
    }
    for (const p of powers) {
      if (!["R", "L"].includes(p.side)) {
        throw { statusCode: 400, code: "INVALID_VALUE", message: `powers[].side must be "R" or "L"` };
      }
      if (p.sph == null) {
        throw { statusCode: 400, code: "MISSING_FIELDS", message: `powers[].sph is required for side "${p.side}"` };
      }
    }
    if (powerType === "Both") {
      const sides = powers.map((p) => p.side);
      if (!sides.includes("R") || !sides.includes("L")) {
        throw { statusCode: 400, code: "MISSING_FIELDS", message: `powerType is "Both" but powers must include both "R" and "L" sides` };
      }
    }
  }

  const customer = await Customer.findById(data.customer.customerId).lean();
  if (!customer) {
    throw { statusCode: 404, code: "NOT_FOUND", message: "Customer not found" };
  }
  if (!customer.status?.isActive) {
    throw { statusCode: 403, code: "CUSTOMER_INACTIVE", message: "Customer account is not active" };
  }

  let customerShipToBranchName = null;
  if (data.customer.customerShipToId) {
    const shipTo = (customer.customerShipToDetails || []).find(
      (s) => s._id.toString() === data.customer.customerShipToId.toString()
    );
    if (!shipTo) {
      throw { statusCode: 404, code: "NOT_FOUND", message: "Ship-to address not found for this customer" };
    }
    customerShipToBranchName = shipTo.branchName;
  }

  const { resolved, suppliers } = !isDraft
    ? await resolveAllEyes({ brand, category, productName, productMode, powerType, powers })
    : { resolved: [], suppliers: [] };

  const orderNumber = await generateOrderNumber();

  const order = await Order.create({
    orderNumber,
    customer: {
      customerId: customer._id,
      customerName: customer.shopName,
      customerShipToId: data.customer.customerShipToId ?? null,
      customerShipToBranchName: customerShipToBranchName,
    },
    lab: labResolved,
    orderReference: data.orderReference,
    consumerCardName: data.consumerCardName,
    opticianName: data.opticianName,
    powerType: data.powerType,
    productMode: data.productMode,
    hasPrism: data.hasPrism ?? false,
    powers: data.powers ?? [],
    prisms: data.prisms ?? [],
    brand: brandResolved,
    category: categoryResolved,
    index: data.index,
    productName: productNameResolved,
    coating: coatingResolved,
    treatment: treatmentResolved,
    tint: tintResolved,
    tintDetails: data.tintDetails,
    remarks: data.remarks,
    mirror: data.mirror ?? false,
    resolved,
    suppliers,
    centration: data.centration ?? [],
    fitting: data.fitting,
    lensData: data.lensData,
    directCustomer: data.directCustomer,
    shippingCharges: data.shippingCharges ?? 0,
    otherCharges: data.otherCharges ?? 0,
    status: isDraft ? "Draft" : "Submitted",
    submittedAt: isDraft ? null : new Date(),
    createdBy: userId,
  });

  return order;
}

export async function getOrderService(orderId) {
  const order = await Order.findById(orderId)
    .populate("customer.customerId", "shopName ownerName customerCode mobileNo1 businessEmail")
    .populate("createdBy", "name email EmployeeType")
    .lean();

  if (!order) throw { statusCode: 404, code: "NOT_FOUND", message: "Order not found" };
  return order;
}

export async function listOrdersService({ customerId, status, page = 1, limit = 20, search, fromDate, toDate }) {
  const VALID_STATUSES = ["Draft", "Submitted", "Processing", "Completed", "Cancelled"];
  const filter = {};

  if (customerId) filter["customer.customerId"] = customerId;

  if (status) {
    if (!VALID_STATUSES.includes(status)) {
      throw { statusCode: 400, code: "INVALID_VALUE", message: `Invalid status. Allowed: ${VALID_STATUSES.join(", ")}` };
    }
    filter.status = status;
  }

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

  // Resolve any dropdown fields provided
  if (data.lab)         data.lab         = await resolveDropdownField(ProductLab,       data.lab,         "Lab");
  if (data.brand)       data.brand       = await resolveDropdownField(ProductBrand,     data.brand,       "Brand");
  if (data.category)    data.category    = await resolveDropdownField(ProductCategory,  data.category,    "Category");
  if (data.productName) data.productName = await resolveDropdownField(Product,          data.productName, "Product", "productName");
  if (data.coating)     data.coating     = await resolveDropdownField(ProductCoating,   data.coating,     "Coating");
  if (data.treatment)   data.treatment   = await resolveDropdownField(ProductTreatment, data.treatment,   "Treatment");
  if (data.tint)        data.tint        = await resolveDropdownField(Tint,             data.tint,        "Tint");

  const needsResolve = data.brand || data.category || data.productName || data.powers || data.productMode || data.powerType;

  if (needsResolve) {
    const { resolved, suppliers } = await resolveAllEyes({
      brand:       (data.brand       || order.brand)?.name,
      category:    (data.category    || order.category)?.name,
      productName: (data.productName || order.productName)?.name,
      productMode: data.productMode  || order.productMode,
      powerType:   data.powerType    || order.powerType,
      powers:      data.powers       || order.powers,
    });
    data.resolved = resolved;
    data.suppliers = suppliers;
  }

  const UPDATABLE = [
    "lab", "orderReference", "consumerCardName",
    "opticianName", "powerType", "productMode", "hasPrism", "powers", "prisms",
    "brand", "category", "index", "productName", "coating", "treatment", "tint",
    "tintDetails", "remarks", "mirror", "resolved", "suppliers",
    "centration", "fitting", "lensData", "directCustomer", "shippingCharges", "otherCharges",
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

export async function updateDraftOrderService(orderId, data) {
  const order = await Order.findById(orderId);
  if (!order) throw { statusCode: 404, code: "NOT_FOUND", message: "Order not found" };

  if (order.status !== "Draft") {
    throw { statusCode: 400, code: "INVALID_STATUS", message: "Only Draft orders can be updated. Submit the order first to make changes." };
  }

  // Resolve any dropdown fields provided
  if (data.lab)         data.lab         = await resolveDropdownField(ProductLab,       data.lab,         "Lab");
  if (data.brand)       data.brand       = await resolveDropdownField(ProductBrand,     data.brand,       "Brand");
  if (data.category)    data.category    = await resolveDropdownField(ProductCategory,  data.category,    "Category");
  if (data.productName) data.productName = await resolveDropdownField(Product,          data.productName, "Product", "productName");
  if (data.coating)     data.coating     = await resolveDropdownField(ProductCoating,   data.coating,     "Coating");
  if (data.treatment)   data.treatment   = await resolveDropdownField(ProductTreatment, data.treatment,   "Treatment");
  if (data.tint)        data.tint        = await resolveDropdownField(Tint,             data.tint,        "Tint");

  const needsResolve = data.brand || data.category || data.productName || data.powers || data.productMode || data.powerType;
  if (needsResolve) {
    const brand       = (data.brand       || order.brand)?.name;
    const category    = (data.category    || order.category)?.name;
    const productName = (data.productName || order.productName)?.name;
    const productMode = data.productMode  || order.productMode;
    const powerType   = data.powerType    || order.powerType;
    const powers      = data.powers       || order.powers;

    if (brand && category && productName && productMode && powerType && powers?.length) {
      const { resolved, suppliers } = await resolveAllEyes({ brand, category, productName, productMode, powerType, powers });
      data.resolved = resolved;
      data.suppliers = suppliers;
    }
  }

  if (data.customer) {
    if (data.customer.customerId) {
      const customer = await Customer.findById(data.customer.customerId).lean();
      if (!customer) throw { statusCode: 404, code: "NOT_FOUND", message: "Customer not found" };

      let customerShipToBranchName = order.customer.customerShipToBranchName;
      const shipToId = data.customer.customerShipToId || order.customer.customerShipToId;
      if (shipToId) {
        const shipTo = (customer.customerShipToDetails || []).find(
          (s) => s._id.toString() === shipToId.toString()
        );
        if (!shipTo) throw { statusCode: 404, code: "NOT_FOUND", message: "Ship-to address not found for this customer" };
        customerShipToBranchName = shipTo.branchName;
      }

      order.customer = {
        customerId: customer._id,
        customerName: customer.shopName,
        customerShipToId: shipToId ?? null,
        customerShipToBranchName: customerShipToBranchName,
      };
    } else if (data.customer.customerShipToId) {
      const customer = await Customer.findById(order.customer.customerId).lean();
      const shipTo = (customer?.customerShipToDetails || []).find(
        (s) => s._id.toString() === data.customer.customerShipToId.toString()
      );
      if (!shipTo) throw { statusCode: 404, code: "NOT_FOUND", message: "Ship-to address not found for this customer" };
      order.customer.customerShipToId = data.customer.customerShipToId;
      order.customer.customerShipToBranchName = shipTo.branchName;
    }
  }

  const UPDATABLE = [
    "lab", "orderReference", "consumerCardName", "opticianName",
    "powerType", "productMode", "hasPrism", "powers", "prisms",
    "brand", "category", "index", "productName", "coating", "treatment",
    "tint", "tintDetails", "remarks", "mirror", "resolved", "suppliers",
    "centration", "fitting", "lensData",
    "directCustomer", "shippingCharges", "otherCharges", "customerBalance",
    "status"
  ];

  UPDATABLE.forEach((key) => {
    if (data[key] !== undefined) order[key] = data[key];
  });

  await order.save();
  return order;
}

export async function resolveProductService({ brand, category, productName, productMode, powerType, powers }) {
  if (!brand || !category || !productName) {
    throw { statusCode: 400, code: "MISSING_FIELDS", message: "brand, category, and productName are required" };
  }
  const brandName       = typeof brand       === "object" ? brand.name       : brand;
  const categoryName    = typeof category    === "object" ? category.name    : category;
  const productNameStr  = typeof productName === "object" ? productName.name : productName;
  return resolveAllEyes({
    brand: brandName,
    category: categoryName,
    productName: productNameStr,
    productMode,
    powerType: powerType || "Single",
    powers: powers || [],
  });
}

export async function getProductNamesService({ search = "", limit = 100, page = 1 }) {
  const filter = { productName: { $ne: null } };

  if (search.trim()) {
    filter.productName = { $regex: search.trim(), $options: "i" };
  }

  const skip = (parseInt(page) - 1) * parseInt(limit);
  const total = await Product.countDocuments(filter);

  const results = await Product.find(filter, {
    _id: 1, itemCode: 1, productName: 1, brand: 1, productType: 1, hsnCode : 1,
    category: 1, treatment: 1, price: 1, status: 1, createdBy: 1, createdAt: 1, updatedAt: 1, __v: 1,
  })
    .sort({ productName: 1 })
    .skip(skip)
    .limit(parseInt(limit))
    .lean();

  return {
    data: results,
    pagination: {
      total,
      page:       parseInt(page),
      limit:      parseInt(limit),
      totalPages: Math.ceil(total / parseInt(limit)),
    },
  };
}


export async function getTintOptionsService() {
  return await Tint.find({}).sort({ name: 1 }).lean();
}


export async function getFrameTypesService() {
  return await FrameType.find({}).sort({ name: 1 }).lean();
}

export async function getProductBrandsService() {
  return await ProductBrand.find({}).sort({ name: 1 }).lean();
}

export async function getProductCategoriesService() {
  return await ProductCategory.find({}).sort({ name: 1 }).lean();
}

export async function getProductTreatmentsService() {
  return await ProductTreatment.find({}).sort({ name: 1 }).lean();
}

export async function getProductIndexesService() {
  return await ProductIndex.find({}).sort({ value: 1 }).lean();
}

export async function getProductTypesService() {
  return await ProductType.find({}).sort({ name: 1 }).lean();
}

export async function getProductLabsService() {
  return await ProductLab.find({}).sort({ name: 1 }).lean();
}

export async function getProductCoatingsService() {
  return await ProductCoating.find({}).sort({ name: 1 }).lean();
}
