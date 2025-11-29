import { model, Schema } from "mongoose";
import { IQuestion, IQuestionBlank } from "./question.interface";
import { answerType, QuestionType } from "./question.enum";

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const QuestionBlankSchema = new Schema<IQuestionBlank>(
  {
    id: { type: Number, required: false },
    options: { type: [String], required: true, default: [] },
    correctAnswer: { type: String, required: true },
  },
  { _id: false }
);

const QuestionSchema = new Schema<IQuestion>(
  {
    questionId: { type: Number, required: true, unique: true },
    title: { type: String, required: true },

    description: { type: String },

    type: {
      type: String,
      enum: Object.values(QuestionType),
      default: QuestionType.GENERAL,
      required: true,
    },

    content: { type: String, required: false },

    options: {
      type: [String],
      default: [],
      required: false,
    },

    blanks: {
      type: Schema.Types.Mixed,
      default: [],
      required: false,
    },

    mathFormula: { type: String },

    answerType: {
      type: String,
      enum: Object.values(answerType),
      default: answerType.MCQ,
      required: true,
    },

    marks: { type: Number, required: true },

    answer: {
      type: Schema.Types.Mixed,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

export const QuestionModel = model<IQuestion>("Question", QuestionSchema);
