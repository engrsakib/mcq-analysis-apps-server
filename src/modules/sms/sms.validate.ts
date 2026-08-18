import z from "zod";

const sendTest = z.object({
  body: z
    .object({
      number: z
        .string({ required_error: "Phone number is required" })
        .min(10, "Phone number is too short")
        .max(15, "Phone number is too long"),
      message: z
        .string({ required_error: "Message is required" })
        .min(1, "Message is required")
        .max(500, "Message must be at most 500 characters"),
    })
    .strict(),
});

const updateOtpConfig = z.object({
  body: z
    .object({
      maxAttempts: z
        .number({ required_error: "Max attempts is required" })
        .int("Max attempts must be an integer")
        .min(1, "Max attempts must be at least 1")
        .max(20, "Max attempts must be at most 20"),
      windowHours: z
        .number({ required_error: "Window hours is required" })
        .int("Window hours must be an integer")
        .min(1, "Window hours must be at least 1")
        .max(168, "Window hours must be at most 168"),
    })
    .strict(),
});

const clearOtpBlock = z.object({
  body: z
    .object({
      phone_number: z
        .string()
        .min(10, "Phone number is too short")
        .max(15, "Phone number is too long")
        .optional(),
      clear_all: z.boolean().optional(),
    })
    .strict()
    .refine(
      (data) => data.clear_all === true || Boolean(data.phone_number?.trim()),
      {
        message: "Provide phone_number or set clear_all to true",
      }
    ),
});

export const smsValidations = {
  sendTest,
  updateOtpConfig,
  clearOtpBlock,
};
