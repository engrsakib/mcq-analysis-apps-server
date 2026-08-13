import BaseController from "@/shared/baseController";
import { ExamRoutineService } from "./exam_routine.service";
import { Request, Response } from "express";
import { HttpStatusCode } from "@/lib/httpStatus";
import { resolveActor } from "@/modules/notification/notification.helpers";

class Controller extends BaseController {
  createExamRoutine = this.catchAsync(async (req: Request, res: Response) => {
    const routineData = req.body;
    if (!routineData) {
      return this.sendResponse(res, {
        statusCode: HttpStatusCode.BAD_REQUEST,
        success: false,
        message: "Exam routine data is required",
      });
    }
    const createdRoutine = await ExamRoutineService.createExamRoutine(
      routineData,
      resolveActor(req.user)
    );

    this.sendResponse(res, {
      statusCode: HttpStatusCode.CREATED,
      success: true,
      message: "Exam routine created successfully",
      data: createdRoutine,
    });
  });

  getAllExamRoutines = this.catchAsync(async (req: Request, res: Response) => {
    const query = req.query;
    const routines = await ExamRoutineService.getAllExamRoutines(query);
    this.sendResponse(res, {
      statusCode: HttpStatusCode.OK,
      success: true,
      message: "Exam routines retrieved successfully",
      data: routines,
    });
  });

  getAllExamRoutinesForUsers = this.catchAsync(
    async (req: Request, res: Response) => {
      const query = req.query;
      const routines =
        await ExamRoutineService.getAllExamRoutinesForUsers(query);
      this.sendResponse(res, {
        statusCode: HttpStatusCode.OK,
        success: true,
        message: "Exam routines retrieved successfully",
        data: routines,
      });
    }
  );

  getExamRoutineById = this.catchAsync(async (req: Request, res: Response) => {
    const id = req.params.id;
    if (!id) {
      return this.sendResponse(res, {
        statusCode: HttpStatusCode.BAD_REQUEST,
        success: false,
        message: "Exam routine ID is required",
      });
    }
    const routine = await ExamRoutineService.getExamRoutineById(id);
    if (!routine) {
      return this.sendResponse(res, {
        statusCode: HttpStatusCode.NOT_FOUND,
        success: false,
        message: "Exam routine not found",
      });
    }
    this.sendResponse(res, {
      statusCode: HttpStatusCode.OK,
      success: true,
      message: "Exam routine retrieved successfully",
      data: routine,
    });
  });

  updateExamRoutine = this.catchAsync(async (req: Request, res: Response) => {
    const id = req.params.id;
    const updateData = req.body;
    if (!id || !updateData) {
      return this.sendResponse(res, {
        statusCode: HttpStatusCode.BAD_REQUEST,
        success: false,
        message: "Exam routine ID and update data are required",
      });
    }

    const updatedRoutine = await ExamRoutineService.updateExamRoutineById(
      id,
      updateData,
      resolveActor(req.user)
    );
    if (!updatedRoutine) {
      return this.sendResponse(res, {
        statusCode: HttpStatusCode.NOT_FOUND,
        success: false,
        message: "Exam routine not found",
      });
    }
    this.sendResponse(res, {
      statusCode: HttpStatusCode.OK,
      success: true,
      message: "Exam routine updated successfully",
      data: updatedRoutine,
    });
  });

  reorderExamRoutines = this.catchAsync(async (req: Request, res: Response) => {
    const items = Array.isArray(req.body) ? req.body : req.body?.items;

    if (!Array.isArray(items) || !items.length) {
      return this.sendResponse(res, {
        statusCode: HttpStatusCode.BAD_REQUEST,
        success: false,
        message: "Exam routine reorder items are required",
      });
    }

    const hasInvalidItem = items.some((item) => {
      const identifier = item?.id || item?._id || item?.exam_routine_number;
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

    const result = await ExamRoutineService.reorderExamRoutines(items);

    this.sendResponse(res, {
      statusCode: HttpStatusCode.OK,
      success: true,
      message: "Exam routine order updated successfully",
      data: result,
    });
  });

  deleteExamRoutine = this.catchAsync(async (req: Request, res: Response) => {
    const id = req.params.id;
    if (!id) {
      return this.sendResponse(res, {
        statusCode: HttpStatusCode.BAD_REQUEST,
        success: false,
        message: "Exam routine ID is required",
      });
    }
    const deletedRoutine = await ExamRoutineService.deleteExamRoutineById(id);
    if (!deletedRoutine) {
      return this.sendResponse(res, {
        statusCode: HttpStatusCode.NOT_FOUND,
        success: false,
        message: "Exam routine not found",
      });
    }
    this.sendResponse(res, {
      statusCode: HttpStatusCode.OK,
      success: true,
      message: "Exam routine deleted successfully",
    });
  });

  toggleExamRoutineStatus = this.catchAsync(
    async (req: Request, res: Response) => {
      const id = req.params.id;
      if (!id) {
        return this.sendResponse(res, {
          statusCode: HttpStatusCode.BAD_REQUEST,
          success: false,
          message: "Exam routine ID is required",
        });
      }
      const toggledRoutine =
        await ExamRoutineService.toggleExamRoutineStatus(id);
      if (!toggledRoutine) {
        return this.sendResponse(res, {
          statusCode: HttpStatusCode.NOT_FOUND,
          success: false,
          message: "Exam routine not found",
        });
      }
      this.sendResponse(res, {
        statusCode: HttpStatusCode.OK,
        success: true,
        message: "Exam routine status toggled successfully",
        data: toggledRoutine,
      });
    }
  );
}

export const ExamRoutineController = new Controller();
