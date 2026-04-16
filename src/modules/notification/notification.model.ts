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
  isRead: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
});

export const NotificationModel = model<INotification>(
  "Notification",
  notificationSchema
);
