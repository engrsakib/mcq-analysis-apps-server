import { Document } from "mongoose";

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
  module: NotificationModuleEnum;
  userId: string;
  isRead: boolean;
  createdAt: Date;
}

export interface ICreateNotificationPayload {
  title: string;
  description: string;
  module: NotificationModuleEnum;
  userId: string;
}
