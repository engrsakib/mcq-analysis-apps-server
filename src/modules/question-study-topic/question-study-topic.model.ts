import { model, Schema } from "mongoose";
import { IQuestionStudyTopic } from "./question-study-topic.interface";

const QuestionStudyTopicSchema = new Schema<IQuestionStudyTopic>(
  {
    category_number: {
      type: Number,
      required: true,
      unique: true,
      immutable: true,
    },
    name: { type: String, required: true, trim: true },
    type: {
      type: String,
      required: false,
      trim: true,
      lowercase: true,
      default: "",
    },
    position: { type: Number, default: 0, index: true },
  },
  { timestamps: true }
);

QuestionStudyTopicSchema.index({ type: 1, category_number: 1 });

export const QuestionStudyTopicModel = model<IQuestionStudyTopic>(
  "QuestionStudyTopic",
  QuestionStudyTopicSchema
);
