export type NotificationModuleName =
  | "study-plan"
  | "youtube"
  | "result"
  | "books"
  | "exam"
  | "guideline";

export type NotificationEventPayload = {
  userId: string;
  title: string;
  description: string;
  module: NotificationModuleName;
  time: string;
  planId?: string | number;
  videoId?: string | number;
  resultId?: string | number;
  bookId?: string | number;
  examId?: string | number;
  guidelineId?: string | number;
};

export type AppEvent =
  | { type: "STUDY_PLAN_CREATED"; payload: NotificationEventPayload }
  | { type: "STUDY_PLAN_UPDATED"; payload: NotificationEventPayload }
  | { type: "YOUTUBE_VIDEO_ADDED"; payload: NotificationEventPayload }
  | { type: "YOUTUBE_VIDEO_UPDATED"; payload: NotificationEventPayload }
  | { type: "RESULT_PUBLISHED"; payload: NotificationEventPayload }
  | { type: "RESULT_UPDATED"; payload: NotificationEventPayload }
  | { type: "BOOK_UPLOADED"; payload: NotificationEventPayload }
  | { type: "BOOK_UPDATED"; payload: NotificationEventPayload }
  | { type: "EXAM_CREATED"; payload: NotificationEventPayload }
  | { type: "EXAM_UPDATED"; payload: NotificationEventPayload }
  | { type: "GUIDELINE_CREATED"; payload: NotificationEventPayload }
  | { type: "GUIDELINE_UPDATED"; payload: NotificationEventPayload };
