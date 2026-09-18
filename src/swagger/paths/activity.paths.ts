import { commonResponses } from "../components/responses";
import { securityRequirements } from "../components/security";
import { jsonRequestBody, successResponse } from "../utils/helpers";

export const activityPaths = {
  "/activity": {
    get: {
      tags: ["Activity"],
      summary: "List activity logs (admin)",
      operationId: "getActivityLogs",
      security: securityRequirements.authenticated,
      parameters: [
        { name: "page", in: "query", schema: { type: "integer", default: 1 } },
        {
          name: "limit",
          in: "query",
          schema: { type: "integer", default: 10 },
        },
        { name: "search", in: "query", schema: { type: "string" } },
        { name: "module", in: "query", schema: { type: "string" } },
        { name: "action", in: "query", schema: { type: "string" } },
        {
          name: "dateFrom",
          in: "query",
          schema: { type: "string", format: "date" },
        },
        {
          name: "dateTo",
          in: "query",
          schema: { type: "string", format: "date" },
        },
        {
          name: "sortBy",
          in: "query",
          schema: { type: "string", enum: ["createdAt", "actorName"] },
        },
        {
          name: "sortOrder",
          in: "query",
          schema: { type: "string", enum: ["asc", "desc"] },
        },
      ],
      responses: {
        "200": successResponse(200, "Activity logs retrieved", {
          $ref: "#/components/schemas/PaginatedResponse",
        }),
        "401": commonResponses.Unauthorized,
        "403": commonResponses.Forbidden,
      },
    },
  },
  "/activity/me": {
    get: {
      tags: ["Activity"],
      summary: "List my activity logs",
      operationId: "getMyActivityLogs",
      security: securityRequirements.authenticated,
      parameters: [
        { name: "page", in: "query", schema: { type: "integer", default: 1 } },
        {
          name: "limit",
          in: "query",
          schema: { type: "integer", default: 20 },
        },
        { name: "module", in: "query", schema: { type: "string" } },
        { name: "action", in: "query", schema: { type: "string" } },
        {
          name: "dateFrom",
          in: "query",
          schema: { type: "string", format: "date" },
        },
        {
          name: "dateTo",
          in: "query",
          schema: { type: "string", format: "date" },
        },
      ],
      responses: {
        "200": successResponse(200, "My activity logs retrieved", {
          $ref: "#/components/schemas/PaginatedResponse",
        }),
        "401": commonResponses.Unauthorized,
      },
    },
  },
  "/activity/me/exam-started": {
    post: {
      tags: ["Activity"],
      summary: "Record exam started for current user",
      operationId: "recordExamStarted",
      security: securityRequirements.authenticated,
      requestBody: jsonRequestBody(
        "#/components/schemas/RecordExamStartedRequest",
        "Exam session start payload"
      ),
      responses: {
        "201": successResponse(201, "Exam started recorded", {
          type: "object",
        }),
        "400": commonResponses.ValidationError,
        "401": commonResponses.Unauthorized,
        "404": commonResponses.NotFound,
      },
    },
  },
};
