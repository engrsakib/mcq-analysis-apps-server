import { NotificationEventPayload } from "@/events/EventTypes";
import { notifyUser, processNotification } from "./notification.helpers";

const dispatch = async (payload: NotificationEventPayload): Promise<void> => {
  await processNotification(payload);
};

function studentExamSubmitCopy(payload: NotificationEventPayload): {
  title: string;
  description: string;
} {
  const scorePart = payload.description.match(/\(Score:[^)]+\)/i)?.[0];
  const examPart = payload.description.match(
    /submitted exam (.+?) \(Score:/i
  )?.[1];
  if (examPart) {
    return {
      title: "Exam submitted",
      description: scorePart
        ? `Your answers for ${examPart} were recorded ${scorePart}.`
        : `Your answers for ${examPart} were recorded.`,
    };
  }
  return {
    title: "Exam submitted",
    description: "Your exam submission was received.",
  };
}

async function mirrorToStudentInbox(
  payload: NotificationEventPayload,
  userId: string,
  overrides: Partial<NotificationEventPayload>
): Promise<void> {
  const id = userId.trim();
  if (!id) return;

  await notifyUser({
    ...payload,
    ...overrides,
    userId: id,
    audience: "user",
  });
}

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

  const newUserId = payload.entityId?.trim();
  if (newUserId) {
    await mirrorToStudentInbox(payload, newUserId, {
      title: "Welcome",
      description:
        "Your account is ready. You'll see updates here when exams, results, and announcements are published.",
      module: "user",
      action: "registered",
      actorName: "System",
      actorId: "system",
      entityType: "user",
      entityId: newUserId,
    });
  }
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

  const studentId = payload.actorId?.trim();
  if (!studentId || studentId === "system") return;

  const copy = studentExamSubmitCopy(payload);
  await mirrorToStudentInbox(payload, studentId, {
    ...copy,
    module: "exam",
    action: "submitted",
    entityType: payload.entityType ?? "exam",
    entityId: payload.entityId,
  });
};
