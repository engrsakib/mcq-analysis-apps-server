import { Request, Response } from "express";
import BaseController from "@/shared/baseController";
import { HttpStatusCode } from "@/lib/httpStatus";
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
}

export const smsController = new SmsController();
