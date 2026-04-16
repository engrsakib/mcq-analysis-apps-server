import { handleSendNotificationJob } from "@/modules/notification/notification.job";
import {
  handleBookUploaded,
  handleExamCreated,
  handleGuidelineCreated,
  handleResultPublished,
  handleStudyPlanCreated,
  handleYoutubeVideoAdded,
} from "@/modules/notification/notification.handler";
import { eventBus } from "./EventBus";
import { AppEvent } from "./EventTypes";
import { jobQueue } from "./JobQueue";
let workerInitialized = false;

jobQueue.setHandler(async (event: AppEvent) => {
  switch (event.type) {
    case "SEND_NOTIFICATION":
      return handleSendNotificationJob(event.payload);

    case "STUDY_PLAN_CREATED":
    case "STUDY_PLAN_UPDATED":
      return handleStudyPlanCreated(event.payload as any);

    case "YOUTUBE_VIDEO_ADDED":
    case "YOUTUBE_VIDEO_UPDATED":
      return handleYoutubeVideoAdded(event.payload as any);

    case "RESULT_PUBLISHED":
    case "RESULT_UPDATED":
      return handleResultPublished(event.payload as any);

    case "BOOK_UPLOADED":
    case "BOOK_UPDATED":
      return handleBookUploaded(event.payload as any);

    case "EXAM_CREATED":
    case "EXAM_UPDATED":
      return handleExamCreated(event.payload as any);

    case "GUIDELINE_CREATED":
    case "GUIDELINE_UPDATED":
      return handleGuidelineCreated(event.payload as any);

    case "EXAM_RESULT_PUBLISHED":
      return handleResultPublished({
        userId: event.payload.userId,
        resultId: event.payload.examId,
        title: "Exam result published",
        score: event.payload.score,
      });

    case "OTP_SENT":
      return;

    default:
      console.log("Unknown event:", event);
  }
});

export const initWorker = () => {
  if (workerInitialized) return;

  eventBus.subscribe(async (event: AppEvent) => {
    jobQueue.enqueue(event);
  });

  workerInitialized = true;
};
