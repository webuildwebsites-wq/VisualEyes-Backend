import express from "express";
import {
  registerVendorMaster,
  getAllVendors,
  getVendorById,
  updateVendorMaster,
  deleteVendorMaster,
} from "../../core/controllers/Vendor/vendorMaster.controller.js";
import { ProtectUser } from "../../middlewares/Auth/AdminMiddleware/adminMiddleware.js";

const vendorRouter = express.Router();

vendorRouter.post("/register", ProtectUser, registerVendorMaster);

// GET /api/vendor/get-all          (with ?page=1&limit=10&search=xyz)
vendorRouter.get("/get-all", ProtectUser, getAllVendors);

// GET /api/vendor/get/:vendorId    (accepts MongoDB _id OR custom VEN-XXXX)
vendorRouter.get("/get/:vendorId", ProtectUser, getVendorById);

vendorRouter.patch("/update/:vendorId", ProtectUser, updateVendorMaster);

vendorRouter.delete("/delete/:vendorId", ProtectUser, deleteVendorMaster);

export default vendorRouter;
