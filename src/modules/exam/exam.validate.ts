import z from "zod";
import { DEFAULT_EXAM_SUBJECT, EXAM_SUBJECTS } from "./exam.constants";
import { NegativeMark } from "./exam.interface";

const subjectValues = [...EXAM_SUBJECTS] as [string, ...string[]];

const subjectSchema = z.enum(subjectValues, {
  invalid_type_error: "Subject must be a string",
  required_error: "Subject is required",
});

const create = z.object({
  body: z
    .object({
      exam_name: z.string().min(1, "Exam name is required"),
      subject: subjectSchema.optional().default(DEFAULT_EXAM_SUBJECT),
      exam_date_time: z.coerce.date({
        required_error: "Exam date and time is required",
      }),
      duration_minutes: z.coerce
        .number()
        .int()
        .positive("Duration must be greater than 0"),
      total_marks: z.coerce
        .number()
        .int()
        .positive("Total marks must be greater than 0"),
      negative_mark: z
        .union([
          z.literal(NegativeMark[0]),
          z.literal(NegativeMark[1]),
          z.literal(NegativeMark[2]),
          z.literal(NegativeMark[3]),
        ])
        .optional(),
      questions: z
        .array(z.string().min(1, "Question id is required"))
        .min(1, "At least one question is required"),
    })
    .strict(),
});

const update = z.object({
  body: z
    .object({
      exam_name: z.string().min(1, "Exam name is required").optional(),
      subject: subjectSchema.optional(),
      exam_date_time: z.coerce.date().optional(),
      duration_minutes: z.coerce
        .number()
        .int()
        .positive("Duration must be greater than 0")
        .optional(),
      total_marks: z.coerce
        .number()
        .int()
        .positive("Total marks must be greater than 0")
        .optional(),
      negative_mark: z
        .union([
          z.literal(NegativeMark[0]),
          z.literal(NegativeMark[1]),
          z.literal(NegativeMark[2]),
          z.literal(NegativeMark[3]),
        ])
        .optional(),
      questions: z
        .array(z.string().min(1, "Question id is required"))
        .min(1, "At least one question is required")
        .optional(),
    })
    .strict(),
});

export const examValidations = {
  create,
  update,
};
