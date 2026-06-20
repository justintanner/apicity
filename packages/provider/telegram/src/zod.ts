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
export const TelegramEmptyRequestSchema = z.object({}).strict();
export const TelegramAllowedUpdatesSchema = z.array(z.string().min(1));
export const TelegramBotCommandSchema = z.object({
  command: z
    .string()
    .min(1)
    .max(32)
    .regex(/^[a-z0-9_]+$/),
  description: z.string().min(1).max(256),
});
export const TelegramBotCommandScopeSchema = TelegramRecordSchema;
export const TelegramMenuButtonSchema = TelegramRecordSchema;
export const TelegramChatAdministratorRightsSchema = TelegramRecordSchema;

export type TelegramInputFile = z.infer<typeof TelegramInputFileSchema>;
export type TelegramEmptyRequest = z.infer<typeof TelegramEmptyRequestSchema>;
export type TelegramBotCommand = z.infer<typeof TelegramBotCommandSchema>;
export type TelegramBotCommandScope = z.infer<
  typeof TelegramBotCommandScopeSchema
>;
export type TelegramMenuButton = z.infer<typeof TelegramMenuButtonSchema>;
export type TelegramChatAdministratorRights = z.infer<
  typeof TelegramChatAdministratorRightsSchema
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
// POST /bot{token}/getUpdates
// ---------------------------------------------------------------------------

export const TelegramGetUpdatesRequestSchema = z.object({
  offset: z.number().int().optional(),
  limit: z.number().int().min(1).max(100).optional(),
  timeout: z.number().int().optional(),
  allowed_updates: TelegramAllowedUpdatesSchema.optional(),
});

export type TelegramGetUpdatesRequest = z.infer<
  typeof TelegramGetUpdatesRequestSchema
>;

// ---------------------------------------------------------------------------
// POST /bot{token}/setWebhook
// ---------------------------------------------------------------------------

export const TelegramSetWebhookRequestSchema = z.object({
  url: z.string(),
  certificate: TelegramInputFileSchema.optional(),
  ip_address: z.string().optional(),
  max_connections: z.number().int().min(1).max(100).optional(),
  allowed_updates: TelegramAllowedUpdatesSchema.optional(),
  drop_pending_updates: z.boolean().optional(),
  secret_token: z
    .string()
    .min(1)
    .max(256)
    .regex(/^[A-Za-z0-9_-]+$/)
    .optional(),
});

export type TelegramSetWebhookRequest = z.infer<
  typeof TelegramSetWebhookRequestSchema
>;

// ---------------------------------------------------------------------------
// POST /bot{token}/deleteWebhook
// ---------------------------------------------------------------------------

export const TelegramDeleteWebhookRequestSchema = z.object({
  drop_pending_updates: z.boolean().optional(),
});

export type TelegramDeleteWebhookRequest = z.infer<
  typeof TelegramDeleteWebhookRequestSchema
>;

// ---------------------------------------------------------------------------
// POST /bot{token}/getFile
// ---------------------------------------------------------------------------

export const TelegramGetFileRequestSchema = z.object({
  file_id: z.string().min(1),
});

export type TelegramGetFileRequest = z.infer<
  typeof TelegramGetFileRequestSchema
>;

// ---------------------------------------------------------------------------
// POST /bot{token}/setMyCommands
// ---------------------------------------------------------------------------

export const TelegramSetMyCommandsRequestSchema = z.object({
  commands: z.array(TelegramBotCommandSchema).max(100),
  scope: TelegramBotCommandScopeSchema.optional(),
  language_code: z.string().optional(),
});

export type TelegramSetMyCommandsRequest = z.infer<
  typeof TelegramSetMyCommandsRequestSchema
>;

// ---------------------------------------------------------------------------
// POST /bot{token}/deleteMyCommands
// ---------------------------------------------------------------------------

export const TelegramDeleteMyCommandsRequestSchema = z.object({
  scope: TelegramBotCommandScopeSchema.optional(),
  language_code: z.string().optional(),
});

export type TelegramDeleteMyCommandsRequest = z.infer<
  typeof TelegramDeleteMyCommandsRequestSchema
>;

// ---------------------------------------------------------------------------
// POST /bot{token}/getMyCommands
// ---------------------------------------------------------------------------

export const TelegramGetMyCommandsRequestSchema =
  TelegramDeleteMyCommandsRequestSchema;

export type TelegramGetMyCommandsRequest = z.infer<
  typeof TelegramGetMyCommandsRequestSchema
>;

// ---------------------------------------------------------------------------
// POST /bot{token}/setMyName
// ---------------------------------------------------------------------------

export const TelegramSetMyNameRequestSchema = z.object({
  name: z.string().max(64).optional(),
  language_code: z.string().optional(),
});

export type TelegramSetMyNameRequest = z.infer<
  typeof TelegramSetMyNameRequestSchema
>;

// ---------------------------------------------------------------------------
// POST /bot{token}/getMyName
// ---------------------------------------------------------------------------

export const TelegramLanguageCodeRequestSchema = z.object({
  language_code: z.string().optional(),
});

export type TelegramLanguageCodeRequest = z.infer<
  typeof TelegramLanguageCodeRequestSchema
>;

// ---------------------------------------------------------------------------
// POST /bot{token}/setMyDescription
// ---------------------------------------------------------------------------

export const TelegramSetMyDescriptionRequestSchema = z.object({
  description: z.string().max(512).optional(),
  language_code: z.string().optional(),
});

export type TelegramSetMyDescriptionRequest = z.infer<
  typeof TelegramSetMyDescriptionRequestSchema
>;

// ---------------------------------------------------------------------------
// POST /bot{token}/setMyShortDescription
// ---------------------------------------------------------------------------

export const TelegramSetMyShortDescriptionRequestSchema = z.object({
  short_description: z.string().max(120).optional(),
  language_code: z.string().optional(),
});

export type TelegramSetMyShortDescriptionRequest = z.infer<
  typeof TelegramSetMyShortDescriptionRequestSchema
>;

// ---------------------------------------------------------------------------
// POST /bot{token}/setChatMenuButton
// ---------------------------------------------------------------------------

export const TelegramSetChatMenuButtonRequestSchema = z.object({
  chat_id: z.number().int().optional(),
  menu_button: TelegramMenuButtonSchema.optional(),
});

export type TelegramSetChatMenuButtonRequest = z.infer<
  typeof TelegramSetChatMenuButtonRequestSchema
>;

// ---------------------------------------------------------------------------
// POST /bot{token}/getChatMenuButton
// ---------------------------------------------------------------------------

export const TelegramGetChatMenuButtonRequestSchema = z.object({
  chat_id: z.number().int().optional(),
});

export type TelegramGetChatMenuButtonRequest = z.infer<
  typeof TelegramGetChatMenuButtonRequestSchema
>;

// ---------------------------------------------------------------------------
// POST /bot{token}/setMyDefaultAdministratorRights
// ---------------------------------------------------------------------------

export const TelegramSetMyDefaultAdministratorRightsRequestSchema = z.object({
  rights: TelegramChatAdministratorRightsSchema.optional(),
  for_channels: z.boolean().optional(),
});

export type TelegramSetMyDefaultAdministratorRightsRequest = z.infer<
  typeof TelegramSetMyDefaultAdministratorRightsRequestSchema
>;

// ---------------------------------------------------------------------------
// POST /bot{token}/getMyDefaultAdministratorRights
// ---------------------------------------------------------------------------

export const TelegramGetMyDefaultAdministratorRightsRequestSchema = z.object({
  for_channels: z.boolean().optional(),
});

export type TelegramGetMyDefaultAdministratorRightsRequest = z.infer<
  typeof TelegramGetMyDefaultAdministratorRightsRequestSchema
>;

// ---------------------------------------------------------------------------
// POST /bot{token}/getManagedBotToken
// ---------------------------------------------------------------------------

export const TelegramManagedBotUserRequestSchema = z.object({
  user_id: z.number().int(),
});

export type TelegramManagedBotUserRequest = z.infer<
  typeof TelegramManagedBotUserRequestSchema
>;

// ---------------------------------------------------------------------------
// POST /bot{token}/setManagedBotAccessSettings
// ---------------------------------------------------------------------------

export const TelegramSetManagedBotAccessSettingsRequestSchema = z.object({
  user_id: z.number().int(),
  is_access_restricted: z.boolean(),
  added_user_ids: z.array(z.number().int()).max(10).optional(),
});

export type TelegramSetManagedBotAccessSettingsRequest = z.infer<
  typeof TelegramSetManagedBotAccessSettingsRequestSchema
>;
