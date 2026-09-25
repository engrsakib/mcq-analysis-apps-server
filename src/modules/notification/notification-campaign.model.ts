import { model, Schema } from "mongoose";
import {
  INotificationCampaign,
  INotificationCampaignStats,
} from "./notification-campaign.interface";

const statsSchema = new Schema<INotificationCampaignStats>(
  {
    totalRecipients: { type: Number, default: 0 },
    inboxCreated: { type: Number, default: 0 },
    pushSent: { type: Number, default: 0 },
    pushSkippedNoToken: { type: Number, default: 0 },
    pushFailed: { type: Number, default: 0 },
  },
  { _id: false }
);

const notificationCampaignSchema = new Schema<INotificationCampaign>(
  {
    senderAdminId: { type: String, required: true, index: true },
    senderAdminName: { type: String, trim: true },
    subject: { type: String, required: true, trim: true },
    body: { type: String, required: true, trim: true },
    audienceMode: {
      type: String,
      enum: ["all", "selected"],
      required: true,
    },
    selectedPhoneNumbers: { type: [String], default: [] },
    resolvedUserIds: [{ type: Schema.Types.ObjectId, ref: "User" }],
    unresolvedPhones: { type: [String], default: [] },
    status: {
      type: String,
      enum: ["queued", "processing", "completed", "failed"],
      default: "queued",
      index: true,
    },
    stats: { type: statsSchema, default: () => ({}) },
    errorMessage: { type: String, trim: true },
    startedAt: { type: Date },
    completedAt: { type: Date },
  },
  { timestamps: true }
);

notificationCampaignSchema.index({ createdAt: -1 });

export const NotificationCampaignModel = model<INotificationCampaign>(
  "NotificationCampaign",
  notificationCampaignSchema
);
