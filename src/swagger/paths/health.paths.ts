import { envConfig } from "../../config";
import { PRODUCTION_API_BASE_URL } from "../constants";
import { securityRequirements } from "../components/security";
import { successResponse } from "../utils/helpers";

const port = envConfig.app.port;

const healthResponseExample = {
  statusCode: 200,
  success: true,
  message: "MCQ Analysis application is running...",
  data: {
    firebasePush: {
      status: "ok",
      configured: true,
      initialized: true,
      projectId: "your-project-id",
      missingEnv: [],
      googleAuthOk: true,
      googleAuthError: null,
      messagingReady: true,
    },
    fcmRegistration: {
      checked: true,
      dbConnected: true,
      usersWithToken: 0,
    },
    notifications: {
      checked: true,
      dbConnected: true,
      lastCreatedAt: "2026-01-15T10:00:00.000Z",
      countLast24h: 12,
      adminsEligible: 3,
    },
  },
};

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
        "Returns application health status including Firebase push (FCM) configuration/auth readiness and optional FCM token registration counts. HTTP 200 is always returned for uptime monitors; inspect data.firebasePush.status for push diagnostics. Mounted at the application root, not under /api/v1.",
      operationId: "healthCheck",
      security: securityRequirements.public,
      responses: {
        "200": successResponse(
          200,
          "Application is running",
          undefined,
          healthResponseExample
        ),
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
        "200": successResponse(
          200,
          "Application is running",
          undefined,
          healthResponseExample
        ),
      },
    },
  },
};
