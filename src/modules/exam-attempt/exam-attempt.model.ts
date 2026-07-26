import { model, Schema } from "mongoose";
import { IExamAttempt } from "./exam-attempt.interface";

const WrittenExamSchema = new Schema(
  {
    question: { type: String, required: true },
    answer: { type: String, required: true },
  },
  { _id: true }
);

const ExamAttemptSchema = new Schema<IExamAttempt>(
  {
    student_name: { type: String, required: true },
    student_phone: { type: String, required: true },
    exam_number: { type: Number, required: true },
    attempt_number: { type: Number, required: true },
    is_official: { type: Boolean, required: true, default: false },
    total_score: { type: Number, required: true },
    score: { type: Number, required: true, default: 0 },
    totalQuestions: { type: Number, required: true },
    correctAnswers: { type: Number, required: true, default: 0 },
    wrongAnswers: { type: Number, required: true, default: 0 },
    unanswered: { type: Number, required: true, default: 0 },
    is_cheated: { type: Boolean, required: true, default: false },
    is_on_time: { type: Boolean, required: true, default: true },
    dateTaken: { type: Date, required: true, default: Date.now },
    writtenExam: { type: [WrittenExamSchema], default: [] },
  },
  { timestamps: true }
);

ExamAttemptSchema.index({
  exam_number: 1,
  student_phone: 1,
  attempt_number: 1,
});
ExamAttemptSchema.index({ exam_number: 1, student_phone: 1, createdAt: -1 });

export const ExamAttemptModel = model<IExamAttempt>(
  "ExamAttempt",
  ExamAttemptSchema
);
