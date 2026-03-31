import express from "express";
import {
  createOrder,
  submitOrder,
  getOrder,
  listOrders,
  updateOrder,
  cancelOrder,
  resolveProduct,
  getOrderDropdowns,
} from "../../core/controllers/order/order.controller.js";
import { ProtectUser } from "../../middlewares/Auth/AdminMiddleware/adminMiddleware.js";

const orderRouter = express.Router();

orderRouter.use(ProtectUser);

orderRouter.post("/resolve-product", resolveProduct);   
orderRouter.get("/dropdowns",        getOrderDropdowns);

orderRouter.post("/create", createOrder);
orderRouter.get("/",        listOrders);
orderRouter.get("/:id",     getOrder);
orderRouter.put("/:id",     updateOrder);

orderRouter.post("/:id/submit", submitOrder);
orderRouter.post("/:id/cancel", cancelOrder);

export default orderRouter;
