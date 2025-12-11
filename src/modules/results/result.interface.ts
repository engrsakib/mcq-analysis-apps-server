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
  is_on_time: boolean;
  dateTaken: Date;
  writtenExam: IwrittenExam[];
}
