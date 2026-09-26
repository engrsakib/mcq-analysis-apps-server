import { z } from "zod";
import {
  countWords,
  MAX_CAMPAIGN_BODY_WORDS,
  normalizePhoneList,
} from "./notification-campaign.utils";

const audienceSchema = z.enum(["all", "selected"]);

export const createNotificationCampaignSchema = z
  .object({
    subject: z
      .string()
      .trim()
      .min(1, "Subject is required")
      .max(200, "Subject must be at most 200 characters"),
    body: z.string().trim().min(1, "Message body is required"),
    audienceMode: audienceSchema,
    phoneNumbers: z.array(z.string()).optional(),
  })
  .superRefine((data, ctx) => {
    const wordCount = countWords(data.body);
    if (wordCount > MAX_CAMPAIGN_BODY_WORDS) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `Message body must be at most ${MAX_CAMPAIGN_BODY_WORDS} words (got ${wordCount})`,
        path: ["body"],
      });
    }

    if (data.audienceMode === "selected") {
      const phones = data.phoneNumbers ?? [];
      if (phones.length === 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message:
            "At least one phone number is required for selected audience",
          path: ["phoneNumbers"],
        });
        return;
      }
      const { invalid } = normalizePhoneList(phones);
      if (invalid.length > 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `Invalid phone number format: ${invalid.join(", ")}`,
          path: ["phoneNumbers"],
        });
      }
    }
  });

export type CreateNotificationCampaignBody = z.infer<
  typeof createNotificationCampaignSchema
>;

const isoDateString = z
  .string()
  .trim()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be YYYY-MM-DD")
  .optional();

export const listCampaignsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(50).optional(),
  status: z.enum(["queued", "processing", "completed", "failed"]).optional(),
  audienceMode: z.enum(["all", "selected"]).optional(),
  dateFrom: isoDateString,
  dateTo: isoDateString,
  search: z.string().trim().max(100).optional(),
});

export const listCampaignRecipientsQuerySchema = z
  .object({
    segment: z.enum(["browse", "not_attended", "top_by_exam"]),
    page: z.coerce.number().int().min(1).optional(),
    limit: z.coerce.number().int().min(1).max(50).optional(),
    search: z.string().trim().max(100).optional(),
    examNumber: z.coerce.number().int().positive().optional(),
    topN: z.coerce.number().int().min(1).max(200).optional(),
  })
  .superRefine((data, ctx) => {
    if (
      (data.segment === "not_attended" || data.segment === "top_by_exam") &&
      !data.examNumber
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "examNumber is required for this segment",
        path: ["examNumber"],
      });
    }
  });
