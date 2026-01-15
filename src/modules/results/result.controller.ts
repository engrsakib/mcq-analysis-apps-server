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

  updateMarks = async (req: Request, res: Response) => {
    try {
      // বডি থেকে ডাটা নেওয়া
      const { exam_number, amount, action } = req.body;

      // ভ্যালিডেশন: জরুরি ফিল্ড আছে কিনা চেক করা (অপশনাল কিন্তু ভালো প্র্যাকটিস)
      if (!exam_number || !amount || !action) {
        return res.status(400).json({
          success: false,
          message: "Please provide exam_number, amount, and action",
        });
      }

      // সার্ভিস কল করা
      const result = await resultService.updateStudentMarks({
        exam_number,
        amount,
        action, // 'increase_marks' or 'decrease_marks'
      });

      res.status(200).json({
        success: true,
        message: "Marks updated successfully",
        data: result,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || "Failed to update marks",
      });
    }
  };

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
      // ১. প্যারামস থেকে এক্সাম নাম্বার (বাধ্যতামূলক)
      const examNum = Number(req.params.exam_number);

      // ভ্যালিডেশন: এক্সাম নাম্বার না থাকলে এরর
      if (!examNum) {
        return res.status(400).json({
          success: false,
          message: "Exam number is required in params!",
        });
      }

      // ২. কুয়েরি থেকে ফোন নাম্বার (অপশনাল) - সার্চের জন্য
      const phone = req.query.phone as string | undefined;

      // ৩. সার্ভিস কল
      const result = await resultService.getMixedLeaderboard(examNum, phone);

      res.status(200).json({
        success: true,
        message: phone
          ? "Student result found"
          : "Leaderboard retrieved successfully",
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
