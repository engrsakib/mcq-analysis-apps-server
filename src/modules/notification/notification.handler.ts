import {
  ICreateNotificationPayload,
  NotificationModuleEnum,
} from "./notification.interface";
import { NotificationService } from "./notification.service";
import { UserModel } from "@/modules/user/user.model";
import { sendPushNotification } from "@/config/firebase/firebase.config";

export interface INotificationWorkerPayload {
  userId: string;
  title: string;
  description: string;
  module: NotificationModuleEnum;
}

export interface ISendNotificationEventPayload {
  userId: string;
  title: string;
  message: string;
}

interface IStudyPlanCreatedPayload {
  userId: string;
  planId: string | number;
  title: string;
}

interface IYoutubeVideoAddedPayload {
  userId: string;
  videoId: string;
  title: string;
}

interface IResultPublishedPayload {
  userId: string;
  resultId: string;
  title: string;
  score?: number;
}

interface IBookUploadedPayload {
  userId: string;
  bookId: string;
  title: string;
}

interface IExamCreatedPayload {
  userId: string;
  examId: string;
  title: string;
}

interface IGuidelineCreatedPayload {
  userId: string;
  guidelineId: string;
  title: string;
}

const DEFAULT_NOTIFICATION_MODULE = NotificationModuleEnum.RESULT;

const NOTIFICATION_PREFIX = {
  STUDY_PLAN: "Study plan created",
  YOUTUBE: "New YouTube video",
  RESULT: "Result published",
  BOOK: "Book uploaded",
  EXAM: "Exam created",
  GUIDELINE: "Guideline created",
} as const;

const getUserFcmToken = async (userId: string): Promise<string | null> => {
  const user = await UserModel.findById(userId).select("fcmToken").lean<{
    fcmToken?: string;
  } | null>();

  return user?.fcmToken?.trim() ? user.fcmToken : null;
};

const processNotification = async (
  payload: ICreateNotificationPayload
): Promise<void> => {
  const token = await getUserFcmToken(payload.userId);

  if (token) {
    await sendPushNotification(token, payload.title, payload.description);
  }

  await NotificationService.createNotification(payload);
};

export const handleNotificationEvent = async (
  payload: INotificationWorkerPayload
) => {
  const notificationPayload: ICreateNotificationPayload = {
    userId: payload.userId,
    title: payload.title,
    description: payload.description,
    module: payload.module,
  };

  return NotificationService.createNotification(notificationPayload);
};

export const handleSendNotificationEvent = async (
  payload: ISendNotificationEventPayload
) => {
  return handleNotificationEvent({
    userId: payload.userId,
    title: payload.title,
    description: payload.message,
    module: DEFAULT_NOTIFICATION_MODULE,
  });
};

export const handleStudyPlanCreated = async (
  payload: IStudyPlanCreatedPayload
): Promise<void> => {
  await processNotification({
    userId: payload.userId,
    title: payload.title,
    description: `${NOTIFICATION_PREFIX.STUDY_PLAN}: #${payload.planId}`,
    module: NotificationModuleEnum.STUDY_PLAN,
  });
};

export const handleYoutubeVideoAdded = async (
  payload: IYoutubeVideoAddedPayload
): Promise<void> => {
  await processNotification({
    userId: payload.userId,
    title: payload.title,
    description: `${NOTIFICATION_PREFIX.YOUTUBE}: ${payload.videoId}`,
    module: NotificationModuleEnum.YOUTUBE,
  });
};

export const handleResultPublished = async (
  payload: IResultPublishedPayload
): Promise<void> => {
  const scoreInfo =
    typeof payload.score === "number" ? `, score ${payload.score}` : "";

  await processNotification({
    userId: payload.userId,
    title: payload.title,
    description: `${NOTIFICATION_PREFIX.RESULT}: ${payload.resultId}${scoreInfo}`,
    module: NotificationModuleEnum.RESULT,
  });
};

export const handleBookUploaded = async (
  payload: IBookUploadedPayload
): Promise<void> => {
  await processNotification({
    userId: payload.userId,
    title: payload.title,
    description: `${NOTIFICATION_PREFIX.BOOK}: ${payload.bookId}`,
    module: NotificationModuleEnum.BOOKS,
  });
};

export const handleExamCreated = async (
  payload: IExamCreatedPayload
): Promise<void> => {
  await processNotification({
    userId: payload.userId,
    title: payload.title,
    description: `${NOTIFICATION_PREFIX.EXAM}: ${payload.examId}`,
    module: NotificationModuleEnum.EXAM,
  });
};

export const handleGuidelineCreated = async (
  payload: IGuidelineCreatedPayload
): Promise<void> => {
  await processNotification({
    userId: payload.userId,
    title: payload.title,
    description: `${NOTIFICATION_PREFIX.GUIDELINE}: ${payload.guidelineId}`,
    module: NotificationModuleEnum.GUIDELINE,
  });
};
