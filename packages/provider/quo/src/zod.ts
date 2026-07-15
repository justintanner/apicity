import { z } from "zod";

export const QuoE164PhoneNumberSchema = z.string().regex(/^\+[1-9]\d{1,14}$/);

export const QuoPhoneNumberIdSchema = z.string().regex(/^PN[A-Za-z0-9]+$/);

export const QuoUserIdSchema = z.string().regex(/^US[A-Za-z0-9]+$/);

export const QuoSendMessageRequestSchema = z.object({
  content: z
    .string()
    .min(1)
    .max(1600)
    .refine((content) => content.trim().length > 0, {
      message: "Message content must include a non-whitespace character",
    }),
  from: z.union([QuoPhoneNumberIdSchema, QuoE164PhoneNumberSchema]),
  to: z.array(QuoE164PhoneNumberSchema).min(1).max(10),
  /** @deprecated Use `from` instead. */
  phoneNumberId: QuoPhoneNumberIdSchema.optional(),
  userId: QuoUserIdSchema.optional(),
  setInboxStatus: z.literal("done").optional(),
});

export type QuoSendMessageInput = z.input<typeof QuoSendMessageRequestSchema>;
export type QuoSendMessageParsed = z.output<typeof QuoSendMessageRequestSchema>;
