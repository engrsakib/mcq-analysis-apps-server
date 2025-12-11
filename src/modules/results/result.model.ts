import { model, Schema } from "mongoose";
import { IResult, IwrittenExam } from "./result.interface";

const WrittenExamSchema = new Schema<IwrittenExam>(
  {
    question: { type: String, required: true },
    answer: { type: String, required: true },
  },
  { _id: true }
);

const ResultSchema = new Schema<IResult>(
  {
    student_name: {
      type: String,
      required: true,
    },
    student_phone: {
      type: String,
      required: true,
      default: "",
    },
    exam_number: {
      type: Number,
      required: false,
    },
    total_score: {
      type: Number,
      required: true,
    },
    score: {
      type: Number,
      required: true,
      default: 0,
    },
    totalQuestions: {
      type: Number,
      required: true,
    },
    correctAnswers: {
      type: Number,
      required: true,
      default: 0,
    },
    wrongAnswers: {
      type: Number,
      required: true,
      default: 0,
    },
    unanswered: {
      type: Number,
      required: true,
      default: 0,
    },
    is_cheated: {
      type: Boolean,
      required: true,
      default: false,
    },
    is_on_time: {
      type: Boolean,
      required: true,
      default: true,
    },
    dateTaken: {
      type: Date,
      required: true,
      default: Date.now,
    },
    writtenExam: {
      type: [WrittenExamSchema],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

export const ResultModel = model<IResult>("Result", ResultSchema);
