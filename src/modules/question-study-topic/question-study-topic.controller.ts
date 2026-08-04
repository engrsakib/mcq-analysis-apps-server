import { Request, Response } from "express";
import BaseController from "@/shared/baseController";
import { HttpStatusCode } from "@/lib/httpStatus";
import { QuestionStudyTopicService } from "./question-study-topic.service";

class Controller extends BaseController {
  createTopic = this.catchAsync(async (req: Request, res: Response) => {
    const topic = await QuestionStudyTopicService.createTopic(req.body);

    this.sendResponse(res, {
      statusCode: HttpStatusCode.CREATED,
      success: true,
      message: "Study topic created successfully",
      data: topic,
    });
  });

  getAllTopics = this.catchAsync(async (req: Request, res: Response) => {
    const topics = await QuestionStudyTopicService.getAllTopics(req.query);

    this.sendResponse(res, {
      statusCode: HttpStatusCode.OK,
      success: true,
      message: "Study topics retrieved successfully",
      data: topics,
    });
  });

  getDropdownTopics = this.catchAsync(async (_req: Request, res: Response) => {
    const topics = await QuestionStudyTopicService.getDropdownTopics();

    this.sendResponse(res, {
      statusCode: HttpStatusCode.OK,
      success: true,
      message: "Study topics dropdown retrieved successfully",
      data: topics,
    });
  });

  getTopicByCategoryNumber = this.catchAsync(
    async (req: Request, res: Response) => {
      const categoryNumber = Number(req.params.category_number);

      if (!Number.isFinite(categoryNumber)) {
        return this.sendResponse(res, {
          statusCode: HttpStatusCode.BAD_REQUEST,
          success: false,
          message: "Invalid category number",
        });
      }

      const topic =
        await QuestionStudyTopicService.getTopicByCategoryNumber(
          categoryNumber
        );

      this.sendResponse(res, {
        statusCode: HttpStatusCode.OK,
        success: true,
        message: "Study topic retrieved successfully",
        data: topic,
      });
    }
  );

  updateTopicByCategoryNumber = this.catchAsync(
    async (req: Request, res: Response) => {
      const categoryNumber = Number(req.params.category_number);

      if (!Number.isFinite(categoryNumber)) {
        return this.sendResponse(res, {
          statusCode: HttpStatusCode.BAD_REQUEST,
          success: false,
          message: "Invalid category number",
        });
      }

      const topic = await QuestionStudyTopicService.updateTopicByCategoryNumber(
        categoryNumber,
        req.body
      );

      this.sendResponse(res, {
        statusCode: HttpStatusCode.OK,
        success: true,
        message: "Study topic updated successfully",
        data: topic,
      });
    }
  );

  reorderTopics = this.catchAsync(async (req: Request, res: Response) => {
    const items = Array.isArray(req.body) ? req.body : req.body?.items;

    if (!Array.isArray(items) || !items.length) {
      return this.sendResponse(res, {
        statusCode: HttpStatusCode.BAD_REQUEST,
        success: false,
        message: "Reorder items are required",
      });
    }

    const hasInvalidItem = items.some((item) => {
      const identifier = item?.id || item?._id || item?.category_number;
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

    const result = await QuestionStudyTopicService.reorderTopics(items);

    this.sendResponse(res, {
      statusCode: HttpStatusCode.OK,
      success: true,
      message: "Study topic order updated successfully",
      data: result,
    });
  });

  deleteTopicByCategoryNumber = this.catchAsync(
    async (req: Request, res: Response) => {
      const categoryNumber = Number(req.params.category_number);

      if (!Number.isFinite(categoryNumber)) {
        return this.sendResponse(res, {
          statusCode: HttpStatusCode.BAD_REQUEST,
          success: false,
          message: "Invalid category number",
        });
      }

      await QuestionStudyTopicService.deleteTopicByCategoryNumber(
        categoryNumber
      );

      this.sendResponse(res, {
        statusCode: HttpStatusCode.OK,
        success: true,
        message: "Study topic deleted successfully",
      });
    }
  );
}

export const QuestionStudyTopicController = new Controller();
