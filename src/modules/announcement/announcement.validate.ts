import z from "zod";

const create = z.object({
  body: z
    .object({
      title: z.string().min(1, "Title is required").max(300),
      body: z.string().min(1, "Body is required"),
      link: z
        .string()
        .url("Link must be a valid URL")
        .optional()
        .or(z.literal("")),
      is_published: z.boolean().optional().default(true),
    })
    .strict(),
});

const update = z.object({
  body: z
    .object({
      title: z.string().min(1).max(300).optional(),
      body: z.string().min(1).optional(),
      link: z.string().url().optional().or(z.literal("")),
      is_published: z.boolean().optional(),
    })
    .strict(),
});

export const announcementValidations = {
  create,
  update,
};
