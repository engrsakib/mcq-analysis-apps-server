import { model, Schema } from "mongoose";
import { IExam } from "./exam.interface";

const examSchema = new Schema<IExam>({
  exam_number: { type: Number, required: false },
  exam_name: { type: String, required: true },
  exam_date_time: { type: Date, required: true },
  duration_minutes: { type: Number, required: true },
  total_marks: { type: Number, required: true },
  is_started: { type: Boolean, required: true, default: false },
  is_completed: { type: Boolean, required: true, default: false },
  questions: [{ type: Schema.Types.ObjectId, ref: "Question", required: true }],
  is_published: { type: Boolean, required: true, default: false },
});

export const ExamModel = model<IExam>("Exam", examSchema);
