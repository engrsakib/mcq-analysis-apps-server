import { Request, Response } from "express";
import BaseController from "@/shared/baseController";
import { HttpStatusCode } from "@/lib/httpStatus";
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { cookieManager } from "@/shared/cookie";
import { GuidelineService } from "./guideline.servece";

class Controller extends BaseController {
  createGuideline = this.catchAsync(async (req: Request, res: Response) => {
    // Implementation for creating a YouTube entry
    const guidelineData = req.body;
    if (!guidelineData) {
      return this.sendResponse(res, {
        statusCode: HttpStatusCode.BAD_REQUEST,
        success: false,
        message: "Guideline data is required",
      });
    }
    const createdGuideline =
      await GuidelineService.createGuideline(guidelineData);

    this.sendResponse(res, {
      statusCode: HttpStatusCode.CREATED,
      success: true,
      message: "Guideline entry created successfully",
      data: createdGuideline,
    });
  });

  getAllGuidelines = this.catchAsync(async (req: Request, res: Response) => {
    // Implementation for retrieving all Guideline entries
    const query = req.query;
    const guidelines = await GuidelineService.getAllGuidelines(query);

    this.sendResponse(res, {
      statusCode: HttpStatusCode.OK,
      success: true,
      message: "Guideline entries retrieved successfully",
      data: guidelines,
    });
  });

  getGuidelineById = this.catchAsync(async (req: Request, res: Response) => {
    const id = req.params.id;
    if (!id) {
      return this.sendResponse(res, {
        statusCode: HttpStatusCode.BAD_REQUEST,
        success: false,
        message: "Guideline entry ID is required",
      });
    }
    const guideline = await GuidelineService.getGuidelineById(id);
    this.sendResponse(res, {
      statusCode: HttpStatusCode.OK,
      success: true,
      message: "Guideline entry retrieved successfully",
      data: guideline, // Replace with actual data
    });
  });

  updateGuidelineById = this.catchAsync(async (req: Request, res: Response) => {
    const id = req.params.id;
    const updateData = req.body;

    if (!id || !updateData) {
      return this.sendResponse(res, {
        statusCode: HttpStatusCode.BAD_REQUEST,
        success: false,
        message: "YouTube entry ID and update data are required",
      });
    }

    const updatedVideo = await GuidelineService.updateGuidelineById(
      id,
      updateData
    );

    this.sendResponse(res, {
      statusCode: HttpStatusCode.OK,
      success: true,
      message: "YouTube entry updated successfully",
      data: updatedVideo,
    });
  });

  deleteGuidelineById = this.catchAsync(async (req: Request, res: Response) => {
    const id = req.params.id;
    if (!id) {
      return this.sendResponse(res, {
        statusCode: HttpStatusCode.BAD_REQUEST,
        success: false,
        message: "YouTube entry ID is required",
      });
    }
    await GuidelineService.deleteGuidelineById(id);
    this.sendResponse(res, {
      statusCode: HttpStatusCode.OK,
      success: true,
      message: "YouTube entry deleted successfully",
    });
  });

  toggleGuidelineStatus = this.catchAsync(
    async (req: Request, res: Response) => {
      const id = req.params.id;
      if (!id) {
        return this.sendResponse(res, {
          statusCode: HttpStatusCode.BAD_REQUEST,
          success: false,
          message: "Guideline entry ID is required",
        });
      }
      const toggledGuideline = await GuidelineService.toggleGuidelineStatus(id);
      this.sendResponse(res, {
        statusCode: HttpStatusCode.OK,
        success: true,
        message: "Guideline entry status toggled successfully",
        data: toggledGuideline,
      });
    }
  );
}

export const GuidelineController = new Controller();
