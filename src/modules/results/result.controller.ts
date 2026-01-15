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

  getResultByExamNumber = async (req: Request, res: Response) => {
    const examNum = Number(req.params.exam_number);

    const result = await resultService.getSingleResultByExamNumber(examNum);

    res.send({
      success: true,
      message: "Result retrieved successfully",
      data: result,
    });
  };

  getLeaderboard = async (req: Request, res: Response) => {
    try {
      const examNum = req.query.exam_number
        ? Number(req.query.exam_number)
        : undefined;

      if (!examNum) {
        return res.status(400).json({
          success: false,
          message: "Exam number is required",
        });
      }

      const result = await resultService.getResultLeaderboard(examNum);

      res.status(200).json({
        success: true,
        message: "Leaderboard retrieved successfully",
        data: result,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || "Something went wrong",
      });
    }
  };
}

export const ResultController = new Controller();
