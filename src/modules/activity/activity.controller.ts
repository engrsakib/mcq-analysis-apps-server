import { Request, Response } from "express";
import BaseController from "@/shared/baseController";
import { HttpStatusCode } from "@/lib/httpStatus";
import { activityService } from "./activity.service";

class ActivityController extends BaseController {
  private getQueryString(req: Request, key: string): string | undefined {
    const value = req.query[key];
    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }
    return undefined;
  }

  getActivityLogs = this.catchAsync(async (req: Request, res: Response) => {
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(50, Math.max(1, Number(req.query.limit) || 10));
    const sortBy = this.getQueryString(req, "sortBy") || "createdAt";
    const sortOrder =
      this.getQueryString(req, "sortOrder") === "asc" ? "asc" : "desc";

    const result = await activityService.list(
      {
        search: this.getQueryString(req, "search"),
        module: this.getQueryString(req, "module"),
        action: this.getQueryString(req, "action"),
        dateFrom: this.getQueryString(req, "dateFrom"),
        dateTo: this.getQueryString(req, "dateTo"),
      },
      { page, limit, sortBy, sortOrder }
    );

    this.sendResponse(res, {
      statusCode: HttpStatusCode.OK,
      success: true,
      message: "Activity logs retrieved successfully",
      data: result,
    });
  });
}

export const activityController = new ActivityController();
