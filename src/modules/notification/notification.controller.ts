import { Request, Response } from "express";
import BaseController from "@/shared/baseController";
import { HttpStatusCode } from "@/lib/httpStatus";
import { NotificationService } from "./notification.service";

const MESSAGE = {
  USER_ID_REQUIRED: "userId query parameter is required",
  NOTIFICATION_ID_REQUIRED: "Notification ID is required",
  ALL_FETCHED: "Notifications retrieved successfully",
  UNREAD_FETCHED: "Unread notifications retrieved successfully",
  MARKED_AS_READ: "Notification marked as read successfully",
  NOT_FOUND: "Notification not found",
} as const;

const QUERY_KEYS = {
  USER_ID: "userId",
} as const;

class Controller extends BaseController {
  private getQueryStringValue(req: Request, key: string): string | null {
    const value = req.query[key];
    if (typeof value === "string" && value.trim()) {
      return value;
    }

    return null;
  }

  getNotifications = this.catchAsync(async (req: Request, res: Response) => {
    const userId = this.getQueryStringValue(req, QUERY_KEYS.USER_ID);

    if (!userId) {
      return this.sendResponse(res, {
        statusCode: HttpStatusCode.BAD_REQUEST,
        success: false,
        message: MESSAGE.USER_ID_REQUIRED,
      });
    }

    const notifications =
      await NotificationService.getNotificationsByUserId(userId);

    this.sendResponse(res, {
      statusCode: HttpStatusCode.OK,
      success: true,
      message: MESSAGE.ALL_FETCHED,
      data: notifications,
    });
  });

  getUnreadNotifications = this.catchAsync(
    async (req: Request, res: Response) => {
      const userId = this.getQueryStringValue(req, QUERY_KEYS.USER_ID);

      if (!userId) {
        return this.sendResponse(res, {
          statusCode: HttpStatusCode.BAD_REQUEST,
          success: false,
          message: MESSAGE.USER_ID_REQUIRED,
        });
      }

      const notifications =
        await NotificationService.getUnreadNotificationsByUserId(userId);

      this.sendResponse(res, {
        statusCode: HttpStatusCode.OK,
        success: true,
        message: MESSAGE.UNREAD_FETCHED,
        data: notifications,
      });
    }
  );

  markAsRead = this.catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;

    if (!id) {
      return this.sendResponse(res, {
        statusCode: HttpStatusCode.BAD_REQUEST,
        success: false,
        message: MESSAGE.NOTIFICATION_ID_REQUIRED,
      });
    }

    const notification = await NotificationService.markAsRead(id);

    if (!notification) {
      return this.sendResponse(res, {
        statusCode: HttpStatusCode.NOT_FOUND,
        success: false,
        message: MESSAGE.NOT_FOUND,
      });
    }

    this.sendResponse(res, {
      statusCode: HttpStatusCode.OK,
      success: true,
      message: MESSAGE.MARKED_AS_READ,
      data: notification,
    });
  });
}

export const NotificationController = new Controller();
