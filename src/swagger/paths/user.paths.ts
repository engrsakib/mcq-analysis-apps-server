import { commonResponses } from "../components/responses";
import { securityRequirements } from "../components/security";
import { jsonRequestBody, successResponse } from "../utils/helpers";

export const userPaths = {
  "/user": {
    post: {
      tags: ["User"],
      summary: "Register user",
      description:
        "Creates a new user account and sends verification OTP via SMS",
      operationId: "createUser",
      security: securityRequirements.public,
      requestBody: jsonRequestBody(
        "#/components/schemas/CreateUserRequest",
        "User registration payload"
      ),
      responses: {
        "201": successResponse(201, "User account created"),
        "400": commonResponses.ValidationError,
        "409": commonResponses.Conflict,
      },
    },
    get: {
      tags: ["User"],
      summary: "Get all customers",
      description:
        "Retrieves paginated list of users. Requires VIEW_STUDENT permission.",
      operationId: "getAllCustomers",
      security: securityRequirements.authenticated,
      parameters: [
        { name: "page", in: "query", schema: { type: "integer", default: 1 } },
        { name: "limit", in: "query", schema: { type: "integer", default: 5 } },
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
        "200": successResponse(200, "Customers retrieved", {
          $ref: "#/components/schemas/PaginatedResponse",
        }),
        "401": commonResponses.Unauthorized,
        "403": commonResponses.Forbidden,
      },
    },
  },
  "/user/save-token": {
    post: {
      tags: ["User"],
      summary: "Save FCM token",
      description:
        "Saves Firebase Cloud Messaging token for push notifications",
      operationId: "saveFcmToken",
      security: securityRequirements.authenticated,
      requestBody: jsonRequestBody(
        "#/components/schemas/SaveFcmTokenRequest",
        "FCM token payload"
      ),
      responses: {
        "200": successResponse(200, "FCM token saved"),
        "401": commonResponses.Unauthorized,
      },
    },
  },
  "/user/self": {
    patch: {
      tags: ["User"],
      summary: "Update own profile",
      description: "Updates the authenticated user's own profile",
      operationId: "updateSelf",
      security: securityRequirements.authenticated,
      requestBody: jsonRequestBody(
        "#/components/schemas/UpdateUserRequest",
        "Profile update payload"
      ),
      responses: {
        "200": successResponse(200, "Profile updated", {
          $ref: "#/components/schemas/User",
        }),
        "400": commonResponses.ValidationError,
        "401": commonResponses.Unauthorized,
      },
    },
  },
  "/user/auth": {
    get: {
      tags: ["User"],
      summary: "Get logged-in user",
      operationId: "getLoggedInUser",
      security: securityRequirements.authenticated,
      responses: {
        "200": successResponse(200, "User retrieved", {
          $ref: "#/components/schemas/User",
        }),
        "401": commonResponses.Unauthorized,
      },
    },
  },
  "/user/{id}": {
    get: {
      tags: ["User"],
      summary: "Get user by ID",
      operationId: "getUserById",
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
        "200": successResponse(200, "User retrieved", {
          $ref: "#/components/schemas/User",
        }),
        "401": commonResponses.Unauthorized,
        "404": commonResponses.NotFound,
        "410": {
          description: "User has been deleted",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ApiResponse" },
            },
          },
        },
      },
    },
    patch: {
      tags: ["User"],
      summary: "Update user by admin",
      description: "Updates a user. Requires UPDATE_STUDENT permission.",
      operationId: "updateUser",
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
        "#/components/schemas/UpdateUserRequest",
        "User update payload"
      ),
      responses: {
        "200": successResponse(200, "User updated", {
          $ref: "#/components/schemas/User",
        }),
        "400": commonResponses.ValidationError,
        "401": commonResponses.Unauthorized,
        "403": commonResponses.Forbidden,
      },
    },
    delete: {
      tags: ["User"],
      summary: "Delete user",
      description: "Soft-deletes a user. Requires DELETE_STUDENT permission.",
      operationId: "deleteUser",
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
        "200": successResponse(200, "User deleted"),
        "401": commonResponses.Unauthorized,
        "403": commonResponses.Forbidden,
      },
    },
  },
  "/user/create-user-by-admin": {
    post: {
      tags: ["User"],
      summary: "Create user by admin",
      operationId: "createUserByAdmin",
      security: securityRequirements.public,
      requestBody: jsonRequestBody(
        "#/components/schemas/CreateUserRequest",
        "User creation payload"
      ),
      responses: {
        "201": successResponse(201, "User created by admin"),
        "400": commonResponses.ValidationError,
        "409": commonResponses.Conflict,
      },
    },
  },
  "/user/verify": {
    post: {
      tags: ["User"],
      summary: "Verify user account",
      operationId: "verifyUserAccount",
      security: securityRequirements.public,
      requestBody: jsonRequestBody(
        "#/components/schemas/OtpVerifyRequest",
        "OTP verification payload"
      ),
      responses: {
        "200": successResponse(200, "Account verified and logged in"),
        "400": commonResponses.ValidationError,
      },
    },
  },
  "/user/resend-otp": {
    post: {
      tags: ["User"],
      summary: "Resend user verification OTP",
      operationId: "resendUserVerificationOtp",
      security: securityRequirements.public,
      requestBody: jsonRequestBody(
        "#/components/schemas/OtpResendRequest",
        "Phone number for OTP resend"
      ),
      responses: {
        "200": successResponse(200, "OTP resent"),
        "400": commonResponses.ValidationError,
      },
    },
  },
  "/user/login": {
    post: {
      tags: ["User"],
      summary: "User login",
      operationId: "userLogin",
      security: securityRequirements.public,
      requestBody: jsonRequestBody(
        "#/components/schemas/LoginRequest",
        "Login credentials"
      ),
      responses: {
        "200": successResponse(200, "Login successful", {
          allOf: [
            { $ref: "#/components/schemas/User" },
            { $ref: "#/components/schemas/AuthTokens" },
          ],
        }),
        "400": commonResponses.ValidationError,
        "401": commonResponses.Unauthorized,
      },
    },
  },
  "/user/reset-password": {
    patch: {
      tags: ["User"],
      summary: "Reset user password",
      operationId: "resetUserPassword",
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
  "/user/change-password": {
    patch: {
      tags: ["User"],
      summary: "Change user password",
      operationId: "changeUserPassword",
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
  "/user/logout": {
    delete: {
      tags: ["User"],
      summary: "User logout",
      operationId: "userLogout",
      security: securityRequirements.public,
      responses: {
        "200": successResponse(200, "Logged out"),
      },
    },
  },
};
