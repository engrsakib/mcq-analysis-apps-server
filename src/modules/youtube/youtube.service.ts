import { BarcodeService } from "@/lib/barcode";
import { YoutubeModel } from "./youtube.model";
import { eventBus } from "@/events/EventBus";
import { searchHelpers } from "@/utils/searchHelpers";

class Service {
  async createYoutubeVideo(videoData: any) {
    // Default value
    videoData.video_number = await BarcodeService.generateEAN13(); // Auto-increment video_number

    const video = await YoutubeModel.create(videoData);

    await eventBus.publish({
      type: "YOUTUBE_VIDEO_ADDED",
      payload: {
        userId: videoData.created_by || "system",
        title: (video as any).title || "YouTube Video",
        description: "Created successfully",
        module: "youtube",
        time: new Date().toISOString(),
        videoId:
          (video.video_number as any)?.toString() || video._id.toString(),
      },
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
      .sort({ createdAt: -1 });

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
      .sort({ createdAt: -1 });

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

  async updateYoutubeVideoById(id: string, updateData: any) {
    const updatedVideo = await YoutubeModel.findOneAndUpdate(
      { video_number: id },
      updateData,
      { new: true }
    );

    if (updatedVideo) {
      await eventBus.publish({
        type: "YOUTUBE_VIDEO_UPDATED",
        payload: {
          userId: updateData.updated_by || "system",
          title: (updatedVideo as any).title || "YouTube Video",
          description: "Updated successfully",
          module: "youtube",
          time: new Date().toISOString(),
          videoId:
            (updatedVideo.video_number as any)?.toString() ||
            updatedVideo._id.toString(),
        },
      });
    }

    return updatedVideo;
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
