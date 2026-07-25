import { Request, Response } from "express";
import BaseController from "@/shared/baseController";
import { HttpStatusCode } from "@/lib/httpStatus";
import { dashboardService } from "./dashboard.service";

class DashboardController extends BaseController {
  getStats = this.catchAsync(async (_req: Request, res: Response) => {
    const stats = await dashboardService.getStats();

    this.sendResponse(res, {
      statusCode: HttpStatusCode.OK,
      success: true,
      message: "Dashboard stats retrieved successfully",
      data: stats,
    });
  });
}

export const dashboardController = new DashboardController();
