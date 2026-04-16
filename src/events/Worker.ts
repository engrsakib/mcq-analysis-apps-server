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
      return handleStudyPlanCreated(event.payload);

    case "YOUTUBE_VIDEO_ADDED":
      return handleYoutubeVideoAdded(event.payload);

    case "RESULT_PUBLISHED":
      return handleResultPublished(event.payload);

    case "BOOK_UPLOADED":
      return handleBookUploaded(event.payload);

    case "EXAM_CREATED":
      return handleExamCreated(event.payload);

    case "GUIDELINE_CREATED":
      return handleGuidelineCreated(event.payload);

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
