import { Request, Response } from "express";
import BaseController from "@/shared/baseController";
import { HttpStatusCode } from "@/lib/httpStatus";
import { QuestionService } from "./question.service";

class Controller extends BaseController {
  createQuestion = this.catchAsync(async (req: Request, res: Response) => {
    const question = await QuestionService.createQuestion(req.body);
    this.sendResponse(res, {
      statusCode: HttpStatusCode.CREATED,
      success: true,
      message: "Question created successfully",
      data: question,
    });
  });

  getAllQuestions = this.catchAsync(async (req: Request, res: Response) => {
    // ১. ফিল্টার আলাদা করা
    const filters = {
      searchTerm: req.query.searchTerm as string,
    };

    // ২. পেজিনেশন অপশন (এখানেই ফিক্স করা হয়েছে)
    const paginationOptions = {
      // Number(...) ব্যবহার করে স্ট্রিং থেকে নাম্বারে কনভার্ট করুন
      page: Number(req.query.page || 1),
      limit: Number(req.query.limit || 10),
      sortBy: req.query.sortBy as string,
      sortOrder: req.query.sortOrder as "asc" | "desc",
    };

    const result = await QuestionService.getAllQuestions(
      filters,
      paginationOptions
    );

    this.sendResponse(res, {
      statusCode: HttpStatusCode.OK,
      success: true,
      message: "Questions retrieved successfully",

      data: result,
    });
  });

  getQuestionById = this.catchAsync(async (req: Request, res: Response) => {
    const id = Number(req.params.id);
    const question = await QuestionService.getQuestionById(id);
    this.sendResponse(res, {
      statusCode: HttpStatusCode.OK,
      success: true,
      message: "Question retrieved successfully",
      data: question,
    });
  });

  updateQuestionById = this.catchAsync(async (req: Request, res: Response) => {
    const id = Number(req.params.id);
    const question = await QuestionService.updateQuestionById(id, req.body);
    this.sendResponse(res, {
      statusCode: HttpStatusCode.OK,
      success: true,
      message: "Question updated successfully",
      data: question,
    });
  });

  deleteQuestionById = this.catchAsync(async (req: Request, res: Response) => {
    const id = Number(req.params.id);
    await QuestionService.deleteQuestionById(id);
    this.sendResponse(res, {
      statusCode: HttpStatusCode.OK,
      success: true,
      message: "Question deleted successfully",
      data: null,
    });
  });
}

export const QuestionController = new Controller();
