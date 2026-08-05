import { Request, Response } from "express";
import BaseController from "@/shared/baseController";
import { HttpStatusCode } from "@/lib/httpStatus";
import { StudyTopicTypeService } from "./study-topic-type.service";

class Controller extends BaseController {
  getAllTypes = this.catchAsync(async (_req: Request, res: Response) => {
    const types = await StudyTopicTypeService.getAllTypes();

    this.sendResponse(res, {
      statusCode: HttpStatusCode.OK,
      success: true,
      message: "Study topic types retrieved successfully",
      data: types,
    });
  });

  createType = this.catchAsync(async (req: Request, res: Response) => {
    const type = await StudyTopicTypeService.createType(req.body);

    this.sendResponse(res, {
      statusCode: HttpStatusCode.CREATED,
      success: true,
      message: "Study topic type created successfully",
      data: type,
    });
  });
}

export const StudyTopicTypeController = new Controller();
