import { envConfig } from "../../config";
import { successResponse } from "../utils/helpers";

const port = envConfig.app.port;

export const healthPaths = {
  "/": {
    servers: [
      { url: `http://localhost:${port}`, description: "Application root" },
    ],
    get: {
      tags: ["Health"],
      summary: "Health check",
      description:
        "Returns application health status. This endpoint is mounted at the application root, not under /api/v1.",
      operationId: "healthCheck",
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
