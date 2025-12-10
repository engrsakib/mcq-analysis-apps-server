import { Request, Response } from "express";
import BaseController from "@/shared/baseController";
import { HttpStatusCode } from "@/lib/httpStatus";
import { resultService } from "./result.service";

class Controller extends BaseController {
  createResult = this.catchAsync(async (req: Request, res: Response) => {
    const question = await resultService.createResult(req.body);
    this.sendResponse(res, {
      statusCode: HttpStatusCode.CREATED,
      success: true,
      message: "results submitted successfully",
      data: question,
    });
  });

  getResultsBySearch = this.catchAsync(async (req: Request, res: Response) => {
    const phone = req.query.phone as string | undefined;
    const examNum = req.query.examNum ? Number(req.query.examNum) : undefined;
    const page = req.query.page ? Number(req.query.page) : 1;
    const limit = req.query.limit ? Number(req.query.limit) : 10;
    if (!examNum) {
      this.sendResponse(res, {
        statusCode: HttpStatusCode.BAD_REQUEST,
        success: false,
        message: "Exam number is required",
      });
      return;
    }

    const results = await resultService.getResultsBySearch(
      phone,
      examNum,
      page,
      limit
    );
    this.sendResponse(res, {
      statusCode: HttpStatusCode.OK,
      success: true,
      message: "Results retrieved successfully",
      data: results,
    });
  });
}

export const ResultController = new Controller();
