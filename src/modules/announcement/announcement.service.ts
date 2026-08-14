import mongoose from "mongoose";
import { BarcodeService } from "@/lib/barcode";
import ApiError from "@/middlewares/error";
import { HttpStatusCode } from "@/lib/httpStatus";
import { searchHelpers } from "@/utils/searchHelpers";
import { eventBus } from "@/events/EventBus";
import {
  ActorInfo,
  buildAdminActivityPayload,
} from "@/modules/notification/notification.helpers";
import { AnnouncementModel } from "./announcement.model";
import { AnnouncementReadModel } from "./announcement-read.model";
import { IAnnouncement } from "./announcement.interface";

const buildAnnouncementFilter = (id: string): Record<string, unknown> => {
  const trimmedId = String(id ?? "").trim();

  if (/^[0-9a-fA-F]{24}$/.test(trimmedId)) {
    return { _id: new mongoose.Types.ObjectId(trimmedId) };
  }

  const announcementNumber = Number(trimmedId);
  if (!trimmedId || !Number.isFinite(announcementNumber)) {
    throw new ApiError(
      HttpStatusCode.BAD_REQUEST,
      "Invalid announcement identifier"
    );
  }

  return { announcement_number: announcementNumber };
};

class Service {
  async createAnnouncement(payload: Partial<IAnnouncement>, actor?: ActorInfo) {
    const announcementNumber = BarcodeService.generateEAN13();

    const announcement = await AnnouncementModel.create({
      ...payload,
      announcement_number: announcementNumber,
      link: payload.link?.trim() || "",
      is_published: payload.is_published ?? true,
    });

    await eventBus.publish({
      type: "ANNOUNCEMENT_CREATED",
      payload: buildAdminActivityPayload({
        actor,
        action: "created",
        entityType: "announcement",
        entityLabel: `"${announcement.title || "Announcement"}"`,
        entityId: String(announcement.announcement_number),
        module: "announcement",
      }),
    });

    return announcement;
  }

  async getAllAnnouncements(query: Record<string, unknown>) {
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 10;
    const skip = (page - 1) * limit;
    const searchTerm = String(query.searchTerm ?? "");

    const searchCondition = {
      ...searchHelpers.buildSearchCondition({
        searchFields: ["title", "body"],
        searchTerm,
        numericIdField: "announcement_number",
      }),
    };

    const [data, total] = await Promise.all([
      AnnouncementModel.find(searchCondition)
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 }),
      AnnouncementModel.countDocuments(searchCondition),
    ]);

    return {
      meta: { page, limit, total, totalPage: Math.ceil(total / limit) },
      data,
    };
  }

  async getAnnouncementById(id: string) {
    return AnnouncementModel.findOne(buildAnnouncementFilter(id));
  }

  async updateAnnouncementById(
    id: string,
    payload: Partial<IAnnouncement>,
    actor?: ActorInfo
  ) {
    const updateData = { ...payload };
    if (updateData.link !== undefined) {
      updateData.link = updateData.link?.trim() || "";
    }

    const updated = await AnnouncementModel.findOneAndUpdate(
      buildAnnouncementFilter(id),
      updateData,
      { new: true, runValidators: true }
    );

    if (!updated) {
      throw new ApiError(HttpStatusCode.NOT_FOUND, "Announcement not found");
    }

    await eventBus.publish({
      type: "ANNOUNCEMENT_UPDATED",
      payload: buildAdminActivityPayload({
        actor,
        action: "updated",
        entityType: "announcement",
        entityLabel: `"${updated.title || "Announcement"}"`,
        entityId: String(updated.announcement_number),
        module: "announcement",
      }),
    });

    return updated;
  }

  async deleteAnnouncementById(id: string, actor?: ActorInfo) {
    const deleted = await AnnouncementModel.findOneAndDelete(
      buildAnnouncementFilter(id)
    );

    if (!deleted) {
      throw new ApiError(HttpStatusCode.NOT_FOUND, "Announcement not found");
    }

    await AnnouncementReadModel.deleteMany({
      announcement_id: deleted._id,
    });

    await eventBus.publish({
      type: "ANNOUNCEMENT_DELETED",
      payload: buildAdminActivityPayload({
        actor,
        action: "deleted",
        entityType: "announcement",
        entityLabel: `"${deleted.title || "Announcement"}"`,
        entityId: String(deleted.announcement_number),
        module: "announcement",
      }),
    });

    return deleted;
  }

  async getAnnouncementsForUser(userId: string) {
    const readRecords = await AnnouncementReadModel.find({
      user_id: userId,
    })
      .select("announcement_id")
      .lean();

    const readIds = new Set(
      readRecords.map((record) => String(record.announcement_id))
    );

    const announcements = await AnnouncementModel.find({
      is_published: true,
    })
      .sort({ createdAt: -1 })
      .lean();

    return announcements.map((announcement) => ({
      ...announcement,
      isRead: readIds.has(String(announcement._id)),
    }));
  }

  async getUnreadAnnouncementForUser(userId: string) {
    const readRecords = await AnnouncementReadModel.find({
      user_id: userId,
    })
      .select("announcement_id")
      .lean();

    const readIds = readRecords.map((record) => record.announcement_id);

    return AnnouncementModel.findOne({
      is_published: true,
      _id: { $nin: readIds },
    })
      .sort({ createdAt: -1 })
      .lean();
  }

  async dismissAnnouncementForUser(userId: string, announcementId: string) {
    const announcement = await AnnouncementModel.findOne(
      buildAnnouncementFilter(announcementId)
    ).lean();

    if (!announcement) {
      throw new ApiError(HttpStatusCode.NOT_FOUND, "Announcement not found");
    }

    if (!announcement.is_published) {
      throw new ApiError(
        HttpStatusCode.BAD_REQUEST,
        "Announcement is not published"
      );
    }

    await AnnouncementReadModel.findOneAndUpdate(
      {
        user_id: userId,
        announcement_id: announcement._id,
      },
      {
        user_id: userId,
        announcement_id: announcement._id,
        dismissed_at: new Date(),
      },
      { upsert: true, new: true }
    );

    return { dismissed: true };
  }
}

export const announcementService = new Service();
