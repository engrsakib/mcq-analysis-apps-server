import { Schema, model } from "mongoose";
import {
  GUIDELINE_CATEGORY_ENUMS,
  GUIDELINE_STATUS,
  IstudyPlan,
} from "./study_plan.interface";

const studyPlanSchema = new Schema<IstudyPlan>(
  {
    study_plan_number: {
      type: Number,
      default: 0,
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
        values: Object.values(GUIDELINE_STATUS),
        message: "{VALUE} is not a valid status",
      },
      default: GUIDELINE_STATUS.INACTIVE,
    },
    thumbnail_url: {
      type: String,
      default: "",
    },
    study_plan_url: {
      type: String,
      required: [true, "Study plan URL is required"],
    },
    category: {
      type: String,
      enum: {
        values: Object.values(GUIDELINE_CATEGORY_ENUMS),
        message: "{VALUE} is not a valid category",
      },
      required: [true, "Category is required"],
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
    },
  }
);

export const StudyPlan = model<IstudyPlan>("StudyPlan", studyPlanSchema);
