import { answerType, QuestionType } from "./question.enum";

export interface IQuestionBlank {
  id: number;
  options: string[];
  correctAnswer: string;
}

export interface IQuestion {
  examId?: number;
  title: string;
  description?: string;
  type: QuestionType;
  content: string;
  options?: string[];
  correctAnswer: string | IQuestionBlank[];
  mathFormula?: string;
  answerType: answerType;
  marks: number;
  answer: string | IQuestionBlank[];
}
