/**
 * Read-only Mongo diagnostics for stale notifications collection.
 *
 * Usage: npx ts-node -r tsconfig-paths/register src/scripts/diagnose-notifications-db.ts
 */
import dotenv from "dotenv";
import path from "path";
import mongodbConnection from "../config/mongoDbConnection";
import { NotificationModel } from "../modules/notification/notification.model";
import { AdminModel } from "../modules/admin/admin.model";
import { UserModel } from "../modules/user/user.model";
import { AdminActivityLogModel } from "../modules/activity/activity.model";
import { APP_USER_ROLES } from "../constants/roles";

dotenv.config({ path: path.join(process.cwd(), ".env") });

const SINCE = new Date("2025-06-26T00:00:00.000Z");

async function main() {
  const connected = await mongodbConnection();
  if (!connected) {
    console.error("MongoDB connection failed");
    process.exit(1);
  }

  const [
    lastNotifications,
    countSinceJun26,
    adminSinceJun26,
    userSinceJun26,
    adminsEligible,
    appUsers,
    lastActivity,
  ] = await Promise.all([
    NotificationModel.find().sort({ createdAt: -1 }).limit(3).lean(),
    NotificationModel.countDocuments({ createdAt: { $gte: SINCE } }),
    NotificationModel.countDocuments({
      audience: "admin",
      createdAt: { $gte: SINCE },
    }),
    NotificationModel.countDocuments({
      audience: "user",
      createdAt: { $gte: SINCE },
    }),
    AdminModel.countDocuments({ is_Deleted: false }),
    UserModel.countDocuments({
      is_Deleted: false,
      role: { $in: [...APP_USER_ROLES] },
    }),
    AdminActivityLogModel.find().sort({ createdAt: -1 }).limit(3).lean(),
  ]);

  console.info("--- Notifications diagnostics ---");
  console.info(
    "Last 3 notifications:",
    JSON.stringify(lastNotifications, null, 2)
  );
  console.info(`Count since ${SINCE.toISOString()}:`, countSinceJun26);
  console.info("  admin audience:", adminSinceJun26);
  console.info("  user audience:", userSinceJun26);
  console.info("Eligible admins (is_Deleted: false):", adminsEligible);
  console.info("Eligible app users (student/customer):", appUsers);
  console.info("Last 3 activity logs:", JSON.stringify(lastActivity, null, 2));

  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
