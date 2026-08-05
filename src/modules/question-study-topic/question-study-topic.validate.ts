import z from "zod";

const studyTopicTypeSchema = z
  .string()
  .max(50)
  .regex(/^[a-z0-9_]+$/, "Invalid study topic type");

const create = z.object({
  body: z
    .object({
      name: z.string().min(1, "Name is required"),
      type: studyTopicTypeSchema.optional(),
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
