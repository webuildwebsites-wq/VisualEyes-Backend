import express from "express";
import {
  createOrder,
  submitOrder,
  getOrder,
  listOrders,
  updateOrder,
  cancelOrder,
  resolveProduct,
} from "../../core/controllers/order/order.controller.js";
import { ProtectUser } from "../../middlewares/Auth/AdminMiddleware/adminMiddleware.js";

const customerOrder = express.Router();

customerOrder.use(ProtectUser);

customerOrder.post("/resolve-product", resolveProduct);

customerOrder.post("/create",       createOrder);
customerOrder.get("/",              listOrders);
customerOrder.get("/:id",           getOrder);
customerOrder.put("/:id",           updateOrder);

// Status transitions
customerOrder.post("/:id/submit",   submitOrder);
customerOrder.post("/:id/cancel",   cancelOrder);

export default customerOrder;
