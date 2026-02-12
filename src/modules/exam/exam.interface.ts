import { ObjectId } from "mongoose";

export enum NegativeMark {
  ZERO = 0,
  QUARTER = 0.25,
  HALF = 0.5,
  FULL = 1,
}

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
