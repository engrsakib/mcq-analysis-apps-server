import { model, Schema } from "mongoose";
import {
  GUIDELINE_CATEGORY_ENUMS,
  GUIDELINE_STATUS,
  IGuideline,
} from "./guideline.interface";

const GuidelineSchema = new Schema<IGuideline>({
  guideline_number: { type: Number, required: false },
  title: {
    type: String,
    required: true,
    default: "write title here",
    unique: true,
  },
  category: {
    type: String,
    enum: Object.values(GUIDELINE_CATEGORY_ENUMS),
    required: true,
    default: GUIDELINE_CATEGORY_ENUMS.BCS_PREPARATION,
  },
  description: {
    type: String,
    required: true,
    default: "write description here",
  },
  status: {
    type: String,
    enum: Object.values(GUIDELINE_STATUS),
    required: true,
    default: GUIDELINE_STATUS.ACTIVE,
  },
  thumbnail_url: {
    type: String,
    required: true,
  },
});

export const GuidelineModel = model("Guideline", GuidelineSchema);
