import { model, Schema } from "mongoose";
import { IAnnouncement } from "./announcement.interface";

const announcementSchema = new Schema<IAnnouncement>(
  {
    announcement_number: { type: Number, required: false },
    title: { type: String, required: true, trim: true },
    body: { type: String, required: true },
    link: { type: String, required: false, default: "" },
    is_published: { type: Boolean, required: true, default: true },
  },
  { timestamps: true }
);

announcementSchema.index({ is_published: 1, createdAt: -1 });

export const AnnouncementModel = model<IAnnouncement>(
  "Announcement",
  announcementSchema
);
