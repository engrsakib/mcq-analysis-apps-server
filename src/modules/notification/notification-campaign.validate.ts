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
