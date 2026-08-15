class ApiError extends Error {
  statusCode: number;
  data?: Record<string, unknown>;

  constructor(
    statusCode: number,
    message: string | undefined,
    data?: Record<string, unknown>,
    stack = ""
  ) {
    super(message);
    this.statusCode = statusCode;
    this.data = data;
    if (stack) {
      this.stack = stack;
    } else {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}

export type IGenericErrorMessage = {
  path: string | number;
  message: string;
};

export default ApiError;
