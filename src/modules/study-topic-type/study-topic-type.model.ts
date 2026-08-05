import { model, Schema } from "mongoose";
import { IStudyTopicType } from "./study-topic-type.interface";

const StudyTopicTypeSchema = new Schema<IStudyTopicType>(
  {
    value: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    label: { type: String, required: true, trim: true },
    position: { type: Number, default: 0, index: true },
    isDefault: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export const StudyTopicTypeModel = model<IStudyTopicType>(
  "StudyTopicType",
  StudyTopicTypeSchema
);
