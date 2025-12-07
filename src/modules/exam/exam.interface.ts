import { ObjectId } from "mongoose";

export interface IExam {
  exam_number?: number;
  exam_name: string;
  exam_date_time: Date;
  duration_minutes: number;
  total_marks: number;
  is_started: boolean;
  is_completed: boolean;
  questions: ObjectId[];
  is_published: boolean;
}
