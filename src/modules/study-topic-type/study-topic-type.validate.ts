import z from "zod";

const create = z.object({
  body: z
    .object({
      label: z.string().min(1, "Label is required").max(100),
      value: z
        .string()
        .min(1)
        .max(50)
        .regex(
          /^[a-z0-9_]+$/,
          "Value must be lowercase letters, numbers, or underscores"
        )
        .optional(),
    })
    .strict(),
});

export const studyTopicTypeValidations = {
  create,
};
