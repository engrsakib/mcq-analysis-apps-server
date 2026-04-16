import {
  handleBookUploaded,
  handleBookUpdated,
  handleExamCreated,
  handleExamUpdated,
  handleGuidelineCreated,
  handleGuidelineUpdated,
  handleResultPublished,
  handleResultUpdated,
  handleStudyPlanCreated,
  handleStudyPlanUpdated,
  handleYoutubeVideoAdded,
  handleYoutubeVideoUpdated,
} from "@/modules/notification/notification.handler";
import { eventBus } from "./EventBus";
import { AppEvent } from "./EventTypes";
import { jobQueue } from "./JobQueue";
let workerInitialized = false;

jobQueue.setHandler(async (event: AppEvent) => {
  switch (event.type) {
    case "STUDY_PLAN_CREATED":
      await handleStudyPlanCreated(event.payload);
      break;

    case "STUDY_PLAN_UPDATED":
      await handleStudyPlanUpdated(event.payload);
      break;

    case "YOUTUBE_VIDEO_ADDED":
      await handleYoutubeVideoAdded(event.payload);
      break;

    case "YOUTUBE_VIDEO_UPDATED":
      await handleYoutubeVideoUpdated(event.payload);
      break;

    case "RESULT_PUBLISHED":
      await handleResultPublished(event.payload);
      break;

    case "RESULT_UPDATED":
      await handleResultUpdated(event.payload);
      break;

    case "BOOK_UPLOADED":
      await handleBookUploaded(event.payload);
      break;

    case "BOOK_UPDATED":
      await handleBookUpdated(event.payload);
      break;

    case "EXAM_CREATED":
      await handleExamCreated(event.payload);
      break;

    case "EXAM_UPDATED":
      await handleExamUpdated(event.payload);
      break;

    case "GUIDELINE_CREATED":
      await handleGuidelineCreated(event.payload);
      break;

    case "GUIDELINE_UPDATED":
      await handleGuidelineUpdated(event.payload);
      break;

    default:
      console.log("Unknown event:", event);
      break;
  }
});

export const initWorker = () => {
  if (workerInitialized) return;

  eventBus.subscribe(async (event: AppEvent) => {
    jobQueue.enqueue(event);
  });

  workerInitialized = true;
};
