import { Request, Response } from "express";
import { OTPService } from "./otp.service";
import BaseController from "@/shared/baseController";
import { otpRateLimitService } from "./otp-rate-limit.service";

class Controller extends BaseController {
  verifyOTP = this.catchAsync(async (req: Request, res: Response) => {
    await OTPService.verifyOTP(req.body);
    this.sendResponse(res, {
      statusCode: 200,
      success: true,
      message:
        "Your OTP verification has been successful. Now, you can login and access to your account",
      data: null,
    });
  });

  getRateLimitConfig = this.catchAsync(async (_req: Request, res: Response) => {
    const config = await otpRateLimitService.getConfig();
    this.sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "OTP rate limit config retrieved successfully",
      data: config,
    });
  });
}

export const OTPController = new Controller();
