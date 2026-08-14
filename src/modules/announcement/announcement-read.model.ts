import { model, Schema, Types } from "mongoose";
import { IAnnouncementRead } from "./announcement.interface";

const announcementReadSchema = new Schema<IAnnouncementRead>({
  user_id: { type: Schema.Types.ObjectId, ref: "User", required: true },
  announcement_id: {
    type: Schema.Types.ObjectId,
    ref: "Announcement",
    required: true,
  },
  dismissed_at: { type: Date, required: true, default: Date.now },
});

announcementReadSchema.index(
  { user_id: 1, announcement_id: 1 },
  { unique: true }
);

export const AnnouncementReadModel = model<IAnnouncementRead>(
  "AnnouncementRead",
  announcementReadSchema
);

export type AnnouncementReadDocument = IAnnouncementRead & {
  _id: Types.ObjectId;
};
