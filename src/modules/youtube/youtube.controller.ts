import { Request, Response } from "express";
import BaseController from "@/shared/baseController";
import { HttpStatusCode } from "@/lib/httpStatus";
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { cookieManager } from "@/shared/cookie";
import { YoutubeService } from "./youtube.service";
import { resolveActor } from "@/modules/notification/notification.helpers";

class Controller extends BaseController {
  createYouTube = this.catchAsync(async (req: Request, res: Response) => {
    // Implementation for creating a YouTube entry
    const videoData = req.body;
    if (!videoData) {
      return this.sendResponse(res, {
        statusCode: HttpStatusCode.BAD_REQUEST,
        success: false,
        message: "YouTube video data is required",
      });
    }
    const createdVideo = await YoutubeService.createYoutubeVideo(
      videoData,
      resolveActor(req.user)
    );

    this.sendResponse(res, {
      statusCode: HttpStatusCode.CREATED,
      success: true,
      message: "YouTube entry created successfully",
      data: createdVideo,
    });
  });

  getAllYouTubes = this.catchAsync(async (req: Request, res: Response) => {
    // Implementation for retrieving all YouTube entries
    const query = req.query;
    const videos = await YoutubeService.getAllYoutubeVideos(query);

    this.sendResponse(res, {
      statusCode: HttpStatusCode.OK,
      success: true,
      message: "YouTube entries retrieved successfully",
      data: videos,
    });
  });

  getAllYouTubesForUsers = this.catchAsync(
    async (req: Request, res: Response) => {
      // Implementation for retrieving all YouTube entries
      const query = req.query;
      const videos = await YoutubeService.getAllYoutubeVideosForUsers(query);

      this.sendResponse(res, {
        statusCode: HttpStatusCode.OK,
        success: true,
        message: "YouTube entries retrieved successfully",
        data: videos,
      });
    }
  );

  getYouTubeById = this.catchAsync(async (req: Request, res: Response) => {
    const id = req.params.id;
    if (!id) {
      return this.sendResponse(res, {
        statusCode: HttpStatusCode.BAD_REQUEST,
        success: false,
        message: "YouTube entry ID is required",
      });
    }
    const video = await YoutubeService.getYoutubeVideoById(id);
    this.sendResponse(res, {
      statusCode: HttpStatusCode.OK,
      success: true,
      message: "YouTube entry retrieved successfully",
      data: video, // Replace with actual data
    });
  });

  reorderYoutubeVideos = this.catchAsync(
    async (req: Request, res: Response) => {
      const items = Array.isArray(req.body) ? req.body : req.body?.items;

      if (!Array.isArray(items) || !items.length) {
        return this.sendResponse(res, {
          statusCode: HttpStatusCode.BAD_REQUEST,
          success: false,
          message: "YouTube reorder items are required",
        });
      }

      const hasInvalidItem = items.some((item) => {
        const identifier = item?.id || item?._id || item?.video_number;
        return (
          !identifier ||
          !Number.isInteger(Number(item?.position)) ||
          Number(item?.position) < 0
        );
      });

      if (hasInvalidItem) {
        return this.sendResponse(res, {
          statusCode: HttpStatusCode.BAD_REQUEST,
          success: false,
          message: "Each item must have a valid ID and position",
        });
      }

      const result = await YoutubeService.reorderYoutubeVideos(items);

      this.sendResponse(res, {
        statusCode: HttpStatusCode.OK,
        success: true,
        message: "YouTube video order updated successfully",
        data: result,
      });
    }
  );

  updateYouTubeById = this.catchAsync(async (req: Request, res: Response) => {
    const id = req.params.id;
    const updateData = req.body;

    if (!id || !updateData) {
      return this.sendResponse(res, {
        statusCode: HttpStatusCode.BAD_REQUEST,
        success: false,
        message: "YouTube entry ID and update data are required",
      });
    }

    const updatedVideo = await YoutubeService.updateYoutubeVideoById(
      id,
      updateData,
      resolveActor(req.user)
    );

    this.sendResponse(res, {
      statusCode: HttpStatusCode.OK,
      success: true,
      message: "YouTube entry updated successfully",
      data: updatedVideo,
    });
  });

  deleteYouTubeById = this.catchAsync(async (req: Request, res: Response) => {
    const id = req.params.id;
    if (!id) {
      return this.sendResponse(res, {
        statusCode: HttpStatusCode.BAD_REQUEST,
        success: false,
        message: "YouTube entry ID is required",
      });
    }
    await YoutubeService.deleteYoutubeVideoById(id);
    this.sendResponse(res, {
      statusCode: HttpStatusCode.OK,
      success: true,
      message: "YouTube entry deleted successfully",
    });
  });

  publishYouTubeToggle = this.catchAsync(
    async (req: Request, res: Response) => {
      const id = req.params.id;
      if (!id) {
        return this.sendResponse(res, {
          statusCode: HttpStatusCode.BAD_REQUEST,
          success: false,
          message: "YouTube entry ID is required",
        });
      }
      const publishedVideo = await YoutubeService.publishVideoToggole(id);
      this.sendResponse(res, {
        statusCode: HttpStatusCode.OK,
        success: true,
        message: "YouTube entry publish status toggled successfully",
        data: publishedVideo,
      });
    }
  );
}

export const YoutubeController = new Controller();
