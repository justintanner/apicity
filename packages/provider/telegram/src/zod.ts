import { z } from "zod";

export const TelegramOptionsSchema = z.object({
  botToken: z.string().min(1),
  baseURL: z.string().optional(),
  timeout: z.number().int().positive().optional(),
  fetch: z.custom<typeof fetch>().optional(),
});

export type TelegramOptions = z.infer<typeof TelegramOptionsSchema>;

export const TelegramChatIdSchema = z.union([
  z.number().int(),
  z.string().min(1),
]);
export const TelegramRecordSchema = z.record(z.string(), z.unknown());
export const TelegramRecordArraySchema = z.array(TelegramRecordSchema);
export const TelegramEntitiesSchema = TelegramRecordArraySchema;
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
export const TelegramGenericRequestSchema = z.object({}).passthrough();
export const TelegramMessageIdListSchema = z
  .array(z.number().int())
  .min(1)
  .max(100);
export const TelegramReactionTypeSchema = TelegramRecordSchema;
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
export const TelegramChatPermissionsSchema = TelegramRecordSchema;
export const TelegramInputChecklistSchema = TelegramRecordSchema;
export const TelegramInputMediaSchema = z
  .object({
    media: TelegramInputFileSchema,
    thumbnail: TelegramInputFileSchema.optional(),
  })
  .passthrough();
export const TelegramInputPaidMediaSchema = z
  .object({
    media: TelegramInputFileSchema,
    thumbnail: TelegramInputFileSchema.optional(),
  })
  .passthrough();
export const TelegramSendMessageBaseSchema = z
  .object({
    chat_id: TelegramChatIdSchema,
    business_connection_id: z.string().optional(),
    message_thread_id: z.number().int().optional(),
    direct_messages_topic_id: z.number().int().optional(),
    disable_notification: z.boolean().optional(),
    protect_content: z.boolean().optional(),
    allow_paid_broadcast: z.boolean().optional(),
    message_effect_id: z.string().optional(),
    suggested_post_parameters: TelegramRecordSchema.optional(),
    reply_parameters: TelegramRecordSchema.optional(),
    reply_markup: TelegramRecordSchema.optional(),
  })
  .passthrough();
export const TelegramMediaMessageBaseSchema =
  TelegramSendMessageBaseSchema.extend({
    caption: z.string().optional(),
    parse_mode: TelegramParseModeSchema.optional(),
    caption_entities: TelegramEntitiesSchema.optional(),
    show_caption_above_media: z.boolean().optional(),
    has_spoiler: z.boolean().optional(),
  }).passthrough();
export const TelegramMessageTargetSchema = z
  .object({
    business_connection_id: z.string().optional(),
    chat_id: TelegramChatIdSchema.optional(),
    message_id: z.number().int().optional(),
    inline_message_id: z.string().optional(),
  })
  .passthrough();

export type TelegramInputFile = z.infer<typeof TelegramInputFileSchema>;
export type TelegramBotCommand = z.infer<typeof TelegramBotCommandSchema>;
export type TelegramBotCommandScope = z.infer<
  typeof TelegramBotCommandScopeSchema
>;
export type TelegramMenuButton = z.infer<typeof TelegramMenuButtonSchema>;
export type TelegramChatAdministratorRights = z.infer<
  typeof TelegramChatAdministratorRightsSchema
>;
export type TelegramChatPermissions = z.infer<
  typeof TelegramChatPermissionsSchema
>;
export type TelegramInputChecklist = z.infer<
  typeof TelegramInputChecklistSchema
>;
export type TelegramInputMedia = z.infer<typeof TelegramInputMediaSchema>;
export type TelegramEmptyRequest = z.infer<typeof TelegramEmptyRequestSchema>;
export type TelegramGenericRequest = z.infer<
  typeof TelegramGenericRequestSchema
>;

export const TelegramAddStickerToSetRequestSchema =
  TelegramGenericRequestSchema;
export type TelegramAddStickerToSetRequest = z.infer<
  typeof TelegramAddStickerToSetRequestSchema
>;

export const TelegramAnswerCallbackQueryRequestSchema =
  TelegramGenericRequestSchema;
export type TelegramAnswerCallbackQueryRequest = z.infer<
  typeof TelegramAnswerCallbackQueryRequestSchema
>;

export const TelegramAnswerChatJoinRequestQueryRequestSchema = z
  .object({
    chat_join_request_query_id: z.string().min(1),
    result: z.enum(["approve", "decline", "queue"]),
  })
  .passthrough();
export type TelegramAnswerChatJoinRequestQueryRequest = z.infer<
  typeof TelegramAnswerChatJoinRequestQueryRequestSchema
>;

export const TelegramAnswerGuestQueryRequestSchema =
  TelegramGenericRequestSchema;
export type TelegramAnswerGuestQueryRequest = z.infer<
  typeof TelegramAnswerGuestQueryRequestSchema
>;

export const TelegramAnswerInlineQueryRequestSchema = z
  .object({
    inline_query_id: z.string().min(1),
    results: TelegramRecordArraySchema,
  })
  .passthrough();
export type TelegramAnswerInlineQueryRequest = z.infer<
  typeof TelegramAnswerInlineQueryRequestSchema
>;

export const TelegramAnswerPreCheckoutQueryRequestSchema =
  TelegramGenericRequestSchema;
export type TelegramAnswerPreCheckoutQueryRequest = z.infer<
  typeof TelegramAnswerPreCheckoutQueryRequestSchema
>;

export const TelegramAnswerShippingQueryRequestSchema =
  TelegramGenericRequestSchema;
export type TelegramAnswerShippingQueryRequest = z.infer<
  typeof TelegramAnswerShippingQueryRequestSchema
>;

export const TelegramAnswerWebAppQueryRequestSchema =
  TelegramGenericRequestSchema;
export type TelegramAnswerWebAppQueryRequest = z.infer<
  typeof TelegramAnswerWebAppQueryRequestSchema
>;

export const TelegramApproveChatJoinRequestRequestSchema =
  TelegramGenericRequestSchema;
export type TelegramApproveChatJoinRequestRequest = z.infer<
  typeof TelegramApproveChatJoinRequestRequestSchema
>;

export const TelegramBanChatMemberRequestSchema = TelegramGenericRequestSchema;
export type TelegramBanChatMemberRequest = z.infer<
  typeof TelegramBanChatMemberRequestSchema
>;

export const TelegramBanChatSenderChatRequestSchema =
  TelegramGenericRequestSchema;
export type TelegramBanChatSenderChatRequest = z.infer<
  typeof TelegramBanChatSenderChatRequestSchema
>;

export const TelegramCloseRequestSchema = TelegramEmptyRequestSchema;
export type TelegramCloseRequest = z.infer<typeof TelegramCloseRequestSchema>;

export const TelegramCloseForumTopicRequestSchema =
  TelegramGenericRequestSchema;
export type TelegramCloseForumTopicRequest = z.infer<
  typeof TelegramCloseForumTopicRequestSchema
>;

export const TelegramCloseGeneralForumTopicRequestSchema =
  TelegramGenericRequestSchema;
export type TelegramCloseGeneralForumTopicRequest = z.infer<
  typeof TelegramCloseGeneralForumTopicRequestSchema
>;

export const TelegramConvertGiftToStarsRequestSchema =
  TelegramGenericRequestSchema;
export type TelegramConvertGiftToStarsRequest = z.infer<
  typeof TelegramConvertGiftToStarsRequestSchema
>;

export const TelegramCopyMessageRequestSchema = z
  .object({
    chat_id: TelegramChatIdSchema,
    from_chat_id: TelegramChatIdSchema,
    message_id: z.number().int(),
  })
  .passthrough();
export type TelegramCopyMessageRequest = z.infer<
  typeof TelegramCopyMessageRequestSchema
>;

export const TelegramCopyMessagesRequestSchema = TelegramGenericRequestSchema;
export type TelegramCopyMessagesRequest = z.infer<
  typeof TelegramCopyMessagesRequestSchema
>;

export const TelegramCreateChatInviteLinkRequestSchema =
  TelegramGenericRequestSchema;
export type TelegramCreateChatInviteLinkRequest = z.infer<
  typeof TelegramCreateChatInviteLinkRequestSchema
>;

export const TelegramCreateChatSubscriptionInviteLinkRequestSchema =
  TelegramGenericRequestSchema;
export type TelegramCreateChatSubscriptionInviteLinkRequest = z.infer<
  typeof TelegramCreateChatSubscriptionInviteLinkRequestSchema
>;

export const TelegramCreateForumTopicRequestSchema =
  TelegramGenericRequestSchema;
export type TelegramCreateForumTopicRequest = z.infer<
  typeof TelegramCreateForumTopicRequestSchema
>;

export const TelegramCreateInvoiceLinkRequestSchema =
  TelegramGenericRequestSchema;
export type TelegramCreateInvoiceLinkRequest = z.infer<
  typeof TelegramCreateInvoiceLinkRequestSchema
>;

export const TelegramCreateNewStickerSetRequestSchema = z
  .object({
    user_id: z.number().int(),
    name: z.string().min(1),
    title: z.string().min(1),
    stickers: TelegramRecordArraySchema,
  })
  .passthrough();
export type TelegramCreateNewStickerSetRequest = z.infer<
  typeof TelegramCreateNewStickerSetRequestSchema
>;

export const TelegramDeclineChatJoinRequestRequestSchema =
  TelegramGenericRequestSchema;
export type TelegramDeclineChatJoinRequestRequest = z.infer<
  typeof TelegramDeclineChatJoinRequestRequestSchema
>;

export const TelegramDeleteAllMessageReactionsRequestSchema = z
  .object({
    chat_id: TelegramChatIdSchema,
    message_id: z.number().int(),
  })
  .passthrough();
export type TelegramDeleteAllMessageReactionsRequest = z.infer<
  typeof TelegramDeleteAllMessageReactionsRequestSchema
>;

export const TelegramDeleteBusinessMessagesRequestSchema =
  TelegramGenericRequestSchema;
export type TelegramDeleteBusinessMessagesRequest = z.infer<
  typeof TelegramDeleteBusinessMessagesRequestSchema
>;

export const TelegramDeleteChatPhotoRequestSchema =
  TelegramGenericRequestSchema;
export type TelegramDeleteChatPhotoRequest = z.infer<
  typeof TelegramDeleteChatPhotoRequestSchema
>;

export const TelegramDeleteChatStickerSetRequestSchema =
  TelegramGenericRequestSchema;
export type TelegramDeleteChatStickerSetRequest = z.infer<
  typeof TelegramDeleteChatStickerSetRequestSchema
>;

export const TelegramDeleteForumTopicRequestSchema =
  TelegramGenericRequestSchema;
export type TelegramDeleteForumTopicRequest = z.infer<
  typeof TelegramDeleteForumTopicRequestSchema
>;

export const TelegramDeleteMessageRequestSchema = TelegramGenericRequestSchema;
export type TelegramDeleteMessageRequest = z.infer<
  typeof TelegramDeleteMessageRequestSchema
>;

export const TelegramDeleteMessageReactionRequestSchema = z
  .object({
    chat_id: TelegramChatIdSchema,
    message_id: z.number().int(),
    user_id: z.number().int().optional(),
  })
  .passthrough();
export type TelegramDeleteMessageReactionRequest = z.infer<
  typeof TelegramDeleteMessageReactionRequestSchema
>;

export const TelegramDeleteMessagesRequestSchema = TelegramGenericRequestSchema;
export type TelegramDeleteMessagesRequest = z.infer<
  typeof TelegramDeleteMessagesRequestSchema
>;

export const TelegramDeleteMyCommandsRequestSchema =
  TelegramGenericRequestSchema;
export type TelegramDeleteMyCommandsRequest = z.infer<
  typeof TelegramDeleteMyCommandsRequestSchema
>;

export const TelegramDeleteStickerFromSetRequestSchema =
  TelegramGenericRequestSchema;
export type TelegramDeleteStickerFromSetRequest = z.infer<
  typeof TelegramDeleteStickerFromSetRequestSchema
>;

export const TelegramDeleteStickerSetRequestSchema =
  TelegramGenericRequestSchema;
export type TelegramDeleteStickerSetRequest = z.infer<
  typeof TelegramDeleteStickerSetRequestSchema
>;

export const TelegramDeleteStoryRequestSchema = TelegramGenericRequestSchema;
export type TelegramDeleteStoryRequest = z.infer<
  typeof TelegramDeleteStoryRequestSchema
>;

export const TelegramDeleteWebhookRequestSchema = TelegramGenericRequestSchema;
export type TelegramDeleteWebhookRequest = z.infer<
  typeof TelegramDeleteWebhookRequestSchema
>;

export const TelegramEditChatInviteLinkRequestSchema =
  TelegramGenericRequestSchema;
export type TelegramEditChatInviteLinkRequest = z.infer<
  typeof TelegramEditChatInviteLinkRequestSchema
>;

export const TelegramEditChatSubscriptionInviteLinkRequestSchema =
  TelegramGenericRequestSchema;
export type TelegramEditChatSubscriptionInviteLinkRequest = z.infer<
  typeof TelegramEditChatSubscriptionInviteLinkRequestSchema
>;

export const TelegramEditForumTopicRequestSchema = TelegramGenericRequestSchema;
export type TelegramEditForumTopicRequest = z.infer<
  typeof TelegramEditForumTopicRequestSchema
>;

export const TelegramEditGeneralForumTopicRequestSchema =
  TelegramGenericRequestSchema;
export type TelegramEditGeneralForumTopicRequest = z.infer<
  typeof TelegramEditGeneralForumTopicRequestSchema
>;

export const TelegramEditMessageCaptionRequestSchema =
  TelegramGenericRequestSchema;
export type TelegramEditMessageCaptionRequest = z.infer<
  typeof TelegramEditMessageCaptionRequestSchema
>;

export const TelegramEditMessageChecklistRequestSchema = z
  .object({
    business_connection_id: z.string().min(1).optional(),
    chat_id: TelegramChatIdSchema.optional(),
    message_id: z.number().int().optional(),
    inline_message_id: z.string().min(1).optional(),
    checklist: TelegramRecordSchema,
  })
  .passthrough();
export type TelegramEditMessageChecklistRequest = z.infer<
  typeof TelegramEditMessageChecklistRequestSchema
>;

export const TelegramEditMessageLiveLocationRequestSchema =
  TelegramGenericRequestSchema;
export type TelegramEditMessageLiveLocationRequest = z.infer<
  typeof TelegramEditMessageLiveLocationRequestSchema
>;

export const TelegramEditMessageMediaRequestSchema =
  TelegramGenericRequestSchema;
export type TelegramEditMessageMediaRequest = z.infer<
  typeof TelegramEditMessageMediaRequestSchema
>;

export const TelegramEditMessageReplyMarkupRequestSchema =
  TelegramGenericRequestSchema;
export type TelegramEditMessageReplyMarkupRequest = z.infer<
  typeof TelegramEditMessageReplyMarkupRequestSchema
>;

export const TelegramEditMessageTextRequestSchema = z
  .object({
    text: z.string().min(1),
  })
  .merge(TelegramMessageTargetSchema)
  .passthrough();
export type TelegramEditMessageTextRequest = z.infer<
  typeof TelegramEditMessageTextRequestSchema
>;

export const TelegramEditStoryRequestSchema = TelegramGenericRequestSchema;
export type TelegramEditStoryRequest = z.infer<
  typeof TelegramEditStoryRequestSchema
>;

export const TelegramEditUserStarSubscriptionRequestSchema =
  TelegramGenericRequestSchema;
export type TelegramEditUserStarSubscriptionRequest = z.infer<
  typeof TelegramEditUserStarSubscriptionRequestSchema
>;

export const TelegramExportChatInviteLinkRequestSchema =
  TelegramGenericRequestSchema;
export type TelegramExportChatInviteLinkRequest = z.infer<
  typeof TelegramExportChatInviteLinkRequestSchema
>;

export const TelegramForwardMessageRequestSchema = TelegramGenericRequestSchema;
export type TelegramForwardMessageRequest = z.infer<
  typeof TelegramForwardMessageRequestSchema
>;

export const TelegramForwardMessagesRequestSchema = z
  .object({
    chat_id: TelegramChatIdSchema,
    from_chat_id: TelegramChatIdSchema,
    message_ids: TelegramMessageIdListSchema,
  })
  .passthrough();
export type TelegramForwardMessagesRequest = z.infer<
  typeof TelegramForwardMessagesRequestSchema
>;

export const TelegramGetAvailableGiftsRequestSchema =
  TelegramGenericRequestSchema;
export type TelegramGetAvailableGiftsRequest = z.infer<
  typeof TelegramGetAvailableGiftsRequestSchema
>;

export const TelegramGetBusinessAccountGiftsRequestSchema =
  TelegramGenericRequestSchema;
export type TelegramGetBusinessAccountGiftsRequest = z.infer<
  typeof TelegramGetBusinessAccountGiftsRequestSchema
>;

export const TelegramGetBusinessAccountStarBalanceRequestSchema =
  TelegramGenericRequestSchema;
export type TelegramGetBusinessAccountStarBalanceRequest = z.infer<
  typeof TelegramGetBusinessAccountStarBalanceRequestSchema
>;

export const TelegramGetBusinessConnectionRequestSchema = z
  .object({
    business_connection_id: z.string().min(1),
  })
  .passthrough();
export type TelegramGetBusinessConnectionRequest = z.infer<
  typeof TelegramGetBusinessConnectionRequestSchema
>;

export const TelegramGetChatRequestSchema = TelegramGenericRequestSchema;
export type TelegramGetChatRequest = z.infer<
  typeof TelegramGetChatRequestSchema
>;

export const TelegramGetChatAdministratorsRequestSchema =
  TelegramGenericRequestSchema;
export type TelegramGetChatAdministratorsRequest = z.infer<
  typeof TelegramGetChatAdministratorsRequestSchema
>;

export const TelegramGetChatGiftsRequestSchema = TelegramGenericRequestSchema;
export type TelegramGetChatGiftsRequest = z.infer<
  typeof TelegramGetChatGiftsRequestSchema
>;

export const TelegramGetChatMemberRequestSchema = TelegramGenericRequestSchema;
export type TelegramGetChatMemberRequest = z.infer<
  typeof TelegramGetChatMemberRequestSchema
>;

export const TelegramGetChatMemberCountRequestSchema =
  TelegramGenericRequestSchema;
export type TelegramGetChatMemberCountRequest = z.infer<
  typeof TelegramGetChatMemberCountRequestSchema
>;

export const TelegramGetChatMenuButtonRequestSchema =
  TelegramGenericRequestSchema;
export type TelegramGetChatMenuButtonRequest = z.infer<
  typeof TelegramGetChatMenuButtonRequestSchema
>;

export const TelegramGetCustomEmojiStickersRequestSchema =
  TelegramGenericRequestSchema;
export type TelegramGetCustomEmojiStickersRequest = z.infer<
  typeof TelegramGetCustomEmojiStickersRequestSchema
>;

export const TelegramGetFileRequestSchema = z
  .object({
    file_id: z.string().min(1),
  })
  .passthrough();
export type TelegramGetFileRequest = z.infer<
  typeof TelegramGetFileRequestSchema
>;

export const TelegramGetForumTopicIconStickersRequestSchema =
  TelegramGenericRequestSchema;
export type TelegramGetForumTopicIconStickersRequest = z.infer<
  typeof TelegramGetForumTopicIconStickersRequestSchema
>;

export const TelegramGetGameHighScoresRequestSchema =
  TelegramGenericRequestSchema;
export type TelegramGetGameHighScoresRequest = z.infer<
  typeof TelegramGetGameHighScoresRequestSchema
>;

export const TelegramGetManagedBotAccessSettingsRequestSchema =
  TelegramGenericRequestSchema;
export type TelegramGetManagedBotAccessSettingsRequest = z.infer<
  typeof TelegramGetManagedBotAccessSettingsRequestSchema
>;

export const TelegramGetManagedBotTokenRequestSchema =
  TelegramGenericRequestSchema;
export type TelegramGetManagedBotTokenRequest = z.infer<
  typeof TelegramGetManagedBotTokenRequestSchema
>;

export const TelegramGetMeRequestSchema = TelegramEmptyRequestSchema;
export type TelegramGetMeRequest = z.infer<typeof TelegramGetMeRequestSchema>;

export const TelegramGetMyCommandsRequestSchema = TelegramGenericRequestSchema;
export type TelegramGetMyCommandsRequest = z.infer<
  typeof TelegramGetMyCommandsRequestSchema
>;

export const TelegramGetMyDefaultAdministratorRightsRequestSchema =
  TelegramGenericRequestSchema;
export type TelegramGetMyDefaultAdministratorRightsRequest = z.infer<
  typeof TelegramGetMyDefaultAdministratorRightsRequestSchema
>;

export const TelegramGetMyDescriptionRequestSchema =
  TelegramGenericRequestSchema;
export type TelegramGetMyDescriptionRequest = z.infer<
  typeof TelegramGetMyDescriptionRequestSchema
>;

export const TelegramGetMyNameRequestSchema = TelegramGenericRequestSchema;
export type TelegramGetMyNameRequest = z.infer<
  typeof TelegramGetMyNameRequestSchema
>;

export const TelegramGetMyShortDescriptionRequestSchema =
  TelegramGenericRequestSchema;
export type TelegramGetMyShortDescriptionRequest = z.infer<
  typeof TelegramGetMyShortDescriptionRequestSchema
>;

export const TelegramGetMyStarBalanceRequestSchema = TelegramEmptyRequestSchema;
export type TelegramGetMyStarBalanceRequest = z.infer<
  typeof TelegramGetMyStarBalanceRequestSchema
>;

export const TelegramGetStarTransactionsRequestSchema =
  TelegramGenericRequestSchema;
export type TelegramGetStarTransactionsRequest = z.infer<
  typeof TelegramGetStarTransactionsRequestSchema
>;

export const TelegramGetStickerSetRequestSchema = TelegramGenericRequestSchema;
export type TelegramGetStickerSetRequest = z.infer<
  typeof TelegramGetStickerSetRequestSchema
>;

export const TelegramGetUpdatesRequestSchema = z
  .object({
    offset: z.number().int().optional(),
    limit: z.number().int().min(1).max(100).optional(),
    timeout: z.number().int().min(0).optional(),
    allowed_updates: z.array(z.string().min(1)).optional(),
  })
  .passthrough();
export type TelegramGetUpdatesRequest = z.infer<
  typeof TelegramGetUpdatesRequestSchema
>;

export const TelegramGetUserChatBoostsRequestSchema =
  TelegramGenericRequestSchema;
export type TelegramGetUserChatBoostsRequest = z.infer<
  typeof TelegramGetUserChatBoostsRequestSchema
>;

export const TelegramGetUserGiftsRequestSchema = TelegramGenericRequestSchema;
export type TelegramGetUserGiftsRequest = z.infer<
  typeof TelegramGetUserGiftsRequestSchema
>;

export const TelegramGetUserPersonalChatMessagesRequestSchema =
  TelegramGenericRequestSchema;
export type TelegramGetUserPersonalChatMessagesRequest = z.infer<
  typeof TelegramGetUserPersonalChatMessagesRequestSchema
>;

export const TelegramGetWebhookInfoRequestSchema = TelegramEmptyRequestSchema;
export type TelegramGetWebhookInfoRequest = z.infer<
  typeof TelegramGetWebhookInfoRequestSchema
>;

export const TelegramGiftPremiumSubscriptionRequestSchema = z
  .object({
    user_id: z.number().int(),
    month_count: z.number().int().min(1),
    star_count: z.number().int().min(1),
  })
  .passthrough();
export type TelegramGiftPremiumSubscriptionRequest = z.infer<
  typeof TelegramGiftPremiumSubscriptionRequestSchema
>;

export const TelegramHideGeneralForumTopicRequestSchema =
  TelegramGenericRequestSchema;
export type TelegramHideGeneralForumTopicRequest = z.infer<
  typeof TelegramHideGeneralForumTopicRequestSchema
>;

export const TelegramLeaveChatRequestSchema = TelegramGenericRequestSchema;
export type TelegramLeaveChatRequest = z.infer<
  typeof TelegramLeaveChatRequestSchema
>;

export const TelegramLogOutRequestSchema = TelegramEmptyRequestSchema;
export type TelegramLogOutRequest = z.infer<typeof TelegramLogOutRequestSchema>;

export const TelegramPinChatMessageRequestSchema = TelegramGenericRequestSchema;
export type TelegramPinChatMessageRequest = z.infer<
  typeof TelegramPinChatMessageRequestSchema
>;

export const TelegramPostStoryRequestSchema = z
  .object({
    business_connection_id: z.string().min(1),
    content: TelegramRecordSchema,
  })
  .passthrough();
export type TelegramPostStoryRequest = z.infer<
  typeof TelegramPostStoryRequestSchema
>;

export const TelegramPromoteChatMemberRequestSchema =
  TelegramGenericRequestSchema;
export type TelegramPromoteChatMemberRequest = z.infer<
  typeof TelegramPromoteChatMemberRequestSchema
>;

export const TelegramReadBusinessMessageRequestSchema =
  TelegramGenericRequestSchema;
export type TelegramReadBusinessMessageRequest = z.infer<
  typeof TelegramReadBusinessMessageRequestSchema
>;

export const TelegramRefundStarPaymentRequestSchema =
  TelegramGenericRequestSchema;
export type TelegramRefundStarPaymentRequest = z.infer<
  typeof TelegramRefundStarPaymentRequestSchema
>;

export const TelegramRemoveBusinessAccountProfilePhotoRequestSchema =
  TelegramGenericRequestSchema;
export type TelegramRemoveBusinessAccountProfilePhotoRequest = z.infer<
  typeof TelegramRemoveBusinessAccountProfilePhotoRequestSchema
>;

export const TelegramRemoveChatVerificationRequestSchema =
  TelegramGenericRequestSchema;
export type TelegramRemoveChatVerificationRequest = z.infer<
  typeof TelegramRemoveChatVerificationRequestSchema
>;

export const TelegramRemoveUserVerificationRequestSchema =
  TelegramGenericRequestSchema;
export type TelegramRemoveUserVerificationRequest = z.infer<
  typeof TelegramRemoveUserVerificationRequestSchema
>;

export const TelegramReopenForumTopicRequestSchema =
  TelegramGenericRequestSchema;
export type TelegramReopenForumTopicRequest = z.infer<
  typeof TelegramReopenForumTopicRequestSchema
>;

export const TelegramReopenGeneralForumTopicRequestSchema =
  TelegramGenericRequestSchema;
export type TelegramReopenGeneralForumTopicRequest = z.infer<
  typeof TelegramReopenGeneralForumTopicRequestSchema
>;

export const TelegramReplaceManagedBotTokenRequestSchema =
  TelegramGenericRequestSchema;
export type TelegramReplaceManagedBotTokenRequest = z.infer<
  typeof TelegramReplaceManagedBotTokenRequestSchema
>;

export const TelegramReplaceStickerInSetRequestSchema =
  TelegramGenericRequestSchema;
export type TelegramReplaceStickerInSetRequest = z.infer<
  typeof TelegramReplaceStickerInSetRequestSchema
>;

export const TelegramRepostStoryRequestSchema = TelegramGenericRequestSchema;
export type TelegramRepostStoryRequest = z.infer<
  typeof TelegramRepostStoryRequestSchema
>;

export const TelegramRestrictChatMemberRequestSchema =
  TelegramGenericRequestSchema;
export type TelegramRestrictChatMemberRequest = z.infer<
  typeof TelegramRestrictChatMemberRequestSchema
>;

export const TelegramRevokeChatInviteLinkRequestSchema =
  TelegramGenericRequestSchema;
export type TelegramRevokeChatInviteLinkRequest = z.infer<
  typeof TelegramRevokeChatInviteLinkRequestSchema
>;

export const TelegramSavePreparedInlineMessageRequestSchema =
  TelegramGenericRequestSchema;
export type TelegramSavePreparedInlineMessageRequest = z.infer<
  typeof TelegramSavePreparedInlineMessageRequestSchema
>;

export const TelegramSavePreparedKeyboardButtonRequestSchema =
  TelegramGenericRequestSchema;
export type TelegramSavePreparedKeyboardButtonRequest = z.infer<
  typeof TelegramSavePreparedKeyboardButtonRequestSchema
>;

export const TelegramSendAnimationRequestSchema = TelegramGenericRequestSchema;
export type TelegramSendAnimationRequest = z.infer<
  typeof TelegramSendAnimationRequestSchema
>;

export const TelegramSendAudioRequestSchema =
  TelegramMediaMessageBaseSchema.extend({
    audio: TelegramInputFileSchema,
    thumbnail: TelegramInputFileSchema.optional(),
  }).passthrough();
export type TelegramSendAudioRequest = z.infer<
  typeof TelegramSendAudioRequestSchema
>;

export const TelegramSendChatActionRequestSchema = TelegramGenericRequestSchema;
export type TelegramSendChatActionRequest = z.infer<
  typeof TelegramSendChatActionRequestSchema
>;

export const TelegramSendChatJoinRequestWebAppRequestSchema = z
  .object({
    chat_join_request_query_id: z.string().min(1),
    web_app_url: z.string().url(),
  })
  .passthrough();
export type TelegramSendChatJoinRequestWebAppRequest = z.infer<
  typeof TelegramSendChatJoinRequestWebAppRequestSchema
>;

export const TelegramSendChecklistRequestSchema = TelegramGenericRequestSchema;
export type TelegramSendChecklistRequest = z.infer<
  typeof TelegramSendChecklistRequestSchema
>;

export const TelegramSendContactRequestSchema = TelegramGenericRequestSchema;
export type TelegramSendContactRequest = z.infer<
  typeof TelegramSendContactRequestSchema
>;

export const TelegramSendDiceRequestSchema = TelegramGenericRequestSchema;
export type TelegramSendDiceRequest = z.infer<
  typeof TelegramSendDiceRequestSchema
>;

export const TelegramSendDocumentRequestSchema =
  TelegramMediaMessageBaseSchema.extend({
    document: TelegramInputFileSchema,
    thumbnail: TelegramInputFileSchema.optional(),
  }).passthrough();
export type TelegramSendDocumentRequest = z.infer<
  typeof TelegramSendDocumentRequestSchema
>;

export const TelegramSendGameRequestSchema =
  TelegramSendMessageBaseSchema.extend({
    game_short_name: z.string().min(1),
  }).passthrough();
export type TelegramSendGameRequest = z.infer<
  typeof TelegramSendGameRequestSchema
>;

export const TelegramSendGiftRequestSchema = TelegramGenericRequestSchema;
export type TelegramSendGiftRequest = z.infer<
  typeof TelegramSendGiftRequestSchema
>;

export const TelegramSendInvoiceRequestSchema =
  TelegramSendMessageBaseSchema.extend({
    title: z.string().min(1),
    description: z.string().min(1),
    payload: z.string().min(1),
    currency: z.string().min(1),
    prices: TelegramRecordArraySchema,
  }).passthrough();
export type TelegramSendInvoiceRequest = z.infer<
  typeof TelegramSendInvoiceRequestSchema
>;

export const TelegramSendLivePhotoRequestSchema = TelegramGenericRequestSchema;
export type TelegramSendLivePhotoRequest = z.infer<
  typeof TelegramSendLivePhotoRequestSchema
>;

export const TelegramSendLocationRequestSchema = TelegramGenericRequestSchema;
export type TelegramSendLocationRequest = z.infer<
  typeof TelegramSendLocationRequestSchema
>;

export const TelegramSendMediaGroupRequestSchema =
  TelegramSendMessageBaseSchema.extend({
    media: z.array(TelegramInputMediaSchema).min(1),
  }).passthrough();
export type TelegramSendMediaGroupRequest = z.infer<
  typeof TelegramSendMediaGroupRequestSchema
>;

export const TelegramSendMessageRequestSchema =
  TelegramSendMessageBaseSchema.extend({
    text: z.string().min(1),
    parse_mode: TelegramParseModeSchema.optional(),
    entities: TelegramEntitiesSchema.optional(),
    link_preview_options: TelegramRecordSchema.optional(),
  }).passthrough();
export type TelegramSendMessageRequest = z.infer<
  typeof TelegramSendMessageRequestSchema
>;

export const TelegramSendMessageDraftRequestSchema =
  TelegramGenericRequestSchema;
export type TelegramSendMessageDraftRequest = z.infer<
  typeof TelegramSendMessageDraftRequestSchema
>;

export const TelegramSendPaidMediaRequestSchema =
  TelegramSendMessageBaseSchema.extend({
    star_count: z.number().int().min(1),
    media: z.array(TelegramInputPaidMediaSchema).min(1),
    payload: z.string().optional(),
  }).passthrough();
export type TelegramSendPaidMediaRequest = z.infer<
  typeof TelegramSendPaidMediaRequestSchema
>;

export const TelegramSendPhotoRequestSchema =
  TelegramMediaMessageBaseSchema.extend({
    photo: TelegramInputFileSchema,
  }).passthrough();
export type TelegramSendPhotoRequest = z.infer<
  typeof TelegramSendPhotoRequestSchema
>;

export const TelegramSendPollRequestSchema =
  TelegramSendMessageBaseSchema.extend({
    question: z.string().min(1),
    options: z.array(TelegramRecordSchema).min(1),
    media: TelegramRecordSchema.optional(),
  }).passthrough();
export type TelegramSendPollRequest = z.infer<
  typeof TelegramSendPollRequestSchema
>;

export const TelegramSendRichMessageRequestSchema =
  TelegramGenericRequestSchema;
export type TelegramSendRichMessageRequest = z.infer<
  typeof TelegramSendRichMessageRequestSchema
>;

export const TelegramSendRichMessageDraftRequestSchema =
  TelegramGenericRequestSchema;
export type TelegramSendRichMessageDraftRequest = z.infer<
  typeof TelegramSendRichMessageDraftRequestSchema
>;

export const TelegramSendStickerRequestSchema = TelegramGenericRequestSchema;
export type TelegramSendStickerRequest = z.infer<
  typeof TelegramSendStickerRequestSchema
>;

export const TelegramSendVenueRequestSchema = TelegramGenericRequestSchema;
export type TelegramSendVenueRequest = z.infer<
  typeof TelegramSendVenueRequestSchema
>;

export const TelegramSendVideoRequestSchema =
  TelegramMediaMessageBaseSchema.extend({
    video: TelegramInputFileSchema,
    thumbnail: TelegramInputFileSchema.optional(),
    cover: TelegramInputFileSchema.optional(),
  }).passthrough();
export type TelegramSendVideoRequest = z.infer<
  typeof TelegramSendVideoRequestSchema
>;

export const TelegramSendVideoNoteRequestSchema = TelegramGenericRequestSchema;
export type TelegramSendVideoNoteRequest = z.infer<
  typeof TelegramSendVideoNoteRequestSchema
>;

export const TelegramSendVoiceRequestSchema =
  TelegramMediaMessageBaseSchema.extend({
    voice: TelegramInputFileSchema,
  }).passthrough();
export type TelegramSendVoiceRequest = z.infer<
  typeof TelegramSendVoiceRequestSchema
>;

export const TelegramSetBusinessAccountBioRequestSchema =
  TelegramGenericRequestSchema;
export type TelegramSetBusinessAccountBioRequest = z.infer<
  typeof TelegramSetBusinessAccountBioRequestSchema
>;

export const TelegramSetBusinessAccountGiftSettingsRequestSchema =
  TelegramGenericRequestSchema;
export type TelegramSetBusinessAccountGiftSettingsRequest = z.infer<
  typeof TelegramSetBusinessAccountGiftSettingsRequestSchema
>;

export const TelegramSetBusinessAccountNameRequestSchema =
  TelegramGenericRequestSchema;
export type TelegramSetBusinessAccountNameRequest = z.infer<
  typeof TelegramSetBusinessAccountNameRequestSchema
>;

export const TelegramSetBusinessAccountProfilePhotoRequestSchema =
  TelegramGenericRequestSchema;
export type TelegramSetBusinessAccountProfilePhotoRequest = z.infer<
  typeof TelegramSetBusinessAccountProfilePhotoRequestSchema
>;

export const TelegramSetBusinessAccountUsernameRequestSchema =
  TelegramGenericRequestSchema;
export type TelegramSetBusinessAccountUsernameRequest = z.infer<
  typeof TelegramSetBusinessAccountUsernameRequestSchema
>;

export const TelegramSetChatAdministratorCustomTitleRequestSchema =
  TelegramGenericRequestSchema;
export type TelegramSetChatAdministratorCustomTitleRequest = z.infer<
  typeof TelegramSetChatAdministratorCustomTitleRequestSchema
>;

export const TelegramSetChatDescriptionRequestSchema =
  TelegramGenericRequestSchema;
export type TelegramSetChatDescriptionRequest = z.infer<
  typeof TelegramSetChatDescriptionRequestSchema
>;

export const TelegramSetChatMemberTagRequestSchema =
  TelegramGenericRequestSchema;
export type TelegramSetChatMemberTagRequest = z.infer<
  typeof TelegramSetChatMemberTagRequestSchema
>;

export const TelegramSetChatMenuButtonRequestSchema =
  TelegramGenericRequestSchema;
export type TelegramSetChatMenuButtonRequest = z.infer<
  typeof TelegramSetChatMenuButtonRequestSchema
>;

export const TelegramSetChatPermissionsRequestSchema =
  TelegramGenericRequestSchema;
export type TelegramSetChatPermissionsRequest = z.infer<
  typeof TelegramSetChatPermissionsRequestSchema
>;

export const TelegramSetChatPhotoRequestSchema = TelegramGenericRequestSchema;
export type TelegramSetChatPhotoRequest = z.infer<
  typeof TelegramSetChatPhotoRequestSchema
>;

export const TelegramSetChatStickerSetRequestSchema =
  TelegramGenericRequestSchema;
export type TelegramSetChatStickerSetRequest = z.infer<
  typeof TelegramSetChatStickerSetRequestSchema
>;

export const TelegramSetChatTitleRequestSchema = TelegramGenericRequestSchema;
export type TelegramSetChatTitleRequest = z.infer<
  typeof TelegramSetChatTitleRequestSchema
>;

export const TelegramSetCustomEmojiStickerSetThumbnailRequestSchema =
  TelegramGenericRequestSchema;
export type TelegramSetCustomEmojiStickerSetThumbnailRequest = z.infer<
  typeof TelegramSetCustomEmojiStickerSetThumbnailRequestSchema
>;

export const TelegramSetGameScoreRequestSchema = TelegramGenericRequestSchema;
export type TelegramSetGameScoreRequest = z.infer<
  typeof TelegramSetGameScoreRequestSchema
>;

export const TelegramSetManagedBotAccessSettingsRequestSchema = z
  .object({
    user_id: z.number().int(),
    is_access_restricted: z.boolean(),
    added_user_ids: z.array(z.number().int()).max(10).optional(),
    removed_user_ids: z.array(z.number().int()).max(10).optional(),
  })
  .passthrough();
export type TelegramSetManagedBotAccessSettingsRequest = z.infer<
  typeof TelegramSetManagedBotAccessSettingsRequestSchema
>;

export const TelegramSetMessageReactionRequestSchema = z
  .object({
    chat_id: TelegramChatIdSchema,
    message_id: z.number().int(),
    reaction: z.array(TelegramReactionTypeSchema).optional(),
  })
  .passthrough();
export type TelegramSetMessageReactionRequest = z.infer<
  typeof TelegramSetMessageReactionRequestSchema
>;

export const TelegramSetMyCommandsRequestSchema = z
  .object({
    commands: z.array(TelegramBotCommandSchema).min(1),
    scope: TelegramBotCommandScopeSchema.optional(),
    language_code: z.string().optional(),
  })
  .passthrough();
export type TelegramSetMyCommandsRequest = z.infer<
  typeof TelegramSetMyCommandsRequestSchema
>;

export const TelegramSetMyDefaultAdministratorRightsRequestSchema =
  TelegramGenericRequestSchema;
export type TelegramSetMyDefaultAdministratorRightsRequest = z.infer<
  typeof TelegramSetMyDefaultAdministratorRightsRequestSchema
>;

export const TelegramSetMyDescriptionRequestSchema = z
  .object({
    description: z.string().max(512).optional(),
    language_code: z.string().optional(),
  })
  .passthrough();
export type TelegramSetMyDescriptionRequest = z.infer<
  typeof TelegramSetMyDescriptionRequestSchema
>;

export const TelegramSetMyNameRequestSchema = z
  .object({
    name: z.string().max(64).optional(),
    language_code: z.string().optional(),
  })
  .passthrough();
export type TelegramSetMyNameRequest = z.infer<
  typeof TelegramSetMyNameRequestSchema
>;

export const TelegramSetMyShortDescriptionRequestSchema = z
  .object({
    short_description: z.string().max(120).optional(),
    language_code: z.string().optional(),
  })
  .passthrough();
export type TelegramSetMyShortDescriptionRequest = z.infer<
  typeof TelegramSetMyShortDescriptionRequestSchema
>;

export const TelegramSetPassportDataErrorsRequestSchema = z
  .object({
    user_id: z.number().int(),
    errors: TelegramRecordArraySchema,
  })
  .passthrough();
export type TelegramSetPassportDataErrorsRequest = z.infer<
  typeof TelegramSetPassportDataErrorsRequestSchema
>;

export const TelegramSetStickerEmojiListRequestSchema =
  TelegramGenericRequestSchema;
export type TelegramSetStickerEmojiListRequest = z.infer<
  typeof TelegramSetStickerEmojiListRequestSchema
>;

export const TelegramSetStickerKeywordsRequestSchema =
  TelegramGenericRequestSchema;
export type TelegramSetStickerKeywordsRequest = z.infer<
  typeof TelegramSetStickerKeywordsRequestSchema
>;

export const TelegramSetStickerMaskPositionRequestSchema =
  TelegramGenericRequestSchema;
export type TelegramSetStickerMaskPositionRequest = z.infer<
  typeof TelegramSetStickerMaskPositionRequestSchema
>;

export const TelegramSetStickerPositionInSetRequestSchema =
  TelegramGenericRequestSchema;
export type TelegramSetStickerPositionInSetRequest = z.infer<
  typeof TelegramSetStickerPositionInSetRequestSchema
>;

export const TelegramSetStickerSetThumbnailRequestSchema =
  TelegramGenericRequestSchema;
export type TelegramSetStickerSetThumbnailRequest = z.infer<
  typeof TelegramSetStickerSetThumbnailRequestSchema
>;

export const TelegramSetStickerSetTitleRequestSchema =
  TelegramGenericRequestSchema;
export type TelegramSetStickerSetTitleRequest = z.infer<
  typeof TelegramSetStickerSetTitleRequestSchema
>;

export const TelegramSetUserEmojiStatusRequestSchema = z
  .object({
    user_id: z.number().int(),
    emoji_status_custom_emoji_id: z.string().optional(),
  })
  .passthrough();
export type TelegramSetUserEmojiStatusRequest = z.infer<
  typeof TelegramSetUserEmojiStatusRequestSchema
>;

export const TelegramSetWebhookRequestSchema = z
  .object({
    url: z.string().url(),
    certificate: TelegramInputFileSchema.optional(),
    allowed_updates: z.array(z.string().min(1)).optional(),
    secret_token: z
      .string()
      .regex(/^[A-Za-z0-9_-]+$/)
      .optional(),
  })
  .passthrough();
export type TelegramSetWebhookRequest = z.infer<
  typeof TelegramSetWebhookRequestSchema
>;

export const TelegramStopMessageLiveLocationRequestSchema =
  TelegramGenericRequestSchema;
export type TelegramStopMessageLiveLocationRequest = z.infer<
  typeof TelegramStopMessageLiveLocationRequestSchema
>;

export const TelegramStopPollRequestSchema = TelegramGenericRequestSchema;
export type TelegramStopPollRequest = z.infer<
  typeof TelegramStopPollRequestSchema
>;

export const TelegramTransferBusinessAccountStarsRequestSchema =
  TelegramGenericRequestSchema;
export type TelegramTransferBusinessAccountStarsRequest = z.infer<
  typeof TelegramTransferBusinessAccountStarsRequestSchema
>;

export const TelegramTransferGiftRequestSchema = TelegramGenericRequestSchema;
export type TelegramTransferGiftRequest = z.infer<
  typeof TelegramTransferGiftRequestSchema
>;

export const TelegramUnbanChatMemberRequestSchema =
  TelegramGenericRequestSchema;
export type TelegramUnbanChatMemberRequest = z.infer<
  typeof TelegramUnbanChatMemberRequestSchema
>;

export const TelegramUnbanChatSenderChatRequestSchema =
  TelegramGenericRequestSchema;
export type TelegramUnbanChatSenderChatRequest = z.infer<
  typeof TelegramUnbanChatSenderChatRequestSchema
>;

export const TelegramUnhideGeneralForumTopicRequestSchema =
  TelegramGenericRequestSchema;
export type TelegramUnhideGeneralForumTopicRequest = z.infer<
  typeof TelegramUnhideGeneralForumTopicRequestSchema
>;

export const TelegramUnpinAllChatMessagesRequestSchema =
  TelegramGenericRequestSchema;
export type TelegramUnpinAllChatMessagesRequest = z.infer<
  typeof TelegramUnpinAllChatMessagesRequestSchema
>;

export const TelegramUnpinAllForumTopicMessagesRequestSchema =
  TelegramGenericRequestSchema;
export type TelegramUnpinAllForumTopicMessagesRequest = z.infer<
  typeof TelegramUnpinAllForumTopicMessagesRequestSchema
>;

export const TelegramUnpinAllGeneralForumTopicMessagesRequestSchema =
  TelegramGenericRequestSchema;
export type TelegramUnpinAllGeneralForumTopicMessagesRequest = z.infer<
  typeof TelegramUnpinAllGeneralForumTopicMessagesRequestSchema
>;

export const TelegramUnpinChatMessageRequestSchema =
  TelegramGenericRequestSchema;
export type TelegramUnpinChatMessageRequest = z.infer<
  typeof TelegramUnpinChatMessageRequestSchema
>;

export const TelegramUpgradeGiftRequestSchema = TelegramGenericRequestSchema;
export type TelegramUpgradeGiftRequest = z.infer<
  typeof TelegramUpgradeGiftRequestSchema
>;

export const TelegramUploadStickerFileRequestSchema =
  TelegramGenericRequestSchema;
export type TelegramUploadStickerFileRequest = z.infer<
  typeof TelegramUploadStickerFileRequestSchema
>;

export const TelegramVerifyChatRequestSchema = TelegramGenericRequestSchema;
export type TelegramVerifyChatRequest = z.infer<
  typeof TelegramVerifyChatRequestSchema
>;

export const TelegramVerifyUserRequestSchema = TelegramGenericRequestSchema;
export type TelegramVerifyUserRequest = z.infer<
  typeof TelegramVerifyUserRequestSchema
>;

export const TelegramApproveSuggestedPostRequestSchema =
  TelegramGenericRequestSchema;
export type TelegramApproveSuggestedPostRequest = z.infer<
  typeof TelegramApproveSuggestedPostRequestSchema
>;

export const TelegramDeclineSuggestedPostRequestSchema =
  TelegramGenericRequestSchema;
export type TelegramDeclineSuggestedPostRequest = z.infer<
  typeof TelegramDeclineSuggestedPostRequestSchema
>;

export const TelegramGetUserProfileAudiosRequestSchema =
  TelegramGenericRequestSchema;
export type TelegramGetUserProfileAudiosRequest = z.infer<
  typeof TelegramGetUserProfileAudiosRequestSchema
>;

export const TelegramGetUserProfilePhotosRequestSchema =
  TelegramGenericRequestSchema;
export type TelegramGetUserProfilePhotosRequest = z.infer<
  typeof TelegramGetUserProfilePhotosRequestSchema
>;

export const TelegramRemoveMyProfilePhotoRequestSchema =
  TelegramEmptyRequestSchema;
export type TelegramRemoveMyProfilePhotoRequest = z.infer<
  typeof TelegramRemoveMyProfilePhotoRequestSchema
>;

export const TelegramSetMyProfilePhotoRequestSchema =
  TelegramGenericRequestSchema;
export type TelegramSetMyProfilePhotoRequest = z.infer<
  typeof TelegramSetMyProfilePhotoRequestSchema
>;
