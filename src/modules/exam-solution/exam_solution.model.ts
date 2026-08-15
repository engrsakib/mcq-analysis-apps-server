import { Schema, model } from "mongoose";
import { EXAM_SOLUTION_STATUS, IExamSolution } from "./exam_solution.interface";

const examSolutionSchema = new Schema<IExamSolution>(
  {
    exam_solution_number: {
      type: Number,
      default: 0,
    },
    position: {
      type: Number,
      default: 0,
      index: true,
    },
    title: {
      type: String,
      required: [true, "Title is required"],
      trim: true,
    },
    description: {
      type: String,
      required: [true, "Description is required"],
    },
    status: {
      type: String,
      enum: {
        values: Object.values(EXAM_SOLUTION_STATUS),
        message: "{VALUE} is not a valid status",
      },
      default: EXAM_SOLUTION_STATUS.INACTIVE,
    },
    thumbnail_url: {
      type: String,
      required: false,
    },
    exam_solution_url: {
      type: String,
      required: [true, "Exam solution URL is required"],
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
    },
  }
);

examSolutionSchema.index({ status: 1, title: 1 });

export const ExamSolution = model<IExamSolution>(
  "ExamSolution",
  examSolutionSchema
);
