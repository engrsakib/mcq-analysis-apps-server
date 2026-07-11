import { commonResponses } from "../components/responses";
import { securityRequirements } from "../components/security";
import { jsonRequestBody, successResponse } from "../utils/helpers";

export const questionPaths = {
  "/question": {
    post: {
      tags: ["Question"],
      summary: "Create question",
      description:
        "Creates a new MCQ/written question. Requires CREATE_QUESTION permission.",
      operationId: "createQuestion",
      security: securityRequirements.authenticated,
      requestBody: jsonRequestBody(
        "#/components/schemas/CreateQuestionRequest",
        "Question creation payload"
      ),
      responses: {
        "201": successResponse(201, "Question created", {
          $ref: "#/components/schemas/Question",
        }),
        "401": commonResponses.Unauthorized,
        "403": commonResponses.Forbidden,
      },
    },
    get: {
      tags: ["Question"],
      summary: "Get all questions",
      description:
        "Retrieves paginated questions with search and sort. Requires VIEW_QUESTION permission.",
      operationId: "getAllQuestions",
      security: securityRequirements.authenticated,
      parameters: [
        { name: "page", in: "query", schema: { type: "integer", default: 1 } },
        {
          name: "limit",
          in: "query",
          schema: { type: "integer", default: 10 },
        },
        { name: "sortBy", in: "query", schema: { type: "string" } },
        {
          name: "sortOrder",
          in: "query",
          schema: { type: "string", enum: ["asc", "desc"] },
        },
        { name: "searchTerm", in: "query", schema: { type: "string" } },
      ],
      responses: {
        "200": successResponse(200, "Questions retrieved", {
          $ref: "#/components/schemas/PaginatedResponse",
        }),
        "401": commonResponses.Unauthorized,
        "403": commonResponses.Forbidden,
      },
    },
  },
  "/question/{id}": {
    get: {
      tags: ["Question"],
      summary: "Get question by ID",
      description:
        "Retrieves a question by its numeric questionId. Requires VIEW_QUESTION permission.",
      operationId: "getQuestionById",
      security: securityRequirements.authenticated,
      parameters: [
        {
          name: "id",
          in: "path",
          required: true,
          schema: { type: "integer" },
          description: "Numeric question ID (questionId)",
          example: 1234567890123,
        },
      ],
      responses: {
        "200": successResponse(200, "Question retrieved", {
          $ref: "#/components/schemas/Question",
        }),
        "401": commonResponses.Unauthorized,
        "403": commonResponses.Forbidden,
      },
    },
    patch: {
      tags: ["Question"],
      summary: "Update question",
      description:
        "Updates a question by ID. Requires UPDATE_QUESTION permission.",
      operationId: "updateQuestionById",
      security: securityRequirements.authenticated,
      parameters: [
        {
          name: "id",
          in: "path",
          required: true,
          schema: { type: "integer" },
        },
      ],
      requestBody: jsonRequestBody(
        "#/components/schemas/CreateQuestionRequest",
        "Question update payload"
      ),
      responses: {
        "200": successResponse(200, "Question updated", {
          $ref: "#/components/schemas/Question",
        }),
        "401": commonResponses.Unauthorized,
        "403": commonResponses.Forbidden,
      },
    },
    delete: {
      tags: ["Question"],
      summary: "Delete question",
      description:
        "Deletes a question by ID. Requires DELETE_QUESTION permission.",
      operationId: "deleteQuestionById",
      security: securityRequirements.authenticated,
      parameters: [
        {
          name: "id",
          in: "path",
          required: true,
          schema: { type: "integer" },
        },
      ],
      responses: {
        "200": successResponse(200, "Question deleted"),
        "401": commonResponses.Unauthorized,
        "403": commonResponses.Forbidden,
      },
    },
  },
};
