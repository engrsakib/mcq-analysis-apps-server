/**
 * Usage: npx ts-node -r tsconfig-paths/register src/scripts/check-user-notifications.ts [userId]
 */
import dotenv from "dotenv";
import path from "path";
import mongodbConnection from "../config/mongoDbConnection";
import { NotificationModel } from "../modules/notification/notification.model";

dotenv.config({ path: path.join(process.cwd(), ".env") });

const userId = process.argv[2] ?? "6aae6606b10b4cbfe5245a81";

async function main() {
  const connected = await mongodbConnection();
  if (!connected) process.exit(1);

  const [userAudience, adminAudience, missingAudience, sampleUser] =
    await Promise.all([
      NotificationModel.countDocuments({ userId, audience: "user" }),
      NotificationModel.countDocuments({ userId, audience: "admin" }),
      NotificationModel.countDocuments({
        userId,
        audience: { $exists: false },
      }),
      NotificationModel.find({ userId, audience: "user" })
        .sort({ createdAt: -1 })
        .limit(5)
        .lean(),
    ]);

  console.info("userId:", userId);
  console.info("counts:", {
    userAudience,
    adminAudience,
    missingAudience,
  });
  console.info("sample user audience:", JSON.stringify(sampleUser, null, 2));

  const usersWithZero = await NotificationModel.aggregate([
    { $match: { audience: "user" } },
    { $group: { _id: "$userId", n: { $sum: 1 } } },
    { $count: "usersWithUserNotifications" },
  ]);
  console.info("distinct users with user notifications:", usersWithZero);

  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
