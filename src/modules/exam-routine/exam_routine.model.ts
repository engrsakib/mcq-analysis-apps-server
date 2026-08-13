import { Schema, model } from "mongoose";
import {
  GUIDELINE_CATEGORY_ENUMS,
  GUIDELINE_STATUS,
  IExamRoutine,
} from "./exam_routine.interface";

const examRoutineSchema = new Schema<IExamRoutine>(
  {
    exam_routine_number: {
      type: Number,
      default: 0,
    },
    position: {
      type: Number,
      default: 0,
      index: true,
    },
    title: {
      type: String,
      required: [true, "Title is required"],
      trim: true,
    },
    description: {
      type: String,
      default: "",
    },
    status: {
      type: String,
      enum: {
        values: Object.values(GUIDELINE_STATUS),
        message: "{VALUE} is not a valid status",
      },
      default: GUIDELINE_STATUS.INACTIVE,
    },
    thumbnail_url: {
      type: String,
      required: false,
    },
    exam_routine_url: {
      type: String,
      required: [true, "Exam routine URL is required"],
    },
    category: {
      type: String,
      enum: {
        values: Object.values(GUIDELINE_CATEGORY_ENUMS),
        message: "{VALUE} is not a valid category",
      },
      default: GUIDELINE_CATEGORY_ENUMS.GENERAL,
    },
    post_date: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
    },
  }
);

examRoutineSchema.index({ status: 1, title: 1 });
examRoutineSchema.index({ post_date: -1 });

export const ExamRoutine = model<IExamRoutine>(
  "ExamRoutine",
  examRoutineSchema
);
