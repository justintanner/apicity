// AUTO-GENERATED from shared/provider-src/chat-fragments-zod.ts; do not edit.
// Edit the canonical file and run `pnpm run gen:shared`.
import { z } from "zod";

export const ChatTextPartSchema = z.object({
  type: z.literal("text"),
  text: z.string(),
});

export const ChatImageUrlPartSchema = z.object({
  type: z.literal("image_url"),
  image_url: z.object({
    url: z.string(),
    detail: z.enum(["auto", "low", "high"]).optional(),
  }),
});

export const ChatContentPartSchema = z.discriminatedUnion("type", [
  ChatTextPartSchema,
  ChatImageUrlPartSchema,
]);

export const ChatToolFunctionSchema = z.object({
  name: z.string(),
  description: z.string().optional(),
  parameters: z.record(z.string(), z.unknown()).optional(),
});

export const ChatToolSchema = z.object({
  type: z.literal("function"),
  function: ChatToolFunctionSchema,
});

export const ChatToolChoiceSchema = z.union([
  z.enum(["auto", "none"]),
  z.object({
    type: z.literal("function"),
    function: z.object({ name: z.string() }),
  }),
]);
