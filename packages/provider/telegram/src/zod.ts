import { z } from "zod";

// ---------------------------------------------------------------------------
// Provider options
// ---------------------------------------------------------------------------

export const TelegramOptionsSchema = z.object({
  botToken: z.string().min(1),
  baseURL: z.string().optional(),
  timeout: z.number().optional(),
  fetch: z.custom<typeof fetch>().optional(),
});

export type TelegramOptions = z.infer<typeof TelegramOptionsSchema>;

// ---------------------------------------------------------------------------
// Shared Telegram Bot API shapes
// ---------------------------------------------------------------------------

export const TelegramChatIdSchema = z.union([z.number().int(), z.string()]);
export const TelegramRecordSchema = z.record(z.string(), z.unknown());
export const TelegramEntitiesSchema = z.array(TelegramRecordSchema);
export const TelegramParseModeSchema = z.enum([
  "Markdown",
  "MarkdownV2",
  "HTML",
]);
export const TelegramInputFileSchema = z.union([
  z.string().min(1),
  z.instanceof(Blob),
]);

export type TelegramInputFile = z.infer<typeof TelegramInputFileSchema>;

const messageBase = {
  business_connection_id: z.string().optional(),
  chat_id: TelegramChatIdSchema,
  message_thread_id: z.number().int().optional(),
  direct_messages_topic_id: z.number().int().optional(),
  disable_notification: z.boolean().optional(),
  protect_content: z.boolean().optional(),
  allow_paid_broadcast: z.boolean().optional(),
  message_effect_id: z.string().optional(),
  suggested_post_parameters: TelegramRecordSchema.optional(),
  reply_parameters: TelegramRecordSchema.optional(),
  reply_markup: TelegramRecordSchema.optional(),
};

const captionFields = {
  caption: z.string().optional(),
  parse_mode: TelegramParseModeSchema.optional(),
  caption_entities: TelegramEntitiesSchema.optional(),
  show_caption_above_media: z.boolean().optional(),
};

// ---------------------------------------------------------------------------
// POST /bot{token}/sendMessage
// ---------------------------------------------------------------------------

export const TelegramSendMessageRequestSchema = z.object({
  ...messageBase,
  text: z.string().min(1),
  parse_mode: TelegramParseModeSchema.optional(),
  entities: TelegramEntitiesSchema.optional(),
  link_preview_options: TelegramRecordSchema.optional(),
});

export type TelegramSendMessageRequest = z.infer<
  typeof TelegramSendMessageRequestSchema
>;

// ---------------------------------------------------------------------------
// POST /bot{token}/sendPhoto
// ---------------------------------------------------------------------------

export const TelegramSendPhotoRequestSchema = z.object({
  ...messageBase,
  photo: TelegramInputFileSchema,
  ...captionFields,
  has_spoiler: z.boolean().optional(),
});

export type TelegramSendPhotoRequest = z.infer<
  typeof TelegramSendPhotoRequestSchema
>;

// ---------------------------------------------------------------------------
// POST /bot{token}/sendVideo
// ---------------------------------------------------------------------------

export const TelegramSendVideoRequestSchema = z.object({
  ...messageBase,
  video: TelegramInputFileSchema,
  duration: z.number().int().optional(),
  width: z.number().int().optional(),
  height: z.number().int().optional(),
  thumbnail: TelegramInputFileSchema.optional(),
  cover: TelegramInputFileSchema.optional(),
  start_timestamp: z.number().int().optional(),
  ...captionFields,
  has_spoiler: z.boolean().optional(),
  supports_streaming: z.boolean().optional(),
});

export type TelegramSendVideoRequest = z.infer<
  typeof TelegramSendVideoRequestSchema
>;

// ---------------------------------------------------------------------------
// POST /bot{token}/sendAudio
// ---------------------------------------------------------------------------

export const TelegramSendAudioRequestSchema = z.object({
  ...messageBase,
  audio: TelegramInputFileSchema,
  ...captionFields,
  duration: z.number().int().optional(),
  performer: z.string().optional(),
  title: z.string().optional(),
  thumbnail: TelegramInputFileSchema.optional(),
});

export type TelegramSendAudioRequest = z.infer<
  typeof TelegramSendAudioRequestSchema
>;
