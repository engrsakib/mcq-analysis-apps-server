import { Types } from "mongoose";

export interface IAnnouncement {
  announcement_number?: number;
  title: string;
  body: string;
  link?: string;
  is_published: boolean;
}

export interface IAnnouncementRead {
  user_id: Types.ObjectId;
  announcement_id: Types.ObjectId;
  dismissed_at: Date;
}
