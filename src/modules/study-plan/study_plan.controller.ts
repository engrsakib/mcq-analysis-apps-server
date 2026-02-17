import BaseController from "@/shared/baseController";
import { StudyPlanService } from "./study_plan.service";
import { Request, Response } from "express";
import { HttpStatusCode } from "@/lib/httpStatus";

class Controller extends BaseController {
  createStudyPlan = this.catchAsync(async (req: Request, res: Response) => {
    const guidelineData = req.body;
    if (!guidelineData) {
      return this.sendResponse(res, {
        statusCode: HttpStatusCode.BAD_REQUEST,
        success: false,
        message: "Study plan data is required",
      });
    }
    const createdGuideline =
      await StudyPlanService.createStudyPlan(guidelineData);

    this.sendResponse(res, {
      statusCode: HttpStatusCode.CREATED,
      success: true,
      message: "Study plan created successfully",
      data: createdGuideline,
    });
  });

  getAllStudyPlans = this.catchAsync(async (req: Request, res: Response) => {
    const query = req.query;
    const guidelines = await StudyPlanService.getAllStudyPlans(query);
    this.sendResponse(res, {
      statusCode: HttpStatusCode.OK,
      success: true,
      message: "Study plans retrieved successfully",
      data: guidelines,
    });
  });

  getAllStudyPlansForUsers = this.catchAsync(
    async (req: Request, res: Response) => {
      const query = req.query;
      const guidelines = await StudyPlanService.getAllStudyPlansForUsers(query);
      this.sendResponse(res, {
        statusCode: HttpStatusCode.OK,
        success: true,
        message: "Study plans retrieved successfully",
        data: guidelines,
      });
    }
  );

  getStudyPlanById = this.catchAsync(async (req: Request, res: Response) => {
    const id = req.params.id;
    if (!id) {
      return this.sendResponse(res, {
        statusCode: HttpStatusCode.BAD_REQUEST,
        success: false,
        message: "Study plan ID is required",
      });
    }
    const guideline = await StudyPlanService.getStudyPlanById(id);
    if (!guideline) {
      return this.sendResponse(res, {
        statusCode: HttpStatusCode.NOT_FOUND,
        success: false,
        message: "Study plan not found",
      });
    }
    this.sendResponse(res, {
      statusCode: HttpStatusCode.OK,
      success: true,
      message: "Study plan retrieved successfully",
      data: guideline,
    });
  });

  updateStudyPlan = this.catchAsync(async (req: Request, res: Response) => {
    const id = req.params.id;
    const updateData = req.body;
    if (!id || !updateData) {
      return this.sendResponse(res, {
        statusCode: HttpStatusCode.BAD_REQUEST,
        success: false,
        message: "Study plan ID and update data are required",
      });
    }

    const updatedGuideline = await StudyPlanService.updateStudyPlanById(
      id,
      updateData
    );
    if (!updatedGuideline) {
      return this.sendResponse(res, {
        statusCode: HttpStatusCode.NOT_FOUND,
        success: false,
        message: "Study plan not found",
      });
    }
    this.sendResponse(res, {
      statusCode: HttpStatusCode.OK,
      success: true,
      message: "Study plan updated successfully",
      data: updatedGuideline,
    });
  });

  deleteStudyPlan = this.catchAsync(async (req: Request, res: Response) => {
    const id = req.params.id;
    if (!id) {
      return this.sendResponse(res, {
        statusCode: HttpStatusCode.BAD_REQUEST,
        success: false,
        message: "Study plan ID is required",
      });
    }
    const deletedStudyPlan = await StudyPlanService.deleteStudyPlanById(id);
    if (!deletedStudyPlan) {
      return this.sendResponse(res, {
        statusCode: HttpStatusCode.NOT_FOUND,
        success: false,
        message: "Study plan not found",
      });
    }
    this.sendResponse(res, {
      statusCode: HttpStatusCode.OK,
      success: true,
      message: "Study plan deleted successfully",
    });
  });

  toggleStudyPlanStatus = this.catchAsync(
    async (req: Request, res: Response) => {
      const id = req.params.id;
      if (!id) {
        return this.sendResponse(res, {
          statusCode: HttpStatusCode.BAD_REQUEST,
          success: false,
          message: "Study plan ID is required",
        });
      }
      const toggledStudyPlan = await StudyPlanService.toggleStudyPlanStatus(id);
      if (!toggledStudyPlan) {
        return this.sendResponse(res, {
          statusCode: HttpStatusCode.NOT_FOUND,
          success: false,
          message: "Study plan not found",
        });
      }
      this.sendResponse(res, {
        statusCode: HttpStatusCode.OK,
        success: true,
        message: "Study plan status toggled successfully",
        data: toggledStudyPlan,
      });
    }
  );
}

export const StudyPlanController = new Controller();
