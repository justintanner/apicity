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
export const TelegramMessageIdListSchema = z
  .array(z.number().int())
  .min(1)
  .max(100);
export const TelegramReactionTypeSchema = TelegramRecordSchema;
export const TelegramInputMediaSchema = TelegramRecordSchema;
export const TelegramInputChecklistSchema = TelegramRecordSchema;
export const TelegramPollSchema = TelegramRecordSchema;

export type TelegramInputFile = z.infer<typeof TelegramInputFileSchema>;
export type TelegramInputMedia = z.infer<typeof TelegramInputMediaSchema>;
export type TelegramInputChecklist = z.infer<
  typeof TelegramInputChecklistSchema
>;

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

const messageTarget = {
  business_connection_id: z.string().optional(),
  chat_id: TelegramChatIdSchema.optional(),
  message_id: z.number().int().optional(),
  inline_message_id: z.string().optional(),
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

// ---------------------------------------------------------------------------
// POST /bot{token}/forwardMessage
// ---------------------------------------------------------------------------

export const TelegramForwardMessageRequestSchema = z.object({
  chat_id: TelegramChatIdSchema,
  message_thread_id: z.number().int().optional(),
  direct_messages_topic_id: z.number().int().optional(),
  from_chat_id: TelegramChatIdSchema,
  video_start_timestamp: z.number().int().optional(),
  disable_notification: z.boolean().optional(),
  protect_content: z.boolean().optional(),
  message_effect_id: z.string().optional(),
  suggested_post_parameters: TelegramRecordSchema.optional(),
  message_id: z.number().int(),
});

export type TelegramForwardMessageRequest = z.infer<
  typeof TelegramForwardMessageRequestSchema
>;

// ---------------------------------------------------------------------------
// POST /bot{token}/forwardMessages
// ---------------------------------------------------------------------------

export const TelegramForwardMessagesRequestSchema = z.object({
  chat_id: TelegramChatIdSchema,
  message_thread_id: z.number().int().optional(),
  direct_messages_topic_id: z.number().int().optional(),
  from_chat_id: TelegramChatIdSchema,
  message_ids: TelegramMessageIdListSchema,
  disable_notification: z.boolean().optional(),
  protect_content: z.boolean().optional(),
});

export type TelegramForwardMessagesRequest = z.infer<
  typeof TelegramForwardMessagesRequestSchema
>;

// ---------------------------------------------------------------------------
// POST /bot{token}/copyMessage
// ---------------------------------------------------------------------------

export const TelegramCopyMessageRequestSchema = z.object({
  chat_id: TelegramChatIdSchema,
  message_thread_id: z.number().int().optional(),
  direct_messages_topic_id: z.number().int().optional(),
  from_chat_id: TelegramChatIdSchema,
  message_id: z.number().int(),
  video_start_timestamp: z.number().int().optional(),
  ...captionFields,
  disable_notification: z.boolean().optional(),
  protect_content: z.boolean().optional(),
  allow_paid_broadcast: z.boolean().optional(),
  message_effect_id: z.string().optional(),
  suggested_post_parameters: TelegramRecordSchema.optional(),
  reply_parameters: TelegramRecordSchema.optional(),
  reply_markup: TelegramRecordSchema.optional(),
});

export type TelegramCopyMessageRequest = z.infer<
  typeof TelegramCopyMessageRequestSchema
>;

// ---------------------------------------------------------------------------
// POST /bot{token}/copyMessages
// ---------------------------------------------------------------------------

export const TelegramCopyMessagesRequestSchema = z.object({
  chat_id: TelegramChatIdSchema,
  message_thread_id: z.number().int().optional(),
  direct_messages_topic_id: z.number().int().optional(),
  from_chat_id: TelegramChatIdSchema,
  message_ids: TelegramMessageIdListSchema,
  disable_notification: z.boolean().optional(),
  protect_content: z.boolean().optional(),
  remove_caption: z.boolean().optional(),
});

export type TelegramCopyMessagesRequest = z.infer<
  typeof TelegramCopyMessagesRequestSchema
>;

// ---------------------------------------------------------------------------
// POST /bot{token}/deleteMessage
// ---------------------------------------------------------------------------

export const TelegramDeleteMessageRequestSchema = z.object({
  chat_id: TelegramChatIdSchema,
  message_id: z.number().int(),
});

export type TelegramDeleteMessageRequest = z.infer<
  typeof TelegramDeleteMessageRequestSchema
>;

// ---------------------------------------------------------------------------
// POST /bot{token}/deleteMessages
// ---------------------------------------------------------------------------

export const TelegramDeleteMessagesRequestSchema = z.object({
  chat_id: TelegramChatIdSchema,
  message_ids: TelegramMessageIdListSchema,
});

export type TelegramDeleteMessagesRequest = z.infer<
  typeof TelegramDeleteMessagesRequestSchema
>;

// ---------------------------------------------------------------------------
// POST /bot{token}/pinChatMessage
// ---------------------------------------------------------------------------

export const TelegramPinChatMessageRequestSchema = z.object({
  business_connection_id: z.string().optional(),
  chat_id: TelegramChatIdSchema,
  message_id: z.number().int(),
  disable_notification: z.boolean().optional(),
});

export type TelegramPinChatMessageRequest = z.infer<
  typeof TelegramPinChatMessageRequestSchema
>;

// ---------------------------------------------------------------------------
// POST /bot{token}/unpinChatMessage
// ---------------------------------------------------------------------------

export const TelegramUnpinChatMessageRequestSchema = z.object({
  business_connection_id: z.string().optional(),
  chat_id: TelegramChatIdSchema,
  message_id: z.number().int().optional(),
});

export type TelegramUnpinChatMessageRequest = z.infer<
  typeof TelegramUnpinChatMessageRequestSchema
>;

// ---------------------------------------------------------------------------
// POST /bot{token}/unpinAllChatMessages
// ---------------------------------------------------------------------------

export const TelegramUnpinAllChatMessagesRequestSchema = z.object({
  chat_id: TelegramChatIdSchema,
});

export type TelegramUnpinAllChatMessagesRequest = z.infer<
  typeof TelegramUnpinAllChatMessagesRequestSchema
>;

// ---------------------------------------------------------------------------
// POST /bot{token}/editMessageText
// ---------------------------------------------------------------------------

export const TelegramEditMessageTextRequestSchema = z.object({
  ...messageTarget,
  text: z.string().min(1).optional(),
  parse_mode: TelegramParseModeSchema.optional(),
  entities: TelegramEntitiesSchema.optional(),
  link_preview_options: TelegramRecordSchema.optional(),
  rich_message: TelegramRecordSchema.optional(),
  reply_markup: TelegramRecordSchema.optional(),
});

export type TelegramEditMessageTextRequest = z.infer<
  typeof TelegramEditMessageTextRequestSchema
>;

// ---------------------------------------------------------------------------
// POST /bot{token}/editMessageCaption
// ---------------------------------------------------------------------------

export const TelegramEditMessageCaptionRequestSchema = z.object({
  ...messageTarget,
  ...captionFields,
  reply_markup: TelegramRecordSchema.optional(),
});

export type TelegramEditMessageCaptionRequest = z.infer<
  typeof TelegramEditMessageCaptionRequestSchema
>;

// ---------------------------------------------------------------------------
// POST /bot{token}/editMessageMedia
// ---------------------------------------------------------------------------

export const TelegramEditMessageMediaRequestSchema = z.object({
  ...messageTarget,
  media: TelegramInputMediaSchema,
  reply_markup: TelegramRecordSchema.optional(),
});

export type TelegramEditMessageMediaRequest = z.infer<
  typeof TelegramEditMessageMediaRequestSchema
>;

// ---------------------------------------------------------------------------
// POST /bot{token}/editMessageLiveLocation
// ---------------------------------------------------------------------------

export const TelegramEditMessageLiveLocationRequestSchema = z.object({
  ...messageTarget,
  latitude: z.number(),
  longitude: z.number(),
  live_period: z.number().int().optional(),
  horizontal_accuracy: z.number().optional(),
  heading: z.number().int().optional(),
  proximity_alert_radius: z.number().int().optional(),
  reply_markup: TelegramRecordSchema.optional(),
});

export type TelegramEditMessageLiveLocationRequest = z.infer<
  typeof TelegramEditMessageLiveLocationRequestSchema
>;

// ---------------------------------------------------------------------------
// POST /bot{token}/stopMessageLiveLocation
// ---------------------------------------------------------------------------

export const TelegramStopMessageLiveLocationRequestSchema = z.object({
  ...messageTarget,
  reply_markup: TelegramRecordSchema.optional(),
});

export type TelegramStopMessageLiveLocationRequest = z.infer<
  typeof TelegramStopMessageLiveLocationRequestSchema
>;

// ---------------------------------------------------------------------------
// POST /bot{token}/editMessageChecklist
// ---------------------------------------------------------------------------

export const TelegramEditMessageChecklistRequestSchema = z.object({
  business_connection_id: z.string(),
  chat_id: TelegramChatIdSchema,
  message_id: z.number().int(),
  checklist: TelegramInputChecklistSchema,
  reply_markup: TelegramRecordSchema.optional(),
});

export type TelegramEditMessageChecklistRequest = z.infer<
  typeof TelegramEditMessageChecklistRequestSchema
>;

// ---------------------------------------------------------------------------
// POST /bot{token}/editMessageReplyMarkup
// ---------------------------------------------------------------------------

export const TelegramEditMessageReplyMarkupRequestSchema = z.object({
  ...messageTarget,
  reply_markup: TelegramRecordSchema.optional(),
});

export type TelegramEditMessageReplyMarkupRequest = z.infer<
  typeof TelegramEditMessageReplyMarkupRequestSchema
>;

// ---------------------------------------------------------------------------
// POST /bot{token}/stopPoll
// ---------------------------------------------------------------------------

export const TelegramStopPollRequestSchema = z.object({
  business_connection_id: z.string().optional(),
  chat_id: TelegramChatIdSchema,
  message_id: z.number().int(),
  reply_markup: TelegramRecordSchema.optional(),
});

export type TelegramStopPollRequest = z.infer<
  typeof TelegramStopPollRequestSchema
>;

// ---------------------------------------------------------------------------
// POST /bot{token}/setMessageReaction
// ---------------------------------------------------------------------------

export const TelegramSetMessageReactionRequestSchema = z.object({
  chat_id: TelegramChatIdSchema,
  message_id: z.number().int(),
  reaction: z.array(TelegramReactionTypeSchema).optional(),
  is_big: z.boolean().optional(),
});

export type TelegramSetMessageReactionRequest = z.infer<
  typeof TelegramSetMessageReactionRequestSchema
>;

// ---------------------------------------------------------------------------
// POST /bot{token}/deleteMessageReaction
// ---------------------------------------------------------------------------

export const TelegramDeleteMessageReactionRequestSchema = z.object({
  chat_id: TelegramChatIdSchema,
  message_id: z.number().int(),
  user_id: z.number().int().optional(),
  actor_chat_id: z.number().int().optional(),
});

export type TelegramDeleteMessageReactionRequest = z.infer<
  typeof TelegramDeleteMessageReactionRequestSchema
>;

// ---------------------------------------------------------------------------
// POST /bot{token}/deleteAllMessageReactions
// ---------------------------------------------------------------------------

export const TelegramDeleteAllMessageReactionsRequestSchema = z.object({
  chat_id: TelegramChatIdSchema,
  user_id: z.number().int().optional(),
  actor_chat_id: z.number().int().optional(),
});

export type TelegramDeleteAllMessageReactionsRequest = z.infer<
  typeof TelegramDeleteAllMessageReactionsRequestSchema
>;
