import { Request, Response } from "express";
import BaseController from "@/shared/baseController";
import { HttpStatusCode } from "@/lib/httpStatus";
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { cookieManager } from "@/shared/cookie";
import { examService } from "./exam.service";

class Controller extends BaseController {
  createExam = this.catchAsync(async (req: Request, res: Response) => {
    // Implementation for creating a YouTube entry
    const examData = req.body;
    if (!examData) {
      return this.sendResponse(res, {
        statusCode: HttpStatusCode.BAD_REQUEST,
        success: false,
        message: "Exam data is required",
      });
    }
    const createdExam = await examService.createExam(examData);
    this.sendResponse(res, {
      statusCode: HttpStatusCode.CREATED,
      success: true,
      message: "Exam entry created successfully",
      data: createdExam,
    });
  });

  getAllExams = this.catchAsync(async (req: Request, res: Response) => {
    // Implementation for retrieving all Exam entries
    const query = req.query;
    const exams = await examService.getAllExams(query);

    this.sendResponse(res, {
      statusCode: HttpStatusCode.OK,
      success: true,
      message: "Exam entries retrieved successfully",
      data: exams,
    });
  });

  getExamById = this.catchAsync(async (req: Request, res: Response) => {
    const id = req.params.id;
    if (!id) {
      return this.sendResponse(res, {
        statusCode: HttpStatusCode.BAD_REQUEST,
        success: false,
        message: "Guideline entry ID is required",
      });
    }
    const exam = await examService.getExamById(id);
    this.sendResponse(res, {
      statusCode: HttpStatusCode.OK,
      success: true,
      message: "Exam entry retrieved successfully",
      data: exam, // Replace with actual data
    });
  });

  updateExamById = this.catchAsync(async (req: Request, res: Response) => {
    const id = req.params.id;
    const updateData = req.body;

    if (!id || !updateData) {
      return this.sendResponse(res, {
        statusCode: HttpStatusCode.BAD_REQUEST,
        success: false,
        message: "YouTube entry ID and update data are required",
      });
    }

    const updatedExam = await examService.updateExamById(id, updateData);

    this.sendResponse(res, {
      statusCode: HttpStatusCode.OK,
      success: true,
      message: "Exam entry updated successfully",
      data: updatedExam,
    });
  });

  deleteExamById = this.catchAsync(async (req: Request, res: Response) => {
    const id = req.params.id;
    if (!id) {
      return this.sendResponse(res, {
        statusCode: HttpStatusCode.BAD_REQUEST,
        success: false,
        message: "YouTube entry ID is required",
      });
    }
    await examService.deleteExamById(id);
    this.sendResponse(res, {
      statusCode: HttpStatusCode.OK,
      success: true,
      message: "Exam entry deleted successfully",
    });
  });

  getExamForSearch = this.catchAsync(async (req: Request, res: Response) => {
    const search = req.query.exam_name as string | undefined;

    // console.log(req, "ser")
    const exams = await examService.getExamForSearch(search);

    this.sendResponse(res, {
      statusCode: HttpStatusCode.OK,
      success: true,
      message: "Exams retrieved successfully",
      data: exams,
    });
  });

  updateStatus = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const updateData = req.body; // { is_published: true, is_started: false }

      // ১. হোয়াইটলিস্টিং (Whitelisting): শুধুমাত্র এই ফিল্ডগুলোই আপডেট করা যাবে
      const allowedUpdates = ["is_published", "is_started", "is_completed"];
      const updates = Object.keys(updateData);

      // চেক করা হচ্ছে ইউজার এমন কিছু পাঠিয়েছে কিনা যা এলাউড না
      const isValidOperation = updates.every((field) =>
        allowedUpdates.includes(field)
      );

      if (!isValidOperation) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid updates! You can only update: is_published, is_started, is_completed",
        });
      }

      // ২. সার্ভিসে কল করা
      const result = await examService.updateExamStatus(id, updateData);

      res.status(200).json({
        success: true,
        message: "Exam status updated successfully",
        data: result,
      });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  };
}

export const ExamController = new Controller();
