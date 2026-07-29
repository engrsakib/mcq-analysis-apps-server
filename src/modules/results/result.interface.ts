export interface IwrittenExam {
  question: string;
  answer: string;
  _id?: string;
}

export interface IResult extends Document {
  student_name: string;
  student_phone: string;
  exam_number?: number;
  total_score: number;
  score: number;
  totalQuestions: number;
  correctAnswers: number;
  wrongAnswers: number;
  unanswered: number;
  is_cheated: boolean;
  is_written_mark_updated?: boolean;
  is_on_time: boolean;
  dateTaken: Date;
  writtenExam: IwrittenExam[];
}

export interface ICreateResultInput {
  exam_number: number;
  total_score: number;
  score: number;
  totalQuestions: number;
  correctAnswers: number;
  wrongAnswers: number;
  unanswered: number;
  is_cheated?: boolean;
  is_on_time?: boolean;
  writtenExam?: IwrittenExam[];
}

export type UpdateMarkAction = "increase_marks" | "decrease_marks";

export interface IUpdateMarkPayload {
  exam_number: number;
  student_phone?: string;
  amount: number;
  action: UpdateMarkAction;
}

export interface IRankedLeaderboardRow {
  rank: string | number | null;
  student_name: string;
  student_phone: string;
  exam_number: number;
  score: number;
}

export type MeritExportPhoneMode = "half" | "full";

export interface IMeritExportRow {
  rank: number;
  student_name: string;
  student_phone?: string;
  score: number;
}

export interface IMeritExportResult {
  exam_name: string;
  exam_date_time: string;
  exam_number: number;
  totalRanked: number;
  rows: IMeritExportRow[];
}
