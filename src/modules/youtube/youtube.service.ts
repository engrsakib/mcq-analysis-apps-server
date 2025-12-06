import { BarcodeService } from "@/lib/barcode";
import { YoutubeModel } from "./youtube.model";

class Service {
  async createYoutubeVideo(videoData: any) {
    videoData.is_published = false; // Default value
    videoData.video_number = await BarcodeService.generateEAN13(); // Auto-increment video_number

    const video = await YoutubeModel.create(videoData);

    return video;
  }

  async getAllYoutubeVideos(query: any) {
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 10;
    const skip = (page - 1) * limit;
    const searchTerm = query.searchTerm || "";

    const searchCondition = searchTerm
      ? {
          title: { $regex: searchTerm, $options: "i" },
        }
      : {};

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
}

export const YoutubeService = new Service();
