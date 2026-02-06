import User from "../../../../models/Auth/User.js";
import { generateRefreshToken, generateToken } from "../../../../Utils/Auth/tokenUtils.js";
import { sendErrorResponse, sendTokenResponse } from "../../../../Utils/response/responseHandler.js";

export async function verifyUserEmail(req, res) {
  try {
    const { email, Emailotp } = req.body;
    
    if(!email || !Emailotp){
      return sendErrorResponse(res, 400, 'VALIDATION_ERROR', 'All required fields must be provided');
    }

    const user = await User.findOne({ email: email });
    if (!user) {
      return sendErrorResponse(res, 401, 'INVALID_EMAIL', 'User not found');
    }

    const isCodeValid = user.emailOtp === Emailotp;
    const isNotExpired = user.emailOtpExpires > Date.now();

    if (isCodeValid && isNotExpired) {
      user.isActive = true;
      user.emailOtp = null;
      user.emailOtpExpires = null;
      user.lastLogin = new Date();
      await user.save();
      return sendTokenResponse(user, 200, res, 'USER', generateToken, generateRefreshToken);
    } else if (!isCodeValid) {
      return sendErrorResponse(res, 401, 'INVALID_OTP', 'Invalid OTP');
    } else {
      return sendErrorResponse(res, 400, 'EXPIRED_OTP', 'OTP expired');
    }
  } catch (error) {
     return sendErrorResponse(res, 500, 'INTERNAL_ERROR', error?.message || 'Internal server error during varify user email');
  }
}