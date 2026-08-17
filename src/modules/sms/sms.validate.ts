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

export const smsValidations = {
  sendTest,
};
