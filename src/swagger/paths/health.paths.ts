import { envConfig } from "../../config";
import { PRODUCTION_API_BASE_URL } from "../constants";
import { securityRequirements } from "../components/security";
import { successResponse } from "../utils/helpers";

const port = envConfig.app.port;

export const healthPaths = {
  "/": {
    servers: [
      {
        url: `http://localhost:${port}`,
        description: "Local application root",
      },
      {
        url: PRODUCTION_API_BASE_URL,
        description: "Production application root (Render)",
      },
    ],
    get: {
      tags: ["Health"],
      summary: "Health check",
      description:
        "Returns application health status. This endpoint is mounted at the application root, not under /api/v1.",
      operationId: "healthCheck",
      security: securityRequirements.public,
      responses: {
        "200": successResponse(200, "Application is running", undefined, {
          statusCode: 200,
          success: true,
          message: "Cloudy BD application is running...",
          data: null,
        }),
      },
    },
  },
  "/health": {
    servers: [
      {
        url: `http://localhost:${port}`,
        description: "Local application root",
      },
      {
        url: PRODUCTION_API_BASE_URL,
        description: "Production application root (Render)",
      },
    ],
    get: {
      tags: ["Health"],
      summary: "Health check (uptime monitor alias)",
      description:
        "Same payload as GET /. Prefer this path for uptime monitors (Checkly, Render health checks, etc.).",
      operationId: "healthCheckAlias",
      security: securityRequirements.public,
      responses: {
        "200": successResponse(200, "Application is running", undefined, {
          statusCode: 200,
          success: true,
          message: "Cloudy BD application is running...",
          data: null,
        }),
      },
    },
  },
};
