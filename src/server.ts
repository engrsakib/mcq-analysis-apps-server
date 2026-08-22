import { Server } from "http";
import app from "./app";
import { envConfig } from "./config";
import mongodbConnection from "./config/mongoDbConnection";
import { connectRedis } from "./config/redis";
import { initExamScheduler } from "./modules/exam/examScheduler.service";
import { initPermissionScheduler } from "./modules/permission/permissionScheduler.service";
import { PermissionService } from "./modules/permission/permission.service";

process.on("uncaughtException", (error) => {
  console.error(`Uncaught Exception: ${error.message}`, { stack: error.stack });
  process.exit(1);
});

let server: Server;
const port = envConfig.app.port;

async function main() {
  // Safety: isolate boot-time DB work so one failure does not exit the whole process.
  try {
    const connected = await mongodbConnection();
    if (!connected) {
      console.warn(
        "Server starting without an active MongoDB connection. API routes that need the database will fail until MONGODB_URL is configured."
      );
    }
  } catch (error: any) {
    console.error(`MongoDB boot initialization failed: ${error?.message}`, {
      stack: error?.stack,
    });
  }

  try {
    await connectRedis();
  } catch (error: any) {
    console.error(`Redis boot initialization failed: ${error?.message}`, {
      stack: error?.stack,
    });
  }

  try {
    await initExamScheduler();
  } catch (error: any) {
    console.error(
      `Exam scheduler boot initialization failed: ${error?.message}`,
      {
        stack: error?.stack,
      }
    );
  }

  try {
    await PermissionService.syncSystemRolePermissions();
  } catch (error: any) {
    console.error(
      `Permission sync boot initialization failed: ${error?.message}`,
      {
        stack: error?.stack,
      }
    );
  }

  try {
    await initPermissionScheduler();
  } catch (error: any) {
    console.error(
      `Permission scheduler boot initialization failed: ${error?.message}`,
      {
        stack: error?.stack,
      }
    );
  }

  try {
    server = app.listen(port, () => {
      console.info(`🚀 Application is running on port ${port}`);
    });
  } catch (error: any) {
    console.error(`❌ Failed to bind HTTP server: ${error.message}`, {
      stack: error.stack,
    });
    process.exit(1);
  }

  process.on("unhandledRejection", (error: any) => {
    // Safety: log background job failures without terminating the process.
    console.error(`Unhandled Promise Rejection: ${error?.message}`, {
      stack: error?.stack,
    });
  });
}

main();

process.on("SIGTERM", () => {
  console.warn("SIGTERM received. Shutting down gracefully...");
  if (server) {
    server.close(() => {
      console.info("Server closed.");
    });
  }
});
