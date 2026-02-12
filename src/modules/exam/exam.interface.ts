import { ObjectId } from "mongoose";

export const NegativeMark = [0, 0.25, 0.5, 1] as const;
export type NegativeMark = (typeof NegativeMark)[number];
export interface IExam {
  exam_number?: number;
  exam_name: string;
  exam_date_time: Date;
  duration_minutes: number;
  total_marks: number;
  is_started: boolean;
  is_completed: boolean;
  is_published: boolean;
  negative_mark: NegativeMark;
  questions: ObjectId[];
}
