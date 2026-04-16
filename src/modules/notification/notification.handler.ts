import { NotificationEventPayload } from "@/events/EventTypes";
import { NotificationModel } from "./notification.model";
import { UserModel } from "@/modules/user/user.model";
import { sendPushNotification } from "@/config/firebase/firebase.config";

type IUserToken = {
  fcmToken?: string;
  fcm_token?: string;
};

const getUserFcmToken = async (userId: string): Promise<string | null> => {
  const user = await UserModel.findById(userId)
    .select("fcmToken fcm_token")
    .lean<IUserToken | null>();

  const token = user?.fcmToken || user?.fcm_token;
  return token?.trim() ? token.trim() : null;
};

const saveAndPushNotification = async (
  payload: NotificationEventPayload
): Promise<void> => {
  await NotificationModel.create({
    userId: payload.userId,
    title: payload.title,
    description: payload.description,
    module: payload.module,
    time: payload.time,
    isRead: false,
  });

  const token = await getUserFcmToken(payload.userId);
  if (token) {
    await sendPushNotification(token, payload.title, payload.description);
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
