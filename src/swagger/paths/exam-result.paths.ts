import { commonResponses } from "../components/responses";
import { securityRequirements } from "../components/security";
import { jsonRequestBody, successResponse } from "../utils/helpers";

const paginationParams = [
  { name: "page", in: "query", schema: { type: "integer", default: 1 } },
  { name: "limit", in: "query", schema: { type: "integer", default: 10 } },
  { name: "searchTerm", in: "query", schema: { type: "string" } },
];

const objectIdParam = {
  name: "id",
  in: "path",
  required: true,
  schema: { type: "string", format: "objectId" },
};

export const examPaths = {
  "/exam/exam-search": {
    get: {
      tags: ["Exam"],
      summary: "Search exams by name",
      description: "Searches exams by exam_name query parameter",
      operationId: "getExamForSearch",
      security: securityRequirements.authenticated,
      parameters: [
        {
          name: "exam_name",
          in: "query",
          schema: { type: "string" },
          description: "Exam name search term",
        },
      ],
      responses: {
        "200": successResponse(200, "Exams retrieved", {
          type: "array",
          items: { $ref: "#/components/schemas/Exam" },
        }),
        "401": commonResponses.Unauthorized,
      },
    },
  },
  "/exam": {
    post: {
      tags: ["Exam"],
      summary: "Create exam",
      description: "Creates a new exam with auto-generated exam_number",
      operationId: "createExam",
      requestBody: jsonRequestBody(
        "#/components/schemas/CreateExamRequest",
        "Exam creation payload"
      ),
      responses: {
        "201": successResponse(201, "Exam created", {
          $ref: "#/components/schemas/Exam",
        }),
        "400": commonResponses.ValidationError,
      },
    },
    get: {
      tags: ["Exam"],
      summary: "Get all exams (admin)",
      description: "Retrieves paginated exams. Requires VIEW_EXAM permission.",
      operationId: "getAllExams",
      security: securityRequirements.authenticated,
      parameters: paginationParams,
      responses: {
        "200": successResponse(200, "Exams retrieved", {
          $ref: "#/components/schemas/PaginatedResponse",
        }),
        "401": commonResponses.Unauthorized,
        "403": commonResponses.Forbidden,
      },
    },
  },
  "/exam/user": {
    get: {
      tags: ["Exam"],
      summary: "Get all exams for users",
      description:
        "Retrieves published exams for authenticated users. Each item includes isSubmitted (per-user) and is_completed (admin exam status).",
      operationId: "getAllExamsForUsers",
      security: securityRequirements.authenticated,
      parameters: paginationParams,
      responses: {
        "200": successResponse(200, "Exam entries retrieved successfully", {
          $ref: "#/components/schemas/UserExamPaginatedResponse",
        }),
        "401": commonResponses.Unauthorized,
        "404": commonResponses.NotFound,
      },
    },
  },
  "/exam/upcoming": {
    get: {
      tags: ["Exam"],
      summary: "Get upcoming exams",
      description: "Retrieves upcoming published exams that have not started",
      operationId: "getUpcomingExamsForUsers",
      parameters: paginationParams,
      responses: {
        "200": successResponse(200, "Upcoming exams retrieved", {
          $ref: "#/components/schemas/PaginatedResponse",
        }),
      },
    },
  },
  "/exam/user/{id}": {
    get: {
      tags: ["Exam"],
      summary: "Get exam by ID for users",
      description: "Retrieves a single exam with questions for end users",
      operationId: "getExamByIdForUsers",
      parameters: [objectIdParam],
      responses: {
        "200": successResponse(200, "Exam retrieved", {
          $ref: "#/components/schemas/Exam",
        }),
        "404": commonResponses.NotFound,
      },
    },
  },
  "/exam/{id}": {
    get: {
      tags: ["Exam"],
      summary: "Get exam by ID",
      operationId: "getExamById",
      parameters: [objectIdParam],
      responses: {
        "200": successResponse(200, "Exam retrieved", {
          $ref: "#/components/schemas/Exam",
        }),
      },
    },
    put: {
      tags: ["Exam"],
      summary: "Update exam",
      description: "Updates an exam. Requires UPDATE_EXAM permission.",
      operationId: "updateExamById",
      security: securityRequirements.authenticated,
      parameters: [objectIdParam],
      requestBody: jsonRequestBody(
        "#/components/schemas/UpdateExamRequest",
        "Exam update payload"
      ),
      responses: {
        "200": successResponse(200, "Exam updated", {
          $ref: "#/components/schemas/Exam",
        }),
        "400": commonResponses.ValidationError,
        "401": commonResponses.Unauthorized,
        "403": commonResponses.Forbidden,
      },
    },
    delete: {
      tags: ["Exam"],
      summary: "Delete exam",
      description: "Deletes an exam. Requires DELETE_EXAM permission.",
      operationId: "deleteExamById",
      security: securityRequirements.authenticated,
      parameters: [objectIdParam],
      responses: {
        "200": successResponse(200, "Exam deleted"),
        "401": commonResponses.Unauthorized,
        "403": commonResponses.Forbidden,
      },
    },
    patch: {
      tags: ["Exam"],
      summary: "Update exam status",
      description:
        "Updates exam status flags (is_published, is_started, is_completed). Requires UPDATE_EXAM permission.",
      operationId: "updateExamStatus",
      security: securityRequirements.authenticated,
      parameters: [objectIdParam],
      requestBody: jsonRequestBody(
        "#/components/schemas/UpdateExamStatusRequest",
        "Status update payload"
      ),
      responses: {
        "200": successResponse(200, "Exam status updated", {
          $ref: "#/components/schemas/Exam",
        }),
        "400": commonResponses.ValidationError,
        "401": commonResponses.Unauthorized,
        "403": commonResponses.Forbidden,
      },
    },
  },
};

export const resultPaths = {
  "/results": {
    post: {
      tags: ["Result"],
      summary: "Submit exam result",
      description: "Submits a student's exam result",
      operationId: "createResult",
      security: securityRequirements.authenticated,
      requestBody: jsonRequestBody(
        "#/components/schemas/CreateResultRequest",
        "Result submission payload"
      ),
      responses: {
        "201": successResponse(201, "Result submitted", {
          $ref: "#/components/schemas/Result",
        }),
        "401": commonResponses.Unauthorized,
      },
    },
    get: {
      tags: ["Result"],
      summary: "Search results",
      description:
        "Searches results by phone and exam number with pagination. examNum query param is required.",
      operationId: "getResultsBySearch",
      security: securityRequirements.authenticated,
      parameters: [
        { name: "phone", in: "query", schema: { type: "string" } },
        {
          name: "examNum",
          in: "query",
          required: true,
          schema: { type: "integer" },
          description: "Exam number (required)",
        },
        { name: "page", in: "query", schema: { type: "integer", default: 1 } },
        {
          name: "limit",
          in: "query",
          schema: { type: "integer", default: 10 },
        },
      ],
      responses: {
        "200": successResponse(200, "Results retrieved", {
          $ref: "#/components/schemas/PaginatedResponse",
        }),
        "400": commonResponses.ValidationError,
        "401": commonResponses.Unauthorized,
      },
    },
  },
  "/results/update-marks": {
    patch: {
      tags: ["Result"],
      summary: "Update student marks",
      description:
        "Increases or decreases marks for a student's written exam answers",
      operationId: "updateMarks",
      requestBody: jsonRequestBody(
        "#/components/schemas/UpdateMarksRequest",
        "Mark update payload"
      ),
      responses: {
        "200": successResponse(200, "Marks updated", {
          $ref: "#/components/schemas/Result",
        }),
        "400": commonResponses.ValidationError,
      },
    },
  },
  "/results/{exam_number}": {
    get: {
      tags: ["Result"],
      summary: "Get result by exam number",
      description:
        "Retrieves a single result for an exam, optionally filtered by phone",
      operationId: "getResultByExamNumber",
      parameters: [
        {
          name: "exam_number",
          in: "path",
          required: true,
          schema: { type: "integer" },
        },
        { name: "phone", in: "query", schema: { type: "string" } },
      ],
      responses: {
        "200": successResponse(200, "Result retrieved", {
          $ref: "#/components/schemas/Result",
        }),
      },
    },
  },
  "/results/{exam_number}/leaderboard": {
    get: {
      tags: ["Result"],
      summary: "Get exam leaderboard",
      description:
        "Retrieves paginated leaderboard for an exam including current user's rank",
      operationId: "getExamLeaderboard",
      security: securityRequirements.authenticated,
      parameters: [
        {
          name: "exam_number",
          in: "path",
          required: true,
          schema: { type: "integer" },
        },
        { name: "page", in: "query", schema: { type: "integer", default: 1 } },
        {
          name: "limit",
          in: "query",
          schema: { type: "integer", default: 10 },
        },
      ],
      responses: {
        "200": successResponse(200, "Leaderboard retrieved", {
          type: "object",
          properties: {
            meta: { $ref: "#/components/schemas/PaginationMeta" },
            current_user: { $ref: "#/components/schemas/LeaderboardEntry" },
            data: {
              type: "array",
              items: { $ref: "#/components/schemas/LeaderboardEntry" },
            },
          },
        }),
        "401": commonResponses.Unauthorized,
      },
    },
  },
};
