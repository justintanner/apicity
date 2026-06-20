import type { z } from "zod";
import type * as TelegramZod from "./zod";

export type * from "./zod";

export class TelegramError extends Error {
  readonly status: number;
  readonly body: unknown;
  readonly code?: string;

  constructor(message: string, status: number, body?: unknown, code?: string) {
    super(message);
    this.name = "TelegramError";
    this.status = status;
    this.body = body ?? null;
    this.code = code;
  }
}

export interface TelegramApiResponse<T> {
  ok: true;
  result: T;
}

export interface TelegramApiErrorResponse {
  ok: false;
  error_code: number;
  description: string;
  parameters?: Record<string, unknown>;
}

export interface TelegramUser {
  id: number;
  is_bot: boolean;
  first_name: string;
  last_name?: string;
  username?: string;
  language_code?: string;
  [key: string]: unknown;
}

export interface TelegramChat {
  id: number;
  type: string;
  title?: string;
  username?: string;
  first_name?: string;
  last_name?: string;
  [key: string]: unknown;
}

export interface TelegramMessage {
  message_id: number;
  date: number;
  chat: TelegramChat;
  text?: string;
  caption?: string;
  [key: string]: unknown;
}

export interface TelegramMethod<TRequest, TResponse> {
  (req?: TRequest, signal?: AbortSignal): Promise<TResponse>;
  schema: z.ZodType<TRequest>;
  example?: unknown;
}

export type TelegramRecordResponse = TelegramApiResponse<
  Record<string, unknown>
>;
export type TelegramBooleanResponse = TelegramApiResponse<boolean>;
export type TelegramStringResponse = TelegramApiResponse<string>;
export type TelegramMessagesResponse = TelegramApiResponse<TelegramMessage[]>;
export type TelegramTrueResponse = TelegramApiResponse<true>;

export type TelegramApproveSuggestedPostResponse = TelegramRecordResponse;
export type TelegramDeclineSuggestedPostResponse = TelegramRecordResponse;
export type TelegramGetUserProfileAudiosResponse = TelegramRecordResponse;
export type TelegramGetUserProfilePhotosResponse = TelegramRecordResponse;
export type TelegramRemoveMyProfilePhotoResponse = TelegramRecordResponse;
export type TelegramSetMyProfilePhotoResponse = TelegramRecordResponse;

export type TelegramAddStickerToSetResponse = TelegramRecordResponse;
export type TelegramAnswerCallbackQueryResponse = TelegramRecordResponse;
export type TelegramAnswerChatJoinRequestQueryResponse = TelegramRecordResponse;
export type TelegramAnswerGuestQueryResponse = TelegramRecordResponse;
export type TelegramAnswerInlineQueryResponse = TelegramRecordResponse;
export type TelegramAnswerPreCheckoutQueryResponse = TelegramRecordResponse;
export type TelegramAnswerShippingQueryResponse = TelegramRecordResponse;
export type TelegramAnswerWebAppQueryResponse = TelegramRecordResponse;
export type TelegramApproveChatJoinRequestResponse = TelegramRecordResponse;
export type TelegramBanChatMemberResponse = TelegramRecordResponse;
export type TelegramBanChatSenderChatResponse = TelegramRecordResponse;
export type TelegramCloseResponse = TelegramRecordResponse;
export type TelegramCloseForumTopicResponse = TelegramRecordResponse;
export type TelegramCloseGeneralForumTopicResponse = TelegramRecordResponse;
export type TelegramConvertGiftToStarsResponse = TelegramRecordResponse;
export type TelegramCopyMessageResponse = TelegramRecordResponse;
export type TelegramCopyMessagesResponse = TelegramRecordResponse;
export type TelegramCreateChatInviteLinkResponse = TelegramRecordResponse;
export type TelegramCreateChatSubscriptionInviteLinkResponse =
  TelegramRecordResponse;
export type TelegramCreateForumTopicResponse = TelegramRecordResponse;
export type TelegramCreateInvoiceLinkResponse = TelegramRecordResponse;
export type TelegramCreateNewStickerSetResponse = TelegramRecordResponse;
export type TelegramDeclineChatJoinRequestResponse = TelegramRecordResponse;
export type TelegramDeleteAllMessageReactionsResponse = TelegramRecordResponse;
export type TelegramDeleteBusinessMessagesResponse = TelegramRecordResponse;
export type TelegramDeleteChatPhotoResponse = TelegramRecordResponse;
export type TelegramDeleteChatStickerSetResponse = TelegramRecordResponse;
export type TelegramDeleteForumTopicResponse = TelegramRecordResponse;
export type TelegramDeleteMessageResponse = TelegramRecordResponse;
export type TelegramDeleteMessageReactionResponse = TelegramRecordResponse;
export type TelegramDeleteMessagesResponse = TelegramRecordResponse;
export type TelegramDeleteMyCommandsResponse = TelegramRecordResponse;
export type TelegramDeleteStickerFromSetResponse = TelegramRecordResponse;
export type TelegramDeleteStickerSetResponse = TelegramRecordResponse;
export type TelegramDeleteStoryResponse = TelegramRecordResponse;
export type TelegramDeleteWebhookResponse = TelegramRecordResponse;
export type TelegramEditChatInviteLinkResponse = TelegramRecordResponse;
export type TelegramEditChatSubscriptionInviteLinkResponse =
  TelegramRecordResponse;
export type TelegramEditForumTopicResponse = TelegramRecordResponse;
export type TelegramEditGeneralForumTopicResponse = TelegramRecordResponse;
export type TelegramEditMessageCaptionResponse = TelegramRecordResponse;
export type TelegramEditMessageChecklistResponse = TelegramRecordResponse;
export type TelegramEditMessageLiveLocationResponse = TelegramRecordResponse;
export type TelegramEditMessageMediaResponse = TelegramRecordResponse;
export type TelegramEditMessageReplyMarkupResponse = TelegramRecordResponse;
export type TelegramEditMessageTextResponse = TelegramRecordResponse;
export type TelegramEditStoryResponse = TelegramRecordResponse;
export type TelegramEditUserStarSubscriptionResponse = TelegramRecordResponse;
export type TelegramExportChatInviteLinkResponse = TelegramRecordResponse;
export type TelegramForwardMessageResponse = TelegramRecordResponse;
export type TelegramForwardMessagesResponse = TelegramRecordResponse;
export type TelegramGetAvailableGiftsResponse = TelegramRecordResponse;
export type TelegramGetBusinessAccountGiftsResponse = TelegramRecordResponse;
export type TelegramGetBusinessAccountStarBalanceResponse =
  TelegramRecordResponse;
export type TelegramGetBusinessConnectionResponse = TelegramRecordResponse;
export type TelegramGetChatResponse = TelegramRecordResponse;
export type TelegramGetChatAdministratorsResponse = TelegramRecordResponse;
export type TelegramGetChatGiftsResponse = TelegramRecordResponse;
export type TelegramGetChatMemberResponse = TelegramRecordResponse;
export type TelegramGetChatMemberCountResponse = TelegramRecordResponse;
export type TelegramGetChatMenuButtonResponse = TelegramRecordResponse;
export type TelegramGetCustomEmojiStickersResponse = TelegramRecordResponse;
export type TelegramGetFileResponse = TelegramRecordResponse;
export type TelegramGetForumTopicIconStickersResponse = TelegramRecordResponse;
export type TelegramGetGameHighScoresResponse = TelegramRecordResponse;
export type TelegramGetManagedBotAccessSettingsResponse =
  TelegramRecordResponse;
export type TelegramGetManagedBotTokenResponse = TelegramRecordResponse;
export type TelegramGetMeResponse = TelegramRecordResponse;
export type TelegramGetMyCommandsResponse = TelegramRecordResponse;
export type TelegramGetMyDefaultAdministratorRightsResponse =
  TelegramRecordResponse;
export type TelegramGetMyDescriptionResponse = TelegramRecordResponse;
export type TelegramGetMyNameResponse = TelegramRecordResponse;
export type TelegramGetMyShortDescriptionResponse = TelegramRecordResponse;
export type TelegramGetMyStarBalanceResponse = TelegramRecordResponse;
export type TelegramGetStarTransactionsResponse = TelegramRecordResponse;
export type TelegramGetStickerSetResponse = TelegramRecordResponse;
export type TelegramGetUpdatesResponse = TelegramRecordResponse;
export type TelegramGetUserChatBoostsResponse = TelegramRecordResponse;
export type TelegramGetUserGiftsResponse = TelegramRecordResponse;
export type TelegramGetUserPersonalChatMessagesResponse =
  TelegramRecordResponse;
export type TelegramGetWebhookInfoResponse = TelegramRecordResponse;
export type TelegramGiftPremiumSubscriptionResponse = TelegramRecordResponse;
export type TelegramHideGeneralForumTopicResponse = TelegramRecordResponse;
export type TelegramLeaveChatResponse = TelegramRecordResponse;
export type TelegramLogOutResponse = TelegramRecordResponse;
export type TelegramPinChatMessageResponse = TelegramRecordResponse;
export type TelegramPostStoryResponse = TelegramRecordResponse;
export type TelegramPromoteChatMemberResponse = TelegramRecordResponse;
export type TelegramReadBusinessMessageResponse = TelegramRecordResponse;
export type TelegramRefundStarPaymentResponse = TelegramRecordResponse;
export type TelegramRemoveBusinessAccountProfilePhotoResponse =
  TelegramRecordResponse;
export type TelegramRemoveChatVerificationResponse = TelegramRecordResponse;
export type TelegramRemoveUserVerificationResponse = TelegramRecordResponse;
export type TelegramReopenForumTopicResponse = TelegramRecordResponse;
export type TelegramReopenGeneralForumTopicResponse = TelegramRecordResponse;
export type TelegramReplaceManagedBotTokenResponse = TelegramRecordResponse;
export type TelegramReplaceStickerInSetResponse = TelegramRecordResponse;
export type TelegramRepostStoryResponse = TelegramRecordResponse;
export type TelegramRestrictChatMemberResponse = TelegramRecordResponse;
export type TelegramRevokeChatInviteLinkResponse = TelegramRecordResponse;
export type TelegramSavePreparedInlineMessageResponse = TelegramRecordResponse;
export type TelegramSavePreparedKeyboardButtonResponse = TelegramRecordResponse;
export type TelegramSendAnimationResponse = TelegramRecordResponse;
export type TelegramSendAudioResponse = TelegramRecordResponse;
export type TelegramSendChatActionResponse = TelegramRecordResponse;
export type TelegramSendChatJoinRequestWebAppResponse = TelegramRecordResponse;
export type TelegramSendChecklistResponse = TelegramRecordResponse;
export type TelegramSendContactResponse = TelegramRecordResponse;
export type TelegramSendDiceResponse = TelegramRecordResponse;
export type TelegramSendDocumentResponse = TelegramRecordResponse;
export type TelegramSendGameResponse = TelegramRecordResponse;
export type TelegramSendGiftResponse = TelegramRecordResponse;
export type TelegramSendInvoiceResponse = TelegramRecordResponse;
export type TelegramSendLivePhotoResponse = TelegramRecordResponse;
export type TelegramSendLocationResponse = TelegramRecordResponse;
export type TelegramSendMediaGroupResponse = TelegramRecordResponse;
export type TelegramSendMessageResponse = TelegramRecordResponse;
export type TelegramSendMessageDraftResponse = TelegramRecordResponse;
export type TelegramSendPaidMediaResponse = TelegramRecordResponse;
export type TelegramSendPhotoResponse = TelegramRecordResponse;
export type TelegramSendPollResponse = TelegramRecordResponse;
export type TelegramSendRichMessageResponse = TelegramRecordResponse;
export type TelegramSendRichMessageDraftResponse = TelegramRecordResponse;
export type TelegramSendStickerResponse = TelegramRecordResponse;
export type TelegramSendVenueResponse = TelegramRecordResponse;
export type TelegramSendVideoResponse = TelegramRecordResponse;
export type TelegramSendVideoNoteResponse = TelegramRecordResponse;
export type TelegramSendVoiceResponse = TelegramRecordResponse;
export type TelegramSetBusinessAccountBioResponse = TelegramRecordResponse;
export type TelegramSetBusinessAccountGiftSettingsResponse =
  TelegramRecordResponse;
export type TelegramSetBusinessAccountNameResponse = TelegramRecordResponse;
export type TelegramSetBusinessAccountProfilePhotoResponse =
  TelegramRecordResponse;
export type TelegramSetBusinessAccountUsernameResponse = TelegramRecordResponse;
export type TelegramSetChatAdministratorCustomTitleResponse =
  TelegramRecordResponse;
export type TelegramSetChatDescriptionResponse = TelegramRecordResponse;
export type TelegramSetChatMemberTagResponse = TelegramRecordResponse;
export type TelegramSetChatMenuButtonResponse = TelegramRecordResponse;
export type TelegramSetChatPermissionsResponse = TelegramRecordResponse;
export type TelegramSetChatPhotoResponse = TelegramRecordResponse;
export type TelegramSetChatStickerSetResponse = TelegramRecordResponse;
export type TelegramSetChatTitleResponse = TelegramRecordResponse;
export type TelegramSetCustomEmojiStickerSetThumbnailResponse =
  TelegramRecordResponse;
export type TelegramSetGameScoreResponse = TelegramRecordResponse;
export type TelegramSetManagedBotAccessSettingsResponse =
  TelegramRecordResponse;
export type TelegramSetMessageReactionResponse = TelegramRecordResponse;
export type TelegramSetMyCommandsResponse = TelegramRecordResponse;
export type TelegramSetMyDefaultAdministratorRightsResponse =
  TelegramRecordResponse;
export type TelegramSetMyDescriptionResponse = TelegramRecordResponse;
export type TelegramSetMyNameResponse = TelegramRecordResponse;
export type TelegramSetMyShortDescriptionResponse = TelegramRecordResponse;
export type TelegramSetPassportDataErrorsResponse = TelegramRecordResponse;
export type TelegramSetStickerEmojiListResponse = TelegramRecordResponse;
export type TelegramSetStickerKeywordsResponse = TelegramRecordResponse;
export type TelegramSetStickerMaskPositionResponse = TelegramRecordResponse;
export type TelegramSetStickerPositionInSetResponse = TelegramRecordResponse;
export type TelegramSetStickerSetThumbnailResponse = TelegramRecordResponse;
export type TelegramSetStickerSetTitleResponse = TelegramRecordResponse;
export type TelegramSetUserEmojiStatusResponse = TelegramRecordResponse;
export type TelegramSetWebhookResponse = TelegramRecordResponse;
export type TelegramStopMessageLiveLocationResponse = TelegramRecordResponse;
export type TelegramStopPollResponse = TelegramRecordResponse;
export type TelegramTransferBusinessAccountStarsResponse =
  TelegramRecordResponse;
export type TelegramTransferGiftResponse = TelegramRecordResponse;
export type TelegramUnbanChatMemberResponse = TelegramRecordResponse;
export type TelegramUnbanChatSenderChatResponse = TelegramRecordResponse;
export type TelegramUnhideGeneralForumTopicResponse = TelegramRecordResponse;
export type TelegramUnpinAllChatMessagesResponse = TelegramRecordResponse;
export type TelegramUnpinAllForumTopicMessagesResponse = TelegramRecordResponse;
export type TelegramUnpinAllGeneralForumTopicMessagesResponse =
  TelegramRecordResponse;
export type TelegramUnpinChatMessageResponse = TelegramRecordResponse;
export type TelegramUpgradeGiftResponse = TelegramRecordResponse;
export type TelegramUploadStickerFileResponse = TelegramRecordResponse;
export type TelegramVerifyChatResponse = TelegramRecordResponse;
export type TelegramVerifyUserResponse = TelegramRecordResponse;

export type TelegramApproveSuggestedPostMethod = TelegramMethod<
  TelegramZod.TelegramApproveSuggestedPostRequest,
  TelegramApproveSuggestedPostResponse
>;
export type TelegramDeclineSuggestedPostMethod = TelegramMethod<
  TelegramZod.TelegramDeclineSuggestedPostRequest,
  TelegramDeclineSuggestedPostResponse
>;
export type TelegramGetUserProfileAudiosMethod = TelegramMethod<
  TelegramZod.TelegramGetUserProfileAudiosRequest,
  TelegramGetUserProfileAudiosResponse
>;
export type TelegramGetUserProfilePhotosMethod = TelegramMethod<
  TelegramZod.TelegramGetUserProfilePhotosRequest,
  TelegramGetUserProfilePhotosResponse
>;
export type TelegramRemoveMyProfilePhotoMethod = TelegramMethod<
  TelegramZod.TelegramRemoveMyProfilePhotoRequest,
  TelegramRemoveMyProfilePhotoResponse
>;
export type TelegramSetMyProfilePhotoMethod = TelegramMethod<
  TelegramZod.TelegramSetMyProfilePhotoRequest,
  TelegramSetMyProfilePhotoResponse
>;

export type TelegramAddStickerToSetMethod = TelegramMethod<
  TelegramZod.TelegramAddStickerToSetRequest,
  TelegramAddStickerToSetResponse
>;
export type TelegramAnswerCallbackQueryMethod = TelegramMethod<
  TelegramZod.TelegramAnswerCallbackQueryRequest,
  TelegramAnswerCallbackQueryResponse
>;
export type TelegramAnswerChatJoinRequestQueryMethod = TelegramMethod<
  TelegramZod.TelegramAnswerChatJoinRequestQueryRequest,
  TelegramAnswerChatJoinRequestQueryResponse
>;
export type TelegramAnswerGuestQueryMethod = TelegramMethod<
  TelegramZod.TelegramAnswerGuestQueryRequest,
  TelegramAnswerGuestQueryResponse
>;
export type TelegramAnswerInlineQueryMethod = TelegramMethod<
  TelegramZod.TelegramAnswerInlineQueryRequest,
  TelegramAnswerInlineQueryResponse
>;
export type TelegramAnswerPreCheckoutQueryMethod = TelegramMethod<
  TelegramZod.TelegramAnswerPreCheckoutQueryRequest,
  TelegramAnswerPreCheckoutQueryResponse
>;
export type TelegramAnswerShippingQueryMethod = TelegramMethod<
  TelegramZod.TelegramAnswerShippingQueryRequest,
  TelegramAnswerShippingQueryResponse
>;
export type TelegramAnswerWebAppQueryMethod = TelegramMethod<
  TelegramZod.TelegramAnswerWebAppQueryRequest,
  TelegramAnswerWebAppQueryResponse
>;
export type TelegramApproveChatJoinRequestMethod = TelegramMethod<
  TelegramZod.TelegramApproveChatJoinRequestRequest,
  TelegramApproveChatJoinRequestResponse
>;
export type TelegramBanChatMemberMethod = TelegramMethod<
  TelegramZod.TelegramBanChatMemberRequest,
  TelegramBanChatMemberResponse
>;
export type TelegramBanChatSenderChatMethod = TelegramMethod<
  TelegramZod.TelegramBanChatSenderChatRequest,
  TelegramBanChatSenderChatResponse
>;
export type TelegramCloseMethod = TelegramMethod<
  TelegramZod.TelegramCloseRequest,
  TelegramCloseResponse
>;
export type TelegramCloseForumTopicMethod = TelegramMethod<
  TelegramZod.TelegramCloseForumTopicRequest,
  TelegramCloseForumTopicResponse
>;
export type TelegramCloseGeneralForumTopicMethod = TelegramMethod<
  TelegramZod.TelegramCloseGeneralForumTopicRequest,
  TelegramCloseGeneralForumTopicResponse
>;
export type TelegramConvertGiftToStarsMethod = TelegramMethod<
  TelegramZod.TelegramConvertGiftToStarsRequest,
  TelegramConvertGiftToStarsResponse
>;
export type TelegramCopyMessageMethod = TelegramMethod<
  TelegramZod.TelegramCopyMessageRequest,
  TelegramCopyMessageResponse
>;
export type TelegramCopyMessagesMethod = TelegramMethod<
  TelegramZod.TelegramCopyMessagesRequest,
  TelegramCopyMessagesResponse
>;
export type TelegramCreateChatInviteLinkMethod = TelegramMethod<
  TelegramZod.TelegramCreateChatInviteLinkRequest,
  TelegramCreateChatInviteLinkResponse
>;
export type TelegramCreateChatSubscriptionInviteLinkMethod = TelegramMethod<
  TelegramZod.TelegramCreateChatSubscriptionInviteLinkRequest,
  TelegramCreateChatSubscriptionInviteLinkResponse
>;
export type TelegramCreateForumTopicMethod = TelegramMethod<
  TelegramZod.TelegramCreateForumTopicRequest,
  TelegramCreateForumTopicResponse
>;
export type TelegramCreateInvoiceLinkMethod = TelegramMethod<
  TelegramZod.TelegramCreateInvoiceLinkRequest,
  TelegramCreateInvoiceLinkResponse
>;
export type TelegramCreateNewStickerSetMethod = TelegramMethod<
  TelegramZod.TelegramCreateNewStickerSetRequest,
  TelegramCreateNewStickerSetResponse
>;
export type TelegramDeclineChatJoinRequestMethod = TelegramMethod<
  TelegramZod.TelegramDeclineChatJoinRequestRequest,
  TelegramDeclineChatJoinRequestResponse
>;
export type TelegramDeleteAllMessageReactionsMethod = TelegramMethod<
  TelegramZod.TelegramDeleteAllMessageReactionsRequest,
  TelegramDeleteAllMessageReactionsResponse
>;
export type TelegramDeleteBusinessMessagesMethod = TelegramMethod<
  TelegramZod.TelegramDeleteBusinessMessagesRequest,
  TelegramDeleteBusinessMessagesResponse
>;
export type TelegramDeleteChatPhotoMethod = TelegramMethod<
  TelegramZod.TelegramDeleteChatPhotoRequest,
  TelegramDeleteChatPhotoResponse
>;
export type TelegramDeleteChatStickerSetMethod = TelegramMethod<
  TelegramZod.TelegramDeleteChatStickerSetRequest,
  TelegramDeleteChatStickerSetResponse
>;
export type TelegramDeleteForumTopicMethod = TelegramMethod<
  TelegramZod.TelegramDeleteForumTopicRequest,
  TelegramDeleteForumTopicResponse
>;
export type TelegramDeleteMessageMethod = TelegramMethod<
  TelegramZod.TelegramDeleteMessageRequest,
  TelegramDeleteMessageResponse
>;
export type TelegramDeleteMessageReactionMethod = TelegramMethod<
  TelegramZod.TelegramDeleteMessageReactionRequest,
  TelegramDeleteMessageReactionResponse
>;
export type TelegramDeleteMessagesMethod = TelegramMethod<
  TelegramZod.TelegramDeleteMessagesRequest,
  TelegramDeleteMessagesResponse
>;
export type TelegramDeleteMyCommandsMethod = TelegramMethod<
  TelegramZod.TelegramDeleteMyCommandsRequest,
  TelegramDeleteMyCommandsResponse
>;
export type TelegramDeleteStickerFromSetMethod = TelegramMethod<
  TelegramZod.TelegramDeleteStickerFromSetRequest,
  TelegramDeleteStickerFromSetResponse
>;
export type TelegramDeleteStickerSetMethod = TelegramMethod<
  TelegramZod.TelegramDeleteStickerSetRequest,
  TelegramDeleteStickerSetResponse
>;
export type TelegramDeleteStoryMethod = TelegramMethod<
  TelegramZod.TelegramDeleteStoryRequest,
  TelegramDeleteStoryResponse
>;
export type TelegramDeleteWebhookMethod = TelegramMethod<
  TelegramZod.TelegramDeleteWebhookRequest,
  TelegramDeleteWebhookResponse
>;
export type TelegramEditChatInviteLinkMethod = TelegramMethod<
  TelegramZod.TelegramEditChatInviteLinkRequest,
  TelegramEditChatInviteLinkResponse
>;
export type TelegramEditChatSubscriptionInviteLinkMethod = TelegramMethod<
  TelegramZod.TelegramEditChatSubscriptionInviteLinkRequest,
  TelegramEditChatSubscriptionInviteLinkResponse
>;
export type TelegramEditForumTopicMethod = TelegramMethod<
  TelegramZod.TelegramEditForumTopicRequest,
  TelegramEditForumTopicResponse
>;
export type TelegramEditGeneralForumTopicMethod = TelegramMethod<
  TelegramZod.TelegramEditGeneralForumTopicRequest,
  TelegramEditGeneralForumTopicResponse
>;
export type TelegramEditMessageCaptionMethod = TelegramMethod<
  TelegramZod.TelegramEditMessageCaptionRequest,
  TelegramEditMessageCaptionResponse
>;
export type TelegramEditMessageChecklistMethod = TelegramMethod<
  TelegramZod.TelegramEditMessageChecklistRequest,
  TelegramEditMessageChecklistResponse
>;
export type TelegramEditMessageLiveLocationMethod = TelegramMethod<
  TelegramZod.TelegramEditMessageLiveLocationRequest,
  TelegramEditMessageLiveLocationResponse
>;
export type TelegramEditMessageMediaMethod = TelegramMethod<
  TelegramZod.TelegramEditMessageMediaRequest,
  TelegramEditMessageMediaResponse
>;
export type TelegramEditMessageReplyMarkupMethod = TelegramMethod<
  TelegramZod.TelegramEditMessageReplyMarkupRequest,
  TelegramEditMessageReplyMarkupResponse
>;
export type TelegramEditMessageTextMethod = TelegramMethod<
  TelegramZod.TelegramEditMessageTextRequest,
  TelegramEditMessageTextResponse
>;
export type TelegramEditStoryMethod = TelegramMethod<
  TelegramZod.TelegramEditStoryRequest,
  TelegramEditStoryResponse
>;
export type TelegramEditUserStarSubscriptionMethod = TelegramMethod<
  TelegramZod.TelegramEditUserStarSubscriptionRequest,
  TelegramEditUserStarSubscriptionResponse
>;
export type TelegramExportChatInviteLinkMethod = TelegramMethod<
  TelegramZod.TelegramExportChatInviteLinkRequest,
  TelegramExportChatInviteLinkResponse
>;
export type TelegramForwardMessageMethod = TelegramMethod<
  TelegramZod.TelegramForwardMessageRequest,
  TelegramForwardMessageResponse
>;
export type TelegramForwardMessagesMethod = TelegramMethod<
  TelegramZod.TelegramForwardMessagesRequest,
  TelegramForwardMessagesResponse
>;
export type TelegramGetAvailableGiftsMethod = TelegramMethod<
  TelegramZod.TelegramGetAvailableGiftsRequest,
  TelegramGetAvailableGiftsResponse
>;
export type TelegramGetBusinessAccountGiftsMethod = TelegramMethod<
  TelegramZod.TelegramGetBusinessAccountGiftsRequest,
  TelegramGetBusinessAccountGiftsResponse
>;
export type TelegramGetBusinessAccountStarBalanceMethod = TelegramMethod<
  TelegramZod.TelegramGetBusinessAccountStarBalanceRequest,
  TelegramGetBusinessAccountStarBalanceResponse
>;
export type TelegramGetBusinessConnectionMethod = TelegramMethod<
  TelegramZod.TelegramGetBusinessConnectionRequest,
  TelegramGetBusinessConnectionResponse
>;
export type TelegramGetChatMethod = TelegramMethod<
  TelegramZod.TelegramGetChatRequest,
  TelegramGetChatResponse
>;
export type TelegramGetChatAdministratorsMethod = TelegramMethod<
  TelegramZod.TelegramGetChatAdministratorsRequest,
  TelegramGetChatAdministratorsResponse
>;
export type TelegramGetChatGiftsMethod = TelegramMethod<
  TelegramZod.TelegramGetChatGiftsRequest,
  TelegramGetChatGiftsResponse
>;
export type TelegramGetChatMemberMethod = TelegramMethod<
  TelegramZod.TelegramGetChatMemberRequest,
  TelegramGetChatMemberResponse
>;
export type TelegramGetChatMemberCountMethod = TelegramMethod<
  TelegramZod.TelegramGetChatMemberCountRequest,
  TelegramGetChatMemberCountResponse
>;
export type TelegramGetChatMenuButtonMethod = TelegramMethod<
  TelegramZod.TelegramGetChatMenuButtonRequest,
  TelegramGetChatMenuButtonResponse
>;
export type TelegramGetCustomEmojiStickersMethod = TelegramMethod<
  TelegramZod.TelegramGetCustomEmojiStickersRequest,
  TelegramGetCustomEmojiStickersResponse
>;
export type TelegramGetFileMethod = TelegramMethod<
  TelegramZod.TelegramGetFileRequest,
  TelegramGetFileResponse
>;
export type TelegramGetForumTopicIconStickersMethod = TelegramMethod<
  TelegramZod.TelegramGetForumTopicIconStickersRequest,
  TelegramGetForumTopicIconStickersResponse
>;
export type TelegramGetGameHighScoresMethod = TelegramMethod<
  TelegramZod.TelegramGetGameHighScoresRequest,
  TelegramGetGameHighScoresResponse
>;
export type TelegramGetManagedBotAccessSettingsMethod = TelegramMethod<
  TelegramZod.TelegramGetManagedBotAccessSettingsRequest,
  TelegramGetManagedBotAccessSettingsResponse
>;
export type TelegramGetManagedBotTokenMethod = TelegramMethod<
  TelegramZod.TelegramGetManagedBotTokenRequest,
  TelegramGetManagedBotTokenResponse
>;
export type TelegramGetMeMethod = TelegramMethod<
  TelegramZod.TelegramGetMeRequest,
  TelegramGetMeResponse
>;
export type TelegramGetMyCommandsMethod = TelegramMethod<
  TelegramZod.TelegramGetMyCommandsRequest,
  TelegramGetMyCommandsResponse
>;
export type TelegramGetMyDefaultAdministratorRightsMethod = TelegramMethod<
  TelegramZod.TelegramGetMyDefaultAdministratorRightsRequest,
  TelegramGetMyDefaultAdministratorRightsResponse
>;
export type TelegramGetMyDescriptionMethod = TelegramMethod<
  TelegramZod.TelegramGetMyDescriptionRequest,
  TelegramGetMyDescriptionResponse
>;
export type TelegramGetMyNameMethod = TelegramMethod<
  TelegramZod.TelegramGetMyNameRequest,
  TelegramGetMyNameResponse
>;
export type TelegramGetMyShortDescriptionMethod = TelegramMethod<
  TelegramZod.TelegramGetMyShortDescriptionRequest,
  TelegramGetMyShortDescriptionResponse
>;
export type TelegramGetMyStarBalanceMethod = TelegramMethod<
  TelegramZod.TelegramGetMyStarBalanceRequest,
  TelegramGetMyStarBalanceResponse
>;
export type TelegramGetStarTransactionsMethod = TelegramMethod<
  TelegramZod.TelegramGetStarTransactionsRequest,
  TelegramGetStarTransactionsResponse
>;
export type TelegramGetStickerSetMethod = TelegramMethod<
  TelegramZod.TelegramGetStickerSetRequest,
  TelegramGetStickerSetResponse
>;
export type TelegramGetUpdatesMethod = TelegramMethod<
  TelegramZod.TelegramGetUpdatesRequest,
  TelegramGetUpdatesResponse
>;
export type TelegramGetUserChatBoostsMethod = TelegramMethod<
  TelegramZod.TelegramGetUserChatBoostsRequest,
  TelegramGetUserChatBoostsResponse
>;
export type TelegramGetUserGiftsMethod = TelegramMethod<
  TelegramZod.TelegramGetUserGiftsRequest,
  TelegramGetUserGiftsResponse
>;
export type TelegramGetUserPersonalChatMessagesMethod = TelegramMethod<
  TelegramZod.TelegramGetUserPersonalChatMessagesRequest,
  TelegramGetUserPersonalChatMessagesResponse
>;
export type TelegramGetWebhookInfoMethod = TelegramMethod<
  TelegramZod.TelegramGetWebhookInfoRequest,
  TelegramGetWebhookInfoResponse
>;
export type TelegramGiftPremiumSubscriptionMethod = TelegramMethod<
  TelegramZod.TelegramGiftPremiumSubscriptionRequest,
  TelegramGiftPremiumSubscriptionResponse
>;
export type TelegramHideGeneralForumTopicMethod = TelegramMethod<
  TelegramZod.TelegramHideGeneralForumTopicRequest,
  TelegramHideGeneralForumTopicResponse
>;
export type TelegramLeaveChatMethod = TelegramMethod<
  TelegramZod.TelegramLeaveChatRequest,
  TelegramLeaveChatResponse
>;
export type TelegramLogOutMethod = TelegramMethod<
  TelegramZod.TelegramLogOutRequest,
  TelegramLogOutResponse
>;
export type TelegramPinChatMessageMethod = TelegramMethod<
  TelegramZod.TelegramPinChatMessageRequest,
  TelegramPinChatMessageResponse
>;
export type TelegramPostStoryMethod = TelegramMethod<
  TelegramZod.TelegramPostStoryRequest,
  TelegramPostStoryResponse
>;
export type TelegramPromoteChatMemberMethod = TelegramMethod<
  TelegramZod.TelegramPromoteChatMemberRequest,
  TelegramPromoteChatMemberResponse
>;
export type TelegramReadBusinessMessageMethod = TelegramMethod<
  TelegramZod.TelegramReadBusinessMessageRequest,
  TelegramReadBusinessMessageResponse
>;
export type TelegramRefundStarPaymentMethod = TelegramMethod<
  TelegramZod.TelegramRefundStarPaymentRequest,
  TelegramRefundStarPaymentResponse
>;
export type TelegramRemoveBusinessAccountProfilePhotoMethod = TelegramMethod<
  TelegramZod.TelegramRemoveBusinessAccountProfilePhotoRequest,
  TelegramRemoveBusinessAccountProfilePhotoResponse
>;
export type TelegramRemoveChatVerificationMethod = TelegramMethod<
  TelegramZod.TelegramRemoveChatVerificationRequest,
  TelegramRemoveChatVerificationResponse
>;
export type TelegramRemoveUserVerificationMethod = TelegramMethod<
  TelegramZod.TelegramRemoveUserVerificationRequest,
  TelegramRemoveUserVerificationResponse
>;
export type TelegramReopenForumTopicMethod = TelegramMethod<
  TelegramZod.TelegramReopenForumTopicRequest,
  TelegramReopenForumTopicResponse
>;
export type TelegramReopenGeneralForumTopicMethod = TelegramMethod<
  TelegramZod.TelegramReopenGeneralForumTopicRequest,
  TelegramReopenGeneralForumTopicResponse
>;
export type TelegramReplaceManagedBotTokenMethod = TelegramMethod<
  TelegramZod.TelegramReplaceManagedBotTokenRequest,
  TelegramReplaceManagedBotTokenResponse
>;
export type TelegramReplaceStickerInSetMethod = TelegramMethod<
  TelegramZod.TelegramReplaceStickerInSetRequest,
  TelegramReplaceStickerInSetResponse
>;
export type TelegramRepostStoryMethod = TelegramMethod<
  TelegramZod.TelegramRepostStoryRequest,
  TelegramRepostStoryResponse
>;
export type TelegramRestrictChatMemberMethod = TelegramMethod<
  TelegramZod.TelegramRestrictChatMemberRequest,
  TelegramRestrictChatMemberResponse
>;
export type TelegramRevokeChatInviteLinkMethod = TelegramMethod<
  TelegramZod.TelegramRevokeChatInviteLinkRequest,
  TelegramRevokeChatInviteLinkResponse
>;
export type TelegramSavePreparedInlineMessageMethod = TelegramMethod<
  TelegramZod.TelegramSavePreparedInlineMessageRequest,
  TelegramSavePreparedInlineMessageResponse
>;
export type TelegramSavePreparedKeyboardButtonMethod = TelegramMethod<
  TelegramZod.TelegramSavePreparedKeyboardButtonRequest,
  TelegramSavePreparedKeyboardButtonResponse
>;
export type TelegramSendAnimationMethod = TelegramMethod<
  TelegramZod.TelegramSendAnimationRequest,
  TelegramSendAnimationResponse
>;
export type TelegramSendAudioMethod = TelegramMethod<
  TelegramZod.TelegramSendAudioRequest,
  TelegramSendAudioResponse
>;
export type TelegramSendChatActionMethod = TelegramMethod<
  TelegramZod.TelegramSendChatActionRequest,
  TelegramSendChatActionResponse
>;
export type TelegramSendChatJoinRequestWebAppMethod = TelegramMethod<
  TelegramZod.TelegramSendChatJoinRequestWebAppRequest,
  TelegramSendChatJoinRequestWebAppResponse
>;
export type TelegramSendChecklistMethod = TelegramMethod<
  TelegramZod.TelegramSendChecklistRequest,
  TelegramSendChecklistResponse
>;
export type TelegramSendContactMethod = TelegramMethod<
  TelegramZod.TelegramSendContactRequest,
  TelegramSendContactResponse
>;
export type TelegramSendDiceMethod = TelegramMethod<
  TelegramZod.TelegramSendDiceRequest,
  TelegramSendDiceResponse
>;
export type TelegramSendDocumentMethod = TelegramMethod<
  TelegramZod.TelegramSendDocumentRequest,
  TelegramSendDocumentResponse
>;
export type TelegramSendGameMethod = TelegramMethod<
  TelegramZod.TelegramSendGameRequest,
  TelegramSendGameResponse
>;
export type TelegramSendGiftMethod = TelegramMethod<
  TelegramZod.TelegramSendGiftRequest,
  TelegramSendGiftResponse
>;
export type TelegramSendInvoiceMethod = TelegramMethod<
  TelegramZod.TelegramSendInvoiceRequest,
  TelegramSendInvoiceResponse
>;
export type TelegramSendLivePhotoMethod = TelegramMethod<
  TelegramZod.TelegramSendLivePhotoRequest,
  TelegramSendLivePhotoResponse
>;
export type TelegramSendLocationMethod = TelegramMethod<
  TelegramZod.TelegramSendLocationRequest,
  TelegramSendLocationResponse
>;
export type TelegramSendMediaGroupMethod = TelegramMethod<
  TelegramZod.TelegramSendMediaGroupRequest,
  TelegramSendMediaGroupResponse
>;
export type TelegramSendMessageMethod = TelegramMethod<
  TelegramZod.TelegramSendMessageRequest,
  TelegramSendMessageResponse
>;
export type TelegramSendMessageDraftMethod = TelegramMethod<
  TelegramZod.TelegramSendMessageDraftRequest,
  TelegramSendMessageDraftResponse
>;
export type TelegramSendPaidMediaMethod = TelegramMethod<
  TelegramZod.TelegramSendPaidMediaRequest,
  TelegramSendPaidMediaResponse
>;
export type TelegramSendPhotoMethod = TelegramMethod<
  TelegramZod.TelegramSendPhotoRequest,
  TelegramSendPhotoResponse
>;
export type TelegramSendPollMethod = TelegramMethod<
  TelegramZod.TelegramSendPollRequest,
  TelegramSendPollResponse
>;
export type TelegramSendRichMessageMethod = TelegramMethod<
  TelegramZod.TelegramSendRichMessageRequest,
  TelegramSendRichMessageResponse
>;
export type TelegramSendRichMessageDraftMethod = TelegramMethod<
  TelegramZod.TelegramSendRichMessageDraftRequest,
  TelegramSendRichMessageDraftResponse
>;
export type TelegramSendStickerMethod = TelegramMethod<
  TelegramZod.TelegramSendStickerRequest,
  TelegramSendStickerResponse
>;
export type TelegramSendVenueMethod = TelegramMethod<
  TelegramZod.TelegramSendVenueRequest,
  TelegramSendVenueResponse
>;
export type TelegramSendVideoMethod = TelegramMethod<
  TelegramZod.TelegramSendVideoRequest,
  TelegramSendVideoResponse
>;
export type TelegramSendVideoNoteMethod = TelegramMethod<
  TelegramZod.TelegramSendVideoNoteRequest,
  TelegramSendVideoNoteResponse
>;
export type TelegramSendVoiceMethod = TelegramMethod<
  TelegramZod.TelegramSendVoiceRequest,
  TelegramSendVoiceResponse
>;
export type TelegramSetBusinessAccountBioMethod = TelegramMethod<
  TelegramZod.TelegramSetBusinessAccountBioRequest,
  TelegramSetBusinessAccountBioResponse
>;
export type TelegramSetBusinessAccountGiftSettingsMethod = TelegramMethod<
  TelegramZod.TelegramSetBusinessAccountGiftSettingsRequest,
  TelegramSetBusinessAccountGiftSettingsResponse
>;
export type TelegramSetBusinessAccountNameMethod = TelegramMethod<
  TelegramZod.TelegramSetBusinessAccountNameRequest,
  TelegramSetBusinessAccountNameResponse
>;
export type TelegramSetBusinessAccountProfilePhotoMethod = TelegramMethod<
  TelegramZod.TelegramSetBusinessAccountProfilePhotoRequest,
  TelegramSetBusinessAccountProfilePhotoResponse
>;
export type TelegramSetBusinessAccountUsernameMethod = TelegramMethod<
  TelegramZod.TelegramSetBusinessAccountUsernameRequest,
  TelegramSetBusinessAccountUsernameResponse
>;
export type TelegramSetChatAdministratorCustomTitleMethod = TelegramMethod<
  TelegramZod.TelegramSetChatAdministratorCustomTitleRequest,
  TelegramSetChatAdministratorCustomTitleResponse
>;
export type TelegramSetChatDescriptionMethod = TelegramMethod<
  TelegramZod.TelegramSetChatDescriptionRequest,
  TelegramSetChatDescriptionResponse
>;
export type TelegramSetChatMemberTagMethod = TelegramMethod<
  TelegramZod.TelegramSetChatMemberTagRequest,
  TelegramSetChatMemberTagResponse
>;
export type TelegramSetChatMenuButtonMethod = TelegramMethod<
  TelegramZod.TelegramSetChatMenuButtonRequest,
  TelegramSetChatMenuButtonResponse
>;
export type TelegramSetChatPermissionsMethod = TelegramMethod<
  TelegramZod.TelegramSetChatPermissionsRequest,
  TelegramSetChatPermissionsResponse
>;
export type TelegramSetChatPhotoMethod = TelegramMethod<
  TelegramZod.TelegramSetChatPhotoRequest,
  TelegramSetChatPhotoResponse
>;
export type TelegramSetChatStickerSetMethod = TelegramMethod<
  TelegramZod.TelegramSetChatStickerSetRequest,
  TelegramSetChatStickerSetResponse
>;
export type TelegramSetChatTitleMethod = TelegramMethod<
  TelegramZod.TelegramSetChatTitleRequest,
  TelegramSetChatTitleResponse
>;
export type TelegramSetCustomEmojiStickerSetThumbnailMethod = TelegramMethod<
  TelegramZod.TelegramSetCustomEmojiStickerSetThumbnailRequest,
  TelegramSetCustomEmojiStickerSetThumbnailResponse
>;
export type TelegramSetGameScoreMethod = TelegramMethod<
  TelegramZod.TelegramSetGameScoreRequest,
  TelegramSetGameScoreResponse
>;
export type TelegramSetManagedBotAccessSettingsMethod = TelegramMethod<
  TelegramZod.TelegramSetManagedBotAccessSettingsRequest,
  TelegramSetManagedBotAccessSettingsResponse
>;
export type TelegramSetMessageReactionMethod = TelegramMethod<
  TelegramZod.TelegramSetMessageReactionRequest,
  TelegramSetMessageReactionResponse
>;
export type TelegramSetMyCommandsMethod = TelegramMethod<
  TelegramZod.TelegramSetMyCommandsRequest,
  TelegramSetMyCommandsResponse
>;
export type TelegramSetMyDefaultAdministratorRightsMethod = TelegramMethod<
  TelegramZod.TelegramSetMyDefaultAdministratorRightsRequest,
  TelegramSetMyDefaultAdministratorRightsResponse
>;
export type TelegramSetMyDescriptionMethod = TelegramMethod<
  TelegramZod.TelegramSetMyDescriptionRequest,
  TelegramSetMyDescriptionResponse
>;
export type TelegramSetMyNameMethod = TelegramMethod<
  TelegramZod.TelegramSetMyNameRequest,
  TelegramSetMyNameResponse
>;
export type TelegramSetMyShortDescriptionMethod = TelegramMethod<
  TelegramZod.TelegramSetMyShortDescriptionRequest,
  TelegramSetMyShortDescriptionResponse
>;
export type TelegramSetPassportDataErrorsMethod = TelegramMethod<
  TelegramZod.TelegramSetPassportDataErrorsRequest,
  TelegramSetPassportDataErrorsResponse
>;
export type TelegramSetStickerEmojiListMethod = TelegramMethod<
  TelegramZod.TelegramSetStickerEmojiListRequest,
  TelegramSetStickerEmojiListResponse
>;
export type TelegramSetStickerKeywordsMethod = TelegramMethod<
  TelegramZod.TelegramSetStickerKeywordsRequest,
  TelegramSetStickerKeywordsResponse
>;
export type TelegramSetStickerMaskPositionMethod = TelegramMethod<
  TelegramZod.TelegramSetStickerMaskPositionRequest,
  TelegramSetStickerMaskPositionResponse
>;
export type TelegramSetStickerPositionInSetMethod = TelegramMethod<
  TelegramZod.TelegramSetStickerPositionInSetRequest,
  TelegramSetStickerPositionInSetResponse
>;
export type TelegramSetStickerSetThumbnailMethod = TelegramMethod<
  TelegramZod.TelegramSetStickerSetThumbnailRequest,
  TelegramSetStickerSetThumbnailResponse
>;
export type TelegramSetStickerSetTitleMethod = TelegramMethod<
  TelegramZod.TelegramSetStickerSetTitleRequest,
  TelegramSetStickerSetTitleResponse
>;
export type TelegramSetUserEmojiStatusMethod = TelegramMethod<
  TelegramZod.TelegramSetUserEmojiStatusRequest,
  TelegramSetUserEmojiStatusResponse
>;
export type TelegramSetWebhookMethod = TelegramMethod<
  TelegramZod.TelegramSetWebhookRequest,
  TelegramSetWebhookResponse
>;
export type TelegramStopMessageLiveLocationMethod = TelegramMethod<
  TelegramZod.TelegramStopMessageLiveLocationRequest,
  TelegramStopMessageLiveLocationResponse
>;
export type TelegramStopPollMethod = TelegramMethod<
  TelegramZod.TelegramStopPollRequest,
  TelegramStopPollResponse
>;
export type TelegramTransferBusinessAccountStarsMethod = TelegramMethod<
  TelegramZod.TelegramTransferBusinessAccountStarsRequest,
  TelegramTransferBusinessAccountStarsResponse
>;
export type TelegramTransferGiftMethod = TelegramMethod<
  TelegramZod.TelegramTransferGiftRequest,
  TelegramTransferGiftResponse
>;
export type TelegramUnbanChatMemberMethod = TelegramMethod<
  TelegramZod.TelegramUnbanChatMemberRequest,
  TelegramUnbanChatMemberResponse
>;
export type TelegramUnbanChatSenderChatMethod = TelegramMethod<
  TelegramZod.TelegramUnbanChatSenderChatRequest,
  TelegramUnbanChatSenderChatResponse
>;
export type TelegramUnhideGeneralForumTopicMethod = TelegramMethod<
  TelegramZod.TelegramUnhideGeneralForumTopicRequest,
  TelegramUnhideGeneralForumTopicResponse
>;
export type TelegramUnpinAllChatMessagesMethod = TelegramMethod<
  TelegramZod.TelegramUnpinAllChatMessagesRequest,
  TelegramUnpinAllChatMessagesResponse
>;
export type TelegramUnpinAllForumTopicMessagesMethod = TelegramMethod<
  TelegramZod.TelegramUnpinAllForumTopicMessagesRequest,
  TelegramUnpinAllForumTopicMessagesResponse
>;
export type TelegramUnpinAllGeneralForumTopicMessagesMethod = TelegramMethod<
  TelegramZod.TelegramUnpinAllGeneralForumTopicMessagesRequest,
  TelegramUnpinAllGeneralForumTopicMessagesResponse
>;
export type TelegramUnpinChatMessageMethod = TelegramMethod<
  TelegramZod.TelegramUnpinChatMessageRequest,
  TelegramUnpinChatMessageResponse
>;
export type TelegramUpgradeGiftMethod = TelegramMethod<
  TelegramZod.TelegramUpgradeGiftRequest,
  TelegramUpgradeGiftResponse
>;
export type TelegramUploadStickerFileMethod = TelegramMethod<
  TelegramZod.TelegramUploadStickerFileRequest,
  TelegramUploadStickerFileResponse
>;
export type TelegramVerifyChatMethod = TelegramMethod<
  TelegramZod.TelegramVerifyChatRequest,
  TelegramVerifyChatResponse
>;
export type TelegramVerifyUserMethod = TelegramMethod<
  TelegramZod.TelegramVerifyUserRequest,
  TelegramVerifyUserResponse
>;

export interface TelegramPostNamespace {
  approveSuggestedPost: TelegramApproveSuggestedPostMethod;
  declineSuggestedPost: TelegramDeclineSuggestedPostMethod;
  getUserProfileAudios: TelegramGetUserProfileAudiosMethod;
  getUserProfilePhotos: TelegramGetUserProfilePhotosMethod;
  removeMyProfilePhoto: TelegramRemoveMyProfilePhotoMethod;
  setMyProfilePhoto: TelegramSetMyProfilePhotoMethod;
  addStickerToSet: TelegramAddStickerToSetMethod;
  answerCallbackQuery: TelegramAnswerCallbackQueryMethod;
  answerChatJoinRequestQuery: TelegramAnswerChatJoinRequestQueryMethod;
  answerGuestQuery: TelegramAnswerGuestQueryMethod;
  answerInlineQuery: TelegramAnswerInlineQueryMethod;
  answerPreCheckoutQuery: TelegramAnswerPreCheckoutQueryMethod;
  answerShippingQuery: TelegramAnswerShippingQueryMethod;
  answerWebAppQuery: TelegramAnswerWebAppQueryMethod;
  approveChatJoinRequest: TelegramApproveChatJoinRequestMethod;
  banChatMember: TelegramBanChatMemberMethod;
  banChatSenderChat: TelegramBanChatSenderChatMethod;
  close: TelegramCloseMethod;
  closeForumTopic: TelegramCloseForumTopicMethod;
  closeGeneralForumTopic: TelegramCloseGeneralForumTopicMethod;
  convertGiftToStars: TelegramConvertGiftToStarsMethod;
  copyMessage: TelegramCopyMessageMethod;
  copyMessages: TelegramCopyMessagesMethod;
  createChatInviteLink: TelegramCreateChatInviteLinkMethod;
  createChatSubscriptionInviteLink: TelegramCreateChatSubscriptionInviteLinkMethod;
  createForumTopic: TelegramCreateForumTopicMethod;
  createInvoiceLink: TelegramCreateInvoiceLinkMethod;
  createNewStickerSet: TelegramCreateNewStickerSetMethod;
  declineChatJoinRequest: TelegramDeclineChatJoinRequestMethod;
  deleteAllMessageReactions: TelegramDeleteAllMessageReactionsMethod;
  deleteBusinessMessages: TelegramDeleteBusinessMessagesMethod;
  deleteChatPhoto: TelegramDeleteChatPhotoMethod;
  deleteChatStickerSet: TelegramDeleteChatStickerSetMethod;
  deleteForumTopic: TelegramDeleteForumTopicMethod;
  deleteMessage: TelegramDeleteMessageMethod;
  deleteMessageReaction: TelegramDeleteMessageReactionMethod;
  deleteMessages: TelegramDeleteMessagesMethod;
  deleteMyCommands: TelegramDeleteMyCommandsMethod;
  deleteStickerFromSet: TelegramDeleteStickerFromSetMethod;
  deleteStickerSet: TelegramDeleteStickerSetMethod;
  deleteStory: TelegramDeleteStoryMethod;
  deleteWebhook: TelegramDeleteWebhookMethod;
  editChatInviteLink: TelegramEditChatInviteLinkMethod;
  editChatSubscriptionInviteLink: TelegramEditChatSubscriptionInviteLinkMethod;
  editForumTopic: TelegramEditForumTopicMethod;
  editGeneralForumTopic: TelegramEditGeneralForumTopicMethod;
  editMessageCaption: TelegramEditMessageCaptionMethod;
  editMessageChecklist: TelegramEditMessageChecklistMethod;
  editMessageLiveLocation: TelegramEditMessageLiveLocationMethod;
  editMessageMedia: TelegramEditMessageMediaMethod;
  editMessageReplyMarkup: TelegramEditMessageReplyMarkupMethod;
  editMessageText: TelegramEditMessageTextMethod;
  editStory: TelegramEditStoryMethod;
  editUserStarSubscription: TelegramEditUserStarSubscriptionMethod;
  exportChatInviteLink: TelegramExportChatInviteLinkMethod;
  forwardMessage: TelegramForwardMessageMethod;
  forwardMessages: TelegramForwardMessagesMethod;
  getAvailableGifts: TelegramGetAvailableGiftsMethod;
  getBusinessAccountGifts: TelegramGetBusinessAccountGiftsMethod;
  getBusinessAccountStarBalance: TelegramGetBusinessAccountStarBalanceMethod;
  getBusinessConnection: TelegramGetBusinessConnectionMethod;
  getChat: TelegramGetChatMethod;
  getChatAdministrators: TelegramGetChatAdministratorsMethod;
  getChatGifts: TelegramGetChatGiftsMethod;
  getChatMember: TelegramGetChatMemberMethod;
  getChatMemberCount: TelegramGetChatMemberCountMethod;
  getChatMenuButton: TelegramGetChatMenuButtonMethod;
  getCustomEmojiStickers: TelegramGetCustomEmojiStickersMethod;
  getFile: TelegramGetFileMethod;
  getForumTopicIconStickers: TelegramGetForumTopicIconStickersMethod;
  getGameHighScores: TelegramGetGameHighScoresMethod;
  getManagedBotAccessSettings: TelegramGetManagedBotAccessSettingsMethod;
  getManagedBotToken: TelegramGetManagedBotTokenMethod;
  getMe: TelegramGetMeMethod;
  getMyCommands: TelegramGetMyCommandsMethod;
  getMyDefaultAdministratorRights: TelegramGetMyDefaultAdministratorRightsMethod;
  getMyDescription: TelegramGetMyDescriptionMethod;
  getMyName: TelegramGetMyNameMethod;
  getMyShortDescription: TelegramGetMyShortDescriptionMethod;
  getMyStarBalance: TelegramGetMyStarBalanceMethod;
  getStarTransactions: TelegramGetStarTransactionsMethod;
  getStickerSet: TelegramGetStickerSetMethod;
  getUpdates: TelegramGetUpdatesMethod;
  getUserChatBoosts: TelegramGetUserChatBoostsMethod;
  getUserGifts: TelegramGetUserGiftsMethod;
  getUserPersonalChatMessages: TelegramGetUserPersonalChatMessagesMethod;
  getWebhookInfo: TelegramGetWebhookInfoMethod;
  giftPremiumSubscription: TelegramGiftPremiumSubscriptionMethod;
  hideGeneralForumTopic: TelegramHideGeneralForumTopicMethod;
  leaveChat: TelegramLeaveChatMethod;
  logOut: TelegramLogOutMethod;
  pinChatMessage: TelegramPinChatMessageMethod;
  postStory: TelegramPostStoryMethod;
  promoteChatMember: TelegramPromoteChatMemberMethod;
  readBusinessMessage: TelegramReadBusinessMessageMethod;
  refundStarPayment: TelegramRefundStarPaymentMethod;
  removeBusinessAccountProfilePhoto: TelegramRemoveBusinessAccountProfilePhotoMethod;
  removeChatVerification: TelegramRemoveChatVerificationMethod;
  removeUserVerification: TelegramRemoveUserVerificationMethod;
  reopenForumTopic: TelegramReopenForumTopicMethod;
  reopenGeneralForumTopic: TelegramReopenGeneralForumTopicMethod;
  replaceManagedBotToken: TelegramReplaceManagedBotTokenMethod;
  replaceStickerInSet: TelegramReplaceStickerInSetMethod;
  repostStory: TelegramRepostStoryMethod;
  restrictChatMember: TelegramRestrictChatMemberMethod;
  revokeChatInviteLink: TelegramRevokeChatInviteLinkMethod;
  savePreparedInlineMessage: TelegramSavePreparedInlineMessageMethod;
  savePreparedKeyboardButton: TelegramSavePreparedKeyboardButtonMethod;
  sendAnimation: TelegramSendAnimationMethod;
  sendAudio: TelegramSendAudioMethod;
  sendChatAction: TelegramSendChatActionMethod;
  sendChatJoinRequestWebApp: TelegramSendChatJoinRequestWebAppMethod;
  sendChecklist: TelegramSendChecklistMethod;
  sendContact: TelegramSendContactMethod;
  sendDice: TelegramSendDiceMethod;
  sendDocument: TelegramSendDocumentMethod;
  sendGame: TelegramSendGameMethod;
  sendGift: TelegramSendGiftMethod;
  sendInvoice: TelegramSendInvoiceMethod;
  sendLivePhoto: TelegramSendLivePhotoMethod;
  sendLocation: TelegramSendLocationMethod;
  sendMediaGroup: TelegramSendMediaGroupMethod;
  sendMessage: TelegramSendMessageMethod;
  sendMessageDraft: TelegramSendMessageDraftMethod;
  sendPaidMedia: TelegramSendPaidMediaMethod;
  sendPhoto: TelegramSendPhotoMethod;
  sendPoll: TelegramSendPollMethod;
  sendRichMessage: TelegramSendRichMessageMethod;
  sendRichMessageDraft: TelegramSendRichMessageDraftMethod;
  sendSticker: TelegramSendStickerMethod;
  sendVenue: TelegramSendVenueMethod;
  sendVideo: TelegramSendVideoMethod;
  sendVideoNote: TelegramSendVideoNoteMethod;
  sendVoice: TelegramSendVoiceMethod;
  setBusinessAccountBio: TelegramSetBusinessAccountBioMethod;
  setBusinessAccountGiftSettings: TelegramSetBusinessAccountGiftSettingsMethod;
  setBusinessAccountName: TelegramSetBusinessAccountNameMethod;
  setBusinessAccountProfilePhoto: TelegramSetBusinessAccountProfilePhotoMethod;
  setBusinessAccountUsername: TelegramSetBusinessAccountUsernameMethod;
  setChatAdministratorCustomTitle: TelegramSetChatAdministratorCustomTitleMethod;
  setChatDescription: TelegramSetChatDescriptionMethod;
  setChatMemberTag: TelegramSetChatMemberTagMethod;
  setChatMenuButton: TelegramSetChatMenuButtonMethod;
  setChatPermissions: TelegramSetChatPermissionsMethod;
  setChatPhoto: TelegramSetChatPhotoMethod;
  setChatStickerSet: TelegramSetChatStickerSetMethod;
  setChatTitle: TelegramSetChatTitleMethod;
  setCustomEmojiStickerSetThumbnail: TelegramSetCustomEmojiStickerSetThumbnailMethod;
  setGameScore: TelegramSetGameScoreMethod;
  setManagedBotAccessSettings: TelegramSetManagedBotAccessSettingsMethod;
  setMessageReaction: TelegramSetMessageReactionMethod;
  setMyCommands: TelegramSetMyCommandsMethod;
  setMyDefaultAdministratorRights: TelegramSetMyDefaultAdministratorRightsMethod;
  setMyDescription: TelegramSetMyDescriptionMethod;
  setMyName: TelegramSetMyNameMethod;
  setMyShortDescription: TelegramSetMyShortDescriptionMethod;
  setPassportDataErrors: TelegramSetPassportDataErrorsMethod;
  setStickerEmojiList: TelegramSetStickerEmojiListMethod;
  setStickerKeywords: TelegramSetStickerKeywordsMethod;
  setStickerMaskPosition: TelegramSetStickerMaskPositionMethod;
  setStickerPositionInSet: TelegramSetStickerPositionInSetMethod;
  setStickerSetThumbnail: TelegramSetStickerSetThumbnailMethod;
  setStickerSetTitle: TelegramSetStickerSetTitleMethod;
  setUserEmojiStatus: TelegramSetUserEmojiStatusMethod;
  setWebhook: TelegramSetWebhookMethod;
  stopMessageLiveLocation: TelegramStopMessageLiveLocationMethod;
  stopPoll: TelegramStopPollMethod;
  transferBusinessAccountStars: TelegramTransferBusinessAccountStarsMethod;
  transferGift: TelegramTransferGiftMethod;
  unbanChatMember: TelegramUnbanChatMemberMethod;
  unbanChatSenderChat: TelegramUnbanChatSenderChatMethod;
  unhideGeneralForumTopic: TelegramUnhideGeneralForumTopicMethod;
  unpinAllChatMessages: TelegramUnpinAllChatMessagesMethod;
  unpinAllForumTopicMessages: TelegramUnpinAllForumTopicMessagesMethod;
  unpinAllGeneralForumTopicMessages: TelegramUnpinAllGeneralForumTopicMessagesMethod;
  unpinChatMessage: TelegramUnpinChatMessageMethod;
  upgradeGift: TelegramUpgradeGiftMethod;
  uploadStickerFile: TelegramUploadStickerFileMethod;
  verifyChat: TelegramVerifyChatMethod;
  verifyUser: TelegramVerifyUserMethod;
}

export interface TelegramProvider extends TelegramPostNamespace {
  post: TelegramPostNamespace;
}
