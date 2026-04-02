import express from "express";
import { createOrder, getOrder, listOrders, updateOrder, cancelOrder, resolveProduct, getProductField, getProductNames, getTintOptions, updateDraftOrder } from "../../core/controllers/order/order.controller.js";
import { ProtectUser } from "../../middlewares/Auth/AdminMiddleware/adminMiddleware.js";

const orderRouter = express.Router();

orderRouter.use(ProtectUser);

orderRouter.post("/resolve-product", resolveProduct);

// Product field dropdowns — must be before /:id
orderRouter.get("/product-fields/:field", getProductField);
orderRouter.get("/product/get-tint",   getTintOptions);
orderRouter.get("/product-names",         getProductNames);

orderRouter.post("/create",          createOrder);
orderRouter.get("/get-all-orders",   listOrders);

// /:id routes last to avoid swallowing named paths
orderRouter.get("/:id",              getOrder);
orderRouter.put("/:id",              updateOrder);
orderRouter.patch("/:id/draft",      updateDraftOrder);
orderRouter.post("/:id/cancel",      cancelOrder);

export default orderRouter;
