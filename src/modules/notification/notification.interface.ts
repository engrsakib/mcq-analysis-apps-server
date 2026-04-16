import { Document } from "mongoose";
import { NotificationModuleName } from "@/events/EventTypes";

export enum NotificationModuleEnum {
  STUDY_PLAN = "study-plan",
  YOUTUBE = "youtube",
  RESULT = "result",
  BOOKS = "books",
  EXAM = "exam",
  GUIDELINE = "guideline",
}

export interface INotification extends Document {
  title: string;
  description: string;
  module: NotificationModuleName;
  userId: string;
  time: string;
  isRead: boolean;
  createdAt: Date;
}

export interface ICreateNotificationPayload {
  title: string;
  description: string;
  module: NotificationModuleName;
  userId: string;
  time: string;
}
