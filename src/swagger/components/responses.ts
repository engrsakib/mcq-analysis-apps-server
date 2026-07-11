export const commonResponses = {
  ValidationError: {
    description: "Validation Error",
    content: {
      "application/json": {
        schema: { $ref: "#/components/schemas/ErrorResponse" },
        example: {
          statusCode: 400,
          success: false,
          message: "Validation Error",
          errorMessages: [
            { path: "phone_number", message: "Phone number must be provided" },
          ],
        },
      },
    },
  },
  Unauthorized: {
    description: "Unauthenticated access",
    content: {
      "application/json": {
        schema: { $ref: "#/components/schemas/ErrorResponse" },
        example: {
          statusCode: 401,
          success: false,
          message: "Unauthenticated access. Please login to access resource(s)",
          errorMessages: [
            {
              path: "",
              message:
                "Unauthenticated access. Please login to access resource(s)",
            },
          ],
        },
      },
    },
  },
  Forbidden: {
    description: "Forbidden - insufficient role or permission",
    content: {
      "application/json": {
        schema: { $ref: "#/components/schemas/ErrorResponse" },
        example: {
          statusCode: 403,
          success: false,
          message: "Forbidden: Permission denied",
          errorMessages: [
            { path: "", message: "Forbidden: Permission denied" },
          ],
        },
      },
    },
  },
  NotFound: {
    description: "Resource not found",
    content: {
      "application/json": {
        schema: { $ref: "#/components/schemas/ErrorResponse" },
        example: {
          statusCode: 404,
          success: false,
          message: "Not Found",
          errorMessages: [
            { path: "/api/v1/example", message: "API Not Found" },
          ],
        },
      },
    },
  },
  Conflict: {
    description: "Duplicate resource",
    content: {
      "application/json": {
        schema: { $ref: "#/components/schemas/ErrorResponse" },
        example: {
          statusCode: 409,
          success: false,
          message: "Duplicate field value",
          errorMessages: [
            { path: "phone_number", message: "phone_number already exists" },
          ],
        },
      },
    },
  },
  InternalServerError: {
    description: "Internal server error",
    content: {
      "application/json": {
        schema: { $ref: "#/components/schemas/ErrorResponse" },
        example: {
          statusCode: 500,
          success: false,
          message: "Something went wrong",
          errorMessages: [],
        },
      },
    },
  },
};
