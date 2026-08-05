import { BarcodeService } from "@/lib/barcode";
import { YoutubeModel } from "./youtube.model";
import { eventBus } from "@/events/EventBus";
import { searchHelpers } from "@/utils/searchHelpers";
import { AnyBulkWriteOperation, Types } from "mongoose";
import {
  ActorInfo,
  buildAdminActivityPayload,
} from "@/modules/notification/notification.helpers";

type ReorderYoutubeItem = {
  id?: string | number;
  _id?: string;
  video_number?: string | number;
  position: number;
};

class Service {
  async createYoutubeVideo(videoData: any, actor?: ActorInfo) {
    videoData.video_number = await BarcodeService.generateEAN13();

    if (videoData.position === undefined || videoData.position === null) {
      const lastVideo = await YoutubeModel.findOne()
        .sort({ position: -1 })
        .select("position");

      videoData.position = (lastVideo?.position || 0) + 1;
    }

    const video = await YoutubeModel.create(videoData);

    await eventBus.publish({
      type: "YOUTUBE_VIDEO_ADDED",
      payload: buildAdminActivityPayload({
        actor,
        action: "created",
        entityType: "youtube",
        entityLabel: `"${video.title || "YouTube Video"}"`,
        entityId: String(video.video_number),
        module: "youtube",
      }),
    });

    return video;
  }

  async getAllYoutubeVideos(query: any) {
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 10;
    const skip = (page - 1) * limit;
    const searchTerm = query.searchTerm || "";

    const searchCondition = {
      ...searchHelpers.buildSearchCondition({
        searchFields: ["title"],
        searchTerm,
      }),
    };

    const videos = await YoutubeModel.find(searchCondition)
      .skip(skip)
      .limit(limit)
      .sort({ position: 1, createdAt: -1 });

    const total = await YoutubeModel.countDocuments(searchCondition);

    return {
      meta: {
        page,
        limit,
        total,
        totalPage: Math.ceil(total / limit),
      },
      data: videos,
    };
  }
  async getAllYoutubeVideosForUsers(query: any) {
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 10;
    const skip = (page - 1) * limit;
    const searchTerm = query.searchTerm || "";

    const searchCondition = {
      is_published: true,
      ...searchHelpers.buildSearchCondition({
        searchFields: ["title"],
        searchTerm,
      }),
    };

    const videos = await YoutubeModel.find(searchCondition)
      .skip(skip)
      .limit(limit)
      .sort({ position: 1, createdAt: -1 });

    const total = await YoutubeModel.countDocuments(searchCondition);

    return {
      meta: {
        page,
        limit,
        total,
        totalPage: Math.ceil(total / limit),
      },
      data: videos,
    };
  }

  async getYoutubeVideoById(id: string) {
    const video = await YoutubeModel.findOne({ video_number: id });
    return video;
  }

  async updateYoutubeVideoById(id: string, updateData: any, actor?: ActorInfo) {
    const updatedVideo = await YoutubeModel.findOneAndUpdate(
      { video_number: id },
      updateData,
      { new: true }
    );

    if (updatedVideo) {
      await eventBus.publish({
        type: "YOUTUBE_VIDEO_UPDATED",
        payload: buildAdminActivityPayload({
          actor,
          action: "updated",
          entityType: "youtube",
          entityLabel: `"${updatedVideo.title || "YouTube Video"}"`,
          entityId: String(updatedVideo.video_number),
          module: "youtube",
        }),
      });
    }

    return updatedVideo;
  }

  async reorderYoutubeVideos(items: ReorderYoutubeItem[]) {
    const operations = items.reduce<AnyBulkWriteOperation<any>[]>(
      (acc, item) => {
        const identifier = item.id || item._id || item.video_number;
        const position = Number(item.position);

        if (!identifier || !Number.isInteger(position) || position < 0) {
          return acc;
        }

        const filter =
          typeof identifier === "string" && Types.ObjectId.isValid(identifier)
            ? { _id: identifier }
            : { video_number: Number(identifier) };

        if ("video_number" in filter && !Number.isFinite(filter.video_number)) {
          return acc;
        }

        acc.push({
          updateOne: {
            filter,
            update: { $set: { position } },
          },
        });

        return acc;
      },
      []
    );

    if (!operations.length) {
      return { matchedCount: 0, modifiedCount: 0 };
    }

    return YoutubeModel.bulkWrite(operations);
  }

  async deleteYoutubeVideoById(id: string) {
    const deletedVideo = await YoutubeModel.findOneAndDelete({
      video_number: id,
    });
    return deletedVideo;
  }

  async publishVideoToggole(id: string) {
    const publishedVideo = await YoutubeModel.findOneAndUpdate(
      { video_number: id },
      [{ $set: { is_published: { $not: "$is_published" } } }],
      { new: true }
    );

    return publishedVideo;
  }
}

export const YoutubeService = new Service();
