import z from "zod";
import { GUIDELINE_CATEGORY_ENUMS } from "./exam_routine.interface";

const categoryValues = Object.values(GUIDELINE_CATEGORY_ENUMS) as [
  string,
  ...string[],
];

const baseFields = {
  title: z.string().min(1, "Title is required").max(200),
  description: z.string().min(1, "Description is required"),
  thumbnail_url: z.string().optional(),
  exam_routine_url: z.string().url("Exam routine URL must be a valid URL"),
  category: z.enum(categoryValues, {
    message: "Category is required",
  }),
  post_date: z.coerce.date({ message: "Post date is required" }),
  position: z.number().int().min(0).optional(),
};

const create = z.object({
  body: z.object(baseFields).strict(),
});

const update = z.object({
  body: z.object(baseFields).partial().strict(),
});

export const examRoutineValidations = {
  create,
  update,
};
