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
export type TelegramEmptyRequest = z.input<typeof TelegramEmptyRequestSchema>;
export type TelegramEmptyParsedRequest = z.output<
  typeof TelegramEmptyRequestSchema
>;
export type TelegramGenericRequest = z.input<
  typeof TelegramGenericRequestSchema
>;
export type TelegramGenericParsedRequest = z.output<
  typeof TelegramGenericRequestSchema
>;

export const TelegramAddStickerToSetRequestSchema =
  TelegramGenericRequestSchema;
export type TelegramAddStickerToSetRequest = z.input<
  typeof TelegramAddStickerToSetRequestSchema
>;
export type TelegramAddStickerToSetParsedRequest = z.output<
  typeof TelegramAddStickerToSetRequestSchema
>;

export const TelegramAnswerCallbackQueryRequestSchema =
  TelegramGenericRequestSchema;
export type TelegramAnswerCallbackQueryRequest = z.input<
  typeof TelegramAnswerCallbackQueryRequestSchema
>;
export type TelegramAnswerCallbackQueryParsedRequest = z.output<
  typeof TelegramAnswerCallbackQueryRequestSchema
>;

export const TelegramAnswerChatJoinRequestQueryRequestSchema = z
  .object({
    chat_join_request_query_id: z.string().min(1),
    result: z.enum(["approve", "decline", "queue"]),
  })
  .passthrough();
export type TelegramAnswerChatJoinRequestQueryRequest = z.input<
  typeof TelegramAnswerChatJoinRequestQueryRequestSchema
>;
export type TelegramAnswerChatJoinRequestQueryParsedRequest = z.output<
  typeof TelegramAnswerChatJoinRequestQueryRequestSchema
>;

export const TelegramAnswerGuestQueryRequestSchema =
  TelegramGenericRequestSchema;
export type TelegramAnswerGuestQueryRequest = z.input<
  typeof TelegramAnswerGuestQueryRequestSchema
>;
export type TelegramAnswerGuestQueryParsedRequest = z.output<
  typeof TelegramAnswerGuestQueryRequestSchema
>;

export const TelegramAnswerInlineQueryRequestSchema = z
  .object({
    inline_query_id: z.string().min(1),
    results: TelegramRecordArraySchema,
  })
  .passthrough();
export type TelegramAnswerInlineQueryRequest = z.input<
  typeof TelegramAnswerInlineQueryRequestSchema
>;
export type TelegramAnswerInlineQueryParsedRequest = z.output<
  typeof TelegramAnswerInlineQueryRequestSchema
>;

export const TelegramAnswerPreCheckoutQueryRequestSchema =
  TelegramGenericRequestSchema;
export type TelegramAnswerPreCheckoutQueryRequest = z.input<
  typeof TelegramAnswerPreCheckoutQueryRequestSchema
>;
export type TelegramAnswerPreCheckoutQueryParsedRequest = z.output<
  typeof TelegramAnswerPreCheckoutQueryRequestSchema
>;

export const TelegramAnswerShippingQueryRequestSchema =
  TelegramGenericRequestSchema;
export type TelegramAnswerShippingQueryRequest = z.input<
  typeof TelegramAnswerShippingQueryRequestSchema
>;
export type TelegramAnswerShippingQueryParsedRequest = z.output<
  typeof TelegramAnswerShippingQueryRequestSchema
>;

export const TelegramAnswerWebAppQueryRequestSchema =
  TelegramGenericRequestSchema;
export type TelegramAnswerWebAppQueryRequest = z.input<
  typeof TelegramAnswerWebAppQueryRequestSchema
>;
export type TelegramAnswerWebAppQueryParsedRequest = z.output<
  typeof TelegramAnswerWebAppQueryRequestSchema
>;

export const TelegramApproveChatJoinRequestRequestSchema =
  TelegramGenericRequestSchema;
export type TelegramApproveChatJoinRequestRequest = z.input<
  typeof TelegramApproveChatJoinRequestRequestSchema
>;
export type TelegramApproveChatJoinRequestParsedRequest = z.output<
  typeof TelegramApproveChatJoinRequestRequestSchema
>;

export const TelegramBanChatMemberRequestSchema = TelegramGenericRequestSchema;
export type TelegramBanChatMemberRequest = z.input<
  typeof TelegramBanChatMemberRequestSchema
>;
export type TelegramBanChatMemberParsedRequest = z.output<
  typeof TelegramBanChatMemberRequestSchema
>;

export const TelegramBanChatSenderChatRequestSchema =
  TelegramGenericRequestSchema;
export type TelegramBanChatSenderChatRequest = z.input<
  typeof TelegramBanChatSenderChatRequestSchema
>;
export type TelegramBanChatSenderChatParsedRequest = z.output<
  typeof TelegramBanChatSenderChatRequestSchema
>;

export const TelegramCloseRequestSchema = TelegramEmptyRequestSchema;
export type TelegramCloseRequest = z.input<typeof TelegramCloseRequestSchema>;
export type TelegramCloseParsedRequest = z.output<
  typeof TelegramCloseRequestSchema
>;

export const TelegramCloseForumTopicRequestSchema =
  TelegramGenericRequestSchema;
export type TelegramCloseForumTopicRequest = z.input<
  typeof TelegramCloseForumTopicRequestSchema
>;
export type TelegramCloseForumTopicParsedRequest = z.output<
  typeof TelegramCloseForumTopicRequestSchema
>;

export const TelegramCloseGeneralForumTopicRequestSchema =
  TelegramGenericRequestSchema;
export type TelegramCloseGeneralForumTopicRequest = z.input<
  typeof TelegramCloseGeneralForumTopicRequestSchema
>;
export type TelegramCloseGeneralForumTopicParsedRequest = z.output<
  typeof TelegramCloseGeneralForumTopicRequestSchema
>;

export const TelegramConvertGiftToStarsRequestSchema =
  TelegramGenericRequestSchema;
export type TelegramConvertGiftToStarsRequest = z.input<
  typeof TelegramConvertGiftToStarsRequestSchema
>;
export type TelegramConvertGiftToStarsParsedRequest = z.output<
  typeof TelegramConvertGiftToStarsRequestSchema
>;

export const TelegramCopyMessageRequestSchema = z
  .object({
    chat_id: TelegramChatIdSchema,
    from_chat_id: TelegramChatIdSchema,
    message_id: z.number().int(),
  })
  .passthrough();
export type TelegramCopyMessageRequest = z.input<
  typeof TelegramCopyMessageRequestSchema
>;
export type TelegramCopyMessageParsedRequest = z.output<
  typeof TelegramCopyMessageRequestSchema
>;

export const TelegramCopyMessagesRequestSchema = TelegramGenericRequestSchema;
export type TelegramCopyMessagesRequest = z.input<
  typeof TelegramCopyMessagesRequestSchema
>;
export type TelegramCopyMessagesParsedRequest = z.output<
  typeof TelegramCopyMessagesRequestSchema
>;

export const TelegramCreateChatInviteLinkRequestSchema =
  TelegramGenericRequestSchema;
export type TelegramCreateChatInviteLinkRequest = z.input<
  typeof TelegramCreateChatInviteLinkRequestSchema
>;
export type TelegramCreateChatInviteLinkParsedRequest = z.output<
  typeof TelegramCreateChatInviteLinkRequestSchema
>;

export const TelegramCreateChatSubscriptionInviteLinkRequestSchema =
  TelegramGenericRequestSchema;
export type TelegramCreateChatSubscriptionInviteLinkRequest = z.input<
  typeof TelegramCreateChatSubscriptionInviteLinkRequestSchema
>;
export type TelegramCreateChatSubscriptionInviteLinkParsedRequest = z.output<
  typeof TelegramCreateChatSubscriptionInviteLinkRequestSchema
>;

export const TelegramCreateForumTopicRequestSchema =
  TelegramGenericRequestSchema;
export type TelegramCreateForumTopicRequest = z.input<
  typeof TelegramCreateForumTopicRequestSchema
>;
export type TelegramCreateForumTopicParsedRequest = z.output<
  typeof TelegramCreateForumTopicRequestSchema
>;

export const TelegramCreateInvoiceLinkRequestSchema =
  TelegramGenericRequestSchema;
export type TelegramCreateInvoiceLinkRequest = z.input<
  typeof TelegramCreateInvoiceLinkRequestSchema
>;
export type TelegramCreateInvoiceLinkParsedRequest = z.output<
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
export type TelegramCreateNewStickerSetRequest = z.input<
  typeof TelegramCreateNewStickerSetRequestSchema
>;
export type TelegramCreateNewStickerSetParsedRequest = z.output<
  typeof TelegramCreateNewStickerSetRequestSchema
>;

export const TelegramDeclineChatJoinRequestRequestSchema =
  TelegramGenericRequestSchema;
export type TelegramDeclineChatJoinRequestRequest = z.input<
  typeof TelegramDeclineChatJoinRequestRequestSchema
>;
export type TelegramDeclineChatJoinRequestParsedRequest = z.output<
  typeof TelegramDeclineChatJoinRequestRequestSchema
>;

export const TelegramDeleteAllMessageReactionsRequestSchema = z
  .object({
    chat_id: TelegramChatIdSchema,
    message_id: z.number().int(),
  })
  .passthrough();
export type TelegramDeleteAllMessageReactionsRequest = z.input<
  typeof TelegramDeleteAllMessageReactionsRequestSchema
>;
export type TelegramDeleteAllMessageReactionsParsedRequest = z.output<
  typeof TelegramDeleteAllMessageReactionsRequestSchema
>;

export const TelegramDeleteBusinessMessagesRequestSchema =
  TelegramGenericRequestSchema;
export type TelegramDeleteBusinessMessagesRequest = z.input<
  typeof TelegramDeleteBusinessMessagesRequestSchema
>;
export type TelegramDeleteBusinessMessagesParsedRequest = z.output<
  typeof TelegramDeleteBusinessMessagesRequestSchema
>;

export const TelegramDeleteChatPhotoRequestSchema =
  TelegramGenericRequestSchema;
export type TelegramDeleteChatPhotoRequest = z.input<
  typeof TelegramDeleteChatPhotoRequestSchema
>;
export type TelegramDeleteChatPhotoParsedRequest = z.output<
  typeof TelegramDeleteChatPhotoRequestSchema
>;

export const TelegramDeleteChatStickerSetRequestSchema =
  TelegramGenericRequestSchema;
export type TelegramDeleteChatStickerSetRequest = z.input<
  typeof TelegramDeleteChatStickerSetRequestSchema
>;
export type TelegramDeleteChatStickerSetParsedRequest = z.output<
  typeof TelegramDeleteChatStickerSetRequestSchema
>;

export const TelegramDeleteForumTopicRequestSchema =
  TelegramGenericRequestSchema;
export type TelegramDeleteForumTopicRequest = z.input<
  typeof TelegramDeleteForumTopicRequestSchema
>;
export type TelegramDeleteForumTopicParsedRequest = z.output<
  typeof TelegramDeleteForumTopicRequestSchema
>;

export const TelegramDeleteMessageRequestSchema = TelegramGenericRequestSchema;
export type TelegramDeleteMessageRequest = z.input<
  typeof TelegramDeleteMessageRequestSchema
>;
export type TelegramDeleteMessageParsedRequest = z.output<
  typeof TelegramDeleteMessageRequestSchema
>;

export const TelegramDeleteMessageReactionRequestSchema = z
  .object({
    chat_id: TelegramChatIdSchema,
    message_id: z.number().int(),
    user_id: z.number().int().optional(),
  })
  .passthrough();
export type TelegramDeleteMessageReactionRequest = z.input<
  typeof TelegramDeleteMessageReactionRequestSchema
>;
export type TelegramDeleteMessageReactionParsedRequest = z.output<
  typeof TelegramDeleteMessageReactionRequestSchema
>;

export const TelegramDeleteMessagesRequestSchema = TelegramGenericRequestSchema;
export type TelegramDeleteMessagesRequest = z.input<
  typeof TelegramDeleteMessagesRequestSchema
>;
export type TelegramDeleteMessagesParsedRequest = z.output<
  typeof TelegramDeleteMessagesRequestSchema
>;

export const TelegramDeleteMyCommandsRequestSchema =
  TelegramGenericRequestSchema;
export type TelegramDeleteMyCommandsRequest = z.input<
  typeof TelegramDeleteMyCommandsRequestSchema
>;
export type TelegramDeleteMyCommandsParsedRequest = z.output<
  typeof TelegramDeleteMyCommandsRequestSchema
>;

export const TelegramDeleteStickerFromSetRequestSchema =
  TelegramGenericRequestSchema;
export type TelegramDeleteStickerFromSetRequest = z.input<
  typeof TelegramDeleteStickerFromSetRequestSchema
>;
export type TelegramDeleteStickerFromSetParsedRequest = z.output<
  typeof TelegramDeleteStickerFromSetRequestSchema
>;

export const TelegramDeleteStickerSetRequestSchema =
  TelegramGenericRequestSchema;
export type TelegramDeleteStickerSetRequest = z.input<
  typeof TelegramDeleteStickerSetRequestSchema
>;
export type TelegramDeleteStickerSetParsedRequest = z.output<
  typeof TelegramDeleteStickerSetRequestSchema
>;

export const TelegramDeleteStoryRequestSchema = TelegramGenericRequestSchema;
export type TelegramDeleteStoryRequest = z.input<
  typeof TelegramDeleteStoryRequestSchema
>;
export type TelegramDeleteStoryParsedRequest = z.output<
  typeof TelegramDeleteStoryRequestSchema
>;

export const TelegramDeleteWebhookRequestSchema = TelegramGenericRequestSchema;
export type TelegramDeleteWebhookRequest = z.input<
  typeof TelegramDeleteWebhookRequestSchema
>;
export type TelegramDeleteWebhookParsedRequest = z.output<
  typeof TelegramDeleteWebhookRequestSchema
>;

export const TelegramEditChatInviteLinkRequestSchema =
  TelegramGenericRequestSchema;
export type TelegramEditChatInviteLinkRequest = z.input<
  typeof TelegramEditChatInviteLinkRequestSchema
>;
export type TelegramEditChatInviteLinkParsedRequest = z.output<
  typeof TelegramEditChatInviteLinkRequestSchema
>;

export const TelegramEditChatSubscriptionInviteLinkRequestSchema =
  TelegramGenericRequestSchema;
export type TelegramEditChatSubscriptionInviteLinkRequest = z.input<
  typeof TelegramEditChatSubscriptionInviteLinkRequestSchema
>;
export type TelegramEditChatSubscriptionInviteLinkParsedRequest = z.output<
  typeof TelegramEditChatSubscriptionInviteLinkRequestSchema
>;

export const TelegramEditForumTopicRequestSchema = TelegramGenericRequestSchema;
export type TelegramEditForumTopicRequest = z.input<
  typeof TelegramEditForumTopicRequestSchema
>;
export type TelegramEditForumTopicParsedRequest = z.output<
  typeof TelegramEditForumTopicRequestSchema
>;

export const TelegramEditGeneralForumTopicRequestSchema =
  TelegramGenericRequestSchema;
export type TelegramEditGeneralForumTopicRequest = z.input<
  typeof TelegramEditGeneralForumTopicRequestSchema
>;
export type TelegramEditGeneralForumTopicParsedRequest = z.output<
  typeof TelegramEditGeneralForumTopicRequestSchema
>;

export const TelegramEditMessageCaptionRequestSchema =
  TelegramGenericRequestSchema;
export type TelegramEditMessageCaptionRequest = z.input<
  typeof TelegramEditMessageCaptionRequestSchema
>;
export type TelegramEditMessageCaptionParsedRequest = z.output<
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
export type TelegramEditMessageChecklistRequest = z.input<
  typeof TelegramEditMessageChecklistRequestSchema
>;
export type TelegramEditMessageChecklistParsedRequest = z.output<
  typeof TelegramEditMessageChecklistRequestSchema
>;

export const TelegramEditMessageLiveLocationRequestSchema =
  TelegramGenericRequestSchema;
export type TelegramEditMessageLiveLocationRequest = z.input<
  typeof TelegramEditMessageLiveLocationRequestSchema
>;
export type TelegramEditMessageLiveLocationParsedRequest = z.output<
  typeof TelegramEditMessageLiveLocationRequestSchema
>;

export const TelegramEditMessageMediaRequestSchema =
  TelegramGenericRequestSchema;
export type TelegramEditMessageMediaRequest = z.input<
  typeof TelegramEditMessageMediaRequestSchema
>;
export type TelegramEditMessageMediaParsedRequest = z.output<
  typeof TelegramEditMessageMediaRequestSchema
>;

export const TelegramEditMessageReplyMarkupRequestSchema =
  TelegramGenericRequestSchema;
export type TelegramEditMessageReplyMarkupRequest = z.input<
  typeof TelegramEditMessageReplyMarkupRequestSchema
>;
export type TelegramEditMessageReplyMarkupParsedRequest = z.output<
  typeof TelegramEditMessageReplyMarkupRequestSchema
>;

export const TelegramEditMessageTextRequestSchema = z
  .object({
    text: z.string().min(1),
  })
  .merge(TelegramMessageTargetSchema)
  .passthrough();
export type TelegramEditMessageTextRequest = z.input<
  typeof TelegramEditMessageTextRequestSchema
>;
export type TelegramEditMessageTextParsedRequest = z.output<
  typeof TelegramEditMessageTextRequestSchema
>;

export const TelegramEditStoryRequestSchema = TelegramGenericRequestSchema;
export type TelegramEditStoryRequest = z.input<
  typeof TelegramEditStoryRequestSchema
>;
export type TelegramEditStoryParsedRequest = z.output<
  typeof TelegramEditStoryRequestSchema
>;

export const TelegramEditUserStarSubscriptionRequestSchema =
  TelegramGenericRequestSchema;
export type TelegramEditUserStarSubscriptionRequest = z.input<
  typeof TelegramEditUserStarSubscriptionRequestSchema
>;
export type TelegramEditUserStarSubscriptionParsedRequest = z.output<
  typeof TelegramEditUserStarSubscriptionRequestSchema
>;

export const TelegramExportChatInviteLinkRequestSchema =
  TelegramGenericRequestSchema;
export type TelegramExportChatInviteLinkRequest = z.input<
  typeof TelegramExportChatInviteLinkRequestSchema
>;
export type TelegramExportChatInviteLinkParsedRequest = z.output<
  typeof TelegramExportChatInviteLinkRequestSchema
>;

export const TelegramForwardMessageRequestSchema = TelegramGenericRequestSchema;
export type TelegramForwardMessageRequest = z.input<
  typeof TelegramForwardMessageRequestSchema
>;
export type TelegramForwardMessageParsedRequest = z.output<
  typeof TelegramForwardMessageRequestSchema
>;

export const TelegramForwardMessagesRequestSchema = z
  .object({
    chat_id: TelegramChatIdSchema,
    from_chat_id: TelegramChatIdSchema,
    message_ids: TelegramMessageIdListSchema,
  })
  .passthrough();
export type TelegramForwardMessagesRequest = z.input<
  typeof TelegramForwardMessagesRequestSchema
>;
export type TelegramForwardMessagesParsedRequest = z.output<
  typeof TelegramForwardMessagesRequestSchema
>;

export const TelegramGetAvailableGiftsRequestSchema =
  TelegramGenericRequestSchema;
export type TelegramGetAvailableGiftsRequest = z.input<
  typeof TelegramGetAvailableGiftsRequestSchema
>;
export type TelegramGetAvailableGiftsParsedRequest = z.output<
  typeof TelegramGetAvailableGiftsRequestSchema
>;

export const TelegramGetBusinessAccountGiftsRequestSchema =
  TelegramGenericRequestSchema;
export type TelegramGetBusinessAccountGiftsRequest = z.input<
  typeof TelegramGetBusinessAccountGiftsRequestSchema
>;
export type TelegramGetBusinessAccountGiftsParsedRequest = z.output<
  typeof TelegramGetBusinessAccountGiftsRequestSchema
>;

export const TelegramGetBusinessAccountStarBalanceRequestSchema =
  TelegramGenericRequestSchema;
export type TelegramGetBusinessAccountStarBalanceRequest = z.input<
  typeof TelegramGetBusinessAccountStarBalanceRequestSchema
>;
export type TelegramGetBusinessAccountStarBalanceParsedRequest = z.output<
  typeof TelegramGetBusinessAccountStarBalanceRequestSchema
>;

export const TelegramGetBusinessConnectionRequestSchema = z
  .object({
    business_connection_id: z.string().min(1),
  })
  .passthrough();
export type TelegramGetBusinessConnectionRequest = z.input<
  typeof TelegramGetBusinessConnectionRequestSchema
>;
export type TelegramGetBusinessConnectionParsedRequest = z.output<
  typeof TelegramGetBusinessConnectionRequestSchema
>;

export const TelegramGetChatRequestSchema = TelegramGenericRequestSchema;
export type TelegramGetChatRequest = z.input<
  typeof TelegramGetChatRequestSchema
>;
export type TelegramGetChatParsedRequest = z.output<
  typeof TelegramGetChatRequestSchema
>;

export const TelegramGetChatAdministratorsRequestSchema =
  TelegramGenericRequestSchema;
export type TelegramGetChatAdministratorsRequest = z.input<
  typeof TelegramGetChatAdministratorsRequestSchema
>;
export type TelegramGetChatAdministratorsParsedRequest = z.output<
  typeof TelegramGetChatAdministratorsRequestSchema
>;

export const TelegramGetChatGiftsRequestSchema = TelegramGenericRequestSchema;
export type TelegramGetChatGiftsRequest = z.input<
  typeof TelegramGetChatGiftsRequestSchema
>;
export type TelegramGetChatGiftsParsedRequest = z.output<
  typeof TelegramGetChatGiftsRequestSchema
>;

export const TelegramGetChatMemberRequestSchema = TelegramGenericRequestSchema;
export type TelegramGetChatMemberRequest = z.input<
  typeof TelegramGetChatMemberRequestSchema
>;
export type TelegramGetChatMemberParsedRequest = z.output<
  typeof TelegramGetChatMemberRequestSchema
>;

export const TelegramGetChatMemberCountRequestSchema =
  TelegramGenericRequestSchema;
export type TelegramGetChatMemberCountRequest = z.input<
  typeof TelegramGetChatMemberCountRequestSchema
>;
export type TelegramGetChatMemberCountParsedRequest = z.output<
  typeof TelegramGetChatMemberCountRequestSchema
>;

export const TelegramGetChatMenuButtonRequestSchema =
  TelegramGenericRequestSchema;
export type TelegramGetChatMenuButtonRequest = z.input<
  typeof TelegramGetChatMenuButtonRequestSchema
>;
export type TelegramGetChatMenuButtonParsedRequest = z.output<
  typeof TelegramGetChatMenuButtonRequestSchema
>;

export const TelegramGetCustomEmojiStickersRequestSchema =
  TelegramGenericRequestSchema;
export type TelegramGetCustomEmojiStickersRequest = z.input<
  typeof TelegramGetCustomEmojiStickersRequestSchema
>;
export type TelegramGetCustomEmojiStickersParsedRequest = z.output<
  typeof TelegramGetCustomEmojiStickersRequestSchema
>;

export const TelegramGetFileRequestSchema = z
  .object({
    file_id: z.string().min(1),
  })
  .passthrough();
export type TelegramGetFileRequest = z.input<
  typeof TelegramGetFileRequestSchema
>;
export type TelegramGetFileParsedRequest = z.output<
  typeof TelegramGetFileRequestSchema
>;

export const TelegramGetForumTopicIconStickersRequestSchema =
  TelegramGenericRequestSchema;
export type TelegramGetForumTopicIconStickersRequest = z.input<
  typeof TelegramGetForumTopicIconStickersRequestSchema
>;
export type TelegramGetForumTopicIconStickersParsedRequest = z.output<
  typeof TelegramGetForumTopicIconStickersRequestSchema
>;

export const TelegramGetGameHighScoresRequestSchema =
  TelegramGenericRequestSchema;
export type TelegramGetGameHighScoresRequest = z.input<
  typeof TelegramGetGameHighScoresRequestSchema
>;
export type TelegramGetGameHighScoresParsedRequest = z.output<
  typeof TelegramGetGameHighScoresRequestSchema
>;

export const TelegramGetManagedBotAccessSettingsRequestSchema =
  TelegramGenericRequestSchema;
export type TelegramGetManagedBotAccessSettingsRequest = z.input<
  typeof TelegramGetManagedBotAccessSettingsRequestSchema
>;
export type TelegramGetManagedBotAccessSettingsParsedRequest = z.output<
  typeof TelegramGetManagedBotAccessSettingsRequestSchema
>;

export const TelegramGetManagedBotTokenRequestSchema =
  TelegramGenericRequestSchema;
export type TelegramGetManagedBotTokenRequest = z.input<
  typeof TelegramGetManagedBotTokenRequestSchema
>;
export type TelegramGetManagedBotTokenParsedRequest = z.output<
  typeof TelegramGetManagedBotTokenRequestSchema
>;

export const TelegramGetMeRequestSchema = TelegramEmptyRequestSchema;
export type TelegramGetMeRequest = z.input<typeof TelegramGetMeRequestSchema>;
export type TelegramGetMeParsedRequest = z.output<
  typeof TelegramGetMeRequestSchema
>;

export const TelegramGetMyCommandsRequestSchema = TelegramGenericRequestSchema;
export type TelegramGetMyCommandsRequest = z.input<
  typeof TelegramGetMyCommandsRequestSchema
>;
export type TelegramGetMyCommandsParsedRequest = z.output<
  typeof TelegramGetMyCommandsRequestSchema
>;

export const TelegramGetMyDefaultAdministratorRightsRequestSchema =
  TelegramGenericRequestSchema;
export type TelegramGetMyDefaultAdministratorRightsRequest = z.input<
  typeof TelegramGetMyDefaultAdministratorRightsRequestSchema
>;
export type TelegramGetMyDefaultAdministratorRightsParsedRequest = z.output<
  typeof TelegramGetMyDefaultAdministratorRightsRequestSchema
>;

export const TelegramGetMyDescriptionRequestSchema =
  TelegramGenericRequestSchema;
export type TelegramGetMyDescriptionRequest = z.input<
  typeof TelegramGetMyDescriptionRequestSchema
>;
export type TelegramGetMyDescriptionParsedRequest = z.output<
  typeof TelegramGetMyDescriptionRequestSchema
>;

export const TelegramGetMyNameRequestSchema = TelegramGenericRequestSchema;
export type TelegramGetMyNameRequest = z.input<
  typeof TelegramGetMyNameRequestSchema
>;
export type TelegramGetMyNameParsedRequest = z.output<
  typeof TelegramGetMyNameRequestSchema
>;

export const TelegramGetMyShortDescriptionRequestSchema =
  TelegramGenericRequestSchema;
export type TelegramGetMyShortDescriptionRequest = z.input<
  typeof TelegramGetMyShortDescriptionRequestSchema
>;
export type TelegramGetMyShortDescriptionParsedRequest = z.output<
  typeof TelegramGetMyShortDescriptionRequestSchema
>;

export const TelegramGetMyStarBalanceRequestSchema = TelegramEmptyRequestSchema;
export type TelegramGetMyStarBalanceRequest = z.input<
  typeof TelegramGetMyStarBalanceRequestSchema
>;
export type TelegramGetMyStarBalanceParsedRequest = z.output<
  typeof TelegramGetMyStarBalanceRequestSchema
>;

export const TelegramGetStarTransactionsRequestSchema =
  TelegramGenericRequestSchema;
export type TelegramGetStarTransactionsRequest = z.input<
  typeof TelegramGetStarTransactionsRequestSchema
>;
export type TelegramGetStarTransactionsParsedRequest = z.output<
  typeof TelegramGetStarTransactionsRequestSchema
>;

export const TelegramGetStickerSetRequestSchema = TelegramGenericRequestSchema;
export type TelegramGetStickerSetRequest = z.input<
  typeof TelegramGetStickerSetRequestSchema
>;
export type TelegramGetStickerSetParsedRequest = z.output<
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
export type TelegramGetUpdatesRequest = z.input<
  typeof TelegramGetUpdatesRequestSchema
>;
export type TelegramGetUpdatesParsedRequest = z.output<
  typeof TelegramGetUpdatesRequestSchema
>;

export const TelegramGetUserChatBoostsRequestSchema =
  TelegramGenericRequestSchema;
export type TelegramGetUserChatBoostsRequest = z.input<
  typeof TelegramGetUserChatBoostsRequestSchema
>;
export type TelegramGetUserChatBoostsParsedRequest = z.output<
  typeof TelegramGetUserChatBoostsRequestSchema
>;

export const TelegramGetUserGiftsRequestSchema = TelegramGenericRequestSchema;
export type TelegramGetUserGiftsRequest = z.input<
  typeof TelegramGetUserGiftsRequestSchema
>;
export type TelegramGetUserGiftsParsedRequest = z.output<
  typeof TelegramGetUserGiftsRequestSchema
>;

export const TelegramGetUserPersonalChatMessagesRequestSchema =
  TelegramGenericRequestSchema;
export type TelegramGetUserPersonalChatMessagesRequest = z.input<
  typeof TelegramGetUserPersonalChatMessagesRequestSchema
>;
export type TelegramGetUserPersonalChatMessagesParsedRequest = z.output<
  typeof TelegramGetUserPersonalChatMessagesRequestSchema
>;

export const TelegramGetWebhookInfoRequestSchema = TelegramEmptyRequestSchema;
export type TelegramGetWebhookInfoRequest = z.input<
  typeof TelegramGetWebhookInfoRequestSchema
>;
export type TelegramGetWebhookInfoParsedRequest = z.output<
  typeof TelegramGetWebhookInfoRequestSchema
>;

export const TelegramGiftPremiumSubscriptionRequestSchema = z
  .object({
    user_id: z.number().int(),
    month_count: z.number().int().min(1),
    star_count: z.number().int().min(1),
  })
  .passthrough();
export type TelegramGiftPremiumSubscriptionRequest = z.input<
  typeof TelegramGiftPremiumSubscriptionRequestSchema
>;
export type TelegramGiftPremiumSubscriptionParsedRequest = z.output<
  typeof TelegramGiftPremiumSubscriptionRequestSchema
>;

export const TelegramHideGeneralForumTopicRequestSchema =
  TelegramGenericRequestSchema;
export type TelegramHideGeneralForumTopicRequest = z.input<
  typeof TelegramHideGeneralForumTopicRequestSchema
>;
export type TelegramHideGeneralForumTopicParsedRequest = z.output<
  typeof TelegramHideGeneralForumTopicRequestSchema
>;

export const TelegramLeaveChatRequestSchema = TelegramGenericRequestSchema;
export type TelegramLeaveChatRequest = z.input<
  typeof TelegramLeaveChatRequestSchema
>;
export type TelegramLeaveChatParsedRequest = z.output<
  typeof TelegramLeaveChatRequestSchema
>;

export const TelegramLogOutRequestSchema = TelegramEmptyRequestSchema;
export type TelegramLogOutRequest = z.input<typeof TelegramLogOutRequestSchema>;
export type TelegramLogOutParsedRequest = z.output<
  typeof TelegramLogOutRequestSchema
>;

export const TelegramPinChatMessageRequestSchema = TelegramGenericRequestSchema;
export type TelegramPinChatMessageRequest = z.input<
  typeof TelegramPinChatMessageRequestSchema
>;
export type TelegramPinChatMessageParsedRequest = z.output<
  typeof TelegramPinChatMessageRequestSchema
>;

export const TelegramPostStoryRequestSchema = z
  .object({
    business_connection_id: z.string().min(1),
    content: TelegramRecordSchema,
  })
  .passthrough();
export type TelegramPostStoryRequest = z.input<
  typeof TelegramPostStoryRequestSchema
>;
export type TelegramPostStoryParsedRequest = z.output<
  typeof TelegramPostStoryRequestSchema
>;

export const TelegramPromoteChatMemberRequestSchema =
  TelegramGenericRequestSchema;
export type TelegramPromoteChatMemberRequest = z.input<
  typeof TelegramPromoteChatMemberRequestSchema
>;
export type TelegramPromoteChatMemberParsedRequest = z.output<
  typeof TelegramPromoteChatMemberRequestSchema
>;

export const TelegramReadBusinessMessageRequestSchema =
  TelegramGenericRequestSchema;
export type TelegramReadBusinessMessageRequest = z.input<
  typeof TelegramReadBusinessMessageRequestSchema
>;
export type TelegramReadBusinessMessageParsedRequest = z.output<
  typeof TelegramReadBusinessMessageRequestSchema
>;

export const TelegramRefundStarPaymentRequestSchema =
  TelegramGenericRequestSchema;
export type TelegramRefundStarPaymentRequest = z.input<
  typeof TelegramRefundStarPaymentRequestSchema
>;
export type TelegramRefundStarPaymentParsedRequest = z.output<
  typeof TelegramRefundStarPaymentRequestSchema
>;

export const TelegramRemoveBusinessAccountProfilePhotoRequestSchema =
  TelegramGenericRequestSchema;
export type TelegramRemoveBusinessAccountProfilePhotoRequest = z.input<
  typeof TelegramRemoveBusinessAccountProfilePhotoRequestSchema
>;
export type TelegramRemoveBusinessAccountProfilePhotoParsedRequest = z.output<
  typeof TelegramRemoveBusinessAccountProfilePhotoRequestSchema
>;

export const TelegramRemoveChatVerificationRequestSchema =
  TelegramGenericRequestSchema;
export type TelegramRemoveChatVerificationRequest = z.input<
  typeof TelegramRemoveChatVerificationRequestSchema
>;
export type TelegramRemoveChatVerificationParsedRequest = z.output<
  typeof TelegramRemoveChatVerificationRequestSchema
>;

export const TelegramRemoveUserVerificationRequestSchema =
  TelegramGenericRequestSchema;
export type TelegramRemoveUserVerificationRequest = z.input<
  typeof TelegramRemoveUserVerificationRequestSchema
>;
export type TelegramRemoveUserVerificationParsedRequest = z.output<
  typeof TelegramRemoveUserVerificationRequestSchema
>;

export const TelegramReopenForumTopicRequestSchema =
  TelegramGenericRequestSchema;
export type TelegramReopenForumTopicRequest = z.input<
  typeof TelegramReopenForumTopicRequestSchema
>;
export type TelegramReopenForumTopicParsedRequest = z.output<
  typeof TelegramReopenForumTopicRequestSchema
>;

export const TelegramReopenGeneralForumTopicRequestSchema =
  TelegramGenericRequestSchema;
export type TelegramReopenGeneralForumTopicRequest = z.input<
  typeof TelegramReopenGeneralForumTopicRequestSchema
>;
export type TelegramReopenGeneralForumTopicParsedRequest = z.output<
  typeof TelegramReopenGeneralForumTopicRequestSchema
>;

export const TelegramReplaceManagedBotTokenRequestSchema =
  TelegramGenericRequestSchema;
export type TelegramReplaceManagedBotTokenRequest = z.input<
  typeof TelegramReplaceManagedBotTokenRequestSchema
>;
export type TelegramReplaceManagedBotTokenParsedRequest = z.output<
  typeof TelegramReplaceManagedBotTokenRequestSchema
>;

export const TelegramReplaceStickerInSetRequestSchema =
  TelegramGenericRequestSchema;
export type TelegramReplaceStickerInSetRequest = z.input<
  typeof TelegramReplaceStickerInSetRequestSchema
>;
export type TelegramReplaceStickerInSetParsedRequest = z.output<
  typeof TelegramReplaceStickerInSetRequestSchema
>;

export const TelegramRepostStoryRequestSchema = TelegramGenericRequestSchema;
export type TelegramRepostStoryRequest = z.input<
  typeof TelegramRepostStoryRequestSchema
>;
export type TelegramRepostStoryParsedRequest = z.output<
  typeof TelegramRepostStoryRequestSchema
>;

export const TelegramRestrictChatMemberRequestSchema =
  TelegramGenericRequestSchema;
export type TelegramRestrictChatMemberRequest = z.input<
  typeof TelegramRestrictChatMemberRequestSchema
>;
export type TelegramRestrictChatMemberParsedRequest = z.output<
  typeof TelegramRestrictChatMemberRequestSchema
>;

export const TelegramRevokeChatInviteLinkRequestSchema =
  TelegramGenericRequestSchema;
export type TelegramRevokeChatInviteLinkRequest = z.input<
  typeof TelegramRevokeChatInviteLinkRequestSchema
>;
export type TelegramRevokeChatInviteLinkParsedRequest = z.output<
  typeof TelegramRevokeChatInviteLinkRequestSchema
>;

export const TelegramSavePreparedInlineMessageRequestSchema =
  TelegramGenericRequestSchema;
export type TelegramSavePreparedInlineMessageRequest = z.input<
  typeof TelegramSavePreparedInlineMessageRequestSchema
>;
export type TelegramSavePreparedInlineMessageParsedRequest = z.output<
  typeof TelegramSavePreparedInlineMessageRequestSchema
>;

export const TelegramSavePreparedKeyboardButtonRequestSchema =
  TelegramGenericRequestSchema;
export type TelegramSavePreparedKeyboardButtonRequest = z.input<
  typeof TelegramSavePreparedKeyboardButtonRequestSchema
>;
export type TelegramSavePreparedKeyboardButtonParsedRequest = z.output<
  typeof TelegramSavePreparedKeyboardButtonRequestSchema
>;

export const TelegramSendAnimationRequestSchema = TelegramGenericRequestSchema;
export type TelegramSendAnimationRequest = z.input<
  typeof TelegramSendAnimationRequestSchema
>;
export type TelegramSendAnimationParsedRequest = z.output<
  typeof TelegramSendAnimationRequestSchema
>;

export const TelegramSendAudioRequestSchema =
  TelegramMediaMessageBaseSchema.extend({
    audio: TelegramInputFileSchema,
    thumbnail: TelegramInputFileSchema.optional(),
  }).passthrough();
export type TelegramSendAudioRequest = z.input<
  typeof TelegramSendAudioRequestSchema
>;
export type TelegramSendAudioParsedRequest = z.output<
  typeof TelegramSendAudioRequestSchema
>;

export const TelegramSendChatActionRequestSchema = TelegramGenericRequestSchema;
export type TelegramSendChatActionRequest = z.input<
  typeof TelegramSendChatActionRequestSchema
>;
export type TelegramSendChatActionParsedRequest = z.output<
  typeof TelegramSendChatActionRequestSchema
>;

export const TelegramSendChatJoinRequestWebAppRequestSchema = z
  .object({
    chat_join_request_query_id: z.string().min(1),
    web_app_url: z.string().url(),
  })
  .passthrough();
export type TelegramSendChatJoinRequestWebAppRequest = z.input<
  typeof TelegramSendChatJoinRequestWebAppRequestSchema
>;
export type TelegramSendChatJoinRequestWebAppParsedRequest = z.output<
  typeof TelegramSendChatJoinRequestWebAppRequestSchema
>;

export const TelegramSendChecklistRequestSchema = TelegramGenericRequestSchema;
export type TelegramSendChecklistRequest = z.input<
  typeof TelegramSendChecklistRequestSchema
>;
export type TelegramSendChecklistParsedRequest = z.output<
  typeof TelegramSendChecklistRequestSchema
>;

export const TelegramSendContactRequestSchema = TelegramGenericRequestSchema;
export type TelegramSendContactRequest = z.input<
  typeof TelegramSendContactRequestSchema
>;
export type TelegramSendContactParsedRequest = z.output<
  typeof TelegramSendContactRequestSchema
>;

export const TelegramSendDiceRequestSchema = TelegramGenericRequestSchema;
export type TelegramSendDiceRequest = z.input<
  typeof TelegramSendDiceRequestSchema
>;
export type TelegramSendDiceParsedRequest = z.output<
  typeof TelegramSendDiceRequestSchema
>;

export const TelegramSendDocumentRequestSchema =
  TelegramMediaMessageBaseSchema.extend({
    document: TelegramInputFileSchema,
    thumbnail: TelegramInputFileSchema.optional(),
  }).passthrough();
export type TelegramSendDocumentRequest = z.input<
  typeof TelegramSendDocumentRequestSchema
>;
export type TelegramSendDocumentParsedRequest = z.output<
  typeof TelegramSendDocumentRequestSchema
>;

export const TelegramSendGameRequestSchema =
  TelegramSendMessageBaseSchema.extend({
    game_short_name: z.string().min(1),
  }).passthrough();
export type TelegramSendGameRequest = z.input<
  typeof TelegramSendGameRequestSchema
>;
export type TelegramSendGameParsedRequest = z.output<
  typeof TelegramSendGameRequestSchema
>;

export const TelegramSendGiftRequestSchema = TelegramGenericRequestSchema;
export type TelegramSendGiftRequest = z.input<
  typeof TelegramSendGiftRequestSchema
>;
export type TelegramSendGiftParsedRequest = z.output<
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
export type TelegramSendInvoiceRequest = z.input<
  typeof TelegramSendInvoiceRequestSchema
>;
export type TelegramSendInvoiceParsedRequest = z.output<
  typeof TelegramSendInvoiceRequestSchema
>;

export const TelegramSendLivePhotoRequestSchema = TelegramGenericRequestSchema;
export type TelegramSendLivePhotoRequest = z.input<
  typeof TelegramSendLivePhotoRequestSchema
>;
export type TelegramSendLivePhotoParsedRequest = z.output<
  typeof TelegramSendLivePhotoRequestSchema
>;

export const TelegramSendLocationRequestSchema = TelegramGenericRequestSchema;
export type TelegramSendLocationRequest = z.input<
  typeof TelegramSendLocationRequestSchema
>;
export type TelegramSendLocationParsedRequest = z.output<
  typeof TelegramSendLocationRequestSchema
>;

export const TelegramSendMediaGroupRequestSchema =
  TelegramSendMessageBaseSchema.extend({
    media: z.array(TelegramInputMediaSchema).min(1),
  }).passthrough();
export type TelegramSendMediaGroupRequest = z.input<
  typeof TelegramSendMediaGroupRequestSchema
>;
export type TelegramSendMediaGroupParsedRequest = z.output<
  typeof TelegramSendMediaGroupRequestSchema
>;

export const TelegramSendMessageRequestSchema =
  TelegramSendMessageBaseSchema.extend({
    text: z.string().min(1),
    parse_mode: TelegramParseModeSchema.optional(),
    entities: TelegramEntitiesSchema.optional(),
    link_preview_options: TelegramRecordSchema.optional(),
  }).passthrough();
export type TelegramSendMessageRequest = z.input<
  typeof TelegramSendMessageRequestSchema
>;
export type TelegramSendMessageParsedRequest = z.output<
  typeof TelegramSendMessageRequestSchema
>;

export const TelegramSendMessageDraftRequestSchema =
  TelegramGenericRequestSchema;
export type TelegramSendMessageDraftRequest = z.input<
  typeof TelegramSendMessageDraftRequestSchema
>;
export type TelegramSendMessageDraftParsedRequest = z.output<
  typeof TelegramSendMessageDraftRequestSchema
>;

export const TelegramSendPaidMediaRequestSchema =
  TelegramSendMessageBaseSchema.extend({
    star_count: z.number().int().min(1),
    media: z.array(TelegramInputPaidMediaSchema).min(1),
    payload: z.string().optional(),
  }).passthrough();
export type TelegramSendPaidMediaRequest = z.input<
  typeof TelegramSendPaidMediaRequestSchema
>;
export type TelegramSendPaidMediaParsedRequest = z.output<
  typeof TelegramSendPaidMediaRequestSchema
>;

export const TelegramSendPhotoRequestSchema =
  TelegramMediaMessageBaseSchema.extend({
    photo: TelegramInputFileSchema,
  }).passthrough();
export type TelegramSendPhotoRequest = z.input<
  typeof TelegramSendPhotoRequestSchema
>;
export type TelegramSendPhotoParsedRequest = z.output<
  typeof TelegramSendPhotoRequestSchema
>;

export const TelegramSendPollRequestSchema =
  TelegramSendMessageBaseSchema.extend({
    question: z.string().min(1),
    options: z.array(TelegramRecordSchema).min(1),
    media: TelegramRecordSchema.optional(),
  }).passthrough();
export type TelegramSendPollRequest = z.input<
  typeof TelegramSendPollRequestSchema
>;
export type TelegramSendPollParsedRequest = z.output<
  typeof TelegramSendPollRequestSchema
>;

export const TelegramSendRichMessageRequestSchema =
  TelegramGenericRequestSchema;
export type TelegramSendRichMessageRequest = z.input<
  typeof TelegramSendRichMessageRequestSchema
>;
export type TelegramSendRichMessageParsedRequest = z.output<
  typeof TelegramSendRichMessageRequestSchema
>;

export const TelegramSendRichMessageDraftRequestSchema =
  TelegramGenericRequestSchema;
export type TelegramSendRichMessageDraftRequest = z.input<
  typeof TelegramSendRichMessageDraftRequestSchema
>;
export type TelegramSendRichMessageDraftParsedRequest = z.output<
  typeof TelegramSendRichMessageDraftRequestSchema
>;

export const TelegramSendStickerRequestSchema = TelegramGenericRequestSchema;
export type TelegramSendStickerRequest = z.input<
  typeof TelegramSendStickerRequestSchema
>;
export type TelegramSendStickerParsedRequest = z.output<
  typeof TelegramSendStickerRequestSchema
>;

export const TelegramSendVenueRequestSchema = TelegramGenericRequestSchema;
export type TelegramSendVenueRequest = z.input<
  typeof TelegramSendVenueRequestSchema
>;
export type TelegramSendVenueParsedRequest = z.output<
  typeof TelegramSendVenueRequestSchema
>;

export const TelegramSendVideoRequestSchema =
  TelegramMediaMessageBaseSchema.extend({
    video: TelegramInputFileSchema,
    thumbnail: TelegramInputFileSchema.optional(),
    cover: TelegramInputFileSchema.optional(),
  }).passthrough();
export type TelegramSendVideoRequest = z.input<
  typeof TelegramSendVideoRequestSchema
>;
export type TelegramSendVideoParsedRequest = z.output<
  typeof TelegramSendVideoRequestSchema
>;

export const TelegramSendVideoNoteRequestSchema = TelegramGenericRequestSchema;
export type TelegramSendVideoNoteRequest = z.input<
  typeof TelegramSendVideoNoteRequestSchema
>;
export type TelegramSendVideoNoteParsedRequest = z.output<
  typeof TelegramSendVideoNoteRequestSchema
>;

export const TelegramSendVoiceRequestSchema =
  TelegramMediaMessageBaseSchema.extend({
    voice: TelegramInputFileSchema,
  }).passthrough();
export type TelegramSendVoiceRequest = z.input<
  typeof TelegramSendVoiceRequestSchema
>;
export type TelegramSendVoiceParsedRequest = z.output<
  typeof TelegramSendVoiceRequestSchema
>;

export const TelegramSetBusinessAccountBioRequestSchema =
  TelegramGenericRequestSchema;
export type TelegramSetBusinessAccountBioRequest = z.input<
  typeof TelegramSetBusinessAccountBioRequestSchema
>;
export type TelegramSetBusinessAccountBioParsedRequest = z.output<
  typeof TelegramSetBusinessAccountBioRequestSchema
>;

export const TelegramSetBusinessAccountGiftSettingsRequestSchema =
  TelegramGenericRequestSchema;
export type TelegramSetBusinessAccountGiftSettingsRequest = z.input<
  typeof TelegramSetBusinessAccountGiftSettingsRequestSchema
>;
export type TelegramSetBusinessAccountGiftSettingsParsedRequest = z.output<
  typeof TelegramSetBusinessAccountGiftSettingsRequestSchema
>;

export const TelegramSetBusinessAccountNameRequestSchema =
  TelegramGenericRequestSchema;
export type TelegramSetBusinessAccountNameRequest = z.input<
  typeof TelegramSetBusinessAccountNameRequestSchema
>;
export type TelegramSetBusinessAccountNameParsedRequest = z.output<
  typeof TelegramSetBusinessAccountNameRequestSchema
>;

export const TelegramSetBusinessAccountProfilePhotoRequestSchema =
  TelegramGenericRequestSchema;
export type TelegramSetBusinessAccountProfilePhotoRequest = z.input<
  typeof TelegramSetBusinessAccountProfilePhotoRequestSchema
>;
export type TelegramSetBusinessAccountProfilePhotoParsedRequest = z.output<
  typeof TelegramSetBusinessAccountProfilePhotoRequestSchema
>;

export const TelegramSetBusinessAccountUsernameRequestSchema =
  TelegramGenericRequestSchema;
export type TelegramSetBusinessAccountUsernameRequest = z.input<
  typeof TelegramSetBusinessAccountUsernameRequestSchema
>;
export type TelegramSetBusinessAccountUsernameParsedRequest = z.output<
  typeof TelegramSetBusinessAccountUsernameRequestSchema
>;

export const TelegramSetChatAdministratorCustomTitleRequestSchema =
  TelegramGenericRequestSchema;
export type TelegramSetChatAdministratorCustomTitleRequest = z.input<
  typeof TelegramSetChatAdministratorCustomTitleRequestSchema
>;
export type TelegramSetChatAdministratorCustomTitleParsedRequest = z.output<
  typeof TelegramSetChatAdministratorCustomTitleRequestSchema
>;

export const TelegramSetChatDescriptionRequestSchema =
  TelegramGenericRequestSchema;
export type TelegramSetChatDescriptionRequest = z.input<
  typeof TelegramSetChatDescriptionRequestSchema
>;
export type TelegramSetChatDescriptionParsedRequest = z.output<
  typeof TelegramSetChatDescriptionRequestSchema
>;

export const TelegramSetChatMemberTagRequestSchema =
  TelegramGenericRequestSchema;
export type TelegramSetChatMemberTagRequest = z.input<
  typeof TelegramSetChatMemberTagRequestSchema
>;
export type TelegramSetChatMemberTagParsedRequest = z.output<
  typeof TelegramSetChatMemberTagRequestSchema
>;

export const TelegramSetChatMenuButtonRequestSchema =
  TelegramGenericRequestSchema;
export type TelegramSetChatMenuButtonRequest = z.input<
  typeof TelegramSetChatMenuButtonRequestSchema
>;
export type TelegramSetChatMenuButtonParsedRequest = z.output<
  typeof TelegramSetChatMenuButtonRequestSchema
>;

export const TelegramSetChatPermissionsRequestSchema =
  TelegramGenericRequestSchema;
export type TelegramSetChatPermissionsRequest = z.input<
  typeof TelegramSetChatPermissionsRequestSchema
>;
export type TelegramSetChatPermissionsParsedRequest = z.output<
  typeof TelegramSetChatPermissionsRequestSchema
>;

export const TelegramSetChatPhotoRequestSchema = TelegramGenericRequestSchema;
export type TelegramSetChatPhotoRequest = z.input<
  typeof TelegramSetChatPhotoRequestSchema
>;
export type TelegramSetChatPhotoParsedRequest = z.output<
  typeof TelegramSetChatPhotoRequestSchema
>;

export const TelegramSetChatStickerSetRequestSchema =
  TelegramGenericRequestSchema;
export type TelegramSetChatStickerSetRequest = z.input<
  typeof TelegramSetChatStickerSetRequestSchema
>;
export type TelegramSetChatStickerSetParsedRequest = z.output<
  typeof TelegramSetChatStickerSetRequestSchema
>;

export const TelegramSetChatTitleRequestSchema = TelegramGenericRequestSchema;
export type TelegramSetChatTitleRequest = z.input<
  typeof TelegramSetChatTitleRequestSchema
>;
export type TelegramSetChatTitleParsedRequest = z.output<
  typeof TelegramSetChatTitleRequestSchema
>;

export const TelegramSetCustomEmojiStickerSetThumbnailRequestSchema =
  TelegramGenericRequestSchema;
export type TelegramSetCustomEmojiStickerSetThumbnailRequest = z.input<
  typeof TelegramSetCustomEmojiStickerSetThumbnailRequestSchema
>;
export type TelegramSetCustomEmojiStickerSetThumbnailParsedRequest = z.output<
  typeof TelegramSetCustomEmojiStickerSetThumbnailRequestSchema
>;

export const TelegramSetGameScoreRequestSchema = TelegramGenericRequestSchema;
export type TelegramSetGameScoreRequest = z.input<
  typeof TelegramSetGameScoreRequestSchema
>;
export type TelegramSetGameScoreParsedRequest = z.output<
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
export type TelegramSetManagedBotAccessSettingsRequest = z.input<
  typeof TelegramSetManagedBotAccessSettingsRequestSchema
>;
export type TelegramSetManagedBotAccessSettingsParsedRequest = z.output<
  typeof TelegramSetManagedBotAccessSettingsRequestSchema
>;

export const TelegramSetMessageReactionRequestSchema = z
  .object({
    chat_id: TelegramChatIdSchema,
    message_id: z.number().int(),
    reaction: z.array(TelegramReactionTypeSchema).optional(),
  })
  .passthrough();
export type TelegramSetMessageReactionRequest = z.input<
  typeof TelegramSetMessageReactionRequestSchema
>;
export type TelegramSetMessageReactionParsedRequest = z.output<
  typeof TelegramSetMessageReactionRequestSchema
>;

export const TelegramSetMyCommandsRequestSchema = z
  .object({
    commands: z.array(TelegramBotCommandSchema).min(1),
    scope: TelegramBotCommandScopeSchema.optional(),
    language_code: z.string().optional(),
  })
  .passthrough();
export type TelegramSetMyCommandsRequest = z.input<
  typeof TelegramSetMyCommandsRequestSchema
>;
export type TelegramSetMyCommandsParsedRequest = z.output<
  typeof TelegramSetMyCommandsRequestSchema
>;

export const TelegramSetMyDefaultAdministratorRightsRequestSchema =
  TelegramGenericRequestSchema;
export type TelegramSetMyDefaultAdministratorRightsRequest = z.input<
  typeof TelegramSetMyDefaultAdministratorRightsRequestSchema
>;
export type TelegramSetMyDefaultAdministratorRightsParsedRequest = z.output<
  typeof TelegramSetMyDefaultAdministratorRightsRequestSchema
>;

export const TelegramSetMyDescriptionRequestSchema = z
  .object({
    description: z.string().max(512).optional(),
    language_code: z.string().optional(),
  })
  .passthrough();
export type TelegramSetMyDescriptionRequest = z.input<
  typeof TelegramSetMyDescriptionRequestSchema
>;
export type TelegramSetMyDescriptionParsedRequest = z.output<
  typeof TelegramSetMyDescriptionRequestSchema
>;

export const TelegramSetMyNameRequestSchema = z
  .object({
    name: z.string().max(64).optional(),
    language_code: z.string().optional(),
  })
  .passthrough();
export type TelegramSetMyNameRequest = z.input<
  typeof TelegramSetMyNameRequestSchema
>;
export type TelegramSetMyNameParsedRequest = z.output<
  typeof TelegramSetMyNameRequestSchema
>;

export const TelegramSetMyShortDescriptionRequestSchema = z
  .object({
    short_description: z.string().max(120).optional(),
    language_code: z.string().optional(),
  })
  .passthrough();
export type TelegramSetMyShortDescriptionRequest = z.input<
  typeof TelegramSetMyShortDescriptionRequestSchema
>;
export type TelegramSetMyShortDescriptionParsedRequest = z.output<
  typeof TelegramSetMyShortDescriptionRequestSchema
>;

export const TelegramSetPassportDataErrorsRequestSchema = z
  .object({
    user_id: z.number().int(),
    errors: TelegramRecordArraySchema,
  })
  .passthrough();
export type TelegramSetPassportDataErrorsRequest = z.input<
  typeof TelegramSetPassportDataErrorsRequestSchema
>;
export type TelegramSetPassportDataErrorsParsedRequest = z.output<
  typeof TelegramSetPassportDataErrorsRequestSchema
>;

export const TelegramSetStickerEmojiListRequestSchema =
  TelegramGenericRequestSchema;
export type TelegramSetStickerEmojiListRequest = z.input<
  typeof TelegramSetStickerEmojiListRequestSchema
>;
export type TelegramSetStickerEmojiListParsedRequest = z.output<
  typeof TelegramSetStickerEmojiListRequestSchema
>;

export const TelegramSetStickerKeywordsRequestSchema =
  TelegramGenericRequestSchema;
export type TelegramSetStickerKeywordsRequest = z.input<
  typeof TelegramSetStickerKeywordsRequestSchema
>;
export type TelegramSetStickerKeywordsParsedRequest = z.output<
  typeof TelegramSetStickerKeywordsRequestSchema
>;

export const TelegramSetStickerMaskPositionRequestSchema =
  TelegramGenericRequestSchema;
export type TelegramSetStickerMaskPositionRequest = z.input<
  typeof TelegramSetStickerMaskPositionRequestSchema
>;
export type TelegramSetStickerMaskPositionParsedRequest = z.output<
  typeof TelegramSetStickerMaskPositionRequestSchema
>;

export const TelegramSetStickerPositionInSetRequestSchema =
  TelegramGenericRequestSchema;
export type TelegramSetStickerPositionInSetRequest = z.input<
  typeof TelegramSetStickerPositionInSetRequestSchema
>;
export type TelegramSetStickerPositionInSetParsedRequest = z.output<
  typeof TelegramSetStickerPositionInSetRequestSchema
>;

export const TelegramSetStickerSetThumbnailRequestSchema =
  TelegramGenericRequestSchema;
export type TelegramSetStickerSetThumbnailRequest = z.input<
  typeof TelegramSetStickerSetThumbnailRequestSchema
>;
export type TelegramSetStickerSetThumbnailParsedRequest = z.output<
  typeof TelegramSetStickerSetThumbnailRequestSchema
>;

export const TelegramSetStickerSetTitleRequestSchema =
  TelegramGenericRequestSchema;
export type TelegramSetStickerSetTitleRequest = z.input<
  typeof TelegramSetStickerSetTitleRequestSchema
>;
export type TelegramSetStickerSetTitleParsedRequest = z.output<
  typeof TelegramSetStickerSetTitleRequestSchema
>;

export const TelegramSetUserEmojiStatusRequestSchema = z
  .object({
    user_id: z.number().int(),
    emoji_status_custom_emoji_id: z.string().optional(),
  })
  .passthrough();
export type TelegramSetUserEmojiStatusRequest = z.input<
  typeof TelegramSetUserEmojiStatusRequestSchema
>;
export type TelegramSetUserEmojiStatusParsedRequest = z.output<
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
export type TelegramSetWebhookRequest = z.input<
  typeof TelegramSetWebhookRequestSchema
>;
export type TelegramSetWebhookParsedRequest = z.output<
  typeof TelegramSetWebhookRequestSchema
>;

export const TelegramStopMessageLiveLocationRequestSchema =
  TelegramGenericRequestSchema;
export type TelegramStopMessageLiveLocationRequest = z.input<
  typeof TelegramStopMessageLiveLocationRequestSchema
>;
export type TelegramStopMessageLiveLocationParsedRequest = z.output<
  typeof TelegramStopMessageLiveLocationRequestSchema
>;

export const TelegramStopPollRequestSchema = TelegramGenericRequestSchema;
export type TelegramStopPollRequest = z.input<
  typeof TelegramStopPollRequestSchema
>;
export type TelegramStopPollParsedRequest = z.output<
  typeof TelegramStopPollRequestSchema
>;

export const TelegramTransferBusinessAccountStarsRequestSchema =
  TelegramGenericRequestSchema;
export type TelegramTransferBusinessAccountStarsRequest = z.input<
  typeof TelegramTransferBusinessAccountStarsRequestSchema
>;
export type TelegramTransferBusinessAccountStarsParsedRequest = z.output<
  typeof TelegramTransferBusinessAccountStarsRequestSchema
>;

export const TelegramTransferGiftRequestSchema = TelegramGenericRequestSchema;
export type TelegramTransferGiftRequest = z.input<
  typeof TelegramTransferGiftRequestSchema
>;
export type TelegramTransferGiftParsedRequest = z.output<
  typeof TelegramTransferGiftRequestSchema
>;

export const TelegramUnbanChatMemberRequestSchema =
  TelegramGenericRequestSchema;
export type TelegramUnbanChatMemberRequest = z.input<
  typeof TelegramUnbanChatMemberRequestSchema
>;
export type TelegramUnbanChatMemberParsedRequest = z.output<
  typeof TelegramUnbanChatMemberRequestSchema
>;

export const TelegramUnbanChatSenderChatRequestSchema =
  TelegramGenericRequestSchema;
export type TelegramUnbanChatSenderChatRequest = z.input<
  typeof TelegramUnbanChatSenderChatRequestSchema
>;
export type TelegramUnbanChatSenderChatParsedRequest = z.output<
  typeof TelegramUnbanChatSenderChatRequestSchema
>;

export const TelegramUnhideGeneralForumTopicRequestSchema =
  TelegramGenericRequestSchema;
export type TelegramUnhideGeneralForumTopicRequest = z.input<
  typeof TelegramUnhideGeneralForumTopicRequestSchema
>;
export type TelegramUnhideGeneralForumTopicParsedRequest = z.output<
  typeof TelegramUnhideGeneralForumTopicRequestSchema
>;

export const TelegramUnpinAllChatMessagesRequestSchema =
  TelegramGenericRequestSchema;
export type TelegramUnpinAllChatMessagesRequest = z.input<
  typeof TelegramUnpinAllChatMessagesRequestSchema
>;
export type TelegramUnpinAllChatMessagesParsedRequest = z.output<
  typeof TelegramUnpinAllChatMessagesRequestSchema
>;

export const TelegramUnpinAllForumTopicMessagesRequestSchema =
  TelegramGenericRequestSchema;
export type TelegramUnpinAllForumTopicMessagesRequest = z.input<
  typeof TelegramUnpinAllForumTopicMessagesRequestSchema
>;
export type TelegramUnpinAllForumTopicMessagesParsedRequest = z.output<
  typeof TelegramUnpinAllForumTopicMessagesRequestSchema
>;

export const TelegramUnpinAllGeneralForumTopicMessagesRequestSchema =
  TelegramGenericRequestSchema;
export type TelegramUnpinAllGeneralForumTopicMessagesRequest = z.input<
  typeof TelegramUnpinAllGeneralForumTopicMessagesRequestSchema
>;
export type TelegramUnpinAllGeneralForumTopicMessagesParsedRequest = z.output<
  typeof TelegramUnpinAllGeneralForumTopicMessagesRequestSchema
>;

export const TelegramUnpinChatMessageRequestSchema =
  TelegramGenericRequestSchema;
export type TelegramUnpinChatMessageRequest = z.input<
  typeof TelegramUnpinChatMessageRequestSchema
>;
export type TelegramUnpinChatMessageParsedRequest = z.output<
  typeof TelegramUnpinChatMessageRequestSchema
>;

export const TelegramUpgradeGiftRequestSchema = TelegramGenericRequestSchema;
export type TelegramUpgradeGiftRequest = z.input<
  typeof TelegramUpgradeGiftRequestSchema
>;
export type TelegramUpgradeGiftParsedRequest = z.output<
  typeof TelegramUpgradeGiftRequestSchema
>;

export const TelegramUploadStickerFileRequestSchema =
  TelegramGenericRequestSchema;
export type TelegramUploadStickerFileRequest = z.input<
  typeof TelegramUploadStickerFileRequestSchema
>;
export type TelegramUploadStickerFileParsedRequest = z.output<
  typeof TelegramUploadStickerFileRequestSchema
>;

export const TelegramVerifyChatRequestSchema = TelegramGenericRequestSchema;
export type TelegramVerifyChatRequest = z.input<
  typeof TelegramVerifyChatRequestSchema
>;
export type TelegramVerifyChatParsedRequest = z.output<
  typeof TelegramVerifyChatRequestSchema
>;

export const TelegramVerifyUserRequestSchema = TelegramGenericRequestSchema;
export type TelegramVerifyUserRequest = z.input<
  typeof TelegramVerifyUserRequestSchema
>;
export type TelegramVerifyUserParsedRequest = z.output<
  typeof TelegramVerifyUserRequestSchema
>;

export const TelegramApproveSuggestedPostRequestSchema =
  TelegramGenericRequestSchema;
export type TelegramApproveSuggestedPostRequest = z.input<
  typeof TelegramApproveSuggestedPostRequestSchema
>;
export type TelegramApproveSuggestedPostParsedRequest = z.output<
  typeof TelegramApproveSuggestedPostRequestSchema
>;

export const TelegramDeclineSuggestedPostRequestSchema =
  TelegramGenericRequestSchema;
export type TelegramDeclineSuggestedPostRequest = z.input<
  typeof TelegramDeclineSuggestedPostRequestSchema
>;
export type TelegramDeclineSuggestedPostParsedRequest = z.output<
  typeof TelegramDeclineSuggestedPostRequestSchema
>;

export const TelegramGetUserProfileAudiosRequestSchema =
  TelegramGenericRequestSchema;
export type TelegramGetUserProfileAudiosRequest = z.input<
  typeof TelegramGetUserProfileAudiosRequestSchema
>;
export type TelegramGetUserProfileAudiosParsedRequest = z.output<
  typeof TelegramGetUserProfileAudiosRequestSchema
>;

export const TelegramGetUserProfilePhotosRequestSchema =
  TelegramGenericRequestSchema;
export type TelegramGetUserProfilePhotosRequest = z.input<
  typeof TelegramGetUserProfilePhotosRequestSchema
>;
export type TelegramGetUserProfilePhotosParsedRequest = z.output<
  typeof TelegramGetUserProfilePhotosRequestSchema
>;

export const TelegramRemoveMyProfilePhotoRequestSchema =
  TelegramEmptyRequestSchema;
export type TelegramRemoveMyProfilePhotoRequest = z.input<
  typeof TelegramRemoveMyProfilePhotoRequestSchema
>;
export type TelegramRemoveMyProfilePhotoParsedRequest = z.output<
  typeof TelegramRemoveMyProfilePhotoRequestSchema
>;

export const TelegramSetMyProfilePhotoRequestSchema =
  TelegramGenericRequestSchema;
export type TelegramSetMyProfilePhotoRequest = z.input<
  typeof TelegramSetMyProfilePhotoRequestSchema
>;
export type TelegramSetMyProfilePhotoParsedRequest = z.output<
  typeof TelegramSetMyProfilePhotoRequestSchema
>;
