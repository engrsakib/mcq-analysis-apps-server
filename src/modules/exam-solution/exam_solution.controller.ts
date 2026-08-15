import BaseController from "@/shared/baseController";
import { ExamSolutionService } from "./exam_solution.service";
import { Request, Response } from "express";
import { HttpStatusCode } from "@/lib/httpStatus";
import { resolveActor } from "@/modules/notification/notification.helpers";

class Controller extends BaseController {
  createExamSolution = this.catchAsync(async (req: Request, res: Response) => {
    const data = req.body;
    if (!data) {
      return this.sendResponse(res, {
        statusCode: HttpStatusCode.BAD_REQUEST,
        success: false,
        message: "Exam solution data is required",
      });
    }

    const created = await ExamSolutionService.createExamSolution(
      data,
      resolveActor(req.user)
    );

    this.sendResponse(res, {
      statusCode: HttpStatusCode.CREATED,
      success: true,
      message: "Exam solution created successfully",
      data: created,
    });
  });

  getAllExamSolutions = this.catchAsync(async (req: Request, res: Response) => {
    const items = await ExamSolutionService.getAllExamSolutions(req.query);
    this.sendResponse(res, {
      statusCode: HttpStatusCode.OK,
      success: true,
      message: "Exam solutions retrieved successfully",
      data: items,
    });
  });

  getAllExamSolutionsForUsers = this.catchAsync(
    async (req: Request, res: Response) => {
      const items = await ExamSolutionService.getAllExamSolutionsForUsers(
        req.query
      );
      this.sendResponse(res, {
        statusCode: HttpStatusCode.OK,
        success: true,
        message: "Exam solutions retrieved successfully",
        data: items,
      });
    }
  );

  getExamSolutionById = this.catchAsync(async (req: Request, res: Response) => {
    const id = req.params.id;
    if (!id) {
      return this.sendResponse(res, {
        statusCode: HttpStatusCode.BAD_REQUEST,
        success: false,
        message: "Exam solution ID is required",
      });
    }

    const item = await ExamSolutionService.getExamSolutionById(id);
    if (!item) {
      return this.sendResponse(res, {
        statusCode: HttpStatusCode.NOT_FOUND,
        success: false,
        message: "Exam solution not found",
      });
    }

    this.sendResponse(res, {
      statusCode: HttpStatusCode.OK,
      success: true,
      message: "Exam solution retrieved successfully",
      data: item,
    });
  });

  updateExamSolution = this.catchAsync(async (req: Request, res: Response) => {
    const id = req.params.id;
    const updateData = req.body;
    if (!id || !updateData) {
      return this.sendResponse(res, {
        statusCode: HttpStatusCode.BAD_REQUEST,
        success: false,
        message: "Exam solution ID and update data are required",
      });
    }

    const updated = await ExamSolutionService.updateExamSolutionById(
      id,
      updateData,
      resolveActor(req.user)
    );
    if (!updated) {
      return this.sendResponse(res, {
        statusCode: HttpStatusCode.NOT_FOUND,
        success: false,
        message: "Exam solution not found",
      });
    }

    this.sendResponse(res, {
      statusCode: HttpStatusCode.OK,
      success: true,
      message: "Exam solution updated successfully",
      data: updated,
    });
  });

  reorderExamSolutions = this.catchAsync(
    async (req: Request, res: Response) => {
      const items = Array.isArray(req.body) ? req.body : req.body?.items;

      if (!Array.isArray(items) || !items.length) {
        return this.sendResponse(res, {
          statusCode: HttpStatusCode.BAD_REQUEST,
          success: false,
          message: "Exam solution reorder items are required",
        });
      }

      const hasInvalidItem = items.some((item) => {
        const identifier = item?.id || item?._id || item?.exam_solution_number;
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

      const result = await ExamSolutionService.reorderExamSolutions(items);

      this.sendResponse(res, {
        statusCode: HttpStatusCode.OK,
        success: true,
        message: "Exam solution order updated successfully",
        data: result,
      });
    }
  );

  deleteExamSolution = this.catchAsync(async (req: Request, res: Response) => {
    const id = req.params.id;
    if (!id) {
      return this.sendResponse(res, {
        statusCode: HttpStatusCode.BAD_REQUEST,
        success: false,
        message: "Exam solution ID is required",
      });
    }

    const deleted = await ExamSolutionService.deleteExamSolutionById(id);
    if (!deleted) {
      return this.sendResponse(res, {
        statusCode: HttpStatusCode.NOT_FOUND,
        success: false,
        message: "Exam solution not found",
      });
    }

    this.sendResponse(res, {
      statusCode: HttpStatusCode.OK,
      success: true,
      message: "Exam solution deleted successfully",
    });
  });

  toggleExamSolutionStatus = this.catchAsync(
    async (req: Request, res: Response) => {
      const id = req.params.id;
      if (!id) {
        return this.sendResponse(res, {
          statusCode: HttpStatusCode.BAD_REQUEST,
          success: false,
          message: "Exam solution ID is required",
        });
      }

      const toggled = await ExamSolutionService.toggleExamSolutionStatus(id);
      if (!toggled) {
        return this.sendResponse(res, {
          statusCode: HttpStatusCode.NOT_FOUND,
          success: false,
          message: "Exam solution not found",
        });
      }

      this.sendResponse(res, {
        statusCode: HttpStatusCode.OK,
        success: true,
        message: "Exam solution status toggled successfully",
        data: toggled,
      });
    }
  );
}

export const ExamSolutionController = new Controller();
