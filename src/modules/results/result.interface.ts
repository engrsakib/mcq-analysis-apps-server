import { Types } from "mongoose";

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
