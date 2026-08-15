import { NotificationEventPayload } from "@/events/EventTypes";
import { processNotification } from "./notification.helpers";

const dispatch = async (payload: NotificationEventPayload): Promise<void> => {
  await processNotification(payload);
};

export const handleStudyPlanCreated = async (
  payload: NotificationEventPayload
): Promise<void> => {
  await dispatch({ ...payload, audience: payload.audience ?? "admin" });
};

export const handleStudyPlanUpdated = async (
  payload: NotificationEventPayload
): Promise<void> => {
  await dispatch({ ...payload, audience: payload.audience ?? "admin" });
};

export const handleExamSolutionCreated = async (
  payload: NotificationEventPayload
): Promise<void> => {
  await dispatch({ ...payload, audience: payload.audience ?? "admin" });
};

export const handleExamSolutionUpdated = async (
  payload: NotificationEventPayload
): Promise<void> => {
  await dispatch({ ...payload, audience: payload.audience ?? "admin" });
};

export const handleExamRoutineCreated = async (
  payload: NotificationEventPayload
): Promise<void> => {
  await dispatch({ ...payload, audience: payload.audience ?? "admin" });
};

export const handleExamRoutineUpdated = async (
  payload: NotificationEventPayload
): Promise<void> => {
  await dispatch({ ...payload, audience: payload.audience ?? "admin" });
};

export const handleYoutubeVideoAdded = async (
  payload: NotificationEventPayload
): Promise<void> => {
  await dispatch({ ...payload, audience: payload.audience ?? "admin" });
};

export const handleYoutubeVideoUpdated = async (
  payload: NotificationEventPayload
): Promise<void> => {
  await dispatch({ ...payload, audience: payload.audience ?? "admin" });
};

export const handleResultPublished = async (
  payload: NotificationEventPayload
): Promise<void> => {
  await dispatch({ ...payload, audience: payload.audience ?? "admin" });
};

export const handleResultUpdated = async (
  payload: NotificationEventPayload
): Promise<void> => {
  await dispatch({ ...payload, audience: payload.audience ?? "admin" });
};

export const handleBookUploaded = async (
  payload: NotificationEventPayload
): Promise<void> => {
  await dispatch({ ...payload, audience: payload.audience ?? "admin" });
};

export const handleBookUpdated = async (
  payload: NotificationEventPayload
): Promise<void> => {
  await dispatch({ ...payload, audience: payload.audience ?? "admin" });
};

export const handleExamCreated = async (
  payload: NotificationEventPayload
): Promise<void> => {
  await dispatch({ ...payload, audience: payload.audience ?? "admin" });
};

export const handleExamUpdated = async (
  payload: NotificationEventPayload
): Promise<void> => {
  await dispatch({ ...payload, audience: payload.audience ?? "admin" });
};

export const handleExamDeleted = async (
  payload: NotificationEventPayload
): Promise<void> => {
  await dispatch({ ...payload, audience: payload.audience ?? "admin" });
};

export const handleGuidelineCreated = async (
  payload: NotificationEventPayload
): Promise<void> => {
  await dispatch({ ...payload, audience: payload.audience ?? "admin" });
};

export const handleGuidelineUpdated = async (
  payload: NotificationEventPayload
): Promise<void> => {
  await dispatch({ ...payload, audience: payload.audience ?? "admin" });
};

export const handleAnnouncementCreated = async (
  payload: NotificationEventPayload
): Promise<void> => {
  await dispatch({ ...payload, audience: payload.audience ?? "admin" });
};

export const handleAnnouncementUpdated = async (
  payload: NotificationEventPayload
): Promise<void> => {
  await dispatch({ ...payload, audience: payload.audience ?? "admin" });
};

export const handleAnnouncementDeleted = async (
  payload: NotificationEventPayload
): Promise<void> => {
  await dispatch({ ...payload, audience: payload.audience ?? "admin" });
};

export const handleQuestionCreated = async (
  payload: NotificationEventPayload
): Promise<void> => {
  await dispatch({ ...payload, audience: payload.audience ?? "admin" });
};

export const handleQuestionUpdated = async (
  payload: NotificationEventPayload
): Promise<void> => {
  await dispatch({ ...payload, audience: payload.audience ?? "admin" });
};

export const handleQuestionDeleted = async (
  payload: NotificationEventPayload
): Promise<void> => {
  await dispatch({ ...payload, audience: payload.audience ?? "admin" });
};

export const handleQuestionTopicCreated = async (
  payload: NotificationEventPayload
): Promise<void> => {
  await dispatch({ ...payload, audience: payload.audience ?? "admin" });
};

export const handleQuestionTopicUpdated = async (
  payload: NotificationEventPayload
): Promise<void> => {
  await dispatch({ ...payload, audience: payload.audience ?? "admin" });
};

export const handleQuestionTopicDeleted = async (
  payload: NotificationEventPayload
): Promise<void> => {
  await dispatch({ ...payload, audience: payload.audience ?? "admin" });
};

export const handleUserRegistered = async (
  payload: NotificationEventPayload
): Promise<void> => {
  await dispatch({ ...payload, audience: payload.audience ?? "admin" });
};

export const handleUserUpdated = async (
  payload: NotificationEventPayload
): Promise<void> => {
  await dispatch({ ...payload, audience: payload.audience ?? "admin" });
};

export const handleUserDeleted = async (
  payload: NotificationEventPayload
): Promise<void> => {
  await dispatch({ ...payload, audience: payload.audience ?? "admin" });
};

export const handleAdminCreated = async (
  payload: NotificationEventPayload
): Promise<void> => {
  await dispatch({ ...payload, audience: payload.audience ?? "admin" });
};

export const handleAdminUpdated = async (
  payload: NotificationEventPayload
): Promise<void> => {
  await dispatch({ ...payload, audience: payload.audience ?? "admin" });
};

export const handleAdminDeleted = async (
  payload: NotificationEventPayload
): Promise<void> => {
  await dispatch({ ...payload, audience: payload.audience ?? "admin" });
};

export const handleExamSubmitted = async (
  payload: NotificationEventPayload
): Promise<void> => {
  await dispatch({ ...payload, audience: payload.audience ?? "admin" });
};
