import {
  handleAdminCreated,
  handleAdminDeleted,
  handleAdminUpdated,
  handleBookUpdated,
  handleBookUploaded,
  handleExamCreated,
  handleExamDeleted,
  handleExamSubmitted,
  handleExamUpdated,
  handleGuidelineCreated,
  handleGuidelineUpdated,
  handleAnnouncementCreated,
  handleAnnouncementUpdated,
  handleAnnouncementDeleted,
  handleQuestionCreated,
  handleQuestionDeleted,
  handleQuestionTopicCreated,
  handleQuestionTopicDeleted,
  handleQuestionTopicUpdated,
  handleQuestionUpdated,
  handleResultPublished,
  handleResultUpdated,
  handleStudyPlanCreated,
  handleStudyPlanUpdated,
  handleExamRoutineCreated,
  handleExamRoutineUpdated,
  handleUserDeleted,
  handleUserRegistered,
  handleUserUpdated,
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

    case "EXAM_ROUTINE_CREATED":
      await handleExamRoutineCreated(event.payload);
      break;

    case "EXAM_ROUTINE_UPDATED":
      await handleExamRoutineUpdated(event.payload);
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

    case "EXAM_DELETED":
      await handleExamDeleted(event.payload);
      break;

    case "GUIDELINE_CREATED":
      await handleGuidelineCreated(event.payload);
      break;

    case "GUIDELINE_UPDATED":
      await handleGuidelineUpdated(event.payload);
      break;

    case "ANNOUNCEMENT_CREATED":
      await handleAnnouncementCreated(event.payload);
      break;

    case "ANNOUNCEMENT_UPDATED":
      await handleAnnouncementUpdated(event.payload);
      break;

    case "ANNOUNCEMENT_DELETED":
      await handleAnnouncementDeleted(event.payload);
      break;

    case "QUESTION_CREATED":
      await handleQuestionCreated(event.payload);
      break;

    case "QUESTION_UPDATED":
      await handleQuestionUpdated(event.payload);
      break;

    case "QUESTION_DELETED":
      await handleQuestionDeleted(event.payload);
      break;

    case "QUESTION_TOPIC_CREATED":
      await handleQuestionTopicCreated(event.payload);
      break;

    case "QUESTION_TOPIC_UPDATED":
      await handleQuestionTopicUpdated(event.payload);
      break;

    case "QUESTION_TOPIC_DELETED":
      await handleQuestionTopicDeleted(event.payload);
      break;

    case "USER_REGISTERED":
      await handleUserRegistered(event.payload);
      break;

    case "USER_UPDATED":
      await handleUserUpdated(event.payload);
      break;

    case "USER_DELETED":
      await handleUserDeleted(event.payload);
      break;

    case "ADMIN_CREATED":
      await handleAdminCreated(event.payload);
      break;

    case "ADMIN_UPDATED":
      await handleAdminUpdated(event.payload);
      break;

    case "ADMIN_DELETED":
      await handleAdminDeleted(event.payload);
      break;

    case "EXAM_SUBMITTED":
      await handleExamSubmitted(event.payload);
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
