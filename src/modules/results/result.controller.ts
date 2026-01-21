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
      message:
        "results submitted successfully and You can check your result after exam is completed",
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
      const { exam_number, student_phone, amount, action } = req.body;

      // ১. ভ্যালিডেশন: দুটো ফিল্ডই থাকতে হবে
      if (!exam_number || !student_phone || !amount || !action) {
        return res.status(400).json({
          success: false,
          message: "Exam Number AND Student Phone both are required!",
        });
      }

      // ২. সার্ভিস কল
      const result = await resultService.updateStudentMarks({
        exam_number,
        student_phone,
        amount,
        action,
      });

      res.status(200).json({
        success: true,
        message: "Marks updated successfully",
        data: result,
      });
    } catch (error: any) {
      // এখানে 'Result not found' এররটি হ্যান্ডেল হবে
      res.status(404).json({ success: false, message: error.message });
    }
  };

  getResultByExamNumber = async (req: Request, res: Response) => {
    const examNum = Number(req.params.exam_number);
    const phone = req.query.phone as string | undefined;

    const result = await resultService.getSingleResultByExamNumber(
      examNum,
      phone
    );

    res.send({
      success: true,
      message: "Result retrieved successfully",
      data: result,
    });
  };

  getExamLeaderboard = async (req: Request, res: Response) => {
    const loggedInUserPhone = req.user.phone_number; // অথেন্টিকেশন থেকে পাওয়া ফোন
    const examNum = Number(req.params.exam_number); // প্যারামস থেকে এক্সাম নাম্বার
    const query = req.query; // পেজিনেশনের জন্য (page, limit)

    console.log(loggedInUserPhone, "logged");

    const result = await resultService.getExamLeaderboard(
      loggedInUserPhone,
      examNum,
      query
    );

    this.sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "Leaderboard retrieved successfully",
      data: result,
    });
  };
}

export const ResultController = new Controller();
