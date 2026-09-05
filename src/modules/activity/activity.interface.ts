import { Document } from "mongoose";
import {
  NotificationAction,
  NotificationEventPayload,
  NotificationModuleName,
} from "@/events/EventTypes";

export type AuthActivityAction = "login" | "logout";

export type ActivityAction = NotificationAction | AuthActivityAction;

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
