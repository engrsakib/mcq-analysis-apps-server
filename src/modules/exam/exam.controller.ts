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

  getAllExamsForUsers = this.catchAsync(async (req: Request, res: Response) => {
    const query = req.query;
    const userId = req.user.id;
    const exams = await examService.getAllExamsForUsers(query, userId);

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

  // getExamByIdForUsers = this.catchAsync(async (req: Request, res: Response) => {
  //   const id = req.params.id;
  //   if (!id) {
  //     return this.sendResponse(res, {
  //       statusCode: HttpStatusCode.BAD_REQUEST,
  //       success: false,
  //       message: "Guideline entry ID is required",
  //     });
  //   }
  //   const exam = await examService.getExamByIdForUsers(id);
  //   this.sendResponse(res, {
  //     statusCode: HttpStatusCode.OK,
  //     success: true,
  //     message: "Exam entry retrieved successfully",
  //     data: exam, // Replace with actual data
  //   });
  // });

  getExamByIdForUsers = this.catchAsync(async (req: Request, res: Response) => {
    const id = req.params.id;

    // ১. মেসেজ ঠিক করা হলো
    if (!id) {
      return this.sendResponse(res, {
        statusCode: HttpStatusCode.BAD_REQUEST,
        success: false,
        message: "Exam ID is required",
      });
    }

    const exam = await examService.getExamByIdForUsers(id);

    // ২. ডাটাবেজে এক্সাম না থাকলে ৪MD৪ (NOT_FOUND) হ্যান্ডেল করার লজিক
    if (!exam) {
      return this.sendResponse(res, {
        statusCode: HttpStatusCode.NOT_FOUND,
        success: false,
        message: "Exam not found with the provided ID",
      });
    }

    // ৩. সাকসেস রেসপন্স
    this.sendResponse(res, {
      statusCode: HttpStatusCode.OK,
      success: true,
      message: "Exam entry retrieved successfully",
      data: exam,
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

  // get upcoming exams for users controller
  getUpcomingExamsForUsers = this.catchAsync(
    async (req: Request, res: Response) => {
      const query = req.query;
      const exams = await examService.getUpcomingExamsForUsers(query);

      this.sendResponse(res, {
        statusCode: HttpStatusCode.OK,
        success: true,
        message: "Upcoming exam entries retrieved successfully",
        data: exams,
      });
    }
  );

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

  updateStatus = this.catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;
    const updateData = req.body;

    const allowedUpdates = ["is_published", "is_started", "is_completed"];
    const updates = Object.keys(updateData);

    const isValidOperation = updates.every((field) =>
      allowedUpdates.includes(field)
    );

    if (!isValidOperation) {
      return this.sendResponse(res, {
        statusCode: HttpStatusCode.BAD_REQUEST,
        success: false,
        message:
          "Invalid updates! You can only update: is_published, is_started, is_completed",
      });
    }

    const result = await examService.updateExamStatus(id, updateData);

    this.sendResponse(res, {
      statusCode: HttpStatusCode.OK,
      success: true,
      message: "Exam status updated successfully",
      data: result,
    });
  });
}

export const ExamController = new Controller();
