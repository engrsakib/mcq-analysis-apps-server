import { Request, Response } from "express";
import BaseController from "@/shared/baseController";
import { HttpStatusCode } from "@/lib/httpStatus";
import { otpRateLimitService } from "../otp/otp-rate-limit.service";
import { smsLogService } from "./sms-log.service";
import { SMSService, SMS_ERROR_MESSAGES } from "./sms.service";

class SmsController extends BaseController {
  getBalance = this.catchAsync(async (_req: Request, res: Response) => {
    const balance = await SMSService.getBalance();

    this.sendResponse(res, {
      statusCode: HttpStatusCode.OK,
      success: balance.success,
      message: balance.success
        ? "SMS balance retrieved successfully"
        : balance.error_message,
      data: balance,
    });
  });

  getStatus = this.catchAsync(async (_req: Request, res: Response) => {
    const status = await SMSService.getStatus();

    this.sendResponse(res, {
      statusCode: HttpStatusCode.OK,
      success: true,
      message: "SMS provider status retrieved successfully",
      data: {
        ...status,
        error_codes: SMS_ERROR_MESSAGES,
      },
    });
  });

  sendTestSms = this.catchAsync(async (req: Request, res: Response) => {
    const result = await SMSService.sendTestSms(
      req.body.number,
      req.body.message
    );

    this.sendResponse(res, {
      statusCode: HttpStatusCode.OK,
      success: true,
      message: "Test SMS sent successfully",
      data: result,
    });
  });

  getSmsLogs = this.catchAsync(async (req: Request, res: Response) => {
    const limit = Number(req.query.limit || 50);
    const logs = await smsLogService.getSmsLogs(limit);

    this.sendResponse(res, {
      statusCode: HttpStatusCode.OK,
      success: true,
      message: "SMS logs retrieved successfully",
      data: logs,
    });
  });

  getOtpBlockLogs = this.catchAsync(async (req: Request, res: Response) => {
    const limit = Number(req.query.limit || 50);
    const logs = await smsLogService.getOtpBlockLogs(limit);

    this.sendResponse(res, {
      statusCode: HttpStatusCode.OK,
      success: true,
      message: "OTP block logs retrieved successfully",
      data: logs,
    });
  });

  getOtpBlocks = this.catchAsync(async (_req: Request, res: Response) => {
    const [blocks, config] = await Promise.all([
      otpRateLimitService.listBlocks(),
      otpRateLimitService.getConfig(),
    ]);

    this.sendResponse(res, {
      statusCode: HttpStatusCode.OK,
      success: true,
      message: "OTP Redis blocks retrieved successfully",
      data: {
        config,
        blocks,
        total: blocks.length,
        blocked_count: blocks.filter((block) => block.is_blocked).length,
      },
    });
  });

  getOtpConfig = this.catchAsync(async (_req: Request, res: Response) => {
    const config = await otpRateLimitService.getConfig();

    this.sendResponse(res, {
      statusCode: HttpStatusCode.OK,
      success: true,
      message: "OTP rate limit config retrieved successfully",
      data: config,
    });
  });

  updateOtpConfig = this.catchAsync(async (req: Request, res: Response) => {
    const config = await otpRateLimitService.updateConfig(req.body);

    this.sendResponse(res, {
      statusCode: HttpStatusCode.OK,
      success: true,
      message: "OTP rate limit config updated successfully",
      data: config,
    });
  });

  clearOtpBlocks = this.catchAsync(async (req: Request, res: Response) => {
    const deletedCount = req.body.clear_all
      ? await otpRateLimitService.clearAllBlocks()
      : await otpRateLimitService.clearBlock(req.body.phone_number);

    this.sendResponse(res, {
      statusCode: HttpStatusCode.OK,
      success: true,
      message: req.body.clear_all
        ? "All OTP Redis blocks cleared successfully"
        : "OTP Redis block cleared successfully",
      data: {
        deleted_count: deletedCount,
      },
    });
  });
}

export const smsController = new SmsController();
