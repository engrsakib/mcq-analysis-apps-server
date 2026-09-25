import { Request, Response } from "express";
import BaseController from "@/shared/baseController";
import { HttpStatusCode } from "@/lib/httpStatus";
import { ADMIN_ROLE_VALUES } from "@/constants/roles";
import { createNotificationCampaignSchema } from "./notification-campaign.validate";
import { notificationCampaignService } from "./notification-campaign.service";

class CampaignController extends BaseController {
  private assertAdmin(req: Request, res: Response): boolean {
    const role = req.user?.role;
    if (!role || !ADMIN_ROLE_VALUES.includes(role as never)) {
      this.sendResponse(res, {
        statusCode: HttpStatusCode.FORBIDDEN,
        success: false,
        message: "Only admin staff can send notification campaigns",
      });
      return false;
    }
    return true;
  }

  createCampaign = this.catchAsync(async (req: Request, res: Response) => {
    if (!this.assertAdmin(req, res)) return;

    const parsed = createNotificationCampaignSchema.safeParse(req.body);
    if (!parsed.success) {
      return this.sendResponse(res, {
        statusCode: HttpStatusCode.BAD_REQUEST,
        success: false,
        message: parsed.error.errors[0]?.message ?? "Invalid request body",
        data: parsed.error.flatten(),
      });
    }

    const senderId = String(req.user?.id ?? "");
    const result = await notificationCampaignService.createCampaign(
      {
        subject: parsed.data.subject,
        body: parsed.data.body,
        audienceMode: parsed.data.audienceMode,
        phoneNumbers: parsed.data.phoneNumbers,
      },
      { id: senderId, name: req.user?.name }
    );

    if (!result.ok) {
      const status =
        result.code === "UNRESOLVED_PHONES" ||
        result.code === "INVALID_PHONES" ||
        result.code === "NO_RECIPIENTS"
          ? HttpStatusCode.BAD_REQUEST
          : HttpStatusCode.BAD_REQUEST;

      return this.sendResponse(res, {
        statusCode: status,
        success: false,
        message: result.message,
        data: {
          code: result.code,
          invalidPhones: result.invalidPhones,
          unresolvedPhones: result.unresolvedPhones,
        },
      });
    }

    this.sendResponse(res, {
      statusCode: HttpStatusCode.CREATED,
      success: true,
      message: "Notification campaign queued for delivery",
      data: result.campaign,
    });
  });

  listCampaigns = this.catchAsync(async (req: Request, res: Response) => {
    if (!this.assertAdmin(req, res)) return;

    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(50, Math.max(1, Number(req.query.limit) || 10));

    const result = await notificationCampaignService.listCampaigns(page, limit);

    this.sendResponse(res, {
      statusCode: HttpStatusCode.OK,
      success: true,
      message: "Campaigns retrieved successfully",
      data: result,
    });
  });

  getCampaign = this.catchAsync(async (req: Request, res: Response) => {
    if (!this.assertAdmin(req, res)) return;

    const { id } = req.params;
    const campaign = await notificationCampaignService.getCampaignById(id);

    if (!campaign) {
      return this.sendResponse(res, {
        statusCode: HttpStatusCode.NOT_FOUND,
        success: false,
        message: "Campaign not found",
      });
    }

    this.sendResponse(res, {
      statusCode: HttpStatusCode.OK,
      success: true,
      message: "Campaign retrieved successfully",
      data: campaign,
    });
  });
}

export const NotificationCampaignController = new CampaignController();
