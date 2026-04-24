import Order from "../../../models/order/customer.order.js";
import LenswareGrid from "../../../models/Product/LenswareGrid.js";
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

const RXSV_TYPES       = new Set(["kt", "rx", "sv"]);
const PROGRESSIVE_TYPE = "progressive";

function roundToStep(value, step = 0.25) {
  if (value == null || isNaN(Number(value))) return null;
  return Math.round(Number(value) / step) * step;
}

function caseInsensitive(val) {
  const normalized = (val || "").replace(/\s+/g, " ").trim();
  const escaped = normalized.replace(/[.*+?^${}()|[\]\\]/g, "\\$&").replace(/ /g, "\\s+");
  return { $regex: `^${escaped}$`, $options: "i" };
}


function lookupBaseCurve(cells, sph, axis) {
  const sphR  = roundToStep(sph);
  const axisR = roundToStep(axis ?? 0);

  if (sphR == null) return null;

  const cell = cells.find(
    (c) => c.sphere === sphR && c.axisValue === axisR
  );
  return cell?.baseCurve ?? null;
}

let _gridCache = null;

async function getGridCache() {
  if (_gridCache) return _gridCache;

  const [rxSvDoc, ffDoc] = await Promise.all([
    LenswareGrid.findOne({ gridType: "RxSvGrid" }).lean(),
    LenswareGrid.findOne({ gridType: "FFGrid"   }).lean(),
  ]);

  _gridCache = {
    rxSv: rxSvDoc?.cells ?? [],
    ff:   ffDoc?.cells   ?? [],
  };
  return _gridCache;
}

export async function resolveEye({ brand, category, productName, sph, cyl, add }) {
  const product = await Product.findOne({
    brand:       caseInsensitive(brand),
    category:    caseInsensitive(category),
    productName: caseInsensitive(productName),
  }).lean();

  if (!product) {
    return { error: `Product not found for brand="${brand}", category="${category}", productName="${productName}"` };
  }

  const productCode = (product.productCode || "").trim().toUpperCase();
  const blankCode   = (product.blankCode   || "").trim().toUpperCase();

  const activeSuppliers = (product.suppliers || [])
    .filter((s) => s.active)
    .sort((a, b) => a.priority - b.priority);

  const chosenSupplier = activeSuppliers[0] ?? null;

  const productTypeRaw = (product.productType || "").trim().toLowerCase();
  let baseCurve = null;

  if (RXSV_TYPES.has(productTypeRaw)) {
    if (sph == null) {
      return { error: `Sphere (sph) is required for product type "${product.productType}"` };
    }
    if (cyl == null) {
      return { error: `Cylinder (cyl) is required for product type "${product.productType}" to suggest base curve` };
    }
    const grids = await getGridCache();
    baseCurve = lookupBaseCurve(grids.rxSv, sph, cyl);

  } else if (productTypeRaw === PROGRESSIVE_TYPE) {
    if (sph == null) {
      return { error: `Sphere (sph) is required for product type "Progressive"` };
    }
    if (add == null) {
      return { error: `Addition (add) is required for product type "Progressive" to suggest base curve` };
    }
    const grids = await getGridCache();
    baseCurve = lookupBaseCurve(grids.ff, sph, add);

  } else {
    // Unknown product type — no base curve suggestion
    baseCurve = null;
  }

  return {
    itemCode:     product.itemCode,
    blankCode,
    productCode,
    productType:  product.productType ?? null,
    supplier:     chosenSupplier?.name ?? null,
    baseCurve,
    allSuppliers: activeSuppliers.map((s) => ({
      name:     s.name,
      priority: s.priority,
      active:   s.active,
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

export async function resolveAllEyes({ brand, category, productName, powerType, powers = [] }) {
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


function sanitizeFitting(fitting) {
  if (!fitting) return fitting;
  if (!fitting.hasFlatFitting) {
    return { hasFlatFitting: false };
  }
  const missing = [];
  if (fitting.dbl == null)         missing.push("fitting.dbl (DBL)");
  if (!fitting.frameType)          missing.push("fitting.frameType (Frame Type)");
  if (fitting.frameLength == null) missing.push("fitting.frameLength (Frame Length)");
  if (fitting.frameHeight == null) missing.push("fitting.frameHeight (Frame Height)");
  if (missing.length) {
    throw { statusCode: 400, code: "MISSING_FIELDS", message: `Fitting data required when hasFlatFitting is true: ${missing.join(", ")}` };
  }
  return fitting;
}


export async function  createOrderService(data, userId) {
  const isDraft = data.status === "Draft";
  const { productMode, powerType, powers = [] } = data;

  data.fitting = sanitizeFitting(data.fitting);

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
    if (!brand)                submitMissing.push("brand");
    if (!category)             submitMissing.push("category");
    if (!productName)          submitMissing.push("productName");
    if (!productMode)          submitMissing.push("productMode");
    if (!powerType)            submitMissing.push("powerType");
    if (!powers.length)        submitMissing.push("powers (at least one eye required)");
    if (!coatingResolved)      submitMissing.push("coating");
    if (data.index == null)    submitMissing.push("index");
    if (!tintResolved)         submitMissing.push("tint");
    if (!treatmentResolved)    submitMissing.push("treatment");

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
    ? await resolveAllEyes({ brand, category, productName, powerType, powers })
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
    .populate("customer.customerId", "shopName ownerName customerCode mobileNo1 businessEmail customerBalance creditLimit creditUsed zone")
    .populate("createdBy", "employeeName email EmployeeType username")
    .lean();

  if (!order) throw { statusCode: 404, code: "NOT_FOUND", message: "Order not found" };
  return order;
}

export async function deleteOrderService(orderId) {
  const order = await Order.findById(orderId);
  if (!order) throw { statusCode: 404, code: "NOT_FOUND", message: "Order not found" };

  if (!["Draft", "Cancelled"].includes(order.status)) {
    throw { statusCode: 400, code: "INVALID_STATUS", message: `Cannot delete an order with status "${order.status}". Only Draft or Cancelled orders can be deleted.` };
  }

  await Order.findByIdAndDelete(orderId);
}

export async function listOrdersService({ customerId, status="Submitted", page = 1, limit = 20, search, fromDate, toDate }) {
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


export async function cancelOrderService(orderId, reason) {
  const order = await Order.findById(orderId);
  if (!order) throw { statusCode: 404, code: "NOT_FOUND", message: "Order not found" };

  if (order.status === "Draft") {
    throw { statusCode: 400, code: "INVALID_STATUS", message: "Cannot cancel a Draft order. Only submitted orders can be cancelled." };
  }

  if (!["Submitted"].includes(order.status)) {
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

  if (order.status !== "Draft" && order.status !== "Submitted") {
    throw { statusCode: 400, code: "INVALID_STATUS", message: "Only Draft or Submitted orders can be updated." };
  }

  if (data.fitting !== undefined) data.fitting = sanitizeFitting(data.fitting);

  // Resolve any dropdown fields provided
  if (data.lab)         data.lab         = await resolveDropdownField(ProductLab,       data.lab,         "Lab");
  if (data.brand)       data.brand       = await resolveDropdownField(ProductBrand,     data.brand,       "Brand");
  if (data.category)    data.category    = await resolveDropdownField(ProductCategory,  data.category,    "Category");
  if (data.productName) data.productName = await resolveDropdownField(Product,          data.productName, "Product", "productName");
  if (data.coating)     data.coating     = await resolveDropdownField(ProductCoating,   data.coating,     "Coating");
  if (data.treatment)   data.treatment   = await resolveDropdownField(ProductTreatment, data.treatment,   "Treatment");
  if (data.tint)        data.tint        = await resolveDropdownField(Tint,             data.tint,        "Tint");

  const brand       = (data.brand       || order.brand)?.name;
  const category    = (data.category    || order.category)?.name;
  const productName = (data.productName || order.productName)?.name;
  const productMode = data.productMode  || order.productMode;
  const powerType   = data.powerType    || order.powerType;
  const powers      = data.powers       || order.powers;

  if (data.status === "Submitted") {
    const submitMissing = [];
    if (!brand)       submitMissing.push("brand");
    if (!category)    submitMissing.push("category");
    if (!productName) submitMissing.push("productName");
    if (!productMode) submitMissing.push("productMode");
    if (!powerType)   submitMissing.push("powerType");
    if (!powers?.length) submitMissing.push("powers (at least one eye required)");

    const coating   = (data.coating   || order.coating)?.name;
    const treatment = (data.treatment || order.treatment)?.name;
    const tint      = (data.tint      || order.tint)?.name;
    const index     = data.index ?? order.index;

    if (!coating)       submitMissing.push("coating");
    if (index == null)  submitMissing.push("index");
    if (!tint)          submitMissing.push("tint");
    if (!treatment)     submitMissing.push("treatment");

    if (submitMissing.length) {
      throw { statusCode: 400, code: "MISSING_FIELDS", message: `Missing required fields for submission: ${submitMissing.join(", ")}` };
    }

    const effectiveFitting = data.fitting ?? order.fitting;
    sanitizeFitting(effectiveFitting);

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

    data.submittedAt = new Date();
  }

  const needsResolve = data.brand || data.category || data.productName || data.powers || data.productMode || data.powerType;
  if (needsResolve) {
    if (brand && category && productName && powerType && powers?.length) {
      const { resolved, suppliers } = await resolveAllEyes({ brand, category, productName, powerType, powers });
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
    "directCustomer", "shippingCharges", "otherCharges",
    "status"
  ];

  UPDATABLE.forEach((key) => {
    if (data[key] !== undefined) order[key] = data[key];
  });

  await order.save();
  return order;
}

export async function resolveProductService({ brand, category, productName, powerType, powers }) {
  if (!brand || !category || !productName) {
    throw { statusCode: 400, code: "MISSING_FIELDS", message: "brand, category, and productName are required" };
  }
  const brandName      = typeof brand       === "object" ? brand.name       : brand;
  const categoryName   = typeof category    === "object" ? category.name    : category;
  const productNameStr = typeof productName === "object" ? productName.name : productName;
  return resolveAllEyes({
    brand:       brandName,
    category:    categoryName,
    productName: productNameStr,
    powerType:   powerType || "Single",
    powers:      powers || [],
  });
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

export async function getProductCategoriesService({ brand } = {}) {
  if (brand?.trim()) {
    const categoryNames = await Product.distinct("category", {
      brand: { $regex: `^${brand.trim()}$`, $options: "i" },
      category: { $ne: null }
    });
    return await ProductCategory.find({ name: { $in: categoryNames } }).sort({ name: 1 }).lean();
  }
  return await ProductCategory.find({}).sort({ name: 1 }).lean();
}

export async function getProductNamesService({ brand, category, search = "", limit = 100, page = 1 }) {
  const filter = { productName: { $ne: null } };

  if (brand?.trim())    filter.brand    = { $regex: `^${brand.trim()}$`,    $options: "i" };
  if (category?.trim()) filter.category = { $regex: `^${category.trim()}$`, $options: "i" };
  if (search.trim())    filter.productName = { $regex: search.trim(), $options: "i" };

  const skip = (parseInt(page) - 1) * parseInt(limit);
  const total = await Product.countDocuments(filter);

  const results = await Product.find(filter, {
    _id: 1, itemCode: 1, productName: 1, brand: 1, productType: 1, productCode: 1,
    blankCode: 1, blankType: 1, hsnCode: 1,
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
