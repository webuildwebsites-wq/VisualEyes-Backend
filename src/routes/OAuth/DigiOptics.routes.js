import express from "express";
import { sendOTP, verifyOTP } from "../../core/services/OAuth/OAuth.controller.js";

const OAuthRouter = express.Router();

OAuthRouter.get("/sendOtp", sendOTP);

OAuthRouter.post("/verifyOtp", verifyOTP);

export default OAuthRouter;
