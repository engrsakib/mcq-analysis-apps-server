import { Request, Response } from "express";
import BaseController from "@/shared/baseController";
import { HttpStatusCode } from "@/lib/httpStatus";
import { examAttemptService } from "./exam-attempt.service";
import { parsePersonalGrowthDateRange } from "./personal-growth-range";
import { UserService } from "@/modules/user/user.service";
import { ADMIN_ROLE_VALUES } from "@/constants/roles";

class Controller extends BaseController {
  personalGrowth = this.catchAsync(async (req: Request, res: Response) => {
    const range = (req.query.range as string) || "last7";
    const startQuery = req.query.start as string | undefined;
    const endQuery = req.query.end as string | undefined;

    const parsed = parsePersonalGrowthDateRange(range, startQuery, endQuery);
    if (!parsed.ok) {
      return this.sendResponse(res, {
        statusCode: HttpStatusCode.BAD_REQUEST,
        success: false,
        message: parsed.message,
      });
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
      parsed.startDate,
      parsed.endDate
    );

    this.sendResponse(res, {
      statusCode: HttpStatusCode.OK,
      success: true,
      message: "Personal growth retrieved successfully",
      data,
    });
  });

  personalGrowthByUserId = this.catchAsync(
    async (req: Request, res: Response) => {
      const requesterRole = req.user?.role;
      if (!requesterRole || !ADMIN_ROLE_VALUES.includes(requesterRole as any)) {
        return this.sendResponse(res, {
          statusCode: HttpStatusCode.FORBIDDEN,
          success: false,
          message: "Only admins can view another user's personal growth",
        });
      }

      const userId = req.params.id;
      const range = (req.query.range as string) || "last7";
      const startQuery = req.query.start as string | undefined;
      const endQuery = req.query.end as string | undefined;

      const parsed = parsePersonalGrowthDateRange(range, startQuery, endQuery);
      if (!parsed.ok) {
        return this.sendResponse(res, {
          statusCode: HttpStatusCode.BAD_REQUEST,
          success: false,
          message: parsed.message,
        });
      }

      const user = await UserService.getUserById(userId);
      if (!user || user.is_Deleted) {
        return this.sendResponse(res, {
          statusCode: HttpStatusCode.NOT_FOUND,
          success: false,
          message: "Student not found",
        });
      }

      if (!user.phone_number) {
        return this.sendResponse(res, {
          statusCode: HttpStatusCode.BAD_REQUEST,
          success: false,
          message: "Student phone number is missing",
        });
      }

      const growth = await examAttemptService.getPersonalGrowth(
        user.phone_number,
        parsed.startDate,
        parsed.endDate
      );

      this.sendResponse(res, {
        statusCode: HttpStatusCode.OK,
        success: true,
        message: "Personal growth retrieved successfully",
        data: {
          ...growth,
          student: {
            _id: user._id,
            name: user.name,
            phone_number: user.phone_number,
            email: user.email,
          },
        },
      });
    }
  );
}

export const ExamAttemptController = new Controller();
