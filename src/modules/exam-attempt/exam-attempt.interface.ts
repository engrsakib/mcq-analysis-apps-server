import { Document } from "mongoose";
import { IwrittenExam } from "../results/result.interface";

export interface IExamAttempt extends Document {
  student_name: string;
  student_phone: string;
  exam_number: number;
  attempt_number: number;
  is_official: boolean;
  total_score: number;
  score: number;
  totalQuestions: number;
  correctAnswers: number;
  wrongAnswers: number;
  unanswered: number;
  is_cheated: boolean;
  is_on_time: boolean;
  dateTaken: Date;
  writtenExam: IwrittenExam[];
  createdAt?: Date;
  updatedAt?: Date;
}
