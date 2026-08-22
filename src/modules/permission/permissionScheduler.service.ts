import cron from "node-cron";
import mongoose from "mongoose";
import { PermissionService } from "./permission.service";

let schedulerInitialized = false;

function isDatabaseReady(): boolean {
  return mongoose.connection.readyState === 1;
}

async function runPermissionSyncTick(): Promise<void> {
  if (!isDatabaseReady()) {
    console.warn(
      "[PermissionScheduler] Skipping sync — database is not connected."
    );
    return;
  }

  try {
    await PermissionService.syncSystemRolePermissions();
    console.info("[PermissionScheduler] System role permissions synced");
  } catch (error) {
    console.error("[PermissionScheduler] Sync tick failed:", error);
  }
}

export async function initPermissionScheduler(): Promise<void> {
  if (schedulerInitialized) {
    return;
  }

  try {
    if (isDatabaseReady()) {
      await runPermissionSyncTick();
    } else {
      console.warn(
        "[PermissionScheduler] Database not connected — skipping boot sync."
      );
    }
  } catch (error) {
    console.error("[PermissionScheduler] Boot initialization failed:", error);
  }

  // Twice daily at 00:00 and 12:00 server time.
  cron.schedule("0 0,12 * * *", () => {
    void runPermissionSyncTick();
  });

  schedulerInitialized = true;
  console.info(
    "[PermissionScheduler] Initialized — syncing system role permissions twice daily (00:00, 12:00)"
  );
}
