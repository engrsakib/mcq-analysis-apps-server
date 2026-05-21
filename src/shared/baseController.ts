import { Response } from "express";
import catchAsync from "./catchAsync";

type IApiResponse<T> = {
  statusCode: number;
  success: boolean | string;
  message?: string | null;
  data?: T | null;
};

class BaseController {
  public model;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  constructor(model: any = "") {
    this.model = model;
  }

  catchAsync = catchAsync;

  sendResponse<T>(res: Response, data: IApiResponse<T>): void {
    const responseData: IApiResponse<T> = {
      statusCode: data.statusCode,
      success: data.success,
      message: data.message || null,
      data: data.data || null || undefined,
    };

    res.status(data.statusCode).json(responseData);
  }
}

export default BaseController;
