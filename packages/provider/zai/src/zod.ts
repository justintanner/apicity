import { z } from "zod";

export const ZaiMessageSchema = z.object({
  role: z.enum(["system", "user", "assistant"]),
  content: z.string(),
});

export const ZaiChatRequestSchema = z.object({
  model: z.string(),
  messages: z.array(ZaiMessageSchema),
  temperature: z.number().optional(),
  max_tokens: z.number().optional(),
  stream: z.boolean().optional(),
});
