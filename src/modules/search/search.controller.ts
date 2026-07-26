import { Request, Response } from "express";
import BaseController from "@/shared/baseController";
import { HttpStatusCode } from "@/lib/httpStatus";
import { searchService } from "./search.service";

class Controller extends BaseController {
  globalSearch = this.catchAsync(async (req: Request, res: Response) => {
    const { q, page, limit } = req.query as {
      q: string;
      page?: string;
      limit?: string;
    };

    const results = await searchService.globalSearch(
      {
        q,
        page: page ? Number(page) : 1,
        limit: limit ? Number(limit) : 10,
      },
      req.user
    );

    this.sendResponse(res, {
      statusCode: HttpStatusCode.OK,
      success: true,
      message: "Search results retrieved successfully",
      data: results,
    });
  });
}

export const SearchController = new Controller();
