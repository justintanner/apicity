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
export const TelegramRecordArraySchema = z.array(TelegramRecordSchema);
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

const emptyRequest = z.object({});

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

const suggestedPostFields = {
  suggested_post_parameters: TelegramRecordSchema.optional(),
};

const paidBroadcastFields = {
  allow_paid_broadcast: z.boolean().optional(),
};

const directMessageFields = {
  direct_messages_topic_id: z.number().int().optional(),
};

const notificationFields = {
  disable_notification: z.boolean().optional(),
  protect_content: z.boolean().optional(),
};

const invoiceFields = {
  title: z.string().min(1),
  description: z.string().min(1),
  payload: z.string(),
  currency: z.string().min(1),
  prices: TelegramRecordArraySchema,
};

const flexibleInvoiceFields = {
  max_tip_amount: z.number().int().optional(),
  suggested_tip_amounts: z.array(z.number().int()).optional(),
  provider_data: z.string().optional(),
  photo_url: z.string().optional(),
  photo_size: z.number().int().optional(),
  photo_width: z.number().int().optional(),
  photo_height: z.number().int().optional(),
  need_name: z.boolean().optional(),
  need_phone_number: z.boolean().optional(),
  need_email: z.boolean().optional(),
  need_shipping_address: z.boolean().optional(),
  send_phone_number_to_provider: z.boolean().optional(),
  send_email_to_provider: z.boolean().optional(),
  is_flexible: z.boolean().optional(),
};

export const TelegramInputStickerSchema = z.object({
  sticker: TelegramInputFileSchema,
  format: z.enum(["static", "animated", "video"]),
  emoji_list: z.array(z.string()),
  mask_position: TelegramRecordSchema.optional(),
  keywords: z.array(z.string()).optional(),
});

export const TelegramInputProfilePhotoSchema = z
  .object({
    type: z.string().min(1),
    photo: TelegramInputFileSchema.optional(),
    animation: TelegramInputFileSchema.optional(),
    main_frame_timestamp: z.number().optional(),
  })
  .passthrough();

export const TelegramInputStoryContentSchema = z
  .object({
    type: z.string().min(1),
    photo: TelegramInputFileSchema.optional(),
    video: TelegramInputFileSchema.optional(),
    duration: z.number().optional(),
    cover_frame_timestamp: z.number().optional(),
    is_animation: z.boolean().optional(),
  })
  .passthrough();

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
// POST /bot{token}/answerCallbackQuery
// ---------------------------------------------------------------------------

export const TelegramAnswerCallbackQueryRequestSchema = z.object({
  callback_query_id: z.string().min(1),
  text: z.string().optional(),
  show_alert: z.boolean().optional(),
  url: z.string().optional(),
  cache_time: z.number().int().optional(),
});

export type TelegramAnswerCallbackQueryRequest = z.infer<
  typeof TelegramAnswerCallbackQueryRequestSchema
>;

// ---------------------------------------------------------------------------
// POST /bot{token}/answerWebAppQuery
// ---------------------------------------------------------------------------

export const TelegramAnswerWebAppQueryRequestSchema = z.object({
  web_app_query_id: z.string().min(1),
  result: TelegramRecordSchema,
});

export type TelegramAnswerWebAppQueryRequest = z.infer<
  typeof TelegramAnswerWebAppQueryRequestSchema
>;

// ---------------------------------------------------------------------------
// POST /bot{token}/savePreparedInlineMessage
// ---------------------------------------------------------------------------

export const TelegramSavePreparedInlineMessageRequestSchema = z.object({
  user_id: z.number().int(),
  result: TelegramRecordSchema,
  allow_user_chats: z.boolean().optional(),
  allow_bot_chats: z.boolean().optional(),
  allow_group_chats: z.boolean().optional(),
  allow_channel_chats: z.boolean().optional(),
});

export type TelegramSavePreparedInlineMessageRequest = z.infer<
  typeof TelegramSavePreparedInlineMessageRequestSchema
>;

// ---------------------------------------------------------------------------
// POST /bot{token}/savePreparedKeyboardButton
// ---------------------------------------------------------------------------

export const TelegramSavePreparedKeyboardButtonRequestSchema = z.object({
  user_id: z.number().int(),
  button: TelegramRecordSchema,
  allow_user_chats: z.boolean().optional(),
  allow_bot_chats: z.boolean().optional(),
  allow_group_chats: z.boolean().optional(),
  allow_channel_chats: z.boolean().optional(),
});

export type TelegramSavePreparedKeyboardButtonRequest = z.infer<
  typeof TelegramSavePreparedKeyboardButtonRequestSchema
>;

// ---------------------------------------------------------------------------
// POST /bot{token}/answerInlineQuery
// ---------------------------------------------------------------------------

export const TelegramAnswerInlineQueryRequestSchema = z.object({
  inline_query_id: z.string().min(1),
  results: TelegramRecordArraySchema,
  cache_time: z.number().int().optional(),
  is_personal: z.boolean().optional(),
  next_offset: z.string().optional(),
  button: TelegramRecordSchema.optional(),
});

export type TelegramAnswerInlineQueryRequest = z.infer<
  typeof TelegramAnswerInlineQueryRequestSchema
>;

// ---------------------------------------------------------------------------
// POST /bot{token}/sendInvoice
// ---------------------------------------------------------------------------

export const TelegramSendInvoiceRequestSchema = z.object({
  ...directMessageFields,
  chat_id: TelegramChatIdSchema,
  message_thread_id: z.number().int().optional(),
  ...invoiceFields,
  provider_token: z.string().optional(),
  start_parameter: z.string().optional(),
  ...flexibleInvoiceFields,
  ...notificationFields,
  ...paidBroadcastFields,
  message_effect_id: z.string().optional(),
  ...suggestedPostFields,
  reply_parameters: TelegramRecordSchema.optional(),
  reply_markup: TelegramRecordSchema.optional(),
});

export type TelegramSendInvoiceRequest = z.infer<
  typeof TelegramSendInvoiceRequestSchema
>;

// ---------------------------------------------------------------------------
// POST /bot{token}/createInvoiceLink
// ---------------------------------------------------------------------------

export const TelegramCreateInvoiceLinkRequestSchema = z.object({
  business_connection_id: z.string().optional(),
  ...invoiceFields,
  subscription_period: z.number().int().optional(),
  provider_token: z.string().optional(),
  ...flexibleInvoiceFields,
});

export type TelegramCreateInvoiceLinkRequest = z.infer<
  typeof TelegramCreateInvoiceLinkRequestSchema
>;

// ---------------------------------------------------------------------------
// POST /bot{token}/answerShippingQuery
// ---------------------------------------------------------------------------

export const TelegramAnswerShippingQueryRequestSchema = z.object({
  shipping_query_id: z.string().min(1),
  ok: z.boolean(),
  shipping_options: TelegramRecordArraySchema.optional(),
  error_message: z.string().optional(),
});

export type TelegramAnswerShippingQueryRequest = z.infer<
  typeof TelegramAnswerShippingQueryRequestSchema
>;

// ---------------------------------------------------------------------------
// POST /bot{token}/answerPreCheckoutQuery
// ---------------------------------------------------------------------------

export const TelegramAnswerPreCheckoutQueryRequestSchema = z.object({
  pre_checkout_query_id: z.string().min(1),
  ok: z.boolean(),
  error_message: z.string().optional(),
});

export type TelegramAnswerPreCheckoutQueryRequest = z.infer<
  typeof TelegramAnswerPreCheckoutQueryRequestSchema
>;

// ---------------------------------------------------------------------------
// POST /bot{token}/getMyStarBalance
// ---------------------------------------------------------------------------

export const TelegramGetMyStarBalanceRequestSchema = emptyRequest;

export type TelegramGetMyStarBalanceRequest = z.infer<
  typeof TelegramGetMyStarBalanceRequestSchema
>;

// ---------------------------------------------------------------------------
// POST /bot{token}/getStarTransactions
// ---------------------------------------------------------------------------

export const TelegramGetStarTransactionsRequestSchema = z.object({
  offset: z.number().int().optional(),
  limit: z.number().int().optional(),
});

export type TelegramGetStarTransactionsRequest = z.infer<
  typeof TelegramGetStarTransactionsRequestSchema
>;

// ---------------------------------------------------------------------------
// POST /bot{token}/refundStarPayment
// ---------------------------------------------------------------------------

export const TelegramRefundStarPaymentRequestSchema = z.object({
  user_id: z.number().int(),
  telegram_payment_charge_id: z.string().min(1),
});

export type TelegramRefundStarPaymentRequest = z.infer<
  typeof TelegramRefundStarPaymentRequestSchema
>;

// ---------------------------------------------------------------------------
// POST /bot{token}/editUserStarSubscription
// ---------------------------------------------------------------------------

export const TelegramEditUserStarSubscriptionRequestSchema = z.object({
  user_id: z.number().int(),
  telegram_payment_charge_id: z.string().min(1),
  is_canceled: z.boolean(),
});

export type TelegramEditUserStarSubscriptionRequest = z.infer<
  typeof TelegramEditUserStarSubscriptionRequestSchema
>;

// ---------------------------------------------------------------------------
// POST /bot{token}/sendSticker
// ---------------------------------------------------------------------------

export const TelegramSendStickerRequestSchema = z.object({
  ...messageBase,
  sticker: TelegramInputFileSchema,
  emoji: z.string().optional(),
});

export type TelegramSendStickerRequest = z.infer<
  typeof TelegramSendStickerRequestSchema
>;

// ---------------------------------------------------------------------------
// POST /bot{token}/getStickerSet
// ---------------------------------------------------------------------------

export const TelegramGetStickerSetRequestSchema = z.object({
  name: z.string().min(1),
});

export type TelegramGetStickerSetRequest = z.infer<
  typeof TelegramGetStickerSetRequestSchema
>;

// ---------------------------------------------------------------------------
// POST /bot{token}/getCustomEmojiStickers
// ---------------------------------------------------------------------------

export const TelegramGetCustomEmojiStickersRequestSchema = z.object({
  custom_emoji_ids: z.array(z.string().min(1)),
});

export type TelegramGetCustomEmojiStickersRequest = z.infer<
  typeof TelegramGetCustomEmojiStickersRequestSchema
>;

// ---------------------------------------------------------------------------
// POST /bot{token}/uploadStickerFile
// ---------------------------------------------------------------------------

export const TelegramUploadStickerFileRequestSchema = z.object({
  user_id: z.number().int(),
  sticker: TelegramInputFileSchema,
  sticker_format: z.enum(["static", "animated", "video"]),
});

export type TelegramUploadStickerFileRequest = z.infer<
  typeof TelegramUploadStickerFileRequestSchema
>;

// ---------------------------------------------------------------------------
// POST /bot{token}/createNewStickerSet
// ---------------------------------------------------------------------------

export const TelegramCreateNewStickerSetRequestSchema = z.object({
  user_id: z.number().int(),
  name: z.string().min(1),
  title: z.string().min(1),
  stickers: z.array(TelegramInputStickerSchema),
  sticker_type: z.enum(["regular", "mask", "custom_emoji"]).optional(),
  needs_repainting: z.boolean().optional(),
});

export type TelegramCreateNewStickerSetRequest = z.infer<
  typeof TelegramCreateNewStickerSetRequestSchema
>;

// ---------------------------------------------------------------------------
// POST /bot{token}/addStickerToSet
// ---------------------------------------------------------------------------

export const TelegramAddStickerToSetRequestSchema = z.object({
  user_id: z.number().int(),
  name: z.string().min(1),
  sticker: TelegramInputStickerSchema,
});

export type TelegramAddStickerToSetRequest = z.infer<
  typeof TelegramAddStickerToSetRequestSchema
>;

// ---------------------------------------------------------------------------
// POST /bot{token}/setStickerPositionInSet
// ---------------------------------------------------------------------------

export const TelegramSetStickerPositionInSetRequestSchema = z.object({
  sticker: z.string().min(1),
  position: z.number().int(),
});

export type TelegramSetStickerPositionInSetRequest = z.infer<
  typeof TelegramSetStickerPositionInSetRequestSchema
>;

// ---------------------------------------------------------------------------
// POST /bot{token}/deleteStickerFromSet
// ---------------------------------------------------------------------------

export const TelegramDeleteStickerFromSetRequestSchema = z.object({
  sticker: z.string().min(1),
});

export type TelegramDeleteStickerFromSetRequest = z.infer<
  typeof TelegramDeleteStickerFromSetRequestSchema
>;

// ---------------------------------------------------------------------------
// POST /bot{token}/replaceStickerInSet
// ---------------------------------------------------------------------------

export const TelegramReplaceStickerInSetRequestSchema = z.object({
  user_id: z.number().int(),
  name: z.string().min(1),
  old_sticker: z.string().min(1),
  sticker: TelegramInputStickerSchema,
});

export type TelegramReplaceStickerInSetRequest = z.infer<
  typeof TelegramReplaceStickerInSetRequestSchema
>;

// ---------------------------------------------------------------------------
// POST /bot{token}/setStickerEmojiList
// ---------------------------------------------------------------------------

export const TelegramSetStickerEmojiListRequestSchema = z.object({
  sticker: z.string().min(1),
  emoji_list: z.array(z.string()),
});

export type TelegramSetStickerEmojiListRequest = z.infer<
  typeof TelegramSetStickerEmojiListRequestSchema
>;

// ---------------------------------------------------------------------------
// POST /bot{token}/setStickerKeywords
// ---------------------------------------------------------------------------

export const TelegramSetStickerKeywordsRequestSchema = z.object({
  sticker: z.string().min(1),
  keywords: z.array(z.string()).optional(),
});

export type TelegramSetStickerKeywordsRequest = z.infer<
  typeof TelegramSetStickerKeywordsRequestSchema
>;

// ---------------------------------------------------------------------------
// POST /bot{token}/setStickerMaskPosition
// ---------------------------------------------------------------------------

export const TelegramSetStickerMaskPositionRequestSchema = z.object({
  sticker: z.string().min(1),
  mask_position: TelegramRecordSchema.optional(),
});

export type TelegramSetStickerMaskPositionRequest = z.infer<
  typeof TelegramSetStickerMaskPositionRequestSchema
>;

// ---------------------------------------------------------------------------
// POST /bot{token}/setStickerSetTitle
// ---------------------------------------------------------------------------

export const TelegramSetStickerSetTitleRequestSchema = z.object({
  name: z.string().min(1),
  title: z.string().min(1),
});

export type TelegramSetStickerSetTitleRequest = z.infer<
  typeof TelegramSetStickerSetTitleRequestSchema
>;

// ---------------------------------------------------------------------------
// POST /bot{token}/setStickerSetThumbnail
// ---------------------------------------------------------------------------

export const TelegramSetStickerSetThumbnailRequestSchema = z.object({
  name: z.string().min(1),
  user_id: z.number().int(),
  thumbnail: TelegramInputFileSchema.optional(),
  format: z.enum(["static", "animated", "video"]),
});

export type TelegramSetStickerSetThumbnailRequest = z.infer<
  typeof TelegramSetStickerSetThumbnailRequestSchema
>;

// ---------------------------------------------------------------------------
// POST /bot{token}/setCustomEmojiStickerSetThumbnail
// ---------------------------------------------------------------------------

export const TelegramSetCustomEmojiStickerSetThumbnailRequestSchema = z.object({
  name: z.string().min(1),
  custom_emoji_id: z.string().optional(),
});

export type TelegramSetCustomEmojiStickerSetThumbnailRequest = z.infer<
  typeof TelegramSetCustomEmojiStickerSetThumbnailRequestSchema
>;

// ---------------------------------------------------------------------------
// POST /bot{token}/deleteStickerSet
// ---------------------------------------------------------------------------

export const TelegramDeleteStickerSetRequestSchema = z.object({
  name: z.string().min(1),
});

export type TelegramDeleteStickerSetRequest = z.infer<
  typeof TelegramDeleteStickerSetRequestSchema
>;

// ---------------------------------------------------------------------------
// POST /bot{token}/getAvailableGifts
// ---------------------------------------------------------------------------

export const TelegramGetAvailableGiftsRequestSchema = emptyRequest;

export type TelegramGetAvailableGiftsRequest = z.infer<
  typeof TelegramGetAvailableGiftsRequestSchema
>;

// ---------------------------------------------------------------------------
// POST /bot{token}/sendGift
// ---------------------------------------------------------------------------

export const TelegramSendGiftRequestSchema = z.object({
  user_id: z.number().int().optional(),
  chat_id: TelegramChatIdSchema.optional(),
  gift_id: z.string().min(1),
  pay_for_upgrade: z.boolean().optional(),
  text: z.string().optional(),
  text_parse_mode: TelegramParseModeSchema.optional(),
  text_entities: TelegramEntitiesSchema.optional(),
});

export type TelegramSendGiftRequest = z.infer<
  typeof TelegramSendGiftRequestSchema
>;

// ---------------------------------------------------------------------------
// POST /bot{token}/giftPremiumSubscription
// ---------------------------------------------------------------------------

export const TelegramGiftPremiumSubscriptionRequestSchema = z.object({
  user_id: z.number().int(),
  month_count: z.number().int(),
  star_count: z.number().int(),
  text: z.string().optional(),
  text_parse_mode: TelegramParseModeSchema.optional(),
  text_entities: TelegramEntitiesSchema.optional(),
});

export type TelegramGiftPremiumSubscriptionRequest = z.infer<
  typeof TelegramGiftPremiumSubscriptionRequestSchema
>;

// ---------------------------------------------------------------------------
// POST /bot{token}/verifyUser
// ---------------------------------------------------------------------------

export const TelegramVerifyUserRequestSchema = z.object({
  user_id: z.number().int(),
  custom_description: z.string().optional(),
});

export type TelegramVerifyUserRequest = z.infer<
  typeof TelegramVerifyUserRequestSchema
>;

// ---------------------------------------------------------------------------
// POST /bot{token}/verifyChat
// ---------------------------------------------------------------------------

export const TelegramVerifyChatRequestSchema = z.object({
  chat_id: TelegramChatIdSchema,
  custom_description: z.string().optional(),
});

export type TelegramVerifyChatRequest = z.infer<
  typeof TelegramVerifyChatRequestSchema
>;

// ---------------------------------------------------------------------------
// POST /bot{token}/removeUserVerification
// ---------------------------------------------------------------------------

export const TelegramRemoveUserVerificationRequestSchema = z.object({
  user_id: z.number().int(),
});

export type TelegramRemoveUserVerificationRequest = z.infer<
  typeof TelegramRemoveUserVerificationRequestSchema
>;

// ---------------------------------------------------------------------------
// POST /bot{token}/removeChatVerification
// ---------------------------------------------------------------------------

export const TelegramRemoveChatVerificationRequestSchema = z.object({
  chat_id: TelegramChatIdSchema,
});

export type TelegramRemoveChatVerificationRequest = z.infer<
  typeof TelegramRemoveChatVerificationRequestSchema
>;

// ---------------------------------------------------------------------------
// POST /bot{token}/getUserGifts
// ---------------------------------------------------------------------------

export const TelegramGetUserGiftsRequestSchema = z.object({
  user_id: z.number().int(),
  offset: z.string().optional(),
  limit: z.number().int().optional(),
  exclude_unsaved: z.boolean().optional(),
  exclude_saved: z.boolean().optional(),
  exclude_unlimited: z.boolean().optional(),
  exclude_limited: z.boolean().optional(),
  exclude_unique: z.boolean().optional(),
  sort_by_price: z.boolean().optional(),
});

export type TelegramGetUserGiftsRequest = z.infer<
  typeof TelegramGetUserGiftsRequestSchema
>;

// ---------------------------------------------------------------------------
// POST /bot{token}/getChatGifts
// ---------------------------------------------------------------------------

export const TelegramGetChatGiftsRequestSchema = z.object({
  chat_id: TelegramChatIdSchema,
});

export type TelegramGetChatGiftsRequest = z.infer<
  typeof TelegramGetChatGiftsRequestSchema
>;

// ---------------------------------------------------------------------------
// POST /bot{token}/setUserEmojiStatus
// ---------------------------------------------------------------------------

export const TelegramSetUserEmojiStatusRequestSchema = z.object({
  user_id: z.number().int(),
  emoji_status_custom_emoji_id: z.string().optional(),
  emoji_status_expiration_date: z.number().int().optional(),
});

export type TelegramSetUserEmojiStatusRequest = z.infer<
  typeof TelegramSetUserEmojiStatusRequestSchema
>;

// ---------------------------------------------------------------------------
// POST /bot{token}/getBusinessConnection
// ---------------------------------------------------------------------------

export const TelegramGetBusinessConnectionRequestSchema = z.object({
  business_connection_id: z.string().min(1),
});

export type TelegramGetBusinessConnectionRequest = z.infer<
  typeof TelegramGetBusinessConnectionRequestSchema
>;

// ---------------------------------------------------------------------------
// POST /bot{token}/readBusinessMessage
// ---------------------------------------------------------------------------

export const TelegramReadBusinessMessageRequestSchema = z.object({
  business_connection_id: z.string().min(1),
  chat_id: TelegramChatIdSchema,
  message_id: z.number().int(),
});

export type TelegramReadBusinessMessageRequest = z.infer<
  typeof TelegramReadBusinessMessageRequestSchema
>;

// ---------------------------------------------------------------------------
// POST /bot{token}/deleteBusinessMessages
// ---------------------------------------------------------------------------

export const TelegramDeleteBusinessMessagesRequestSchema = z.object({
  business_connection_id: z.string().min(1),
  message_ids: z.array(z.number().int()),
});

export type TelegramDeleteBusinessMessagesRequest = z.infer<
  typeof TelegramDeleteBusinessMessagesRequestSchema
>;

// ---------------------------------------------------------------------------
// POST /bot{token}/setBusinessAccountName
// ---------------------------------------------------------------------------

export const TelegramSetBusinessAccountNameRequestSchema = z.object({
  business_connection_id: z.string().min(1),
  first_name: z.string().min(1),
  last_name: z.string().optional(),
});

export type TelegramSetBusinessAccountNameRequest = z.infer<
  typeof TelegramSetBusinessAccountNameRequestSchema
>;

// ---------------------------------------------------------------------------
// POST /bot{token}/setBusinessAccountUsername
// ---------------------------------------------------------------------------

export const TelegramSetBusinessAccountUsernameRequestSchema = z.object({
  business_connection_id: z.string().min(1),
  username: z.string().optional(),
});

export type TelegramSetBusinessAccountUsernameRequest = z.infer<
  typeof TelegramSetBusinessAccountUsernameRequestSchema
>;

// ---------------------------------------------------------------------------
// POST /bot{token}/setBusinessAccountBio
// ---------------------------------------------------------------------------

export const TelegramSetBusinessAccountBioRequestSchema = z.object({
  business_connection_id: z.string().min(1),
  bio: z.string().optional(),
});

export type TelegramSetBusinessAccountBioRequest = z.infer<
  typeof TelegramSetBusinessAccountBioRequestSchema
>;

// ---------------------------------------------------------------------------
// POST /bot{token}/setBusinessAccountProfilePhoto
// ---------------------------------------------------------------------------

export const TelegramSetBusinessAccountProfilePhotoRequestSchema = z.object({
  business_connection_id: z.string().min(1),
  photo: TelegramInputProfilePhotoSchema,
  is_public: z.boolean().optional(),
});

export type TelegramSetBusinessAccountProfilePhotoRequest = z.infer<
  typeof TelegramSetBusinessAccountProfilePhotoRequestSchema
>;

// ---------------------------------------------------------------------------
// POST /bot{token}/removeBusinessAccountProfilePhoto
// ---------------------------------------------------------------------------

export const TelegramRemoveBusinessAccountProfilePhotoRequestSchema = z.object({
  business_connection_id: z.string().min(1),
  is_public: z.boolean().optional(),
});

export type TelegramRemoveBusinessAccountProfilePhotoRequest = z.infer<
  typeof TelegramRemoveBusinessAccountProfilePhotoRequestSchema
>;

// ---------------------------------------------------------------------------
// POST /bot{token}/setBusinessAccountGiftSettings
// ---------------------------------------------------------------------------

export const TelegramSetBusinessAccountGiftSettingsRequestSchema = z.object({
  business_connection_id: z.string().min(1),
  show_gift_button: z.boolean(),
  accepted_gift_types: TelegramRecordSchema,
});

export type TelegramSetBusinessAccountGiftSettingsRequest = z.infer<
  typeof TelegramSetBusinessAccountGiftSettingsRequestSchema
>;

// ---------------------------------------------------------------------------
// POST /bot{token}/getBusinessAccountStarBalance
// ---------------------------------------------------------------------------

export const TelegramGetBusinessAccountStarBalanceRequestSchema = z.object({
  business_connection_id: z.string().min(1),
});

export type TelegramGetBusinessAccountStarBalanceRequest = z.infer<
  typeof TelegramGetBusinessAccountStarBalanceRequestSchema
>;

// ---------------------------------------------------------------------------
// POST /bot{token}/transferBusinessAccountStars
// ---------------------------------------------------------------------------

export const TelegramTransferBusinessAccountStarsRequestSchema = z.object({
  business_connection_id: z.string().min(1),
  star_count: z.number().int(),
});

export type TelegramTransferBusinessAccountStarsRequest = z.infer<
  typeof TelegramTransferBusinessAccountStarsRequestSchema
>;

// ---------------------------------------------------------------------------
// POST /bot{token}/getBusinessAccountGifts
// ---------------------------------------------------------------------------

export const TelegramGetBusinessAccountGiftsRequestSchema = z.object({
  business_connection_id: z.string().min(1),
  offset: z.string().optional(),
  limit: z.number().int().optional(),
  exclude_unsaved: z.boolean().optional(),
  exclude_saved: z.boolean().optional(),
  exclude_unlimited: z.boolean().optional(),
  exclude_limited: z.boolean().optional(),
  exclude_unique: z.boolean().optional(),
  sort_by_price: z.boolean().optional(),
});

export type TelegramGetBusinessAccountGiftsRequest = z.infer<
  typeof TelegramGetBusinessAccountGiftsRequestSchema
>;

// ---------------------------------------------------------------------------
// POST /bot{token}/convertGiftToStars
// ---------------------------------------------------------------------------

export const TelegramConvertGiftToStarsRequestSchema = z.object({
  business_connection_id: z.string().min(1),
  owned_gift_id: z.string().min(1),
});

export type TelegramConvertGiftToStarsRequest = z.infer<
  typeof TelegramConvertGiftToStarsRequestSchema
>;

// ---------------------------------------------------------------------------
// POST /bot{token}/upgradeGift
// ---------------------------------------------------------------------------

export const TelegramUpgradeGiftRequestSchema = z.object({
  business_connection_id: z.string().min(1),
  owned_gift_id: z.string().min(1),
  keep_original_details: z.boolean().optional(),
  star_count: z.number().int().optional(),
});

export type TelegramUpgradeGiftRequest = z.infer<
  typeof TelegramUpgradeGiftRequestSchema
>;

// ---------------------------------------------------------------------------
// POST /bot{token}/transferGift
// ---------------------------------------------------------------------------

export const TelegramTransferGiftRequestSchema = z.object({
  business_connection_id: z.string().min(1),
  owned_gift_id: z.string().min(1),
  new_owner_chat_id: z.number().int(),
  star_count: z.number().int().optional(),
});

export type TelegramTransferGiftRequest = z.infer<
  typeof TelegramTransferGiftRequestSchema
>;

// ---------------------------------------------------------------------------
// POST /bot{token}/postStory
// ---------------------------------------------------------------------------

export const TelegramPostStoryRequestSchema = z.object({
  business_connection_id: z.string().min(1),
  content: TelegramInputStoryContentSchema,
  active_period: z.number().int(),
  caption: z.string().optional(),
  parse_mode: TelegramParseModeSchema.optional(),
  caption_entities: TelegramEntitiesSchema.optional(),
  areas: TelegramRecordArraySchema.optional(),
  post_to_chat_page: z.boolean().optional(),
  protect_content: z.boolean().optional(),
});

export type TelegramPostStoryRequest = z.infer<
  typeof TelegramPostStoryRequestSchema
>;

// ---------------------------------------------------------------------------
// POST /bot{token}/repostStory
// ---------------------------------------------------------------------------

export const TelegramRepostStoryRequestSchema = z.object({
  business_connection_id: z.string().min(1),
  chat_id: TelegramChatIdSchema,
  story_id: z.number().int(),
  caption: z.string().optional(),
  parse_mode: TelegramParseModeSchema.optional(),
  caption_entities: TelegramEntitiesSchema.optional(),
});

export type TelegramRepostStoryRequest = z.infer<
  typeof TelegramRepostStoryRequestSchema
>;

// ---------------------------------------------------------------------------
// POST /bot{token}/editStory
// ---------------------------------------------------------------------------

export const TelegramEditStoryRequestSchema = z.object({
  business_connection_id: z.string().min(1),
  story_id: z.number().int(),
  content: TelegramInputStoryContentSchema,
  caption: z.string().optional(),
  parse_mode: TelegramParseModeSchema.optional(),
  caption_entities: TelegramEntitiesSchema.optional(),
  areas: TelegramRecordArraySchema.optional(),
});

export type TelegramEditStoryRequest = z.infer<
  typeof TelegramEditStoryRequestSchema
>;

// ---------------------------------------------------------------------------
// POST /bot{token}/deleteStory
// ---------------------------------------------------------------------------

export const TelegramDeleteStoryRequestSchema = z.object({
  business_connection_id: z.string().min(1),
  story_id: z.number().int(),
});

export type TelegramDeleteStoryRequest = z.infer<
  typeof TelegramDeleteStoryRequestSchema
>;

// ---------------------------------------------------------------------------
// POST /bot{token}/setPassportDataErrors
// ---------------------------------------------------------------------------

export const TelegramSetPassportDataErrorsRequestSchema = z.object({
  user_id: z.number().int(),
  errors: TelegramRecordArraySchema,
});

export type TelegramSetPassportDataErrorsRequest = z.infer<
  typeof TelegramSetPassportDataErrorsRequestSchema
>;

// ---------------------------------------------------------------------------
// POST /bot{token}/sendGame
// ---------------------------------------------------------------------------

export const TelegramSendGameRequestSchema = z.object({
  ...directMessageFields,
  chat_id: z.number().int(),
  message_thread_id: z.number().int().optional(),
  game_short_name: z.string().min(1),
  ...notificationFields,
  ...paidBroadcastFields,
  message_effect_id: z.string().optional(),
  ...suggestedPostFields,
  reply_parameters: TelegramRecordSchema.optional(),
  reply_markup: TelegramRecordSchema.optional(),
});

export type TelegramSendGameRequest = z.infer<
  typeof TelegramSendGameRequestSchema
>;

// ---------------------------------------------------------------------------
// POST /bot{token}/setGameScore
// ---------------------------------------------------------------------------

export const TelegramSetGameScoreRequestSchema = z.object({
  user_id: z.number().int(),
  score: z.number().int(),
  force: z.boolean().optional(),
  disable_edit_message: z.boolean().optional(),
  chat_id: z.number().int().optional(),
  message_id: z.number().int().optional(),
  inline_message_id: z.string().optional(),
});

export type TelegramSetGameScoreRequest = z.infer<
  typeof TelegramSetGameScoreRequestSchema
>;

// ---------------------------------------------------------------------------
// POST /bot{token}/getGameHighScores
// ---------------------------------------------------------------------------

export const TelegramGetGameHighScoresRequestSchema = z.object({
  user_id: z.number().int(),
  chat_id: z.number().int().optional(),
  message_id: z.number().int().optional(),
  inline_message_id: z.string().optional(),
});

export type TelegramGetGameHighScoresRequest = z.infer<
  typeof TelegramGetGameHighScoresRequestSchema
>;
