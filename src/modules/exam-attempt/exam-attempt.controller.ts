import { Request, Response } from "express";
import BaseController from "@/shared/baseController";
import { HttpStatusCode } from "@/lib/httpStatus";
import { examAttemptService } from "./exam-attempt.service";

class Controller extends BaseController {
  personalGrowth = this.catchAsync(async (req: Request, res: Response) => {
    const range = (req.query.range as string) || "last7";
    const startQuery = req.query.start as string | undefined;
    const endQuery = req.query.end as string | undefined;

    let startDate: Date;
    let endDate: Date;

    // normalize end to end of day
    const endOfDay = (d: Date) =>
      new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999);

    switch (range) {
      case "last7":
        endDate = endOfDay(new Date());
        startDate = new Date();
        startDate.setDate(endDate.getDate() - 6);
        startDate = new Date(
          startDate.getFullYear(),
          startDate.getMonth(),
          startDate.getDate()
        );
        break;
      case "last15":
        endDate = endOfDay(new Date());
        startDate = new Date();
        startDate.setDate(endDate.getDate() - 14);
        startDate = new Date(
          startDate.getFullYear(),
          startDate.getMonth(),
          startDate.getDate()
        );
        break;
      case "last30":
        endDate = endOfDay(new Date());
        startDate = new Date();
        startDate.setDate(endDate.getDate() - 29);
        startDate = new Date(
          startDate.getFullYear(),
          startDate.getMonth(),
          startDate.getDate()
        );
        break;
      case "lastMonth": {
        const d = new Date();
        d.setDate(1);
        d.setMonth(d.getMonth() - 1);
        startDate = new Date(d.getFullYear(), d.getMonth(), 1);
        endDate = endOfDay(new Date(d.getFullYear(), d.getMonth() + 1, 0));
        break;
      }
      case "lastYear": {
        const d = new Date();
        const year = d.getFullYear() - 1;
        startDate = new Date(year, 0, 1);
        endDate = endOfDay(new Date(year, 11, 31));
        break;
      }
      case "custom": {
        if (!startQuery || !endQuery) {
          return this.sendResponse(res, {
            statusCode: HttpStatusCode.BAD_REQUEST,
            success: false,
            message: "Custom range requires start and end query parameters",
          });
        }
        startDate = new Date(startQuery);
        endDate = endOfDay(new Date(endQuery));
        break;
      }
      default:
        // fallback to last7
        endDate = endOfDay(new Date());
        startDate = new Date();
        startDate.setDate(endDate.getDate() - 6);
        startDate = new Date(
          startDate.getFullYear(),
          startDate.getMonth(),
          startDate.getDate()
        );
    }

    const phone = req.user?.phone_number ?? req.user?.phone ?? undefined;
    if (!phone) {
      return this.sendResponse(res, {
        statusCode: HttpStatusCode.BAD_REQUEST,
        success: false,
        message: "Unable to determine user phone_number from token",
      });
    }

    const data = await examAttemptService.getPersonalGrowth(
      phone,
      startDate,
      endDate
    );

    this.sendResponse(res, {
      statusCode: HttpStatusCode.OK,
      success: true,
      message: "Personal growth retrieved successfully",
      data,
    });
  });
}

export const ExamAttemptController = new Controller();
