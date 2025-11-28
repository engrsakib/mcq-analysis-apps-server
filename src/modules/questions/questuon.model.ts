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
    examId: { type: Number },
    title: { type: String, required: true },

    description: { type: String },

    type: {
      type: String,
      enum: Object.values(QuestionType),
      required: true,
    },

    content: { type: String, required: true },

    options: {
      type: [String],
      default: [],
    },

    blanks: {
      type: Schema.Types.Mixed,
      default: [],
    },

    mathFormula: { type: String },

    answerType: {
      type: String,
      enum: Object.values(answerType),
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
