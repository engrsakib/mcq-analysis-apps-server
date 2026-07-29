import { commonResponses } from "../components/responses";
import { securityRequirements } from "../components/security";
import { jsonRequestBody, successResponse } from "../utils/helpers";

export const adminPaths = {
  "/admin/create": {
    post: {
      tags: ["Admin"],
      summary: "Create admin by admin",
      description:
        "Creates a new staff/admin account. Requires authentication and CREATE_STAFF permission.",
      operationId: "createAdminByAdmin",
      security: securityRequirements.authenticated,
      requestBody: jsonRequestBody(
        "#/components/schemas/CreateAdminRequest",
        "Admin creation payload"
      ),
      responses: {
        "201": successResponse(201, "Admin created successfully", {
          $ref: "#/components/schemas/Admin",
        }),
        "400": commonResponses.ValidationError,
        "401": commonResponses.Unauthorized,
        "403": commonResponses.Forbidden,
        "409": commonResponses.Conflict,
      },
    },
  },
  "/admin/login": {
    post: {
      tags: ["Admin"],
      summary: "Admin login",
      description:
        "Authenticates admin with phone number and password. Sets access and refresh tokens as HTTP-only cookies.",
      operationId: "adminLogin",
      security: securityRequirements.public,
      requestBody: jsonRequestBody(
        "#/components/schemas/LoginRequest",
        "Login credentials"
      ),
      responses: {
        "200": successResponse(200, "Login successful", {
          allOf: [
            { $ref: "#/components/schemas/Admin" },
            { $ref: "#/components/schemas/AuthTokens" },
          ],
        }),
        "400": commonResponses.ValidationError,
        "401": commonResponses.Unauthorized,
      },
    },
  },
  "/admin/verify": {
    post: {
      tags: ["Admin"],
      summary: "Verify admin account",
      description: "Verifies admin account using OTP sent to phone number",
      operationId: "verifyAdminAccount",
      security: securityRequirements.public,
      requestBody: jsonRequestBody(
        "#/components/schemas/OtpVerifyRequest",
        "OTP verification payload"
      ),
      responses: {
        "200": successResponse(200, "Account verified successfully"),
        "400": commonResponses.ValidationError,
      },
    },
  },
  "/admin/resend-otp": {
    post: {
      tags: ["Admin"],
      summary: "Resend admin verification OTP",
      operationId: "resendAdminVerificationOtp",
      security: securityRequirements.public,
      requestBody: jsonRequestBody(
        "#/components/schemas/OtpResendRequest",
        "Phone number for OTP resend"
      ),
      responses: {
        "200": successResponse(200, "OTP resent successfully"),
        "400": commonResponses.ValidationError,
      },
    },
  },
  "/admin/approve": {
    post: {
      tags: ["Admin"],
      summary: "Approve admin account",
      description: "Activates an admin account pending approval",
      operationId: "approveAdminAccount",
      security: securityRequirements.public,
      requestBody: jsonRequestBody(
        "#/components/schemas/ApproveAdminRequest",
        "Admin phone number to approve"
      ),
      responses: {
        "200": successResponse(200, "Admin account activated"),
        "400": commonResponses.ValidationError,
      },
    },
  },
  "/admin/auth": {
    get: {
      tags: ["Admin"],
      summary: "Get logged-in admin",
      description: "Returns the currently authenticated admin profile",
      operationId: "getLoggedInAdmin",
      security: securityRequirements.authenticated,
      responses: {
        "200": successResponse(200, "Admin retrieved", {
          $ref: "#/components/schemas/Admin",
        }),
        "401": commonResponses.Unauthorized,
        "403": commonResponses.Forbidden,
      },
    },
  },
  "/admin": {
    get: {
      tags: ["Admin"],
      summary: "Get all admins",
      description:
        "Retrieves paginated list of admins. Requires VIEW_STAFF permission.",
      operationId: "getAllAdmins",
      security: securityRequirements.authenticated,
      parameters: [
        {
          name: "page",
          in: "query",
          schema: { type: "integer", default: 1 },
        },
        {
          name: "limit",
          in: "query",
          schema: { type: "integer", default: 5 },
        },
        {
          name: "sortBy",
          in: "query",
          schema: { type: "string", default: "createdAt" },
        },
        {
          name: "sortOrder",
          in: "query",
          schema: { type: "string", enum: ["asc", "desc"], default: "desc" },
        },
        { name: "role", in: "query", schema: { type: "string" } },
        { name: "search_query", in: "query", schema: { type: "string" } },
      ],
      responses: {
        "200": successResponse(200, "Admins retrieved", {
          $ref: "#/components/schemas/PaginatedResponse",
        }),
        "401": commonResponses.Unauthorized,
        "403": commonResponses.Forbidden,
      },
    },
  },
  "/admin/{id}": {
    get: {
      tags: ["Admin"],
      summary: "Get admin by ID",
      operationId: "getAdminById",
      security: securityRequirements.authenticated,
      parameters: [
        {
          name: "id",
          in: "path",
          required: true,
          schema: { type: "string", format: "objectId" },
        },
      ],
      responses: {
        "200": successResponse(200, "Admin retrieved", {
          $ref: "#/components/schemas/Admin",
        }),
        "401": commonResponses.Unauthorized,
        "403": commonResponses.Forbidden,
        "404": commonResponses.NotFound,
        "410": {
          description: "Admin has been deleted",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ApiResponse" },
            },
          },
        },
      },
    },
    delete: {
      tags: ["Admin"],
      summary: "Delete admin",
      description: "Soft-deletes an admin. Requires DELETE_STAFF permission.",
      operationId: "deleteAdmin",
      security: securityRequirements.authenticated,
      parameters: [
        {
          name: "id",
          in: "path",
          required: true,
          schema: { type: "string", format: "objectId" },
        },
      ],
      responses: {
        "200": successResponse(200, "Admin deleted"),
        "401": commonResponses.Unauthorized,
        "403": commonResponses.Forbidden,
      },
    },
  },
  "/admin/change-password": {
    patch: {
      tags: ["Admin"],
      summary: "Change admin password",
      description:
        "Changes password for the authenticated admin and clears auth cookies",
      operationId: "changeAdminPassword",
      security: securityRequirements.authenticated,
      requestBody: jsonRequestBody(
        "#/components/schemas/ChangePasswordRequest",
        "Password change payload"
      ),
      responses: {
        "200": successResponse(200, "Password changed"),
        "400": commonResponses.ValidationError,
        "401": commonResponses.Unauthorized,
      },
    },
  },
  "/admin/reset-password": {
    patch: {
      tags: ["Admin"],
      summary: "Reset admin password",
      description: "Resets admin password using phone number (after OTP flow)",
      operationId: "resetAdminPassword",
      security: securityRequirements.public,
      requestBody: jsonRequestBody(
        "#/components/schemas/ResetPasswordRequest",
        "Reset password payload"
      ),
      responses: {
        "200": successResponse(200, "Password reset successful"),
        "400": commonResponses.ValidationError,
      },
    },
  },
  "/admin/update-staff/{id}": {
    patch: {
      tags: ["Admin"],
      summary: "Update admin/staff",
      description: "Updates admin profile. Requires UPDATE_STAFF permission.",
      operationId: "updateAdmin",
      security: securityRequirements.authenticated,
      parameters: [
        {
          name: "id",
          in: "path",
          required: true,
          schema: { type: "string", format: "objectId" },
        },
      ],
      requestBody: jsonRequestBody(
        "#/components/schemas/UpdateAdminRequest",
        "Admin update payload"
      ),
      responses: {
        "200": successResponse(200, "Admin updated", {
          $ref: "#/components/schemas/Admin",
        }),
        "400": commonResponses.ValidationError,
        "401": commonResponses.Unauthorized,
        "403": commonResponses.Forbidden,
      },
    },
  },
  "/admin/logout": {
    delete: {
      tags: ["Admin"],
      summary: "Admin logout",
      description: "Clears authentication cookies",
      operationId: "adminLogout",
      security: securityRequirements.public,
      responses: {
        "200": successResponse(200, "Logged out successfully"),
      },
    },
  },
};
