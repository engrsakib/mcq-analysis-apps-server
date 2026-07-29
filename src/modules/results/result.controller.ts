import { Request, Response } from "express";
import BaseController from "@/shared/baseController";
import { HttpStatusCode } from "@/lib/httpStatus";
import { resultService } from "./result.service";

class Controller extends BaseController {
  createResult = this.catchAsync(async (req: Request, res: Response) => {
    const result = await resultService.createResult(req.body, req.user);
    this.sendResponse(res, {
      statusCode: HttpStatusCode.CREATED,
      success: true,
      message:
        "results submitted successfully and You can check your result after exam is completed",
      data: result,
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

  updateMarks = this.catchAsync(async (req: Request, res: Response) => {
    const { exam_number, student_phone, amount, action } = req.body;

    if (!exam_number || !student_phone || !amount || !action) {
      return this.sendResponse(res, {
        statusCode: HttpStatusCode.BAD_REQUEST,
        success: false,
        message: "Exam Number AND Student Phone both are required!",
      });
    }

    const result = await resultService.updateStudentMarks({
      exam_number,
      student_phone,
      amount,
      action,
    });

    this.sendResponse(res, {
      statusCode: HttpStatusCode.OK,
      success: true,
      message: "Marks updated successfully",
      data: result,
    });
  });

  getResultByExamNumber = this.catchAsync(
    async (req: Request, res: Response) => {
      const examNum = Number(req.params.exam_number);
      const phone = req.query.phone as string | undefined;

      const result = await resultService.getSingleResultByExamNumber(
        examNum,
        phone
      );

      this.sendResponse(res, {
        statusCode: HttpStatusCode.OK,
        success: true,
        message: "Result retrieved successfully",
        data: result,
      });
    }
  );

  getExamLeaderboard = this.catchAsync(async (req: Request, res: Response) => {
    const loggedInUserPhone = req.user.phone_number;
    const examNum = Number(req.params.exam_number);
    const query = req.query;

    console.log(loggedInUserPhone, "logged");

    const result = await resultService.getExamLeaderboard(
      loggedInUserPhone,
      examNum,
      query,
      req.user.role
    );

    this.sendResponse(res, {
      statusCode: HttpStatusCode.OK,
      success: true,
      message: "Leaderboard retrieved successfully",
      data: result,
    });
  });

  getMeritListForExport = this.catchAsync(
    async (req: Request, res: Response) => {
      const examNum = Number(req.params.exam_number);
      const from = req.query.from ? Number(req.query.from) : 1;
      const to = req.query.to ? Number(req.query.to) : undefined;
      const includePhone = req.query.includePhone !== "false";
      const phoneMode =
        req.query.phoneMode === "full" ? "full" : ("half" as const);

      if (!examNum || Number.isNaN(examNum)) {
        return this.sendResponse(res, {
          statusCode: HttpStatusCode.BAD_REQUEST,
          success: false,
          message: "Valid exam number is required",
        });
      }

      if (!to || Number.isNaN(to)) {
        return this.sendResponse(res, {
          statusCode: HttpStatusCode.BAD_REQUEST,
          success: false,
          message: "Merit range 'to' is required",
        });
      }

      if (from < 1 || to < from) {
        return this.sendResponse(res, {
          statusCode: HttpStatusCode.BAD_REQUEST,
          success: false,
          message:
            "Invalid merit range. 'from' must be >= 1 and 'to' must be >= 'from'",
        });
      }

      if (to - from > 5000) {
        return this.sendResponse(res, {
          statusCode: HttpStatusCode.BAD_REQUEST,
          success: false,
          message: "Merit range cannot exceed 5000 positions",
        });
      }

      const result = await resultService.getMeritListForExport(
        examNum,
        from,
        to,
        includePhone,
        phoneMode,
        req.user.role
      );

      this.sendResponse(res, {
        statusCode: HttpStatusCode.OK,
        success: true,
        message: "Merit list retrieved successfully",
        data: result,
      });
    }
  );
}

export const ResultController = new Controller();
