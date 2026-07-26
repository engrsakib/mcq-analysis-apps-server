import { NotificationEventPayload } from "@/events/EventTypes";
import { NotificationModel } from "./notification.model";
import { UserModel } from "@/modules/user/user.model";
import { sendPushNotification } from "@/config/firebase/firebase.config";
import { isValidObjectId } from "@/utils/mongooseHelpers";

type IUserToken = {
  fcmToken?: string;
  fcm_token?: string;
};

const getUserFcmToken = async (userId: string): Promise<string | null> => {
  // Safety: scheduler/events may pass "system" or phone numbers — never pass those to findById.
  if (!isValidObjectId(userId)) {
    return null;
  }

  try {
    const user = await UserModel.findById(userId)
      .select("fcmToken fcm_token")
      .lean<IUserToken | null>();

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

const saveAndPushNotification = async (
  payload: NotificationEventPayload
): Promise<void> => {
  // Safety: userId is stored as a plain string on notifications; require a non-empty value.
  const userId = payload.userId?.trim();
  if (!userId) {
    console.warn(
      "[Notification] Skipped — payload.userId is missing or empty."
    );
    return;
  }

  try {
    await NotificationModel.create({
      userId,
      title: payload.title,
      description: payload.description,
      module: payload.module,
      time: payload.time,
      isRead: false,
    });

    const token = await getUserFcmToken(userId);
    if (token) {
      await sendPushNotification(token, payload.title, payload.description);
    }
  } catch (error) {
    // Safety: log and swallow so background jobs never crash the process.
    console.error("[Notification] Failed to save or push notification:", error);
  }
};

export const handleSendNotificationEvent = async (
  payload: NotificationEventPayload
): Promise<void> => {
  await saveAndPushNotification(payload);
};

export const handleStudyPlanCreated = async (
  payload: NotificationEventPayload
): Promise<void> => {
  await saveAndPushNotification(payload);
};

export const handleStudyPlanUpdated = async (
  payload: NotificationEventPayload
): Promise<void> => {
  await saveAndPushNotification(payload);
};

export const handleYoutubeVideoAdded = async (
  payload: NotificationEventPayload
): Promise<void> => {
  await saveAndPushNotification(payload);
};

export const handleYoutubeVideoUpdated = async (
  payload: NotificationEventPayload
): Promise<void> => {
  await saveAndPushNotification(payload);
};

export const handleResultPublished = async (
  payload: NotificationEventPayload
): Promise<void> => {
  await saveAndPushNotification(payload);
};

export const handleResultUpdated = async (
  payload: NotificationEventPayload
): Promise<void> => {
  await saveAndPushNotification(payload);
};

export const handleBookUploaded = async (
  payload: NotificationEventPayload
): Promise<void> => {
  await saveAndPushNotification(payload);
};

export const handleBookUpdated = async (
  payload: NotificationEventPayload
): Promise<void> => {
  await saveAndPushNotification(payload);
};

export const handleExamCreated = async (
  payload: NotificationEventPayload
): Promise<void> => {
  await saveAndPushNotification(payload);
};

export const handleExamUpdated = async (
  payload: NotificationEventPayload
): Promise<void> => {
  await saveAndPushNotification(payload);
};

export const handleGuidelineCreated = async (
  payload: NotificationEventPayload
): Promise<void> => {
  await saveAndPushNotification(payload);
};

export const handleGuidelineUpdated = async (
  payload: NotificationEventPayload
): Promise<void> => {
  await saveAndPushNotification(payload);
};
