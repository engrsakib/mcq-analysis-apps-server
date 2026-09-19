/**
 * Verifies NotificationModel writes via processNotification (admin fan-out).
 *
 * Usage: npx ts-node -r tsconfig-paths/register src/scripts/verify-notification-pipeline.ts
 */
import dotenv from "dotenv";
import path from "path";
import mongodbConnection from "../config/mongoDbConnection";
import { NotificationModel } from "../modules/notification/notification.model";
import { AdminModel } from "../modules/admin/admin.model";
import { processNotification } from "../modules/notification/notification.helpers";

dotenv.config({ path: path.join(process.cwd(), ".env") });

async function main() {
  const connected = await mongodbConnection();
  if (!connected) {
    console.error("MongoDB connection failed");
    process.exit(1);
  }

  const adminCount = await AdminModel.countDocuments({ is_Deleted: false });
  const beforeCount = await NotificationModel.countDocuments();

  console.info(`Eligible admins: ${adminCount}`);
  console.info(`Notifications before: ${beforeCount}`);

  if (adminCount === 0) {
    console.error(
      "FAIL: No eligible admins — notifyAllAdmins will skip DB inserts."
    );
    process.exit(1);
  }

  await processNotification({
    title: "Pipeline verification",
    description: "Synthetic notification from verify-notification-pipeline.ts",
    module: "exam",
    time: "Just now",
    actorName: "System",
    actorId: "system",
    action: "updated",
    entityType: "exam",
    entityId: "health-check",
    audience: "admin",
  });

  const afterCount = await NotificationModel.countDocuments();
  const inserted = afterCount - beforeCount;

  console.info(`Notifications after: ${afterCount}`);
  console.info(`Inserted delta: ${inserted}`);

  if (inserted < 1) {
    console.error(
      "FAIL: Expected at least one new notification document. Check server logs for validation errors."
    );
    process.exit(1);
  }

  console.info("OK: Notification pipeline wrote to MongoDB.");
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
