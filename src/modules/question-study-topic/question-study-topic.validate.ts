import z from "zod";
import { StudyTopicType } from "./question-study-topic.enum";

const studyTopicTypeSchema = z.enum(
  Object.values(StudyTopicType) as [string, ...string[]]
);

const create = z.object({
  body: z
    .object({
      name: z.string().min(1, "Name is required"),
      type: studyTopicTypeSchema,
    })
    .strict(),
});

const update = z.object({
  body: z
    .object({
      name: z.string().min(1).optional(),
      type: studyTopicTypeSchema.optional(),
    })
    .strict(),
});

export const questionStudyTopicValidations = {
  create,
  update,
};
