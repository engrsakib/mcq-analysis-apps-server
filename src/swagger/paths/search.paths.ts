import { commonResponses } from "../components/responses";
import { securityRequirements } from "../components/security";
import { successResponse } from "../utils/helpers";

const globalSearchParams = [
  {
    name: "q",
    in: "query",
    required: true,
    schema: { type: "string", minLength: 1, maxLength: 100 },
    description:
      "Search keyword matched against exam_name, title, and related content fields",
    example: "database",
  },
  {
    name: "page",
    in: "query",
    schema: { type: "integer", minimum: 1, default: 1 },
    description: "Page number applied independently to each result group",
  },
  {
    name: "limit",
    in: "query",
    schema: { type: "integer", minimum: 1, maximum: 50, default: 10 },
    description: "Results per module group (max 50)",
  },
];

export const searchPaths = {
  "/search": {
    get: {
      tags: ["Search"],
      summary: "Global search across all content modules",
      description:
        "Searches published exams, books, YouTube videos, active study plans, and active guidelines in parallel. " +
        "Returns grouped results with per-module pagination meta. Requires JWT authentication.",
      operationId: "globalSearch",
      security: securityRequirements.authenticated,
      parameters: globalSearchParams,
      responses: {
        "200": successResponse(200, "Search results retrieved successfully", {
          $ref: "#/components/schemas/GlobalSearchResponse",
        }),
        "400": commonResponses.ValidationError,
        "401": commonResponses.Unauthorized,
      },
    },
  },
};
