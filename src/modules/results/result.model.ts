import { model, Schema, Types } from "mongoose";

// ইন্টারফেসগুলো এখানে উল্লেখ করা হলো (আপনার দেওয়া অংশ)
interface IwrittenExam {
  _id: string;
  question: string;
  answer: string;
}

export interface IResult {
  _id: string;
  user: Types.ObjectId;
  exam_number?: number;
  score: number;
  totalQuestions: number;
  correctAnswers: number;
  wrongAnswers: number;
  unanswered: number;
  is_cheted: boolean;
  is_on_time: boolean;
  dateTaken: Date;
  writtenExam: IwrittenExam[];
}

// ১. Written Exam এর জন্য সাব-স্কিমা (Sub-schema)
const WrittenExamSchema = new Schema<IwrittenExam>(
  {
    question: { type: String, required: true },
    answer: { type: String, required: true },
  },
  { _id: true }
);

// ২. মূল Result স্কিমা
const ResultSchema = new Schema<IResult>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    exam_number: {
      type: Number,
      required: false,
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
    is_cheted: {
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
