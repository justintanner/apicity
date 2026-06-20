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

const locationFields = {
  latitude: z.number(),
  longitude: z.number(),
};

export const TelegramInputMediaSchema = z
  .object({
    type: z.string().min(1),
    media: TelegramInputFileSchema,
    thumbnail: TelegramInputFileSchema.optional(),
    ...captionFields,
    parse_mode: TelegramParseModeSchema.optional(),
    has_spoiler: z.boolean().optional(),
  })
  .passthrough();

export const TelegramInputPaidMediaSchema = z
  .object({
    type: z.string().min(1),
    media: TelegramInputFileSchema,
    thumbnail: TelegramInputFileSchema.optional(),
  })
  .passthrough();

export const TelegramInputPollMediaSchema = z
  .object({
    type: z.string().min(1),
    media: TelegramInputFileSchema,
  })
  .passthrough();

export const TelegramInputPollOptionSchema = z
  .object({
    text: z.string().min(1),
    text_parse_mode: TelegramParseModeSchema.optional(),
    text_entities: TelegramEntitiesSchema.optional(),
    media: TelegramInputPollMediaSchema.optional(),
  })
  .passthrough();

export const TelegramRichMessageSchema = TelegramRecordSchema;
export const TelegramInputChecklistSchema = TelegramRecordSchema;

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
// POST /bot{token}/sendLivePhoto
// ---------------------------------------------------------------------------

export const TelegramSendLivePhotoRequestSchema = z.object({
  ...messageBase,
  live_photo: TelegramInputFileSchema,
  photo: TelegramInputFileSchema,
  ...captionFields,
  has_spoiler: z.boolean().optional(),
});

export type TelegramSendLivePhotoRequest = z.infer<
  typeof TelegramSendLivePhotoRequestSchema
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
// POST /bot{token}/sendDocument
// ---------------------------------------------------------------------------

export const TelegramSendDocumentRequestSchema = z.object({
  ...messageBase,
  document: TelegramInputFileSchema,
  thumbnail: TelegramInputFileSchema.optional(),
  ...captionFields,
  disable_content_type_detection: z.boolean().optional(),
});

export type TelegramSendDocumentRequest = z.infer<
  typeof TelegramSendDocumentRequestSchema
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
// POST /bot{token}/sendAnimation
// ---------------------------------------------------------------------------

export const TelegramSendAnimationRequestSchema = z.object({
  ...messageBase,
  animation: TelegramInputFileSchema,
  duration: z.number().int().optional(),
  width: z.number().int().optional(),
  height: z.number().int().optional(),
  thumbnail: TelegramInputFileSchema.optional(),
  ...captionFields,
  has_spoiler: z.boolean().optional(),
});

export type TelegramSendAnimationRequest = z.infer<
  typeof TelegramSendAnimationRequestSchema
>;

// ---------------------------------------------------------------------------
// POST /bot{token}/sendVoice
// ---------------------------------------------------------------------------

export const TelegramSendVoiceRequestSchema = z.object({
  ...messageBase,
  voice: TelegramInputFileSchema,
  ...captionFields,
  duration: z.number().int().optional(),
});

export type TelegramSendVoiceRequest = z.infer<
  typeof TelegramSendVoiceRequestSchema
>;

// ---------------------------------------------------------------------------
// POST /bot{token}/sendVideoNote
// ---------------------------------------------------------------------------

export const TelegramSendVideoNoteRequestSchema = z.object({
  ...messageBase,
  video_note: TelegramInputFileSchema,
  duration: z.number().int().optional(),
  length: z.number().int().optional(),
  thumbnail: TelegramInputFileSchema.optional(),
});

export type TelegramSendVideoNoteRequest = z.infer<
  typeof TelegramSendVideoNoteRequestSchema
>;

// ---------------------------------------------------------------------------
// POST /bot{token}/sendPaidMedia
// ---------------------------------------------------------------------------

export const TelegramSendPaidMediaRequestSchema = z.object({
  ...messageBase,
  star_count: z.number().int().min(1),
  media: z.array(TelegramInputPaidMediaSchema).min(1).max(10),
  payload: z.string().optional(),
  ...captionFields,
});

export type TelegramSendPaidMediaRequest = z.infer<
  typeof TelegramSendPaidMediaRequestSchema
>;

// ---------------------------------------------------------------------------
// POST /bot{token}/sendMediaGroup
// ---------------------------------------------------------------------------

export const TelegramSendMediaGroupRequestSchema = z.object({
  business_connection_id: z.string().optional(),
  chat_id: TelegramChatIdSchema,
  message_thread_id: z.number().int().optional(),
  direct_messages_topic_id: z.number().int().optional(),
  media: z.array(TelegramInputMediaSchema).min(2).max(10),
  disable_notification: z.boolean().optional(),
  protect_content: z.boolean().optional(),
  allow_paid_broadcast: z.boolean().optional(),
  message_effect_id: z.string().optional(),
  reply_parameters: TelegramRecordSchema.optional(),
});

export type TelegramSendMediaGroupRequest = z.infer<
  typeof TelegramSendMediaGroupRequestSchema
>;

// ---------------------------------------------------------------------------
// POST /bot{token}/sendLocation
// ---------------------------------------------------------------------------

export const TelegramSendLocationRequestSchema = z.object({
  ...messageBase,
  ...locationFields,
  horizontal_accuracy: z.number().optional(),
  live_period: z.number().int().optional(),
  heading: z.number().int().optional(),
  proximity_alert_radius: z.number().int().optional(),
});

export type TelegramSendLocationRequest = z.infer<
  typeof TelegramSendLocationRequestSchema
>;

// ---------------------------------------------------------------------------
// POST /bot{token}/sendVenue
// ---------------------------------------------------------------------------

export const TelegramSendVenueRequestSchema = z.object({
  ...messageBase,
  ...locationFields,
  title: z.string().min(1),
  address: z.string().min(1),
  foursquare_id: z.string().optional(),
  foursquare_type: z.string().optional(),
  google_place_id: z.string().optional(),
  google_place_type: z.string().optional(),
});

export type TelegramSendVenueRequest = z.infer<
  typeof TelegramSendVenueRequestSchema
>;

// ---------------------------------------------------------------------------
// POST /bot{token}/sendContact
// ---------------------------------------------------------------------------

export const TelegramSendContactRequestSchema = z.object({
  ...messageBase,
  phone_number: z.string().min(1),
  first_name: z.string().min(1),
  last_name: z.string().optional(),
  vcard: z.string().optional(),
});

export type TelegramSendContactRequest = z.infer<
  typeof TelegramSendContactRequestSchema
>;

// ---------------------------------------------------------------------------
// POST /bot{token}/sendPoll
// ---------------------------------------------------------------------------

export const TelegramSendPollRequestSchema = z.object({
  business_connection_id: z.string().optional(),
  chat_id: TelegramChatIdSchema,
  message_thread_id: z.number().int().optional(),
  question: z.string().min(1),
  question_parse_mode: TelegramParseModeSchema.optional(),
  question_entities: TelegramEntitiesSchema.optional(),
  options: z.array(TelegramInputPollOptionSchema).min(1).max(12),
  is_anonymous: z.boolean().optional(),
  type: z.enum(["regular", "quiz"]).optional(),
  allows_multiple_answers: z.boolean().optional(),
  correct_option_ids: z.array(z.number().int()).optional(),
  is_closed: z.boolean().optional(),
  explanation: z.string().optional(),
  explanation_parse_mode: TelegramParseModeSchema.optional(),
  explanation_entities: TelegramEntitiesSchema.optional(),
  open_period: z.number().int().optional(),
  close_date: z.number().int().optional(),
  allows_revoting: z.boolean().optional(),
  shuffle_options: z.boolean().optional(),
  allow_adding_options: z.boolean().optional(),
  hide_results_until_closes: z.boolean().optional(),
  media: TelegramInputPollMediaSchema.optional(),
  explanation_media: TelegramInputPollMediaSchema.optional(),
  members_only: z.boolean().optional(),
  country_codes: z.array(z.string()).optional(),
  disable_notification: z.boolean().optional(),
  protect_content: z.boolean().optional(),
  allow_paid_broadcast: z.boolean().optional(),
  message_effect_id: z.string().optional(),
  reply_parameters: TelegramRecordSchema.optional(),
  reply_markup: TelegramRecordSchema.optional(),
});

export type TelegramSendPollRequest = z.infer<
  typeof TelegramSendPollRequestSchema
>;

// ---------------------------------------------------------------------------
// POST /bot{token}/sendChecklist
// ---------------------------------------------------------------------------

export const TelegramSendChecklistRequestSchema = z.object({
  business_connection_id: z.string().min(1),
  chat_id: TelegramChatIdSchema,
  checklist: TelegramInputChecklistSchema,
  disable_notification: z.boolean().optional(),
  protect_content: z.boolean().optional(),
  message_effect_id: z.string().optional(),
  reply_parameters: TelegramRecordSchema.optional(),
  reply_markup: TelegramRecordSchema.optional(),
});

export type TelegramSendChecklistRequest = z.infer<
  typeof TelegramSendChecklistRequestSchema
>;

// ---------------------------------------------------------------------------
// POST /bot{token}/sendDice
// ---------------------------------------------------------------------------

export const TelegramSendDiceRequestSchema = z.object({
  ...messageBase,
  emoji: z.string().optional(),
});

export type TelegramSendDiceRequest = z.infer<
  typeof TelegramSendDiceRequestSchema
>;

// ---------------------------------------------------------------------------
// POST /bot{token}/sendMessageDraft
// ---------------------------------------------------------------------------

export const TelegramSendMessageDraftRequestSchema = z.object({
  chat_id: z.number().int(),
  message_thread_id: z.number().int().optional(),
  draft_id: z.number().int(),
  text: z.string().optional(),
  parse_mode: TelegramParseModeSchema.optional(),
  entities: TelegramEntitiesSchema.optional(),
});

export type TelegramSendMessageDraftRequest = z.infer<
  typeof TelegramSendMessageDraftRequestSchema
>;

// ---------------------------------------------------------------------------
// POST /bot{token}/sendChatAction
// ---------------------------------------------------------------------------

export const TelegramSendChatActionRequestSchema = z.object({
  business_connection_id: z.string().optional(),
  chat_id: TelegramChatIdSchema,
  message_thread_id: z.number().int().optional(),
  action: z.string().min(1),
});

export type TelegramSendChatActionRequest = z.infer<
  typeof TelegramSendChatActionRequestSchema
>;

// ---------------------------------------------------------------------------
// POST /bot{token}/sendRichMessage
// ---------------------------------------------------------------------------

export const TelegramSendRichMessageRequestSchema = z.object({
  ...messageBase,
  rich_message: TelegramRichMessageSchema,
});

export type TelegramSendRichMessageRequest = z.infer<
  typeof TelegramSendRichMessageRequestSchema
>;

// ---------------------------------------------------------------------------
// POST /bot{token}/sendRichMessageDraft
// ---------------------------------------------------------------------------

export const TelegramSendRichMessageDraftRequestSchema = z.object({
  chat_id: z.number().int(),
  message_thread_id: z.number().int().optional(),
  draft_id: z.number().int(),
  rich_message: TelegramRichMessageSchema,
});

export type TelegramSendRichMessageDraftRequest = z.infer<
  typeof TelegramSendRichMessageDraftRequestSchema
>;
