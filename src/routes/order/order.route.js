import express from "express";
import {
  createOrder,
  getOrder,
  listOrders,
  updateOrder,
  updateDraftOrder,
  cancelOrder,
  resolveProduct,
  getProductNames,
  getTintOptions,
  getFrameTypes,
  getProductBrands,
  getProductCategories,
  getProductTreatments,
  getProductIndexes,
  getProductTypes,
  getProductLabs,
  getProductCoatings,
} from "../../core/controllers/order/order.controller.js";
import { ProtectUser } from "../../middlewares/Auth/AdminMiddleware/adminMiddleware.js";

const orderRouter = express.Router();

orderRouter.use(ProtectUser);

orderRouter.post("/resolve-product",          resolveProduct);

// Product field dropdowns — all before /:id to avoid route conflicts
orderRouter.get("/product/get-tint",          getTintOptions);
orderRouter.get("/product/get-frame-types",   getFrameTypes);
orderRouter.get("/product-fields/brand",      getProductBrands);
orderRouter.get("/product-fields/category",   getProductCategories);
orderRouter.get("/product-fields/treatment",  getProductTreatments);
orderRouter.get("/product-fields/index",      getProductIndexes);
orderRouter.get("/product-fields/productDetails",getProductTypes);
orderRouter.get("/product-fields/lab",        getProductLabs);
orderRouter.get("/product-fields/coating",    getProductCoatings);
orderRouter.get("/lens-type",             getProductNames);

orderRouter.post("/create",                   createOrder);
orderRouter.get("/get-all-orders",            listOrders);

// /:id routes last
orderRouter.get("/:id",                       getOrder);
orderRouter.post("/:id/cancel",               cancelOrder);

orderRouter.put("/:id",                       updateOrder);
orderRouter.patch("/:id/draft",               updateDraftOrder);

export default orderRouter;
