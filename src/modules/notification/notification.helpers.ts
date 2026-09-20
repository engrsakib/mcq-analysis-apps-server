import { appUserMatchFilter } from "@/constants/roles";
import { IJWtPayload } from "@/interfaces/common.interface";
import { AdminModel } from "@/modules/admin/admin.model";
import { UserModel } from "@/modules/user/user.model";
import { sendPushNotification } from "@/config/firebase/firebase.config";
import { isValidObjectId } from "@/utils/mongooseHelpers";
import {
  NotificationAction,
  NotificationEventPayload,
  NotificationModuleName,
} from "@/events/EventTypes";
import { activityService } from "@/modules/activity/activity.service";
import { getRequestContext } from "@/middlewares/requestContext";
import { Error as MongooseError } from "mongoose";
import { NotificationModel } from "./notification.model";
import { sseManager } from "./notification.sse";

const FCM_SEND_TIMEOUT_MS = 10_000;

function logNotificationWriteError(
  context: string,
  error: unknown,
  meta: Record<string, unknown>
): void {
  if (error instanceof MongooseError.ValidationError) {
    const fields = Object.fromEntries(
      Object.entries(error.errors).map(([key, val]) => [
        key,
        val?.message ?? String(val),
      ])
    );
    console.error(`[Notification] ${context} validation failed:`, {
      ...meta,
      fields,
    });
    return;
  }

  console.error(`[Notification] ${context} failed:`, error, meta);
}

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

export type ActorInfo = {
  id: string;
  name: string;
};

export function resolveActor(user?: IJWtPayload): ActorInfo {
  return {
    id: String(user?.id ?? "system"),
    name: user?.name?.trim() || "System",
  };
}

export function formatRelativeTime(isoOrDate: string | Date): string {
  const date = typeof isoOrDate === "string" ? new Date(isoOrDate) : isoOrDate;
  const diffMs = Math.max(0, Date.now() - date.getTime());
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  if (diffSec < 60) return "Just now";
  if (diffMin < 60) return `${diffMin} min ago`;
  if (diffHour < 24) return `${diffHour} hr ago`;

  const remainingHours = diffHour % 24;
  const remainingMins = diffMin % 60;
  const dayPart = `${diffDay} day${diffDay === 1 ? "" : "s"}`;

  if (remainingHours === 0 && remainingMins === 0) {
    return `${dayPart} ago`;
  }

  const timeParts: string[] = [];
  if (remainingHours > 0) timeParts.push(`${remainingHours} hr`);
  if (remainingMins > 0) timeParts.push(`${remainingMins} min`);

  if (diffDay >= 30) {
    return date.toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  }

  return `${dayPart} and ${timeParts.join(" ")} ago`;
}

const ACTION_VERBS: Record<NotificationAction, string> = {
  created: "created",
  updated: "updated",
  deleted: "deleted",
  registered: "registered as a new student",
  submitted: "submitted",
};

const ENTITY_LABELS: Record<string, string> = {
  question: "question",
  exam: "exam",
  user: "student",
  admin: "staff member",
  "question-study-topic": "study topic",
  "study-plan": "study plan",
  "exam-solution": "model test solution",
  "exam-routine": "exam routine",
  books: "book",
  guideline: "guideline",
  announcement: "announcement",
  youtube: "video",
  result: "result",
};

export function buildActivityMessage(options: {
  actorName: string;
  action: NotificationAction;
  entityType: string;
  entityLabel: string;
}): { title: string; description: string } {
  const { actorName, action, entityType, entityLabel } = options;
  const entityName = ENTITY_LABELS[entityType] || entityType;

  if (action === "registered") {
    return {
      title: "New Student Registered",
      description: `${actorName} registered as a new student`,
    };
  }

  if (action === "submitted") {
    return {
      title: "Exam Submitted",
      description: entityLabel,
    };
  }

  const titleVerb =
    action === "created"
      ? "Created"
      : action === "updated"
        ? "Updated"
        : "Deleted";

  const title = `${entityName.charAt(0).toUpperCase()}${entityName.slice(1)} ${titleVerb}`;
  const description = `${actorName} ${ACTION_VERBS[action]} ${entityName} ${entityLabel}`;

  return { title, description };
}

export function buildAdminActivityPayload(options: {
  actor?: ActorInfo;
  action: NotificationAction;
  entityType: string;
  entityLabel: string;
  entityId?: string;
  module: NotificationModuleName;
  title?: string;
  description?: string;
}): NotificationEventPayload {
  const actor = options.actor ?? { id: "system", name: "System" };
  const now = new Date();
  const messages =
    options.title && options.description
      ? { title: options.title, description: options.description }
      : buildActivityMessage({
          actorName: actor.name,
          action: options.action,
          entityType: options.entityType,
          entityLabel: options.entityLabel,
        });

  return {
    title: messages.title,
    description: messages.description,
    module: options.module,
    time: formatRelativeTime(now),
    actorName: actor.name,
    actorId: actor.id,
    action: options.action,
    entityType: options.entityType,
    entityId: options.entityId,
    audience: "admin",
  };
}

async function deliverPushToUser(
  userId: string,
  token: string,
  title: string,
  body: string
): Promise<void> {
  const result = await withTimeout(
    sendPushNotification(token, title, body),
    FCM_SEND_TIMEOUT_MS,
    "FCM send"
  ).catch((error) => ({
    success: false as const,
    error: error instanceof Error ? error.message : "FCM send failed",
  }));
  if (result.success) return;

  console.warn(
    `[Notification] FCM failed for userId="${userId}": ${result.error ?? "unknown"}`
  );

  const err = result.error ?? "";
  if (
    err.includes("registration-token-not-registered") ||
    err.includes("InvalidRegistration") ||
    err.includes("NotRegistered")
  ) {
    await UserModel.updateOne({ _id: userId }, { $set: { fcmToken: "" } });
  }
}

const getUserFcmToken = async (userId: string): Promise<string | null> => {
  if (!isValidObjectId(userId)) {
    return null;
  }

  try {
    const user = await UserModel.findById(userId)
      .select("fcmToken fcm_token")
      .lean<{ fcmToken?: string; fcm_token?: string } | null>();

    const token = user?.fcmToken || user?.fcm_token;
    return token?.trim() ? token.trim() : null;
  } catch (error) {
    console.error(
      `[Notification] Failed to load FCM token for userId="${userId}":`,
      error
    );
    return null;
  }
};

export function serializeNotification(
  notification: unknown
): Record<string, unknown> {
  const doc = notification as {
    _id?: unknown;
    toObject?: () => Record<string, unknown>;
  };

  const raw =
    typeof doc.toObject === "function"
      ? doc.toObject()
      : { ...(doc as object) };

  return {
    ...raw,
    _id: String(raw._id ?? ""),
  };
}

export async function notifyAllAdmins(
  payload: NotificationEventPayload
): Promise<void> {
  let insertedCount = 0;
  let failedCount = 0;

  try {
    const admins = await AdminModel.find({ is_Deleted: false })
      .select("_id")
      .lean();

    if (!admins.length) {
      console.warn(
        "[Notification] notifyAllAdmins skipped — no eligible admins",
        {
          module: payload.module,
          title: payload.title,
        }
      );
      return;
    }

    const basePayload = {
      title: payload.title,
      description: payload.description,
      module: payload.module,
      time: payload.time || formatRelativeTime(new Date()),
      isRead: false,
      actorName: payload.actorName,
      actorId: payload.actorId,
      action: payload.action,
      entityType: payload.entityType,
      entityId: payload.entityId,
      audience: "admin" as const,
    };

    for (const admin of admins) {
      const adminId = admin._id.toString();
      try {
        const notification = await NotificationModel.create({
          ...basePayload,
          userId: adminId,
        });
        insertedCount += 1;

        sseManager.broadcast(adminId, {
          type: "notification",
          data: serializeNotification(notification),
        });
      } catch (error) {
        failedCount += 1;
        logNotificationWriteError("notifyAllAdmins create", error, {
          module: payload.module,
          audience: "admin",
          userId: adminId,
        });
      }
    }

    if (failedCount > 0) {
      console.warn("[Notification] notifyAllAdmins summary", {
        module: payload.module,
        insertedCount,
        failedCount,
        adminCount: admins.length,
      });
    }
  } catch (error) {
    logNotificationWriteError("notifyAllAdmins", error, {
      module: payload.module,
      audience: "admin",
    });
  }
}

const USER_FANOUT_CHUNK_SIZE = 50;

async function persistUserInboxNotification(
  userId: string,
  basePayload: Record<string, unknown>
): Promise<void> {
  try {
    await NotificationModel.create({
      ...basePayload,
      userId,
    });
  } catch (error) {
    logNotificationWriteError("notifyAllUsers inbox", error, {
      audience: "user",
      userId,
      module: basePayload.module,
    });
  }
}

export async function notifyAllUsers(
  payload: NotificationEventPayload
): Promise<void> {
  let pushSent = 0;
  let pushSkippedNoToken = 0;
  let pushFailed = 0;

  try {
    const users = await UserModel.find(appUserMatchFilter())
      .select("_id fcmToken")
      .lean<{ _id: { toString(): string }; fcmToken?: string }[]>();

    if (!users.length) {
      console.warn(
        "[Notification] notifyAllUsers skipped — no eligible users",
        {
          module: payload.module,
          title: payload.title,
        }
      );
      return;
    }

    const basePayload = {
      title: payload.title,
      description: payload.description,
      module: payload.module,
      time: payload.time || formatRelativeTime(new Date()),
      isRead: false,
      actorName: payload.actorName,
      actorId: payload.actorId,
      action: payload.action,
      entityType: payload.entityType,
      entityId: payload.entityId,
      audience: "user" as const,
    };

    for (let i = 0; i < users.length; i += USER_FANOUT_CHUNK_SIZE) {
      const chunk = users.slice(i, i + USER_FANOUT_CHUNK_SIZE);
      await Promise.all(
        chunk.map(async (user) => {
          const userId = user._id.toString();

          await persistUserInboxNotification(userId, basePayload);

          const fcmToken = user.fcmToken?.trim()
            ? user.fcmToken.trim()
            : await getUserFcmToken(userId);

          if (!fcmToken) {
            pushSkippedNoToken += 1;
            return;
          }

          const result = await withTimeout(
            sendPushNotification(fcmToken, payload.title, payload.description),
            FCM_SEND_TIMEOUT_MS,
            "FCM send"
          ).catch((error) => ({
            success: false as const,
            error: error instanceof Error ? error.message : "FCM send failed",
          }));

          if (result.success) {
            pushSent += 1;
            return;
          }

          pushFailed += 1;
          console.warn(
            `[Notification] FCM failed for userId="${userId}": ${result.error ?? "unknown"}`
          );

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

    console.info("[Notification] notifyAllUsers push summary", {
      module: payload.module,
      title: payload.title,
      userCount: users.length,
      pushSent,
      pushSkippedNoToken,
      pushFailed,
    });
  } catch (error) {
    logNotificationWriteError("notifyAllUsers", error, {
      module: payload.module,
      audience: "user",
    });
  }
}

export async function notifyUser(
  payload: NotificationEventPayload
): Promise<void> {
  const userId = payload.userId?.trim();
  if (!userId) {
    console.warn("[Notification] Skipped — payload.userId is missing.");
    return;
  }

  try {
    await NotificationModel.create({
      userId,
      title: payload.title,
      description: payload.description,
      module: payload.module,
      time: payload.time || formatRelativeTime(new Date()),
      isRead: false,
      actorName: payload.actorName,
      actorId: payload.actorId,
      action: payload.action,
      entityType: payload.entityType,
      entityId: payload.entityId,
      audience: "user",
    });

    const token = await getUserFcmToken(userId);
    if (token) {
      await deliverPushToUser(
        userId,
        token,
        payload.title,
        payload.description
      );
    }
  } catch (error) {
    logNotificationWriteError("notifyUser", error, {
      module: payload.module,
      audience: "user",
      userId,
    });
  }
}

export async function processNotification(
  payload: NotificationEventPayload
): Promise<void> {
  if (payload.audience === "admin") {
    await notifyAllAdmins(payload);
    if (payload.notifyStudents) {
      await notifyAllUsers({ ...payload, audience: "user" });
    }
    await activityService.recordFromNotification(payload, getRequestContext());
    return;
  }

  await notifyUser(payload);
}
