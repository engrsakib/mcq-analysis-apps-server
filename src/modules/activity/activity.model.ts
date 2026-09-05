import { model, Schema } from "mongoose";
import { IAdminActivityLog } from "./activity.interface";

const ACTIVITY_ACTIONS = [
  "login",
  "logout",
  "created",
  "updated",
  "deleted",
  "registered",
  "submitted",
] as const;

const ACTIVITY_MODULES = [
  "study-plan",
  "exam-solution",
  "exam-routine",
  "youtube",
  "result",
  "books",
  "exam",
  "guideline",
  "announcement",
  "question",
  "user",
  "admin",
  "question-study-topic",
  "auth",
] as const;

const adminActivityLogSchema = new Schema<IAdminActivityLog>(
  {
    actorId: { type: String, required: true, trim: true, index: true },
    actorName: { type: String, required: true, trim: true, index: true },
    action: {
      type: String,
      enum: ACTIVITY_ACTIONS,
      required: true,
      index: true,
    },
    module: {
      type: String,
      enum: ACTIVITY_MODULES,
      required: true,
      index: true,
    },
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },
    entityType: { type: String, trim: true },
    entityId: { type: String, trim: true },
    ipAddress: { type: String, trim: true },
    userAgent: { type: String, trim: true },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

adminActivityLogSchema.index({ createdAt: -1 });
adminActivityLogSchema.index({ actorName: 1, createdAt: -1 });
adminActivityLogSchema.index({ module: 1, action: 1, createdAt: -1 });

export const AdminActivityLogModel = model<IAdminActivityLog>(
  "AdminActivityLog",
  adminActivityLogSchema
);
