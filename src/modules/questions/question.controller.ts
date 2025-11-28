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
    const questions = await QuestionService.getAllQuestions(req.query);
    this.sendResponse(res, {
      statusCode: HttpStatusCode.OK,
      success: true,
      message: "Questions retrieved successfully",
      data: questions,
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
