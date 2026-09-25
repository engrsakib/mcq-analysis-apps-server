import { Document, Types } from "mongoose";

export type NotificationCampaignAudienceMode = "all" | "selected";

export type NotificationCampaignStatus =
  | "queued"
  | "processing"
  | "completed"
  | "failed";

export interface INotificationCampaignStats {
  totalRecipients: number;
  inboxCreated: number;
  pushSent: number;
  pushSkippedNoToken: number;
  pushFailed: number;
}

export interface INotificationCampaign extends Document {
  senderAdminId: string;
  senderAdminName?: string;
  subject: string;
  body: string;
  audienceMode: NotificationCampaignAudienceMode;
  selectedPhoneNumbers: string[];
  resolvedUserIds: Types.ObjectId[];
  unresolvedPhones: string[];
  status: NotificationCampaignStatus;
  stats: INotificationCampaignStats;
  errorMessage?: string;
  startedAt?: Date;
  completedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateNotificationCampaignInput {
  subject: string;
  body: string;
  audienceMode: NotificationCampaignAudienceMode;
  phoneNumbers?: string[];
}
