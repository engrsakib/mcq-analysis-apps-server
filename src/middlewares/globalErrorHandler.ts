/* eslint-disable @typescript-eslint/no-unused-vars */
import { ErrorRequestHandler, NextFunction, Request, Response } from "express";
import { ZodError, ZodIssue } from "zod";
import mongoose from "mongoose";
import ApiError, { IGenericErrorMessage } from "./error";
import { HttpStatusCode } from "@/lib/httpStatus";
import multer from "multer";

type ErrorResponse = {
  statusCode: number;
  message: string;
  errorMessages: IGenericErrorMessage[];
};

const handleZodValidationError = (error: ZodError): ErrorResponse => {
  const errorMessages: IGenericErrorMessage[] = error.issues.map(
    (issue: ZodIssue) => {
      if (issue.code === "unrecognized_keys" && (issue as any).keys) {
        const keys = (issue as any).keys;
        return {
          path: issue?.path[issue.path.length - 1] || "body",
          message: `The field(s) ${keys.map((key: string) => `'${key}'`).join(", ")} are not allowed.`,
        };
      }

      if (
        issue.code === "custom" &&
        issue.message === "At least one field is required"
      ) {
        return {
          path: issue?.path[issue.path.length - 1] || "body",
          message: "Please provide at least one field to update.",
        };
      }

      return {
        path: issue?.path[issue.path.length - 1] || "body",
        message: issue?.message,
      };
    }
  );

  return {
    statusCode: HttpStatusCode.BAD_REQUEST,
    message: "Validation Error",
    errorMessages,
  };
};

const handleApiError = (error: ApiError): ErrorResponse => ({
  statusCode: error?.statusCode || HttpStatusCode.INTERNAL_SERVER_ERROR,
  message: error.message || "Something went wrong",
  errorMessages: error?.message ? [{ path: "", message: error.message }] : [],
});

const handleGenericError = (error: Error): ErrorResponse => ({
  statusCode: HttpStatusCode.INTERNAL_SERVER_ERROR,
  message: error?.message || "Something went wrong",
  errorMessages: error?.message ? [{ path: "", message: error.message }] : [],
});

const handleCastError = (error: mongoose.Error.CastError): ErrorResponse => ({
  statusCode: HttpStatusCode.BAD_REQUEST,
  message: "Invalid MongoDB ObjectId",
  errorMessages: [{ path: error.path, message: "Invalid id!" }],
});

const handleMongodbValidationError = (
  error: mongoose.Error.ValidationError
): ErrorResponse => ({
  statusCode: HttpStatusCode.BAD_REQUEST,
  message: "Validation Error!",
  errorMessages: Object.values(error.errors).map(
    (el: mongoose.Error.ValidatorError | mongoose.Error.CastError) => ({
      path: el?.path,
      message: el?.message,
    })
  ),
});

const handleDuplicateKeyError = (
  error: mongoose.mongo.MongoServerError
): ErrorResponse => {
  const keyPattern = error.keyPattern || {};
  const fields = Object.keys(keyPattern);

  if (fields.includes("exam_number") && fields.includes("student_phone")) {
    return {
      statusCode: HttpStatusCode.CONFLICT,
      message: "You have already submitted this exam",
      errorMessages: [
        {
          path: "exam_number",
          message: "Duplicate submission for this exam",
        },
      ],
    };
  }

  const field = fields[0] || "field";

  return {
    statusCode: HttpStatusCode.CONFLICT,
    message: "Duplicate field value",
    errorMessages: [
      {
        path: field,
        message: `${field} already exists`,
      },
    ],
  };
};

const handleMulterError = (error: multer.MulterError): ErrorResponse => {
  if (error.code === "LIMIT_FILE_SIZE") {
    return {
      statusCode: HttpStatusCode.BAD_REQUEST,
      message: "Image exceeds 5MB size limit. Please upload a smaller file.",
      errorMessages: [
        {
          path: "file",
          message: "Image exceeds 5MB size limit.",
        },
      ],
    };
  }

  return {
    statusCode: HttpStatusCode.BAD_REQUEST,
    message: error.message || "File upload error.",
    errorMessages: [{ path: "file", message: error.message }],
  };
};

const normalizeError = (error: unknown): ErrorResponse => {
  if (error instanceof ZodError) {
    return handleZodValidationError(error);
  }

  if (
    error instanceof ApiError ||
    (error as ApiError)?.constructor?.name === "ApiError" ||
    ((error as ApiError)?.statusCode &&
      typeof (error as ApiError).statusCode === "number")
  ) {
    return handleApiError(error as ApiError);
  }

  if (error instanceof multer.MulterError) {
    return handleMulterError(error);
  }

  if (error instanceof mongoose.Error.CastError) {
    return handleCastError(error);
  }

  if (error instanceof mongoose.Error.ValidationError) {
    return handleMongodbValidationError(error);
  }

  if (
    error instanceof mongoose.mongo.MongoServerError &&
    error.code === 11000
  ) {
    return handleDuplicateKeyError(error);
  }

  if (error instanceof Error) {
    return handleGenericError(error);
  }

  return {
    statusCode: HttpStatusCode.INTERNAL_SERVER_ERROR,
    message: "Something went wrong",
    errorMessages: [],
  };
};

export const globalErrorHandler: ErrorRequestHandler = (
  error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { statusCode, message, errorMessages } = normalizeError(error);

  res.status(statusCode).json({
    statusCode,
    success: false,
    message,
    errorMessages,
    stack:
      process.env.NODE_ENV !== "production" && error instanceof Error
        ? error.stack
        : undefined,
  });
};

export default { globalErrorHandler };
