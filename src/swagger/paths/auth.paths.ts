import { commonResponses } from "../components/responses";
import { securityRequirements } from "../components/security";
import { jsonRequestBody, successResponse } from "../utils/helpers";

export const otpPaths = {
  "/otp/validate/verify": {
    post: {
      tags: ["OTP"],
      summary: "Verify OTP",
      description: "Standalone OTP verification endpoint",
      operationId: "verifyOtp",
      requestBody: jsonRequestBody(
        "#/components/schemas/OtpVerifyRequest",
        "OTP verification payload"
      ),
      responses: {
        "200": successResponse(200, "OTP verified successfully"),
        "400": commonResponses.ValidationError,
      },
    },
  },
};

export const forgetPasswordPaths = {
  "/forget-password/admin": {
    post: {
      tags: ["Forget Password"],
      summary: "Admin forget password",
      description:
        "Sends verification code to admin phone number for password reset",
      operationId: "adminForgetPassword",
      requestBody: jsonRequestBody(
        "#/components/schemas/ForgetPasswordRequest",
        "Phone number"
      ),
      responses: {
        "200": successResponse(200, "Verification code sent"),
        "400": commonResponses.ValidationError,
      },
    },
  },
  "/forget-password/user": {
    post: {
      tags: ["Forget Password"],
      summary: "User forget password",
      description:
        "Sends verification code to user phone number for password reset",
      operationId: "userForgetPassword",
      requestBody: jsonRequestBody(
        "#/components/schemas/ForgetPasswordRequest",
        "Phone number"
      ),
      responses: {
        "200": successResponse(200, "Verification code sent"),
        "400": commonResponses.ValidationError,
      },
    },
  },
};

export const uploadPaths = {
  "/upload/single": {
    post: {
      tags: ["Upload"],
      summary: "Upload single file",
      description: "Uploads a single file to AWS S3. Max file size: 100MB.",
      operationId: "uploadSingleFile",
      requestBody: {
        required: true,
        content: {
          "multipart/form-data": {
            schema: {
              type: "object",
              properties: {
                file: {
                  type: "string",
                  format: "binary",
                  description: "File to upload",
                },
              },
              required: ["file"],
            },
          },
        },
      },
      responses: {
        "200": successResponse(200, "File uploaded", {
          $ref: "#/components/schemas/UploadSingleResponse",
        }),
        "400": commonResponses.ValidationError,
      },
    },
  },
  "/upload/multiple": {
    post: {
      tags: ["Upload"],
      summary: "Upload multiple files",
      description:
        "Uploads multiple files to AWS S3. Max file size per file: 100MB.",
      operationId: "uploadMultipleFiles",
      requestBody: {
        required: true,
        content: {
          "multipart/form-data": {
            schema: {
              type: "object",
              properties: {
                files: {
                  type: "array",
                  items: { type: "string", format: "binary" },
                  description: "Files to upload",
                },
              },
              required: ["files"],
            },
          },
        },
      },
      responses: {
        "200": successResponse(200, "Files uploaded", {
          $ref: "#/components/schemas/UploadMultipleResponse",
        }),
        "400": commonResponses.ValidationError,
      },
    },
  },
};

export const permissionPaths = {
  "/permissions": {
    patch: {
      tags: ["Permissions"],
      summary: "Create or update permissions",
      description:
        "Assigns or updates permissions for an admin user. Requires MANAGE_PERMISSIONS permission.",
      operationId: "createAndUpdatePermissions",
      security: securityRequirements.authenticated,
      requestBody: jsonRequestBody(
        "#/components/schemas/UpdatePermissionsRequest",
        "Permission update payload"
      ),
      responses: {
        "200": successResponse(200, "Permissions updated", {
          type: "object",
          properties: {
            user: { $ref: "#/components/schemas/Admin" },
            permission: { $ref: "#/components/schemas/Permission" },
          },
        }),
        "400": commonResponses.ValidationError,
        "401": commonResponses.Unauthorized,
        "403": commonResponses.Forbidden,
        "404": commonResponses.NotFound,
      },
    },
  },
};
