import axios from "axios";
import { sendSuccessResponse, sendErrorResponse } from "../../../Utils/response/responseHandler.js";

const DIGIOPTICS_API_BASE = "https://digiopticsretailapi.digibysr.in/api/otp/customers";

export const sendOTP = async (req, res) => {
    try {
        const { email } = req.query;

        if (!email) {
            return sendErrorResponse(res, 400, "MISSING_EMAIL", "Email is required");
        }
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return sendErrorResponse(res, 400, "INVALID_EMAIL", "Invalid email format");
        }

        const response = await axios.get(`${DIGIOPTICS_API_BASE}/email`, {
            params: { email },
            timeout: 10000,
        });

        if (response.data?.success) {
            return sendSuccessResponse(res, 200, { email }, response.data.message || "OTP sent to email successfully");
        }
        return sendErrorResponse(res, 500, "OTP_SEND_FAILED", response.data?.message || "Failed to send OTP");

    } catch (error) {
        console.error("[OAuth] Send OTP error:", error.message);
        if (error.response) {
            return sendErrorResponse(res, error.response.status, "OTP_SEND_FAILED", error.response.data?.message || "Failed to send OTP");
        }
        if (error.code === "ECONNABORTED") {
            return sendErrorResponse(res, 504, "TIMEOUT", "Request timeout - DigiOptics API did not respond");
        }
        if (error.code === "ENOTFOUND" || error.code === "ECONNREFUSED") {
            return sendErrorResponse(res, 503, "SERVICE_UNAVAILABLE", "DigiOptics API is unavailable");
        }

        return sendErrorResponse(res, 500, "INTERNAL_ERROR", error.message || "An error occurred while sending OTP");
    }
};

export const verifyOTP = async (req, res) => {
    try {
        const { email, otp } = req.body;

        if (!email || !otp) {
            return sendErrorResponse(res, 400, "MISSING_FIELDS", "Email and OTP are required");
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return sendErrorResponse(res, 400, "INVALID_EMAIL", "Invalid email format");
        }

        if (!/^\d{6}$/.test(otp)) {
            return sendErrorResponse(res, 400, "INVALID_OTP", "OTP must be 6 digits");
        }

        const response = await axios.post(`${DIGIOPTICS_API_BASE}/verify-otp`, { email, otp }, {
            headers: { "Content-Type": "application/json" },
            timeout: 10000,
        }
        );

        if (response.data?.success && response.data?.customer) {
            return sendSuccessResponse(res, 200, { customer: response.data.customer, email, }, response.data.message || "OTP verified successfully");
        }

        return sendErrorResponse(res, 400, "OTP_VERIFICATION_FAILED", response.data?.message || "Failed to verify OTP");

    } catch (error) {
        console.error("[OAuth] Verify OTP error:", error.message);

        if (error.response) {
            const status = error.response.status;
            const message = error.response.data?.message || "Failed to verify OTP";

            if (status === 404 || message.includes("not found") || message.includes("expired")) {
                return sendErrorResponse(res, 400, "OTP_INVALID", "OTP not found or expired");
            }

            if (status === 400 || message.includes("invalid") || message.includes("incorrect")) {
                return sendErrorResponse(res, 400, "OTP_INVALID", "Invalid OTP");
            }

            return sendErrorResponse(res, status, "OTP_VERIFICATION_FAILED", message);
        }

        if (error.code === "ECONNABORTED") {
            return sendErrorResponse(res, 504, "TIMEOUT", "Request timeout - DigiOptics API did not respond");
        }

        if (error.code === "ENOTFOUND" || error.code === "ECONNREFUSED") {
            return sendErrorResponse(res, 503, "SERVICE_UNAVAILABLE", "DigiOptics API is unavailable");
        }

        return sendErrorResponse(res, 500, "INTERNAL_ERROR", error.message || "An error occurred while verifying OTP");
    }
};
