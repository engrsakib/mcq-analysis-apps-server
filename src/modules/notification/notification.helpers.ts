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
import { NotificationModel } from "./notification.model";
import { sseManager } from "./notification.sse";

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
  const diffMs = Date.now() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  if (diffSec < 60) return "Just now";
  if (diffMin < 60) return `${diffMin} minute${diffMin === 1 ? "" : "s"} ago`;
  if (diffHour < 24) return `${diffHour} hour${diffHour === 1 ? "" : "s"} ago`;
  if (diffDay < 7) return `${diffDay} day${diffDay === 1 ? "" : "s"} ago`;
  return date.toLocaleDateString();
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
  try {
    const admins = await AdminModel.find({ is_Deleted: false })
      .select("_id")
      .lean();

    if (!admins.length) return;

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
      const notification = await NotificationModel.create({
        ...basePayload,
        userId: adminId,
      });

      sseManager.broadcast(adminId, {
        type: "notification",
        data: serializeNotification(notification),
      });
    }
  } catch (error) {
    console.error("[Notification] notifyAllAdmins failed:", error);
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
      await sendPushNotification(token, payload.title, payload.description);
    }
  } catch (error) {
    console.error("[Notification] notifyUser failed:", error);
  }
}

export async function processNotification(
  payload: NotificationEventPayload
): Promise<void> {
  if (payload.audience === "admin") {
    await notifyAllAdmins(payload);
    return;
  }

  await notifyUser(payload);
}
