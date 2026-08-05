import { model, Schema } from "mongoose";
import {
  INotification,
  NotificationModuleEnum,
} from "@/modules/notification/notification.interface";

const notificationSchema = new Schema<INotification>({
  title: { type: String, required: true, trim: true },
  description: { type: String, required: true, trim: true },
  module: {
    type: String,
    enum: Object.values(NotificationModuleEnum),
    required: true,
  },
  userId: { type: String, required: true, index: true },
  time: { type: String, required: true },
  isRead: { type: Boolean, default: false },
  actorName: { type: String, trim: true },
  actorId: { type: String, trim: true },
  action: {
    type: String,
    enum: ["created", "updated", "deleted", "registered", "submitted"],
  },
  entityType: { type: String, trim: true },
  entityId: { type: String, trim: true },
  audience: {
    type: String,
    enum: ["admin", "user"],
    default: "user",
  },
  createdAt: { type: Date, default: Date.now },
});

notificationSchema.index({ userId: 1, audience: 1, createdAt: -1 });

export const NotificationModel = model<INotification>(
  "Notification",
  notificationSchema
);
