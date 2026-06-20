import type { z } from "zod";
import type * as TelegramZod from "./zod";

export type * from "./zod";

// -- Error -------------------------------------------------------------------

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

// -- Response shapes ---------------------------------------------------------

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
  is_premium?: boolean;
}

export interface TelegramChat {
  id: number;
  type: string;
  title?: string;
  username?: string;
  first_name?: string;
  last_name?: string;
}

export interface TelegramMessage {
  message_id: number;
  message_thread_id?: number;
  from?: TelegramUser;
  sender_chat?: TelegramChat;
  date: number;
  chat: TelegramChat;
  text?: string;
  caption?: string;
  photo?: Array<Record<string, unknown>>;
  video?: Record<string, unknown>;
  audio?: Record<string, unknown>;
  [key: string]: unknown;
}

export type TelegramBooleanResponse = TelegramApiResponse<boolean>;
export type TelegramStringResponse = TelegramApiResponse<string>;
export type TelegramRecordResponse = TelegramApiResponse<
  Record<string, unknown>
>;
export type TelegramRecordArrayResponse = TelegramApiResponse<
  Array<Record<string, unknown>>
>;

export type TelegramSendMessageResponse = TelegramApiResponse<TelegramMessage>;
export type TelegramSendPhotoResponse = TelegramApiResponse<TelegramMessage>;
export type TelegramSendVideoResponse = TelegramApiResponse<TelegramMessage>;
export type TelegramSendAudioResponse = TelegramApiResponse<TelegramMessage>;
export type TelegramAnswerCallbackQueryResponse = TelegramBooleanResponse;
export type TelegramAnswerWebAppQueryResponse = TelegramRecordResponse;
export type TelegramSavePreparedInlineMessageResponse = TelegramRecordResponse;
export type TelegramSavePreparedKeyboardButtonResponse = TelegramRecordResponse;
export type TelegramAnswerInlineQueryResponse = TelegramBooleanResponse;
export type TelegramSendInvoiceResponse = TelegramApiResponse<TelegramMessage>;
export type TelegramCreateInvoiceLinkResponse = TelegramStringResponse;
export type TelegramAnswerShippingQueryResponse = TelegramBooleanResponse;
export type TelegramAnswerPreCheckoutQueryResponse = TelegramBooleanResponse;
export type TelegramGetMyStarBalanceResponse = TelegramRecordResponse;
export type TelegramGetStarTransactionsResponse = TelegramRecordResponse;
export type TelegramRefundStarPaymentResponse = TelegramBooleanResponse;
export type TelegramEditUserStarSubscriptionResponse = TelegramBooleanResponse;
export type TelegramSendStickerResponse = TelegramApiResponse<TelegramMessage>;
export type TelegramGetStickerSetResponse = TelegramRecordResponse;
export type TelegramGetCustomEmojiStickersResponse =
  TelegramRecordArrayResponse;
export type TelegramUploadStickerFileResponse = TelegramRecordResponse;
export type TelegramCreateNewStickerSetResponse = TelegramBooleanResponse;
export type TelegramAddStickerToSetResponse = TelegramBooleanResponse;
export type TelegramSetStickerPositionInSetResponse = TelegramBooleanResponse;
export type TelegramDeleteStickerFromSetResponse = TelegramBooleanResponse;
export type TelegramReplaceStickerInSetResponse = TelegramBooleanResponse;
export type TelegramSetStickerEmojiListResponse = TelegramBooleanResponse;
export type TelegramSetStickerKeywordsResponse = TelegramBooleanResponse;
export type TelegramSetStickerMaskPositionResponse = TelegramBooleanResponse;
export type TelegramSetStickerSetTitleResponse = TelegramBooleanResponse;
export type TelegramSetStickerSetThumbnailResponse = TelegramBooleanResponse;
export type TelegramSetCustomEmojiStickerSetThumbnailResponse =
  TelegramBooleanResponse;
export type TelegramDeleteStickerSetResponse = TelegramBooleanResponse;
export type TelegramGetAvailableGiftsResponse = TelegramRecordResponse;
export type TelegramSendGiftResponse = TelegramBooleanResponse;
export type TelegramGiftPremiumSubscriptionResponse = TelegramBooleanResponse;
export type TelegramVerifyUserResponse = TelegramBooleanResponse;
export type TelegramVerifyChatResponse = TelegramBooleanResponse;
export type TelegramRemoveUserVerificationResponse = TelegramBooleanResponse;
export type TelegramRemoveChatVerificationResponse = TelegramBooleanResponse;
export type TelegramGetUserGiftsResponse = TelegramRecordResponse;
export type TelegramGetChatGiftsResponse = TelegramRecordResponse;
export type TelegramSetUserEmojiStatusResponse = TelegramBooleanResponse;
export type TelegramGetBusinessConnectionResponse = TelegramRecordResponse;
export type TelegramReadBusinessMessageResponse = TelegramBooleanResponse;
export type TelegramDeleteBusinessMessagesResponse = TelegramBooleanResponse;
export type TelegramSetBusinessAccountNameResponse = TelegramBooleanResponse;
export type TelegramSetBusinessAccountUsernameResponse =
  TelegramBooleanResponse;
export type TelegramSetBusinessAccountBioResponse = TelegramBooleanResponse;
export type TelegramSetBusinessAccountProfilePhotoResponse =
  TelegramBooleanResponse;
export type TelegramRemoveBusinessAccountProfilePhotoResponse =
  TelegramBooleanResponse;
export type TelegramSetBusinessAccountGiftSettingsResponse =
  TelegramBooleanResponse;
export type TelegramGetBusinessAccountStarBalanceResponse =
  TelegramRecordResponse;
export type TelegramTransferBusinessAccountStarsResponse =
  TelegramBooleanResponse;
export type TelegramGetBusinessAccountGiftsResponse = TelegramRecordResponse;
export type TelegramConvertGiftToStarsResponse = TelegramBooleanResponse;
export type TelegramUpgradeGiftResponse = TelegramBooleanResponse;
export type TelegramTransferGiftResponse = TelegramBooleanResponse;
export type TelegramPostStoryResponse = TelegramRecordResponse;
export type TelegramRepostStoryResponse = TelegramRecordResponse;
export type TelegramEditStoryResponse = TelegramRecordResponse;
export type TelegramDeleteStoryResponse = TelegramBooleanResponse;
export type TelegramSetPassportDataErrorsResponse = TelegramBooleanResponse;
export type TelegramSendGameResponse = TelegramApiResponse<TelegramMessage>;
export type TelegramSetGameScoreResponse = TelegramApiResponse<
  TelegramMessage | boolean
>;
export type TelegramGetGameHighScoresResponse = TelegramRecordArrayResponse;

// -- Method interfaces -------------------------------------------------------

export interface TelegramMethod<Request, Response> {
  (req: Request, signal?: AbortSignal): Promise<Response>;
  schema: z.ZodType<Request>;
}

export type TelegramSendMessageMethod = TelegramMethod<
  TelegramZod.TelegramSendMessageRequest,
  TelegramSendMessageResponse
>;
export type TelegramSendPhotoMethod = TelegramMethod<
  TelegramZod.TelegramSendPhotoRequest,
  TelegramSendPhotoResponse
>;
export type TelegramSendVideoMethod = TelegramMethod<
  TelegramZod.TelegramSendVideoRequest,
  TelegramSendVideoResponse
>;
export type TelegramSendAudioMethod = TelegramMethod<
  TelegramZod.TelegramSendAudioRequest,
  TelegramSendAudioResponse
>;
export type TelegramAnswerCallbackQueryMethod = TelegramMethod<
  TelegramZod.TelegramAnswerCallbackQueryRequest,
  TelegramAnswerCallbackQueryResponse
>;
export type TelegramAnswerWebAppQueryMethod = TelegramMethod<
  TelegramZod.TelegramAnswerWebAppQueryRequest,
  TelegramAnswerWebAppQueryResponse
>;
export type TelegramSavePreparedInlineMessageMethod = TelegramMethod<
  TelegramZod.TelegramSavePreparedInlineMessageRequest,
  TelegramSavePreparedInlineMessageResponse
>;
export type TelegramSavePreparedKeyboardButtonMethod = TelegramMethod<
  TelegramZod.TelegramSavePreparedKeyboardButtonRequest,
  TelegramSavePreparedKeyboardButtonResponse
>;
export type TelegramAnswerInlineQueryMethod = TelegramMethod<
  TelegramZod.TelegramAnswerInlineQueryRequest,
  TelegramAnswerInlineQueryResponse
>;
export type TelegramSendInvoiceMethod = TelegramMethod<
  TelegramZod.TelegramSendInvoiceRequest,
  TelegramSendInvoiceResponse
>;
export type TelegramCreateInvoiceLinkMethod = TelegramMethod<
  TelegramZod.TelegramCreateInvoiceLinkRequest,
  TelegramCreateInvoiceLinkResponse
>;
export type TelegramAnswerShippingQueryMethod = TelegramMethod<
  TelegramZod.TelegramAnswerShippingQueryRequest,
  TelegramAnswerShippingQueryResponse
>;
export type TelegramAnswerPreCheckoutQueryMethod = TelegramMethod<
  TelegramZod.TelegramAnswerPreCheckoutQueryRequest,
  TelegramAnswerPreCheckoutQueryResponse
>;
export type TelegramGetMyStarBalanceMethod = TelegramMethod<
  TelegramZod.TelegramGetMyStarBalanceRequest,
  TelegramGetMyStarBalanceResponse
>;
export type TelegramGetStarTransactionsMethod = TelegramMethod<
  TelegramZod.TelegramGetStarTransactionsRequest,
  TelegramGetStarTransactionsResponse
>;
export type TelegramRefundStarPaymentMethod = TelegramMethod<
  TelegramZod.TelegramRefundStarPaymentRequest,
  TelegramRefundStarPaymentResponse
>;
export type TelegramEditUserStarSubscriptionMethod = TelegramMethod<
  TelegramZod.TelegramEditUserStarSubscriptionRequest,
  TelegramEditUserStarSubscriptionResponse
>;
export type TelegramSendStickerMethod = TelegramMethod<
  TelegramZod.TelegramSendStickerRequest,
  TelegramSendStickerResponse
>;
export type TelegramGetStickerSetMethod = TelegramMethod<
  TelegramZod.TelegramGetStickerSetRequest,
  TelegramGetStickerSetResponse
>;
export type TelegramGetCustomEmojiStickersMethod = TelegramMethod<
  TelegramZod.TelegramGetCustomEmojiStickersRequest,
  TelegramGetCustomEmojiStickersResponse
>;
export type TelegramUploadStickerFileMethod = TelegramMethod<
  TelegramZod.TelegramUploadStickerFileRequest,
  TelegramUploadStickerFileResponse
>;
export type TelegramCreateNewStickerSetMethod = TelegramMethod<
  TelegramZod.TelegramCreateNewStickerSetRequest,
  TelegramCreateNewStickerSetResponse
>;
export type TelegramAddStickerToSetMethod = TelegramMethod<
  TelegramZod.TelegramAddStickerToSetRequest,
  TelegramAddStickerToSetResponse
>;
export type TelegramSetStickerPositionInSetMethod = TelegramMethod<
  TelegramZod.TelegramSetStickerPositionInSetRequest,
  TelegramSetStickerPositionInSetResponse
>;
export type TelegramDeleteStickerFromSetMethod = TelegramMethod<
  TelegramZod.TelegramDeleteStickerFromSetRequest,
  TelegramDeleteStickerFromSetResponse
>;
export type TelegramReplaceStickerInSetMethod = TelegramMethod<
  TelegramZod.TelegramReplaceStickerInSetRequest,
  TelegramReplaceStickerInSetResponse
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
export type TelegramSetStickerSetTitleMethod = TelegramMethod<
  TelegramZod.TelegramSetStickerSetTitleRequest,
  TelegramSetStickerSetTitleResponse
>;
export type TelegramSetStickerSetThumbnailMethod = TelegramMethod<
  TelegramZod.TelegramSetStickerSetThumbnailRequest,
  TelegramSetStickerSetThumbnailResponse
>;
export type TelegramSetCustomEmojiStickerSetThumbnailMethod = TelegramMethod<
  TelegramZod.TelegramSetCustomEmojiStickerSetThumbnailRequest,
  TelegramSetCustomEmojiStickerSetThumbnailResponse
>;
export type TelegramDeleteStickerSetMethod = TelegramMethod<
  TelegramZod.TelegramDeleteStickerSetRequest,
  TelegramDeleteStickerSetResponse
>;
export type TelegramGetAvailableGiftsMethod = TelegramMethod<
  TelegramZod.TelegramGetAvailableGiftsRequest,
  TelegramGetAvailableGiftsResponse
>;
export type TelegramSendGiftMethod = TelegramMethod<
  TelegramZod.TelegramSendGiftRequest,
  TelegramSendGiftResponse
>;
export type TelegramGiftPremiumSubscriptionMethod = TelegramMethod<
  TelegramZod.TelegramGiftPremiumSubscriptionRequest,
  TelegramGiftPremiumSubscriptionResponse
>;
export type TelegramVerifyUserMethod = TelegramMethod<
  TelegramZod.TelegramVerifyUserRequest,
  TelegramVerifyUserResponse
>;
export type TelegramVerifyChatMethod = TelegramMethod<
  TelegramZod.TelegramVerifyChatRequest,
  TelegramVerifyChatResponse
>;
export type TelegramRemoveUserVerificationMethod = TelegramMethod<
  TelegramZod.TelegramRemoveUserVerificationRequest,
  TelegramRemoveUserVerificationResponse
>;
export type TelegramRemoveChatVerificationMethod = TelegramMethod<
  TelegramZod.TelegramRemoveChatVerificationRequest,
  TelegramRemoveChatVerificationResponse
>;
export type TelegramGetUserGiftsMethod = TelegramMethod<
  TelegramZod.TelegramGetUserGiftsRequest,
  TelegramGetUserGiftsResponse
>;
export type TelegramGetChatGiftsMethod = TelegramMethod<
  TelegramZod.TelegramGetChatGiftsRequest,
  TelegramGetChatGiftsResponse
>;
export type TelegramSetUserEmojiStatusMethod = TelegramMethod<
  TelegramZod.TelegramSetUserEmojiStatusRequest,
  TelegramSetUserEmojiStatusResponse
>;
export type TelegramGetBusinessConnectionMethod = TelegramMethod<
  TelegramZod.TelegramGetBusinessConnectionRequest,
  TelegramGetBusinessConnectionResponse
>;
export type TelegramReadBusinessMessageMethod = TelegramMethod<
  TelegramZod.TelegramReadBusinessMessageRequest,
  TelegramReadBusinessMessageResponse
>;
export type TelegramDeleteBusinessMessagesMethod = TelegramMethod<
  TelegramZod.TelegramDeleteBusinessMessagesRequest,
  TelegramDeleteBusinessMessagesResponse
>;
export type TelegramSetBusinessAccountNameMethod = TelegramMethod<
  TelegramZod.TelegramSetBusinessAccountNameRequest,
  TelegramSetBusinessAccountNameResponse
>;
export type TelegramSetBusinessAccountUsernameMethod = TelegramMethod<
  TelegramZod.TelegramSetBusinessAccountUsernameRequest,
  TelegramSetBusinessAccountUsernameResponse
>;
export type TelegramSetBusinessAccountBioMethod = TelegramMethod<
  TelegramZod.TelegramSetBusinessAccountBioRequest,
  TelegramSetBusinessAccountBioResponse
>;
export type TelegramSetBusinessAccountProfilePhotoMethod = TelegramMethod<
  TelegramZod.TelegramSetBusinessAccountProfilePhotoRequest,
  TelegramSetBusinessAccountProfilePhotoResponse
>;
export type TelegramRemoveBusinessAccountProfilePhotoMethod = TelegramMethod<
  TelegramZod.TelegramRemoveBusinessAccountProfilePhotoRequest,
  TelegramRemoveBusinessAccountProfilePhotoResponse
>;
export type TelegramSetBusinessAccountGiftSettingsMethod = TelegramMethod<
  TelegramZod.TelegramSetBusinessAccountGiftSettingsRequest,
  TelegramSetBusinessAccountGiftSettingsResponse
>;
export type TelegramGetBusinessAccountStarBalanceMethod = TelegramMethod<
  TelegramZod.TelegramGetBusinessAccountStarBalanceRequest,
  TelegramGetBusinessAccountStarBalanceResponse
>;
export type TelegramTransferBusinessAccountStarsMethod = TelegramMethod<
  TelegramZod.TelegramTransferBusinessAccountStarsRequest,
  TelegramTransferBusinessAccountStarsResponse
>;
export type TelegramGetBusinessAccountGiftsMethod = TelegramMethod<
  TelegramZod.TelegramGetBusinessAccountGiftsRequest,
  TelegramGetBusinessAccountGiftsResponse
>;
export type TelegramConvertGiftToStarsMethod = TelegramMethod<
  TelegramZod.TelegramConvertGiftToStarsRequest,
  TelegramConvertGiftToStarsResponse
>;
export type TelegramUpgradeGiftMethod = TelegramMethod<
  TelegramZod.TelegramUpgradeGiftRequest,
  TelegramUpgradeGiftResponse
>;
export type TelegramTransferGiftMethod = TelegramMethod<
  TelegramZod.TelegramTransferGiftRequest,
  TelegramTransferGiftResponse
>;
export type TelegramPostStoryMethod = TelegramMethod<
  TelegramZod.TelegramPostStoryRequest,
  TelegramPostStoryResponse
>;
export type TelegramRepostStoryMethod = TelegramMethod<
  TelegramZod.TelegramRepostStoryRequest,
  TelegramRepostStoryResponse
>;
export type TelegramEditStoryMethod = TelegramMethod<
  TelegramZod.TelegramEditStoryRequest,
  TelegramEditStoryResponse
>;
export type TelegramDeleteStoryMethod = TelegramMethod<
  TelegramZod.TelegramDeleteStoryRequest,
  TelegramDeleteStoryResponse
>;
export type TelegramSetPassportDataErrorsMethod = TelegramMethod<
  TelegramZod.TelegramSetPassportDataErrorsRequest,
  TelegramSetPassportDataErrorsResponse
>;
export type TelegramSendGameMethod = TelegramMethod<
  TelegramZod.TelegramSendGameRequest,
  TelegramSendGameResponse
>;
export type TelegramSetGameScoreMethod = TelegramMethod<
  TelegramZod.TelegramSetGameScoreRequest,
  TelegramSetGameScoreResponse
>;
export type TelegramGetGameHighScoresMethod = TelegramMethod<
  TelegramZod.TelegramGetGameHighScoresRequest,
  TelegramGetGameHighScoresResponse
>;

// -- Provider ----------------------------------------------------------------

export interface TelegramMethodMap {
  sendMessage: TelegramSendMessageMethod;
  sendPhoto: TelegramSendPhotoMethod;
  sendVideo: TelegramSendVideoMethod;
  sendAudio: TelegramSendAudioMethod;
  answerCallbackQuery: TelegramAnswerCallbackQueryMethod;
  answerWebAppQuery: TelegramAnswerWebAppQueryMethod;
  savePreparedInlineMessage: TelegramSavePreparedInlineMessageMethod;
  savePreparedKeyboardButton: TelegramSavePreparedKeyboardButtonMethod;
  answerInlineQuery: TelegramAnswerInlineQueryMethod;
  sendInvoice: TelegramSendInvoiceMethod;
  createInvoiceLink: TelegramCreateInvoiceLinkMethod;
  answerShippingQuery: TelegramAnswerShippingQueryMethod;
  answerPreCheckoutQuery: TelegramAnswerPreCheckoutQueryMethod;
  getMyStarBalance: TelegramGetMyStarBalanceMethod;
  getStarTransactions: TelegramGetStarTransactionsMethod;
  refundStarPayment: TelegramRefundStarPaymentMethod;
  editUserStarSubscription: TelegramEditUserStarSubscriptionMethod;
  sendSticker: TelegramSendStickerMethod;
  getStickerSet: TelegramGetStickerSetMethod;
  getCustomEmojiStickers: TelegramGetCustomEmojiStickersMethod;
  uploadStickerFile: TelegramUploadStickerFileMethod;
  createNewStickerSet: TelegramCreateNewStickerSetMethod;
  addStickerToSet: TelegramAddStickerToSetMethod;
  setStickerPositionInSet: TelegramSetStickerPositionInSetMethod;
  deleteStickerFromSet: TelegramDeleteStickerFromSetMethod;
  replaceStickerInSet: TelegramReplaceStickerInSetMethod;
  setStickerEmojiList: TelegramSetStickerEmojiListMethod;
  setStickerKeywords: TelegramSetStickerKeywordsMethod;
  setStickerMaskPosition: TelegramSetStickerMaskPositionMethod;
  setStickerSetTitle: TelegramSetStickerSetTitleMethod;
  setStickerSetThumbnail: TelegramSetStickerSetThumbnailMethod;
  setCustomEmojiStickerSetThumbnail: TelegramSetCustomEmojiStickerSetThumbnailMethod;
  deleteStickerSet: TelegramDeleteStickerSetMethod;
  getAvailableGifts: TelegramGetAvailableGiftsMethod;
  sendGift: TelegramSendGiftMethod;
  giftPremiumSubscription: TelegramGiftPremiumSubscriptionMethod;
  verifyUser: TelegramVerifyUserMethod;
  verifyChat: TelegramVerifyChatMethod;
  removeUserVerification: TelegramRemoveUserVerificationMethod;
  removeChatVerification: TelegramRemoveChatVerificationMethod;
  getUserGifts: TelegramGetUserGiftsMethod;
  getChatGifts: TelegramGetChatGiftsMethod;
  setUserEmojiStatus: TelegramSetUserEmojiStatusMethod;
  getBusinessConnection: TelegramGetBusinessConnectionMethod;
  readBusinessMessage: TelegramReadBusinessMessageMethod;
  deleteBusinessMessages: TelegramDeleteBusinessMessagesMethod;
  setBusinessAccountName: TelegramSetBusinessAccountNameMethod;
  setBusinessAccountUsername: TelegramSetBusinessAccountUsernameMethod;
  setBusinessAccountBio: TelegramSetBusinessAccountBioMethod;
  setBusinessAccountProfilePhoto: TelegramSetBusinessAccountProfilePhotoMethod;
  removeBusinessAccountProfilePhoto: TelegramRemoveBusinessAccountProfilePhotoMethod;
  setBusinessAccountGiftSettings: TelegramSetBusinessAccountGiftSettingsMethod;
  getBusinessAccountStarBalance: TelegramGetBusinessAccountStarBalanceMethod;
  transferBusinessAccountStars: TelegramTransferBusinessAccountStarsMethod;
  getBusinessAccountGifts: TelegramGetBusinessAccountGiftsMethod;
  convertGiftToStars: TelegramConvertGiftToStarsMethod;
  upgradeGift: TelegramUpgradeGiftMethod;
  transferGift: TelegramTransferGiftMethod;
  postStory: TelegramPostStoryMethod;
  repostStory: TelegramRepostStoryMethod;
  editStory: TelegramEditStoryMethod;
  deleteStory: TelegramDeleteStoryMethod;
  setPassportDataErrors: TelegramSetPassportDataErrorsMethod;
  sendGame: TelegramSendGameMethod;
  setGameScore: TelegramSetGameScoreMethod;
  getGameHighScores: TelegramGetGameHighScoresMethod;
}

export type TelegramPostNamespace = TelegramMethodMap;

export interface TelegramProvider extends TelegramMethodMap {
  post: TelegramPostNamespace;
}
