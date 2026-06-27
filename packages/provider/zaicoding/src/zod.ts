import { z } from "zod";

export const ZaiCodingMessageSchema = z.object({
  role: z.enum(["system", "user", "assistant"]),
  content: z.string(),
});

export const ZaiCodingChatRequestSchema = z.object({
  model: z.string(),
  messages: z.array(ZaiCodingMessageSchema),
  temperature: z.number().optional(),
  max_tokens: z.number().optional(),
  stream: z.boolean().optional(),
});
