import { Request, Response } from "express";
import BaseController from "@/shared/baseController";
import { HttpStatusCode } from "@/lib/httpStatus";
import { announcementService } from "./announcement.service";
import { resolveActor } from "@/modules/notification/notification.helpers";

class Controller extends BaseController {
  createAnnouncement = this.catchAsync(async (req: Request, res: Response) => {
    const created = await announcementService.createAnnouncement(
      req.body,
      resolveActor(req.user)
    );

    this.sendResponse(res, {
      statusCode: HttpStatusCode.CREATED,
      success: true,
      message: "Announcement created successfully",
      data: created,
    });
  });

  getAllAnnouncements = this.catchAsync(async (req: Request, res: Response) => {
    const announcements = await announcementService.getAllAnnouncements(
      req.query as Record<string, unknown>
    );

    this.sendResponse(res, {
      statusCode: HttpStatusCode.OK,
      success: true,
      message: "Announcements retrieved successfully",
      data: announcements,
    });
  });

  getAnnouncementById = this.catchAsync(async (req: Request, res: Response) => {
    const announcement = await announcementService.getAnnouncementById(
      req.params.id
    );

    this.sendResponse(res, {
      statusCode: HttpStatusCode.OK,
      success: true,
      message: "Announcement retrieved successfully",
      data: announcement,
    });
  });

  updateAnnouncementById = this.catchAsync(
    async (req: Request, res: Response) => {
      const updated = await announcementService.updateAnnouncementById(
        req.params.id,
        req.body,
        resolveActor(req.user)
      );

      this.sendResponse(res, {
        statusCode: HttpStatusCode.OK,
        success: true,
        message: "Announcement updated successfully",
        data: updated,
      });
    }
  );

  deleteAnnouncementById = this.catchAsync(
    async (req: Request, res: Response) => {
      await announcementService.deleteAnnouncementById(
        req.params.id,
        resolveActor(req.user)
      );

      this.sendResponse(res, {
        statusCode: HttpStatusCode.OK,
        success: true,
        message: "Announcement deleted successfully",
      });
    }
  );

  getAnnouncementsForUser = this.catchAsync(
    async (req: Request, res: Response) => {
      const announcements = await announcementService.getAnnouncementsForUser(
        String(req.user.id)
      );

      this.sendResponse(res, {
        statusCode: HttpStatusCode.OK,
        success: true,
        message: "Announcements retrieved successfully",
        data: announcements,
      });
    }
  );

  getUnreadAnnouncementForUser = this.catchAsync(
    async (req: Request, res: Response) => {
      const unread = await announcementService.getUnreadAnnouncementForUser(
        String(req.user.id)
      );

      this.sendResponse(res, {
        statusCode: HttpStatusCode.OK,
        success: true,
        message: unread
          ? "Unread announcement retrieved successfully"
          : "No unread announcements",
        data: unread,
      });
    }
  );

  dismissAnnouncementForUser = this.catchAsync(
    async (req: Request, res: Response) => {
      const result = await announcementService.dismissAnnouncementForUser(
        String(req.user.id),
        req.params.id
      );

      this.sendResponse(res, {
        statusCode: HttpStatusCode.OK,
        success: true,
        message: "Announcement dismissed successfully",
        data: result,
      });
    }
  );
}

export const AnnouncementController = new Controller();
