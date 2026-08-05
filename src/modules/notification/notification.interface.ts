import { Document } from "mongoose";
import {
  NotificationAction,
  NotificationAudience,
  NotificationModuleName,
} from "@/events/EventTypes";

export enum NotificationModuleEnum {
  STUDY_PLAN = "study-plan",
  YOUTUBE = "youtube",
  RESULT = "result",
  BOOKS = "books",
  EXAM = "exam",
  GUIDELINE = "guideline",
  QUESTION = "question",
  USER = "user",
  ADMIN = "admin",
  QUESTION_STUDY_TOPIC = "question-study-topic",
}

export interface INotification extends Document {
  title: string;
  description: string;
  module: NotificationModuleName;
  userId: string;
  time: string;
  isRead: boolean;
  createdAt: Date;
  actorName?: string;
  actorId?: string;
  action?: NotificationAction;
  entityType?: string;
  entityId?: string;
  audience?: NotificationAudience;
}

export interface ICreateNotificationPayload {
  title: string;
  description: string;
  module: NotificationModuleName;
  userId: string;
  time: string;
  actorName?: string;
  actorId?: string;
  action?: NotificationAction;
  entityType?: string;
  entityId?: string;
  audience?: NotificationAudience;
}
