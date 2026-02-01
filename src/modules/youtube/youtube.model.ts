import { model, Schema } from "mongoose";
import { IYoutube } from "./youtube.interface";

const youtubeSchema = new Schema<IYoutube>({
  video_number: { type: Number, required: false },
  title: { type: String, required: false },
  thumbnail_url: { type: String, required: false },
  video_url: { type: String, required: true },
  description: { type: String, required: false },
  is_published: { type: Boolean, required: true, default: false },
});

export const YoutubeModel = model("Youtube", youtubeSchema);
