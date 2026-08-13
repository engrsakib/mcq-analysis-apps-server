import z from "zod";
import { GUIDELINE_CATEGORY_ENUMS } from "./exam_routine.interface";

const categoryValues = Object.values(GUIDELINE_CATEGORY_ENUMS) as [
  string,
  ...string[],
];

const baseFields = {
  title: z.string().min(1, "Title is required").max(200),
  description: z.string().optional().default(""),
  thumbnail_url: z.string().optional(),
  exam_routine_url: z.string().min(1, "Exam routine URL is required"),
  category: z.enum(categoryValues).optional(),
  post_date: z.coerce.date().optional(),
  position: z.number().int().min(0).optional(),
};

const create = z.object({
  body: z
    .object({
      title: baseFields.title,
      exam_routine_url: baseFields.exam_routine_url,
      description: baseFields.description,
      thumbnail_url: baseFields.thumbnail_url,
      category: baseFields.category,
      post_date: baseFields.post_date,
      position: baseFields.position,
    })
    .strict(),
});

const update = z.object({
  body: z.object(baseFields).partial().strict(),
});

export const examRoutineValidations = {
  create,
  update,
};
