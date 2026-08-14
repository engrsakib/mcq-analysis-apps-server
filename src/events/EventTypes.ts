export type NotificationModuleName =
  | "study-plan"
  | "exam-routine"
  | "youtube"
  | "result"
  | "books"
  | "exam"
  | "guideline"
  | "announcement"
  | "question"
  | "user"
  | "admin"
  | "question-study-topic";

export type NotificationAction =
  | "created"
  | "updated"
  | "deleted"
  | "registered"
  | "submitted";

export type NotificationAudience = "admin" | "user";

export type NotificationEventPayload = {
  userId?: string;
  title: string;
  description: string;
  module: NotificationModuleName;
  time: string;
  actorName?: string;
  actorId?: string;
  action?: NotificationAction;
  entityType?: string;
  entityId?: string;
  audience?: NotificationAudience;
  planId?: string | number;
  videoId?: string | number;
  resultId?: string | number;
  bookId?: string | number;
  examId?: string | number;
  guidelineId?: string | number;
  announcementId?: string | number;
  questionId?: string | number;
};

export type AppEvent =
  | { type: "STUDY_PLAN_CREATED"; payload: NotificationEventPayload }
  | { type: "STUDY_PLAN_UPDATED"; payload: NotificationEventPayload }
  | { type: "EXAM_ROUTINE_CREATED"; payload: NotificationEventPayload }
  | { type: "EXAM_ROUTINE_UPDATED"; payload: NotificationEventPayload }
  | { type: "YOUTUBE_VIDEO_ADDED"; payload: NotificationEventPayload }
  | { type: "YOUTUBE_VIDEO_UPDATED"; payload: NotificationEventPayload }
  | { type: "RESULT_PUBLISHED"; payload: NotificationEventPayload }
  | { type: "RESULT_UPDATED"; payload: NotificationEventPayload }
  | { type: "BOOK_UPLOADED"; payload: NotificationEventPayload }
  | { type: "BOOK_UPDATED"; payload: NotificationEventPayload }
  | { type: "EXAM_CREATED"; payload: NotificationEventPayload }
  | { type: "EXAM_UPDATED"; payload: NotificationEventPayload }
  | { type: "EXAM_DELETED"; payload: NotificationEventPayload }
  | { type: "GUIDELINE_CREATED"; payload: NotificationEventPayload }
  | { type: "GUIDELINE_UPDATED"; payload: NotificationEventPayload }
  | { type: "ANNOUNCEMENT_CREATED"; payload: NotificationEventPayload }
  | { type: "ANNOUNCEMENT_UPDATED"; payload: NotificationEventPayload }
  | { type: "ANNOUNCEMENT_DELETED"; payload: NotificationEventPayload }
  | { type: "QUESTION_CREATED"; payload: NotificationEventPayload }
  | { type: "QUESTION_UPDATED"; payload: NotificationEventPayload }
  | { type: "QUESTION_DELETED"; payload: NotificationEventPayload }
  | { type: "QUESTION_TOPIC_CREATED"; payload: NotificationEventPayload }
  | { type: "QUESTION_TOPIC_UPDATED"; payload: NotificationEventPayload }
  | { type: "QUESTION_TOPIC_DELETED"; payload: NotificationEventPayload }
  | { type: "USER_REGISTERED"; payload: NotificationEventPayload }
  | { type: "USER_UPDATED"; payload: NotificationEventPayload }
  | { type: "USER_DELETED"; payload: NotificationEventPayload }
  | { type: "ADMIN_CREATED"; payload: NotificationEventPayload }
  | { type: "ADMIN_UPDATED"; payload: NotificationEventPayload }
  | { type: "ADMIN_DELETED"; payload: NotificationEventPayload }
  | { type: "EXAM_SUBMITTED"; payload: NotificationEventPayload };
