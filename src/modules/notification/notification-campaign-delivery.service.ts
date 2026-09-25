import { appUserMatchFilter } from "@/constants/roles";
import { sendPushNotification } from "@/config/firebase/firebase.config";
import { UserModel } from "@/modules/user/user.model";
import { NotificationModuleEnum } from "./notification.interface";
import { NotificationModel } from "./notification.model";
import { NotificationCampaignModel } from "./notification-campaign.model";
import { CUSTOM_CAMPAIGN_KIND } from "./notification-campaign.constants";
import { formatRelativeTime } from "./notification.helpers";

const CHUNK_SIZE = 50;
const FCM_SEND_TIMEOUT_MS = 10_000;

async function withTimeout<T>(
  promise: Promise<T>,
  ms: number,
  label: string
): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => {
      setTimeout(
        () => reject(new Error(`${label} timed out after ${ms}ms`)),
        ms
      );
    }),
  ]);
}

export async function deliverNotificationCampaign(
  campaignId: string
): Promise<void> {
  const campaign = await NotificationCampaignModel.findById(campaignId);
  if (!campaign) {
    console.warn(
      `[Campaign] deliver skipped — campaign not found id=${campaignId}`
    );
    return;
  }

  if (campaign.status === "completed" || campaign.status === "processing") {
    return;
  }

  campaign.status = "processing";
  campaign.startedAt = new Date();
  await campaign.save();

  const stats = {
    totalRecipients: 0,
    inboxCreated: 0,
    pushSent: 0,
    pushSkippedNoToken: 0,
    pushFailed: 0,
  };

  try {
    let userIds: string[] = [];

    if (campaign.audienceMode === "all") {
      const users = await UserModel.find(appUserMatchFilter())
        .select("_id")
        .lean<{ _id: { toString(): string } }[]>();
      userIds = users.map((u) => u._id.toString());
    } else {
      userIds = campaign.resolvedUserIds.map((id) => id.toString());
    }

    stats.totalRecipients = userIds.length;

    if (userIds.length === 0) {
      campaign.status = "completed";
      campaign.stats = stats;
      campaign.completedAt = new Date();
      await campaign.save();
      return;
    }

    const timeLabel = formatRelativeTime(new Date());
    const subject = campaign.subject;
    const body = campaign.body;

    for (let i = 0; i < userIds.length; i += CHUNK_SIZE) {
      const chunk = userIds.slice(i, i + CHUNK_SIZE);
      const users = await UserModel.find({ _id: { $in: chunk } })
        .select("_id fcmToken fcm_token")
        .lean<
          {
            _id: { toString(): string };
            fcmToken?: string;
            fcm_token?: string;
          }[]
        >();

      await Promise.all(
        users.map(async (user) => {
          const userId = user._id.toString();
          let notificationId = "";

          try {
            const doc = await NotificationModel.create({
              title: subject,
              description: body,
              module: NotificationModuleEnum.ADMIN_BROADCAST,
              userId,
              time: timeLabel,
              isRead: false,
              audience: "user",
              campaignId: campaign._id,
              kind: CUSTOM_CAMPAIGN_KIND,
              popupSeenAt: null,
              actorId: campaign.senderAdminId,
              actorName: campaign.senderAdminName ?? "Admin",
              entityType: "admin-broadcast",
              entityId: campaignId,
            });
            notificationId = String(doc._id);
            stats.inboxCreated += 1;
          } catch (error) {
            console.error(
              `[Campaign] inbox create failed userId=${userId}:`,
              error
            );
            return;
          }

          const token = (user.fcmToken || user.fcm_token)?.trim();
          if (!token) {
            stats.pushSkippedNoToken += 1;
            return;
          }

          const result = await withTimeout(
            sendPushNotification(token, subject, body, {
              kind: CUSTOM_CAMPAIGN_KIND,
              notificationId,
              campaignId,
              subject,
              body,
            }),
            FCM_SEND_TIMEOUT_MS,
            "FCM send"
          ).catch((error) => ({
            success: false as const,
            error: error instanceof Error ? error.message : "FCM send failed",
          }));

          if (result.success) {
            stats.pushSent += 1;
            return;
          }

          stats.pushFailed += 1;
          const err = result.error ?? "";
          if (
            err.includes("registration-token-not-registered") ||
            err.includes("InvalidRegistration") ||
            err.includes("NotRegistered")
          ) {
            await UserModel.updateOne(
              { _id: userId },
              { $set: { fcmToken: "" } }
            );
          }
        })
      );
    }

    campaign.status = "completed";
    campaign.stats = stats;
    campaign.completedAt = new Date();
    await campaign.save();

    console.info("[Campaign] delivery completed", {
      campaignId,
      ...stats,
    });
  } catch (error) {
    campaign.status = "failed";
    campaign.stats = stats;
    campaign.errorMessage =
      error instanceof Error ? error.message : "Campaign delivery failed";
    campaign.completedAt = new Date();
    await campaign.save();
    console.error("[Campaign] delivery failed", campaignId, error);
  }
}
