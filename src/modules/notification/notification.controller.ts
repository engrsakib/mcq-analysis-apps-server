import { Request, Response } from "express";
import BaseController from "@/shared/baseController";
import { HttpStatusCode } from "@/lib/httpStatus";
import { NotificationService } from "./notification.service";
import { sseManager } from "./notification.sse";
import { NotificationAudience } from "@/events/EventTypes";
import { ADMIN_ROLE_VALUES } from "@/constants/roles";

const MESSAGE = {
  USER_ID_REQUIRED: "userId query parameter is required",
  NOTIFICATION_ID_REQUIRED: "Notification ID is required",
  ALL_FETCHED: "Notifications retrieved successfully",
  UNREAD_FETCHED: "Unread notifications retrieved successfully",
  MARKED_AS_READ: "Notification marked as read successfully",
  ALL_MARKED_AS_READ: "All notifications marked as read successfully",
  NOT_FOUND: "Notification not found",
} as const;

const QUERY_KEYS = {
  USER_ID: "userId",
  AUDIENCE: "audience",
} as const;

class Controller extends BaseController {
  private getQueryStringValue(req: Request, key: string): string | null {
    const value = req.query[key];
    if (typeof value === "string" && value.trim()) {
      return value;
    }

    return null;
  }

  private resolveUserId(req: Request): string | null {
    if (req.user?.id) {
      return String(req.user.id);
    }

    return this.getQueryStringValue(req, QUERY_KEYS.USER_ID);
  }

  private resolveAudience(req: Request): NotificationAudience {
    const audience = this.getQueryStringValue(req, QUERY_KEYS.AUDIENCE);
    if (audience === "user" || audience === "admin") {
      return audience;
    }

    if (req.user?.role && ADMIN_ROLE_VALUES.includes(req.user.role as never)) {
      return "admin";
    }

    return "user";
  }

  getNotifications = this.catchAsync(async (req: Request, res: Response) => {
    const userId = this.resolveUserId(req);
    const audience = this.resolveAudience(req);

    if (!userId) {
      return this.sendResponse(res, {
        statusCode: HttpStatusCode.BAD_REQUEST,
        success: false,
        message: MESSAGE.USER_ID_REQUIRED,
      });
    }

    const notifications = await NotificationService.getNotificationsByUserId(
      userId,
      audience
    );

    this.sendResponse(res, {
      statusCode: HttpStatusCode.OK,
      success: true,
      message: MESSAGE.ALL_FETCHED,
      data: notifications,
    });
  });

  getUnreadNotifications = this.catchAsync(
    async (req: Request, res: Response) => {
      const userId = this.resolveUserId(req);
      const audience = this.resolveAudience(req);

      if (!userId) {
        return this.sendResponse(res, {
          statusCode: HttpStatusCode.BAD_REQUEST,
          success: false,
          message: MESSAGE.USER_ID_REQUIRED,
        });
      }

      const notifications =
        await NotificationService.getUnreadNotificationsByUserId(
          userId,
          audience
        );

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
    const userId = this.resolveUserId(req);

    if (!id) {
      return this.sendResponse(res, {
        statusCode: HttpStatusCode.BAD_REQUEST,
        success: false,
        message: MESSAGE.NOTIFICATION_ID_REQUIRED,
      });
    }

    if (!userId) {
      return this.sendResponse(res, {
        statusCode: HttpStatusCode.BAD_REQUEST,
        success: false,
        message: MESSAGE.USER_ID_REQUIRED,
      });
    }

    const notification = await NotificationService.markAsRead(id, userId);

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

  markAllAsRead = this.catchAsync(async (req: Request, res: Response) => {
    const userId = this.resolveUserId(req);
    const audience = this.resolveAudience(req);

    if (!userId) {
      return this.sendResponse(res, {
        statusCode: HttpStatusCode.BAD_REQUEST,
        success: false,
        message: MESSAGE.USER_ID_REQUIRED,
      });
    }

    const result = await NotificationService.markAllAsRead(userId, audience);

    this.sendResponse(res, {
      statusCode: HttpStatusCode.OK,
      success: true,
      message: MESSAGE.ALL_MARKED_AS_READ,
      data: result,
    });
  });

  streamNotifications = this.catchAsync(async (req: Request, res: Response) => {
    const adminId = String(req.user?.id ?? "");

    if (!adminId) {
      return this.sendResponse(res, {
        statusCode: HttpStatusCode.UNAUTHORIZED,
        success: false,
        message: "Authentication required",
      });
    }

    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache, no-transform");
    res.setHeader("Connection", "keep-alive");
    res.setHeader("X-Accel-Buffering", "no");
    res.flushHeaders?.();

    res.write(`event: connected\ndata: ${JSON.stringify({ adminId })}\n\n`);

    sseManager.subscribe(adminId, res);

    const heartbeat = setInterval(() => {
      try {
        res.write(
          `event: ping\ndata: ${JSON.stringify({ ts: Date.now() })}\n\n`
        );
      } catch {
        clearInterval(heartbeat);
        sseManager.unsubscribe(adminId, res);
      }
    }, 30000);

    req.on("close", () => {
      clearInterval(heartbeat);
      sseManager.unsubscribe(adminId, res);
    });
  });
}

export const NotificationController = new Controller();
