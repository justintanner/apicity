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
export const TelegramChatPermissionsSchema = z
  .object({
    can_send_messages: z.boolean().optional(),
    can_send_audios: z.boolean().optional(),
    can_send_documents: z.boolean().optional(),
    can_send_photos: z.boolean().optional(),
    can_send_videos: z.boolean().optional(),
    can_send_video_notes: z.boolean().optional(),
    can_send_voice_notes: z.boolean().optional(),
    can_send_polls: z.boolean().optional(),
    can_send_other_messages: z.boolean().optional(),
    can_add_web_page_previews: z.boolean().optional(),
    can_change_info: z.boolean().optional(),
    can_invite_users: z.boolean().optional(),
    can_pin_messages: z.boolean().optional(),
    can_manage_topics: z.boolean().optional(),
    can_react_to_messages: z.boolean().optional(),
  })
  .passthrough();

export type TelegramChatPermissions = z.infer<
  typeof TelegramChatPermissionsSchema
>;
export type TelegramInputFile = z.infer<typeof TelegramInputFileSchema>;

const chatIdFields = {
  chat_id: TelegramChatIdSchema,
};

const userIdFields = {
  user_id: z.number().int(),
};

const senderChatIdFields = {
  sender_chat_id: z.number().int(),
};

const messageThreadIdFields = {
  message_thread_id: z.number().int(),
};

const inviteLinkFields = {
  invite_link: z.string().min(1),
};

const chatInviteLinkFields = {
  name: z.string().optional(),
  expire_date: z.number().int().optional(),
  member_limit: z.number().int().optional(),
  creates_join_request: z.boolean().optional(),
};

const administratorRightFields = {
  is_anonymous: z.boolean().optional(),
  can_manage_chat: z.boolean().optional(),
  can_delete_messages: z.boolean().optional(),
  can_manage_video_chats: z.boolean().optional(),
  can_restrict_members: z.boolean().optional(),
  can_promote_members: z.boolean().optional(),
  can_change_info: z.boolean().optional(),
  can_invite_users: z.boolean().optional(),
  can_post_stories: z.boolean().optional(),
  can_edit_stories: z.boolean().optional(),
  can_delete_stories: z.boolean().optional(),
  can_post_messages: z.boolean().optional(),
  can_edit_messages: z.boolean().optional(),
  can_pin_messages: z.boolean().optional(),
  can_manage_topics: z.boolean().optional(),
  can_manage_direct_messages: z.boolean().optional(),
  can_manage_tags: z.boolean().optional(),
};

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
// Chat administration, invites, forum topics, boosts, and join requests
// ---------------------------------------------------------------------------

export const TelegramChatRequestSchema = z.object(chatIdFields);
export type TelegramChatRequest = z.infer<typeof TelegramChatRequestSchema>;

export const TelegramEmptyRequestSchema = z.object({}).optional();
export type TelegramEmptyRequest = z.infer<typeof TelegramEmptyRequestSchema>;

export const TelegramUserRequestSchema = z.object(userIdFields);
export type TelegramUserRequest = z.infer<typeof TelegramUserRequestSchema>;

export const TelegramChatUserRequestSchema = z.object({
  ...chatIdFields,
  ...userIdFields,
});
export type TelegramChatUserRequest = z.infer<
  typeof TelegramChatUserRequestSchema
>;

export const TelegramChatSenderRequestSchema = z.object({
  ...chatIdFields,
  ...senderChatIdFields,
});
export type TelegramChatSenderRequest = z.infer<
  typeof TelegramChatSenderRequestSchema
>;

export const TelegramForumTopicRequestSchema = z.object({
  ...chatIdFields,
  ...messageThreadIdFields,
});
export type TelegramForumTopicRequest = z.infer<
  typeof TelegramForumTopicRequestSchema
>;

export const TelegramAnswerChatJoinRequestQueryRequestSchema = z.object({
  chat_join_request_query_id: z.string().min(1),
  result: z.enum(["approve", "decline", "queue"]),
});
export type TelegramAnswerChatJoinRequestQueryRequest = z.infer<
  typeof TelegramAnswerChatJoinRequestQueryRequestSchema
>;

export const TelegramAnswerGuestQueryRequestSchema = z.object({
  guest_query_id: z.string().min(1),
  result: TelegramRecordSchema,
});
export type TelegramAnswerGuestQueryRequest = z.infer<
  typeof TelegramAnswerGuestQueryRequestSchema
>;

export const TelegramApproveChatJoinRequestRequestSchema =
  TelegramChatUserRequestSchema;
export type TelegramApproveChatJoinRequestRequest = z.infer<
  typeof TelegramApproveChatJoinRequestRequestSchema
>;

export const TelegramBanChatMemberRequestSchema = z.object({
  ...chatIdFields,
  ...userIdFields,
  until_date: z.number().int().optional(),
  revoke_messages: z.boolean().optional(),
});
export type TelegramBanChatMemberRequest = z.infer<
  typeof TelegramBanChatMemberRequestSchema
>;

export const TelegramBanChatSenderChatRequestSchema =
  TelegramChatSenderRequestSchema;
export type TelegramBanChatSenderChatRequest = z.infer<
  typeof TelegramBanChatSenderChatRequestSchema
>;

export const TelegramCloseForumTopicRequestSchema =
  TelegramForumTopicRequestSchema;
export type TelegramCloseForumTopicRequest = z.infer<
  typeof TelegramCloseForumTopicRequestSchema
>;

export const TelegramCloseGeneralForumTopicRequestSchema =
  TelegramChatRequestSchema;
export type TelegramCloseGeneralForumTopicRequest = z.infer<
  typeof TelegramCloseGeneralForumTopicRequestSchema
>;

export const TelegramCreateChatInviteLinkRequestSchema = z.object({
  ...chatIdFields,
  ...chatInviteLinkFields,
});
export type TelegramCreateChatInviteLinkRequest = z.infer<
  typeof TelegramCreateChatInviteLinkRequestSchema
>;

export const TelegramCreateChatSubscriptionInviteLinkRequestSchema = z.object({
  ...chatIdFields,
  name: z.string().optional(),
  subscription_period: z.number().int(),
  subscription_price: z.number().int(),
});
export type TelegramCreateChatSubscriptionInviteLinkRequest = z.infer<
  typeof TelegramCreateChatSubscriptionInviteLinkRequestSchema
>;

export const TelegramCreateForumTopicRequestSchema = z.object({
  ...chatIdFields,
  name: z.string().min(1),
  icon_color: z.number().int().optional(),
  icon_custom_emoji_id: z.string().optional(),
});
export type TelegramCreateForumTopicRequest = z.infer<
  typeof TelegramCreateForumTopicRequestSchema
>;

export const TelegramDeclineChatJoinRequestRequestSchema =
  TelegramChatUserRequestSchema;
export type TelegramDeclineChatJoinRequestRequest = z.infer<
  typeof TelegramDeclineChatJoinRequestRequestSchema
>;

export const TelegramDeleteChatPhotoRequestSchema = TelegramChatRequestSchema;
export type TelegramDeleteChatPhotoRequest = z.infer<
  typeof TelegramDeleteChatPhotoRequestSchema
>;

export const TelegramDeleteChatStickerSetRequestSchema =
  TelegramChatRequestSchema;
export type TelegramDeleteChatStickerSetRequest = z.infer<
  typeof TelegramDeleteChatStickerSetRequestSchema
>;

export const TelegramDeleteForumTopicRequestSchema =
  TelegramForumTopicRequestSchema;
export type TelegramDeleteForumTopicRequest = z.infer<
  typeof TelegramDeleteForumTopicRequestSchema
>;

export const TelegramEditChatInviteLinkRequestSchema = z.object({
  ...chatIdFields,
  ...inviteLinkFields,
  ...chatInviteLinkFields,
});
export type TelegramEditChatInviteLinkRequest = z.infer<
  typeof TelegramEditChatInviteLinkRequestSchema
>;

export const TelegramEditChatSubscriptionInviteLinkRequestSchema = z.object({
  ...chatIdFields,
  ...inviteLinkFields,
  name: z.string().optional(),
});
export type TelegramEditChatSubscriptionInviteLinkRequest = z.infer<
  typeof TelegramEditChatSubscriptionInviteLinkRequestSchema
>;

export const TelegramEditForumTopicRequestSchema = z.object({
  ...chatIdFields,
  ...messageThreadIdFields,
  name: z.string().optional(),
  icon_custom_emoji_id: z.string().optional(),
});
export type TelegramEditForumTopicRequest = z.infer<
  typeof TelegramEditForumTopicRequestSchema
>;

export const TelegramEditGeneralForumTopicRequestSchema = z.object({
  ...chatIdFields,
  name: z.string().min(1),
});
export type TelegramEditGeneralForumTopicRequest = z.infer<
  typeof TelegramEditGeneralForumTopicRequestSchema
>;

export const TelegramExportChatInviteLinkRequestSchema =
  TelegramChatRequestSchema;
export type TelegramExportChatInviteLinkRequest = z.infer<
  typeof TelegramExportChatInviteLinkRequestSchema
>;

export const TelegramGetChatRequestSchema = TelegramChatRequestSchema;
export type TelegramGetChatRequest = z.infer<
  typeof TelegramGetChatRequestSchema
>;

export const TelegramGetChatAdministratorsRequestSchema = z.object({
  ...chatIdFields,
  return_bots: z.boolean().optional(),
});
export type TelegramGetChatAdministratorsRequest = z.infer<
  typeof TelegramGetChatAdministratorsRequestSchema
>;

export const TelegramGetChatMemberRequestSchema = TelegramChatUserRequestSchema;
export type TelegramGetChatMemberRequest = z.infer<
  typeof TelegramGetChatMemberRequestSchema
>;

export const TelegramGetChatMemberCountRequestSchema =
  TelegramChatRequestSchema;
export type TelegramGetChatMemberCountRequest = z.infer<
  typeof TelegramGetChatMemberCountRequestSchema
>;

export const TelegramGetForumTopicIconStickersRequestSchema =
  TelegramEmptyRequestSchema;
export type TelegramGetForumTopicIconStickersRequest = z.infer<
  typeof TelegramGetForumTopicIconStickersRequestSchema
>;

export const TelegramGetUserChatBoostsRequestSchema = z.object({
  ...chatIdFields,
  ...userIdFields,
});
export type TelegramGetUserChatBoostsRequest = z.infer<
  typeof TelegramGetUserChatBoostsRequestSchema
>;

export const TelegramGetUserPersonalChatMessagesRequestSchema = z.object({
  ...userIdFields,
  limit: z.number().int(),
});
export type TelegramGetUserPersonalChatMessagesRequest = z.infer<
  typeof TelegramGetUserPersonalChatMessagesRequestSchema
>;

export const TelegramHideGeneralForumTopicRequestSchema =
  TelegramChatRequestSchema;
export type TelegramHideGeneralForumTopicRequest = z.infer<
  typeof TelegramHideGeneralForumTopicRequestSchema
>;

export const TelegramLeaveChatRequestSchema = TelegramChatRequestSchema;
export type TelegramLeaveChatRequest = z.infer<
  typeof TelegramLeaveChatRequestSchema
>;

export const TelegramPromoteChatMemberRequestSchema = z.object({
  ...chatIdFields,
  ...userIdFields,
  ...administratorRightFields,
});
export type TelegramPromoteChatMemberRequest = z.infer<
  typeof TelegramPromoteChatMemberRequestSchema
>;

export const TelegramReopenForumTopicRequestSchema =
  TelegramForumTopicRequestSchema;
export type TelegramReopenForumTopicRequest = z.infer<
  typeof TelegramReopenForumTopicRequestSchema
>;

export const TelegramReopenGeneralForumTopicRequestSchema =
  TelegramChatRequestSchema;
export type TelegramReopenGeneralForumTopicRequest = z.infer<
  typeof TelegramReopenGeneralForumTopicRequestSchema
>;

export const TelegramRestrictChatMemberRequestSchema = z.object({
  ...chatIdFields,
  ...userIdFields,
  permissions: TelegramChatPermissionsSchema,
  use_independent_chat_permissions: z.boolean().optional(),
  until_date: z.number().int().optional(),
});
export type TelegramRestrictChatMemberRequest = z.infer<
  typeof TelegramRestrictChatMemberRequestSchema
>;

export const TelegramRevokeChatInviteLinkRequestSchema = z.object({
  ...chatIdFields,
  ...inviteLinkFields,
});
export type TelegramRevokeChatInviteLinkRequest = z.infer<
  typeof TelegramRevokeChatInviteLinkRequestSchema
>;

export const TelegramSendChatJoinRequestWebAppRequestSchema = z.object({
  chat_join_request_query_id: z.string().min(1),
  web_app_url: z.string().url(),
});
export type TelegramSendChatJoinRequestWebAppRequest = z.infer<
  typeof TelegramSendChatJoinRequestWebAppRequestSchema
>;

export const TelegramSetChatAdministratorCustomTitleRequestSchema = z.object({
  ...chatIdFields,
  ...userIdFields,
  custom_title: z.string(),
});
export type TelegramSetChatAdministratorCustomTitleRequest = z.infer<
  typeof TelegramSetChatAdministratorCustomTitleRequestSchema
>;

export const TelegramSetChatDescriptionRequestSchema = z.object({
  ...chatIdFields,
  description: z.string().optional(),
});
export type TelegramSetChatDescriptionRequest = z.infer<
  typeof TelegramSetChatDescriptionRequestSchema
>;

export const TelegramSetChatMemberTagRequestSchema = z.object({
  ...chatIdFields,
  ...userIdFields,
  tag: z.string().optional(),
});
export type TelegramSetChatMemberTagRequest = z.infer<
  typeof TelegramSetChatMemberTagRequestSchema
>;

export const TelegramSetChatPermissionsRequestSchema = z.object({
  ...chatIdFields,
  permissions: TelegramChatPermissionsSchema,
  use_independent_chat_permissions: z.boolean().optional(),
});
export type TelegramSetChatPermissionsRequest = z.infer<
  typeof TelegramSetChatPermissionsRequestSchema
>;

export const TelegramSetChatPhotoRequestSchema = z.object({
  ...chatIdFields,
  photo: TelegramInputFileSchema,
});
export type TelegramSetChatPhotoRequest = z.infer<
  typeof TelegramSetChatPhotoRequestSchema
>;

export const TelegramSetChatStickerSetRequestSchema = z.object({
  ...chatIdFields,
  sticker_set_name: z.string().min(1),
});
export type TelegramSetChatStickerSetRequest = z.infer<
  typeof TelegramSetChatStickerSetRequestSchema
>;

export const TelegramSetChatTitleRequestSchema = z.object({
  ...chatIdFields,
  title: z.string().min(1),
});
export type TelegramSetChatTitleRequest = z.infer<
  typeof TelegramSetChatTitleRequestSchema
>;

export const TelegramUnbanChatMemberRequestSchema = z.object({
  ...chatIdFields,
  ...userIdFields,
  only_if_banned: z.boolean().optional(),
});
export type TelegramUnbanChatMemberRequest = z.infer<
  typeof TelegramUnbanChatMemberRequestSchema
>;

export const TelegramUnbanChatSenderChatRequestSchema =
  TelegramChatSenderRequestSchema;
export type TelegramUnbanChatSenderChatRequest = z.infer<
  typeof TelegramUnbanChatSenderChatRequestSchema
>;

export const TelegramUnhideGeneralForumTopicRequestSchema =
  TelegramChatRequestSchema;
export type TelegramUnhideGeneralForumTopicRequest = z.infer<
  typeof TelegramUnhideGeneralForumTopicRequestSchema
>;

export const TelegramUnpinAllForumTopicMessagesRequestSchema =
  TelegramForumTopicRequestSchema;
export type TelegramUnpinAllForumTopicMessagesRequest = z.infer<
  typeof TelegramUnpinAllForumTopicMessagesRequestSchema
>;

export const TelegramUnpinAllGeneralForumTopicMessagesRequestSchema =
  TelegramChatRequestSchema;
export type TelegramUnpinAllGeneralForumTopicMessagesRequest = z.infer<
  typeof TelegramUnpinAllGeneralForumTopicMessagesRequestSchema
>;
