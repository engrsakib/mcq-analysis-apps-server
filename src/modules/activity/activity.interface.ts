import { Document } from "mongoose";
import {
  NotificationAction,
  NotificationEventPayload,
  NotificationModuleName,
} from "@/events/EventTypes";

export type AuthActivityAction = "login" | "logout";

export type ProctoringActivityAction = "proctoring_violation";

export type ExamActivityAction =
  | "exam_started"
  | "exam_submitted"
  | "exam_submitted_offline"
  | "exam_submitted_cheated";

export type ActivitySeverity = "normal" | "danger";

export type ActivityAction =
  | NotificationAction
  | AuthActivityAction
  | ProctoringActivityAction
  | ExamActivityAction;

export type ActivityModule = NotificationModuleName | "auth";

export interface IAdminActivityLog extends Document {
  actorId: string;
  actorName: string;
  action: ActivityAction;
  module: ActivityModule;
  title: string;
  description: string;
  entityType?: string;
  entityId?: string;
  ipAddress?: string;
  userAgent?: string;
  severity?: ActivitySeverity;
  examNumber?: number;
  createdAt: Date;
}

export interface IRecordActivityInput {
  actorId: string;
  actorName: string;
  action: ActivityAction;
  module: ActivityModule;
  title: string;
  description: string;
  entityType?: string;
  entityId?: string;
  ipAddress?: string;
  userAgent?: string;
  severity?: ActivitySeverity;
  examNumber?: number;
}

export interface IRecordExamStartedInput {
  exam_number: number;
  sessionStartedAt: string;
}

export interface IActivityListFilters {
  search?: string;
  module?: string;
  action?: string;
  dateFrom?: string;
  dateTo?: string;
}

export interface IActivityListOptions {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export type ActivityListResult = {
  data: Record<string, unknown>[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};

export type ActivityNotificationPayload = NotificationEventPayload;
