import mongoose from "mongoose";
import { AdminModel } from "@/modules/admin/admin.model";
import { NotificationModel } from "@/modules/notification/notification.model";

export type NotificationsHealthSnapshot = {
  checked: boolean;
  dbConnected: boolean;
  lastCreatedAt: string | null;
  countLast24h: number | null;
  adminsEligible: number | null;
};

export async function getNotificationsHealth(): Promise<NotificationsHealthSnapshot> {
  const dbConnected = mongoose.connection.readyState === 1;

  if (!dbConnected) {
    return {
      checked: false,
      dbConnected: false,
      lastCreatedAt: null,
      countLast24h: null,
      adminsEligible: null,
    };
  }

  try {
    const since24h = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const [latest, countLast24h, adminsEligible] = await Promise.all([
      NotificationModel.findOne()
        .sort({ createdAt: -1 })
        .select("createdAt")
        .lean<{ createdAt?: Date } | null>(),
      NotificationModel.countDocuments({ createdAt: { $gte: since24h } }),
      AdminModel.countDocuments({ is_Deleted: false }),
    ]);

    const lastCreatedAt =
      latest?.createdAt instanceof Date
        ? latest.createdAt.toISOString()
        : latest?.createdAt
          ? String(latest.createdAt)
          : null;

    return {
      checked: true,
      dbConnected: true,
      lastCreatedAt,
      countLast24h,
      adminsEligible,
    };
  } catch {
    return {
      checked: false,
      dbConnected: true,
      lastCreatedAt: null,
      countLast24h: null,
      adminsEligible: null,
    };
  }
}
