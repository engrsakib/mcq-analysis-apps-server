import { envConfig } from "../config";
import { schemas } from "./components/schemas";
import { securitySchemes } from "./components/security";
import { PRODUCTION_API_BASE_URL } from "./constants";
import { healthPaths } from "./paths/health.paths";
import { apiPaths } from "./paths";

export const SWAGGER_BASE_PATH = "/api/v1/sakib/server/docs";
export const SWAGGER_JSON_PATH = "/api/v1/sakib/server/docs.json";

const port = envConfig.app.port;

const resolveApiServerUrl = (baseUrl: string): string => {
  const normalized = baseUrl.replace(/\/$/, "");
  return normalized.endsWith("/api/v1") ? normalized : `${normalized}/api/v1`;
};

const productionServerUrl = resolveApiServerUrl(PRODUCTION_API_BASE_URL);

export const openApiSpec = {
  openapi: "3.1.0",
  info: {
    title: "MCQ Analyzer API",
    version: "1.0.0",
    description:
      "Production API documentation for the MCQ Analyzer Backend (Cloudy BD). " +
      "All endpoints are prefixed with `/api/v1`. " +
      "Authentication uses JWT tokens passed in the `authorization` header (raw token value, no Bearer prefix). " +
      "Optionally pass refresh token via `x-refresh-token` header.",
    contact: {
      name: "MCQ Analyzer Team",
    },
  },
  servers: [
    {
      url: `http://localhost:${port}/api/v1`,
      description: "Local development server",
    },
    {
      url: productionServerUrl,
      description: "Production server (Render)",
    },
  ],
  tags: [
    { name: "Health", description: "Application health check" },
    { name: "Admin", description: "Admin authentication and staff management" },
    {
      name: "User",
      description: "User registration, authentication, and management",
    },
    { name: "OTP", description: "OTP verification" },
    { name: "Forget Password", description: "Password recovery" },
    { name: "Upload", description: "File upload to AWS S3" },
    { name: "Permissions", description: "Admin permission management" },
    { name: "Question", description: "MCQ and written question management" },
    { name: "Exam", description: "Exam creation and management" },
    { name: "Result", description: "Exam results and leaderboard" },
    { name: "Books", description: "Book catalog management" },
    { name: "Guideline", description: "Study guideline management" },
    { name: "YouTube", description: "YouTube video resource management" },
    { name: "Study Plan", description: "Study plan management" },
    { name: "Notification", description: "User notifications" },
    {
      name: "Search",
      description:
        "Global search across exams, books, YouTube, study plans, and guidelines",
    },
  ],
  paths: {
    ...healthPaths,
    ...apiPaths,
  },
  components: {
    securitySchemes,
    schemas,
  },
};
