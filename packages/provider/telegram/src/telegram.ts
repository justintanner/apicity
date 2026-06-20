import { z } from "zod";

import { attachExamples } from "./example";
import { TelegramError } from "./types";
import type * as Telegram from "./types";
import {
  TelegramOptionsSchema,
  TelegramApproveSuggestedPostRequestSchema,
  TelegramDeclineSuggestedPostRequestSchema,
  TelegramGetUserProfileAudiosRequestSchema,
  TelegramGetUserProfilePhotosRequestSchema,
  TelegramRemoveMyProfilePhotoRequestSchema,
  TelegramSetMyProfilePhotoRequestSchema,
  TelegramAddStickerToSetRequestSchema,
  TelegramAnswerCallbackQueryRequestSchema,
  TelegramAnswerChatJoinRequestQueryRequestSchema,
  TelegramAnswerGuestQueryRequestSchema,
  TelegramAnswerInlineQueryRequestSchema,
  TelegramAnswerPreCheckoutQueryRequestSchema,
  TelegramAnswerShippingQueryRequestSchema,
  TelegramAnswerWebAppQueryRequestSchema,
  TelegramApproveChatJoinRequestRequestSchema,
  TelegramBanChatMemberRequestSchema,
  TelegramBanChatSenderChatRequestSchema,
  TelegramCloseRequestSchema,
  TelegramCloseForumTopicRequestSchema,
  TelegramCloseGeneralForumTopicRequestSchema,
  TelegramConvertGiftToStarsRequestSchema,
  TelegramCopyMessageRequestSchema,
  TelegramCopyMessagesRequestSchema,
  TelegramCreateChatInviteLinkRequestSchema,
  TelegramCreateChatSubscriptionInviteLinkRequestSchema,
  TelegramCreateForumTopicRequestSchema,
  TelegramCreateInvoiceLinkRequestSchema,
  TelegramCreateNewStickerSetRequestSchema,
  TelegramDeclineChatJoinRequestRequestSchema,
  TelegramDeleteAllMessageReactionsRequestSchema,
  TelegramDeleteBusinessMessagesRequestSchema,
  TelegramDeleteChatPhotoRequestSchema,
  TelegramDeleteChatStickerSetRequestSchema,
  TelegramDeleteForumTopicRequestSchema,
  TelegramDeleteMessageRequestSchema,
  TelegramDeleteMessageReactionRequestSchema,
  TelegramDeleteMessagesRequestSchema,
  TelegramDeleteMyCommandsRequestSchema,
  TelegramDeleteStickerFromSetRequestSchema,
  TelegramDeleteStickerSetRequestSchema,
  TelegramDeleteStoryRequestSchema,
  TelegramDeleteWebhookRequestSchema,
  TelegramEditChatInviteLinkRequestSchema,
  TelegramEditChatSubscriptionInviteLinkRequestSchema,
  TelegramEditForumTopicRequestSchema,
  TelegramEditGeneralForumTopicRequestSchema,
  TelegramEditMessageCaptionRequestSchema,
  TelegramEditMessageChecklistRequestSchema,
  TelegramEditMessageLiveLocationRequestSchema,
  TelegramEditMessageMediaRequestSchema,
  TelegramEditMessageReplyMarkupRequestSchema,
  TelegramEditMessageTextRequestSchema,
  TelegramEditStoryRequestSchema,
  TelegramEditUserStarSubscriptionRequestSchema,
  TelegramExportChatInviteLinkRequestSchema,
  TelegramForwardMessageRequestSchema,
  TelegramForwardMessagesRequestSchema,
  TelegramGetAvailableGiftsRequestSchema,
  TelegramGetBusinessAccountGiftsRequestSchema,
  TelegramGetBusinessAccountStarBalanceRequestSchema,
  TelegramGetBusinessConnectionRequestSchema,
  TelegramGetChatRequestSchema,
  TelegramGetChatAdministratorsRequestSchema,
  TelegramGetChatGiftsRequestSchema,
  TelegramGetChatMemberRequestSchema,
  TelegramGetChatMemberCountRequestSchema,
  TelegramGetChatMenuButtonRequestSchema,
  TelegramGetCustomEmojiStickersRequestSchema,
  TelegramGetFileRequestSchema,
  TelegramGetForumTopicIconStickersRequestSchema,
  TelegramGetGameHighScoresRequestSchema,
  TelegramGetManagedBotAccessSettingsRequestSchema,
  TelegramGetManagedBotTokenRequestSchema,
  TelegramGetMeRequestSchema,
  TelegramGetMyCommandsRequestSchema,
  TelegramGetMyDefaultAdministratorRightsRequestSchema,
  TelegramGetMyDescriptionRequestSchema,
  TelegramGetMyNameRequestSchema,
  TelegramGetMyShortDescriptionRequestSchema,
  TelegramGetMyStarBalanceRequestSchema,
  TelegramGetStarTransactionsRequestSchema,
  TelegramGetStickerSetRequestSchema,
  TelegramGetUpdatesRequestSchema,
  TelegramGetUserChatBoostsRequestSchema,
  TelegramGetUserGiftsRequestSchema,
  TelegramGetUserPersonalChatMessagesRequestSchema,
  TelegramGetWebhookInfoRequestSchema,
  TelegramGiftPremiumSubscriptionRequestSchema,
  TelegramHideGeneralForumTopicRequestSchema,
  TelegramLeaveChatRequestSchema,
  TelegramLogOutRequestSchema,
  TelegramPinChatMessageRequestSchema,
  TelegramPostStoryRequestSchema,
  TelegramPromoteChatMemberRequestSchema,
  TelegramReadBusinessMessageRequestSchema,
  TelegramRefundStarPaymentRequestSchema,
  TelegramRemoveBusinessAccountProfilePhotoRequestSchema,
  TelegramRemoveChatVerificationRequestSchema,
  TelegramRemoveUserVerificationRequestSchema,
  TelegramReopenForumTopicRequestSchema,
  TelegramReopenGeneralForumTopicRequestSchema,
  TelegramReplaceManagedBotTokenRequestSchema,
  TelegramReplaceStickerInSetRequestSchema,
  TelegramRepostStoryRequestSchema,
  TelegramRestrictChatMemberRequestSchema,
  TelegramRevokeChatInviteLinkRequestSchema,
  TelegramSavePreparedInlineMessageRequestSchema,
  TelegramSavePreparedKeyboardButtonRequestSchema,
  TelegramSendAnimationRequestSchema,
  TelegramSendAudioRequestSchema,
  TelegramSendChatActionRequestSchema,
  TelegramSendChatJoinRequestWebAppRequestSchema,
  TelegramSendChecklistRequestSchema,
  TelegramSendContactRequestSchema,
  TelegramSendDiceRequestSchema,
  TelegramSendDocumentRequestSchema,
  TelegramSendGameRequestSchema,
  TelegramSendGiftRequestSchema,
  TelegramSendInvoiceRequestSchema,
  TelegramSendLivePhotoRequestSchema,
  TelegramSendLocationRequestSchema,
  TelegramSendMediaGroupRequestSchema,
  TelegramSendMessageRequestSchema,
  TelegramSendMessageDraftRequestSchema,
  TelegramSendPaidMediaRequestSchema,
  TelegramSendPhotoRequestSchema,
  TelegramSendPollRequestSchema,
  TelegramSendRichMessageRequestSchema,
  TelegramSendRichMessageDraftRequestSchema,
  TelegramSendStickerRequestSchema,
  TelegramSendVenueRequestSchema,
  TelegramSendVideoRequestSchema,
  TelegramSendVideoNoteRequestSchema,
  TelegramSendVoiceRequestSchema,
  TelegramSetBusinessAccountBioRequestSchema,
  TelegramSetBusinessAccountGiftSettingsRequestSchema,
  TelegramSetBusinessAccountNameRequestSchema,
  TelegramSetBusinessAccountProfilePhotoRequestSchema,
  TelegramSetBusinessAccountUsernameRequestSchema,
  TelegramSetChatAdministratorCustomTitleRequestSchema,
  TelegramSetChatDescriptionRequestSchema,
  TelegramSetChatMemberTagRequestSchema,
  TelegramSetChatMenuButtonRequestSchema,
  TelegramSetChatPermissionsRequestSchema,
  TelegramSetChatPhotoRequestSchema,
  TelegramSetChatStickerSetRequestSchema,
  TelegramSetChatTitleRequestSchema,
  TelegramSetCustomEmojiStickerSetThumbnailRequestSchema,
  TelegramSetGameScoreRequestSchema,
  TelegramSetManagedBotAccessSettingsRequestSchema,
  TelegramSetMessageReactionRequestSchema,
  TelegramSetMyCommandsRequestSchema,
  TelegramSetMyDefaultAdministratorRightsRequestSchema,
  TelegramSetMyDescriptionRequestSchema,
  TelegramSetMyNameRequestSchema,
  TelegramSetMyShortDescriptionRequestSchema,
  TelegramSetPassportDataErrorsRequestSchema,
  TelegramSetStickerEmojiListRequestSchema,
  TelegramSetStickerKeywordsRequestSchema,
  TelegramSetStickerMaskPositionRequestSchema,
  TelegramSetStickerPositionInSetRequestSchema,
  TelegramSetStickerSetThumbnailRequestSchema,
  TelegramSetStickerSetTitleRequestSchema,
  TelegramSetUserEmojiStatusRequestSchema,
  TelegramSetWebhookRequestSchema,
  TelegramStopMessageLiveLocationRequestSchema,
  TelegramStopPollRequestSchema,
  TelegramTransferBusinessAccountStarsRequestSchema,
  TelegramTransferGiftRequestSchema,
  TelegramUnbanChatMemberRequestSchema,
  TelegramUnbanChatSenderChatRequestSchema,
  TelegramUnhideGeneralForumTopicRequestSchema,
  TelegramUnpinAllChatMessagesRequestSchema,
  TelegramUnpinAllForumTopicMessagesRequestSchema,
  TelegramUnpinAllGeneralForumTopicMessagesRequestSchema,
  TelegramUnpinChatMessageRequestSchema,
  TelegramUpgradeGiftRequestSchema,
  TelegramUploadStickerFileRequestSchema,
  TelegramVerifyChatRequestSchema,
  TelegramVerifyUserRequestSchema,
} from "./zod";

function encodeToken(token: string): string {
  return encodeURIComponent(token).replace(/%3A/gi, ":");
}

function hasBlob(value: unknown): boolean {
  if (value instanceof Blob) return true;
  if (Array.isArray(value)) return value.some(hasBlob);
  if (typeof value === "object" && value !== null) {
    return Object.values(value).some(hasBlob);
  }
  return false;
}

function attachmentName(path: Array<string | number>): string {
  return path
    .map((part) => String(part).replace(/[^A-Za-z0-9_]+/g, "_"))
    .filter(Boolean)
    .join("_");
}

function multipartJsonValue(
  form: FormData,
  value: unknown,
  path: Array<string | number>
): unknown {
  if (value === undefined) return undefined;
  if (value === null) return null;
  if (value instanceof Blob) {
    const name = attachmentName(path);
    form.append(name, value);
    return "attach://" + name;
  }
  if (Array.isArray(value)) {
    return value.map((item, index) =>
      multipartJsonValue(form, item, [...path, index])
    );
  }
  if (typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [key, item] of Object.entries(value)) {
      const encoded = multipartJsonValue(form, item, [...path, key]);
      if (encoded !== undefined) out[key] = encoded;
    }
    return out;
  }
  return value;
}

function appendFormField(form: FormData, key: string, value: unknown): void {
  if (value === undefined || value === null) return;
  if (value instanceof Blob) {
    form.append(key, value);
    return;
  }
  if (typeof value === "object") {
    form.append(key, JSON.stringify(multipartJsonValue(form, value, [key])));
    return;
  }
  form.append(key, String(value));
}

function toRequestBody(req: Record<string, unknown>): {
  body: BodyInit;
  headers?: Record<string, string>;
} {
  if (!hasBlob(req)) {
    return {
      body: JSON.stringify(req),
      headers: { "Content-Type": "application/json" },
    };
  }

  const form = new FormData();
  for (const [key, value] of Object.entries(req)) {
    appendFormField(form, key, value);
  }
  return { body: form };
}

function errorCode(body: unknown): string | undefined {
  if (typeof body === "object" && body !== null) {
    const code = (body as { error_code?: number }).error_code;
    if (typeof code === "number") return String(code);
  }
  return undefined;
}

function errorMessage(status: number, body: unknown): string {
  if (typeof body === "object" && body !== null) {
    const description = (body as { description?: unknown }).description;
    if (typeof description === "string" && description.length > 0) {
      return "Telegram API error " + status + ": " + description;
    }
  }
  return "Telegram API error: " + status;
}

export function createTelegram(
  opts: Telegram.TelegramOptions
): Telegram.TelegramProvider {
  const parsedOptions = TelegramOptionsSchema.parse(opts);
  const baseURL = (
    parsedOptions.baseURL ?? "https://api.telegram.org/bot{token}"
  ).replace("{token}", encodeToken(parsedOptions.botToken));
  const fetchImpl = parsedOptions.fetch ?? fetch;
  const timeout = parsedOptions.timeout ?? 30000;

  async function makeRequest<TResponse>(
    path: string,
    rawReq: unknown,
    signal: AbortSignal | undefined,
    schema: z.ZodType<unknown>
  ): Promise<TResponse> {
    const req = schema.parse(rawReq ?? {}) as Record<string, unknown>;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);
    const requestSignal = signal ?? controller.signal;

    try {
      const { body, headers } = toRequestBody(req);
      const res = await fetchImpl(baseURL + path, {
        method: "POST",
        headers,
        body,
        signal: requestSignal,
      });

      if (!res.ok) {
        let errorBody: unknown = null;
        try {
          errorBody = await res.json();
        } catch {
          errorBody = await res.text();
        }
        throw new TelegramError(
          errorMessage(res.status, errorBody),
          res.status,
          errorBody,
          errorCode(errorBody)
        );
      }

      return (await res.json()) as TResponse;
    } catch (error) {
      if (error instanceof TelegramError) throw error;
      throw new TelegramError("Telegram request failed: " + error, 500);
    } finally {
      clearTimeout(timeoutId);
    }
  }

  // sig-ok: `bot{token}` is Telegram's auth prefix, not a method namespace.
  // POST https://api.telegram.org/bot{token}/addStickerToSet
  // Docs: https://core.telegram.org/bots/api#addstickertoset
  const addStickerToSet: Telegram.TelegramAddStickerToSetMethod = Object.assign(
    async (
      req?: Telegram.TelegramAddStickerToSetRequest,
      signal?: AbortSignal
    ): Promise<Telegram.TelegramAddStickerToSetResponse> => {
      return makeRequest<Telegram.TelegramAddStickerToSetResponse>(
        "/addStickerToSet",
        req ?? {},
        signal,
        TelegramAddStickerToSetRequestSchema
      );
    },
    { schema: TelegramAddStickerToSetRequestSchema }
  );

  // sig-ok: `bot{token}` is Telegram's auth prefix, not a method namespace.
  // POST https://api.telegram.org/bot{token}/answerCallbackQuery
  // Docs: https://core.telegram.org/bots/api#answercallbackquery
  const answerCallbackQuery: Telegram.TelegramAnswerCallbackQueryMethod =
    Object.assign(
      async (
        req?: Telegram.TelegramAnswerCallbackQueryRequest,
        signal?: AbortSignal
      ): Promise<Telegram.TelegramAnswerCallbackQueryResponse> => {
        return makeRequest<Telegram.TelegramAnswerCallbackQueryResponse>(
          "/answerCallbackQuery",
          req ?? {},
          signal,
          TelegramAnswerCallbackQueryRequestSchema
        );
      },
      { schema: TelegramAnswerCallbackQueryRequestSchema }
    );

  // sig-ok: `bot{token}` is Telegram's auth prefix, not a method namespace.
  // POST https://api.telegram.org/bot{token}/answerChatJoinRequestQuery
  // Docs: https://core.telegram.org/bots/api#answerchatjoinrequestquery
  const answerChatJoinRequestQuery: Telegram.TelegramAnswerChatJoinRequestQueryMethod =
    Object.assign(
      async (
        req?: Telegram.TelegramAnswerChatJoinRequestQueryRequest,
        signal?: AbortSignal
      ): Promise<Telegram.TelegramAnswerChatJoinRequestQueryResponse> => {
        return makeRequest<Telegram.TelegramAnswerChatJoinRequestQueryResponse>(
          "/answerChatJoinRequestQuery",
          req ?? {},
          signal,
          TelegramAnswerChatJoinRequestQueryRequestSchema
        );
      },
      { schema: TelegramAnswerChatJoinRequestQueryRequestSchema }
    );

  // sig-ok: `bot{token}` is Telegram's auth prefix, not a method namespace.
  // POST https://api.telegram.org/bot{token}/answerGuestQuery
  // Docs: https://core.telegram.org/bots/api#answerguestquery
  const answerGuestQuery: Telegram.TelegramAnswerGuestQueryMethod =
    Object.assign(
      async (
        req?: Telegram.TelegramAnswerGuestQueryRequest,
        signal?: AbortSignal
      ): Promise<Telegram.TelegramAnswerGuestQueryResponse> => {
        return makeRequest<Telegram.TelegramAnswerGuestQueryResponse>(
          "/answerGuestQuery",
          req ?? {},
          signal,
          TelegramAnswerGuestQueryRequestSchema
        );
      },
      { schema: TelegramAnswerGuestQueryRequestSchema }
    );

  // sig-ok: `bot{token}` is Telegram's auth prefix, not a method namespace.
  // POST https://api.telegram.org/bot{token}/answerInlineQuery
  // Docs: https://core.telegram.org/bots/api#answerinlinequery
  const answerInlineQuery: Telegram.TelegramAnswerInlineQueryMethod =
    Object.assign(
      async (
        req?: Telegram.TelegramAnswerInlineQueryRequest,
        signal?: AbortSignal
      ): Promise<Telegram.TelegramAnswerInlineQueryResponse> => {
        return makeRequest<Telegram.TelegramAnswerInlineQueryResponse>(
          "/answerInlineQuery",
          req ?? {},
          signal,
          TelegramAnswerInlineQueryRequestSchema
        );
      },
      { schema: TelegramAnswerInlineQueryRequestSchema }
    );

  // sig-ok: `bot{token}` is Telegram's auth prefix, not a method namespace.
  // POST https://api.telegram.org/bot{token}/answerPreCheckoutQuery
  // Docs: https://core.telegram.org/bots/api#answerprecheckoutquery
  const answerPreCheckoutQuery: Telegram.TelegramAnswerPreCheckoutQueryMethod =
    Object.assign(
      async (
        req?: Telegram.TelegramAnswerPreCheckoutQueryRequest,
        signal?: AbortSignal
      ): Promise<Telegram.TelegramAnswerPreCheckoutQueryResponse> => {
        return makeRequest<Telegram.TelegramAnswerPreCheckoutQueryResponse>(
          "/answerPreCheckoutQuery",
          req ?? {},
          signal,
          TelegramAnswerPreCheckoutQueryRequestSchema
        );
      },
      { schema: TelegramAnswerPreCheckoutQueryRequestSchema }
    );

  // sig-ok: `bot{token}` is Telegram's auth prefix, not a method namespace.
  // POST https://api.telegram.org/bot{token}/answerShippingQuery
  // Docs: https://core.telegram.org/bots/api#answershippingquery
  const answerShippingQuery: Telegram.TelegramAnswerShippingQueryMethod =
    Object.assign(
      async (
        req?: Telegram.TelegramAnswerShippingQueryRequest,
        signal?: AbortSignal
      ): Promise<Telegram.TelegramAnswerShippingQueryResponse> => {
        return makeRequest<Telegram.TelegramAnswerShippingQueryResponse>(
          "/answerShippingQuery",
          req ?? {},
          signal,
          TelegramAnswerShippingQueryRequestSchema
        );
      },
      { schema: TelegramAnswerShippingQueryRequestSchema }
    );

  // sig-ok: `bot{token}` is Telegram's auth prefix, not a method namespace.
  // POST https://api.telegram.org/bot{token}/answerWebAppQuery
  // Docs: https://core.telegram.org/bots/api#answerwebappquery
  const answerWebAppQuery: Telegram.TelegramAnswerWebAppQueryMethod =
    Object.assign(
      async (
        req?: Telegram.TelegramAnswerWebAppQueryRequest,
        signal?: AbortSignal
      ): Promise<Telegram.TelegramAnswerWebAppQueryResponse> => {
        return makeRequest<Telegram.TelegramAnswerWebAppQueryResponse>(
          "/answerWebAppQuery",
          req ?? {},
          signal,
          TelegramAnswerWebAppQueryRequestSchema
        );
      },
      { schema: TelegramAnswerWebAppQueryRequestSchema }
    );

  // sig-ok: `bot{token}` is Telegram's auth prefix, not a method namespace.
  // POST https://api.telegram.org/bot{token}/approveChatJoinRequest
  // Docs: https://core.telegram.org/bots/api#approvechatjoinrequest
  const approveChatJoinRequest: Telegram.TelegramApproveChatJoinRequestMethod =
    Object.assign(
      async (
        req?: Telegram.TelegramApproveChatJoinRequestRequest,
        signal?: AbortSignal
      ): Promise<Telegram.TelegramApproveChatJoinRequestResponse> => {
        return makeRequest<Telegram.TelegramApproveChatJoinRequestResponse>(
          "/approveChatJoinRequest",
          req ?? {},
          signal,
          TelegramApproveChatJoinRequestRequestSchema
        );
      },
      { schema: TelegramApproveChatJoinRequestRequestSchema }
    );

  // sig-ok: `bot{token}` is Telegram's auth prefix, not a method namespace.
  // POST https://api.telegram.org/bot{token}/banChatMember
  // Docs: https://core.telegram.org/bots/api#banchatmember
  const banChatMember: Telegram.TelegramBanChatMemberMethod = Object.assign(
    async (
      req?: Telegram.TelegramBanChatMemberRequest,
      signal?: AbortSignal
    ): Promise<Telegram.TelegramBanChatMemberResponse> => {
      return makeRequest<Telegram.TelegramBanChatMemberResponse>(
        "/banChatMember",
        req ?? {},
        signal,
        TelegramBanChatMemberRequestSchema
      );
    },
    { schema: TelegramBanChatMemberRequestSchema }
  );

  // sig-ok: `bot{token}` is Telegram's auth prefix, not a method namespace.
  // POST https://api.telegram.org/bot{token}/banChatSenderChat
  // Docs: https://core.telegram.org/bots/api#banchatsenderchat
  const banChatSenderChat: Telegram.TelegramBanChatSenderChatMethod =
    Object.assign(
      async (
        req?: Telegram.TelegramBanChatSenderChatRequest,
        signal?: AbortSignal
      ): Promise<Telegram.TelegramBanChatSenderChatResponse> => {
        return makeRequest<Telegram.TelegramBanChatSenderChatResponse>(
          "/banChatSenderChat",
          req ?? {},
          signal,
          TelegramBanChatSenderChatRequestSchema
        );
      },
      { schema: TelegramBanChatSenderChatRequestSchema }
    );

  // sig-ok: `bot{token}` is Telegram's auth prefix, not a method namespace.
  // POST https://api.telegram.org/bot{token}/close
  // Docs: https://core.telegram.org/bots/api#close
  const close: Telegram.TelegramCloseMethod = Object.assign(
    async (
      req?: Telegram.TelegramCloseRequest,
      signal?: AbortSignal
    ): Promise<Telegram.TelegramCloseResponse> => {
      return makeRequest<Telegram.TelegramCloseResponse>(
        "/close",
        req ?? {},
        signal,
        TelegramCloseRequestSchema
      );
    },
    { schema: TelegramCloseRequestSchema }
  );

  // sig-ok: `bot{token}` is Telegram's auth prefix, not a method namespace.
  // POST https://api.telegram.org/bot{token}/closeForumTopic
  // Docs: https://core.telegram.org/bots/api#closeforumtopic
  const closeForumTopic: Telegram.TelegramCloseForumTopicMethod = Object.assign(
    async (
      req?: Telegram.TelegramCloseForumTopicRequest,
      signal?: AbortSignal
    ): Promise<Telegram.TelegramCloseForumTopicResponse> => {
      return makeRequest<Telegram.TelegramCloseForumTopicResponse>(
        "/closeForumTopic",
        req ?? {},
        signal,
        TelegramCloseForumTopicRequestSchema
      );
    },
    { schema: TelegramCloseForumTopicRequestSchema }
  );

  // sig-ok: `bot{token}` is Telegram's auth prefix, not a method namespace.
  // POST https://api.telegram.org/bot{token}/closeGeneralForumTopic
  // Docs: https://core.telegram.org/bots/api#closegeneralforumtopic
  const closeGeneralForumTopic: Telegram.TelegramCloseGeneralForumTopicMethod =
    Object.assign(
      async (
        req?: Telegram.TelegramCloseGeneralForumTopicRequest,
        signal?: AbortSignal
      ): Promise<Telegram.TelegramCloseGeneralForumTopicResponse> => {
        return makeRequest<Telegram.TelegramCloseGeneralForumTopicResponse>(
          "/closeGeneralForumTopic",
          req ?? {},
          signal,
          TelegramCloseGeneralForumTopicRequestSchema
        );
      },
      { schema: TelegramCloseGeneralForumTopicRequestSchema }
    );

  // sig-ok: `bot{token}` is Telegram's auth prefix, not a method namespace.
  // POST https://api.telegram.org/bot{token}/convertGiftToStars
  // Docs: https://core.telegram.org/bots/api#convertgifttostars
  const convertGiftToStars: Telegram.TelegramConvertGiftToStarsMethod =
    Object.assign(
      async (
        req?: Telegram.TelegramConvertGiftToStarsRequest,
        signal?: AbortSignal
      ): Promise<Telegram.TelegramConvertGiftToStarsResponse> => {
        return makeRequest<Telegram.TelegramConvertGiftToStarsResponse>(
          "/convertGiftToStars",
          req ?? {},
          signal,
          TelegramConvertGiftToStarsRequestSchema
        );
      },
      { schema: TelegramConvertGiftToStarsRequestSchema }
    );

  // sig-ok: `bot{token}` is Telegram's auth prefix, not a method namespace.
  // POST https://api.telegram.org/bot{token}/copyMessage
  // Docs: https://core.telegram.org/bots/api#copymessage
  const copyMessage: Telegram.TelegramCopyMessageMethod = Object.assign(
    async (
      req?: Telegram.TelegramCopyMessageRequest,
      signal?: AbortSignal
    ): Promise<Telegram.TelegramCopyMessageResponse> => {
      return makeRequest<Telegram.TelegramCopyMessageResponse>(
        "/copyMessage",
        req ?? {},
        signal,
        TelegramCopyMessageRequestSchema
      );
    },
    { schema: TelegramCopyMessageRequestSchema }
  );

  // sig-ok: `bot{token}` is Telegram's auth prefix, not a method namespace.
  // POST https://api.telegram.org/bot{token}/copyMessages
  // Docs: https://core.telegram.org/bots/api#copymessages
  const copyMessages: Telegram.TelegramCopyMessagesMethod = Object.assign(
    async (
      req?: Telegram.TelegramCopyMessagesRequest,
      signal?: AbortSignal
    ): Promise<Telegram.TelegramCopyMessagesResponse> => {
      return makeRequest<Telegram.TelegramCopyMessagesResponse>(
        "/copyMessages",
        req ?? {},
        signal,
        TelegramCopyMessagesRequestSchema
      );
    },
    { schema: TelegramCopyMessagesRequestSchema }
  );

  // sig-ok: `bot{token}` is Telegram's auth prefix, not a method namespace.
  // POST https://api.telegram.org/bot{token}/createChatInviteLink
  // Docs: https://core.telegram.org/bots/api#createchatinvitelink
  const createChatInviteLink: Telegram.TelegramCreateChatInviteLinkMethod =
    Object.assign(
      async (
        req?: Telegram.TelegramCreateChatInviteLinkRequest,
        signal?: AbortSignal
      ): Promise<Telegram.TelegramCreateChatInviteLinkResponse> => {
        return makeRequest<Telegram.TelegramCreateChatInviteLinkResponse>(
          "/createChatInviteLink",
          req ?? {},
          signal,
          TelegramCreateChatInviteLinkRequestSchema
        );
      },
      { schema: TelegramCreateChatInviteLinkRequestSchema }
    );

  // sig-ok: `bot{token}` is Telegram's auth prefix, not a method namespace.
  // POST https://api.telegram.org/bot{token}/createChatSubscriptionInviteLink
  // Docs: https://core.telegram.org/bots/api#createchatsubscriptioninvitelink
  const createChatSubscriptionInviteLink: Telegram.TelegramCreateChatSubscriptionInviteLinkMethod =
    Object.assign(
      async (
        req?: Telegram.TelegramCreateChatSubscriptionInviteLinkRequest,
        signal?: AbortSignal
      ): Promise<Telegram.TelegramCreateChatSubscriptionInviteLinkResponse> => {
        return makeRequest<Telegram.TelegramCreateChatSubscriptionInviteLinkResponse>(
          "/createChatSubscriptionInviteLink",
          req ?? {},
          signal,
          TelegramCreateChatSubscriptionInviteLinkRequestSchema
        );
      },
      { schema: TelegramCreateChatSubscriptionInviteLinkRequestSchema }
    );

  // sig-ok: `bot{token}` is Telegram's auth prefix, not a method namespace.
  // POST https://api.telegram.org/bot{token}/createForumTopic
  // Docs: https://core.telegram.org/bots/api#createforumtopic
  const createForumTopic: Telegram.TelegramCreateForumTopicMethod =
    Object.assign(
      async (
        req?: Telegram.TelegramCreateForumTopicRequest,
        signal?: AbortSignal
      ): Promise<Telegram.TelegramCreateForumTopicResponse> => {
        return makeRequest<Telegram.TelegramCreateForumTopicResponse>(
          "/createForumTopic",
          req ?? {},
          signal,
          TelegramCreateForumTopicRequestSchema
        );
      },
      { schema: TelegramCreateForumTopicRequestSchema }
    );

  // sig-ok: `bot{token}` is Telegram's auth prefix, not a method namespace.
  // POST https://api.telegram.org/bot{token}/createInvoiceLink
  // Docs: https://core.telegram.org/bots/api#createinvoicelink
  const createInvoiceLink: Telegram.TelegramCreateInvoiceLinkMethod =
    Object.assign(
      async (
        req?: Telegram.TelegramCreateInvoiceLinkRequest,
        signal?: AbortSignal
      ): Promise<Telegram.TelegramCreateInvoiceLinkResponse> => {
        return makeRequest<Telegram.TelegramCreateInvoiceLinkResponse>(
          "/createInvoiceLink",
          req ?? {},
          signal,
          TelegramCreateInvoiceLinkRequestSchema
        );
      },
      { schema: TelegramCreateInvoiceLinkRequestSchema }
    );

  // sig-ok: `bot{token}` is Telegram's auth prefix, not a method namespace.
  // POST https://api.telegram.org/bot{token}/createNewStickerSet
  // Docs: https://core.telegram.org/bots/api#createnewstickerset
  const createNewStickerSet: Telegram.TelegramCreateNewStickerSetMethod =
    Object.assign(
      async (
        req?: Telegram.TelegramCreateNewStickerSetRequest,
        signal?: AbortSignal
      ): Promise<Telegram.TelegramCreateNewStickerSetResponse> => {
        return makeRequest<Telegram.TelegramCreateNewStickerSetResponse>(
          "/createNewStickerSet",
          req ?? {},
          signal,
          TelegramCreateNewStickerSetRequestSchema
        );
      },
      { schema: TelegramCreateNewStickerSetRequestSchema }
    );

  // sig-ok: `bot{token}` is Telegram's auth prefix, not a method namespace.
  // POST https://api.telegram.org/bot{token}/declineChatJoinRequest
  // Docs: https://core.telegram.org/bots/api#declinechatjoinrequest
  const declineChatJoinRequest: Telegram.TelegramDeclineChatJoinRequestMethod =
    Object.assign(
      async (
        req?: Telegram.TelegramDeclineChatJoinRequestRequest,
        signal?: AbortSignal
      ): Promise<Telegram.TelegramDeclineChatJoinRequestResponse> => {
        return makeRequest<Telegram.TelegramDeclineChatJoinRequestResponse>(
          "/declineChatJoinRequest",
          req ?? {},
          signal,
          TelegramDeclineChatJoinRequestRequestSchema
        );
      },
      { schema: TelegramDeclineChatJoinRequestRequestSchema }
    );

  // sig-ok: `bot{token}` is Telegram's auth prefix, not a method namespace.
  // POST https://api.telegram.org/bot{token}/deleteAllMessageReactions
  // Docs: https://core.telegram.org/bots/api#deleteallmessagereactions
  const deleteAllMessageReactions: Telegram.TelegramDeleteAllMessageReactionsMethod =
    Object.assign(
      async (
        req?: Telegram.TelegramDeleteAllMessageReactionsRequest,
        signal?: AbortSignal
      ): Promise<Telegram.TelegramDeleteAllMessageReactionsResponse> => {
        return makeRequest<Telegram.TelegramDeleteAllMessageReactionsResponse>(
          "/deleteAllMessageReactions",
          req ?? {},
          signal,
          TelegramDeleteAllMessageReactionsRequestSchema
        );
      },
      { schema: TelegramDeleteAllMessageReactionsRequestSchema }
    );

  // sig-ok: `bot{token}` is Telegram's auth prefix, not a method namespace.
  // POST https://api.telegram.org/bot{token}/deleteBusinessMessages
  // Docs: https://core.telegram.org/bots/api#deletebusinessmessages
  const deleteBusinessMessages: Telegram.TelegramDeleteBusinessMessagesMethod =
    Object.assign(
      async (
        req?: Telegram.TelegramDeleteBusinessMessagesRequest,
        signal?: AbortSignal
      ): Promise<Telegram.TelegramDeleteBusinessMessagesResponse> => {
        return makeRequest<Telegram.TelegramDeleteBusinessMessagesResponse>(
          "/deleteBusinessMessages",
          req ?? {},
          signal,
          TelegramDeleteBusinessMessagesRequestSchema
        );
      },
      { schema: TelegramDeleteBusinessMessagesRequestSchema }
    );

  // sig-ok: `bot{token}` is Telegram's auth prefix, not a method namespace.
  // POST https://api.telegram.org/bot{token}/deleteChatPhoto
  // Docs: https://core.telegram.org/bots/api#deletechatphoto
  const deleteChatPhoto: Telegram.TelegramDeleteChatPhotoMethod = Object.assign(
    async (
      req?: Telegram.TelegramDeleteChatPhotoRequest,
      signal?: AbortSignal
    ): Promise<Telegram.TelegramDeleteChatPhotoResponse> => {
      return makeRequest<Telegram.TelegramDeleteChatPhotoResponse>(
        "/deleteChatPhoto",
        req ?? {},
        signal,
        TelegramDeleteChatPhotoRequestSchema
      );
    },
    { schema: TelegramDeleteChatPhotoRequestSchema }
  );

  // sig-ok: `bot{token}` is Telegram's auth prefix, not a method namespace.
  // POST https://api.telegram.org/bot{token}/deleteChatStickerSet
  // Docs: https://core.telegram.org/bots/api#deletechatstickerset
  const deleteChatStickerSet: Telegram.TelegramDeleteChatStickerSetMethod =
    Object.assign(
      async (
        req?: Telegram.TelegramDeleteChatStickerSetRequest,
        signal?: AbortSignal
      ): Promise<Telegram.TelegramDeleteChatStickerSetResponse> => {
        return makeRequest<Telegram.TelegramDeleteChatStickerSetResponse>(
          "/deleteChatStickerSet",
          req ?? {},
          signal,
          TelegramDeleteChatStickerSetRequestSchema
        );
      },
      { schema: TelegramDeleteChatStickerSetRequestSchema }
    );

  // sig-ok: `bot{token}` is Telegram's auth prefix, not a method namespace.
  // POST https://api.telegram.org/bot{token}/deleteForumTopic
  // Docs: https://core.telegram.org/bots/api#deleteforumtopic
  const deleteForumTopic: Telegram.TelegramDeleteForumTopicMethod =
    Object.assign(
      async (
        req?: Telegram.TelegramDeleteForumTopicRequest,
        signal?: AbortSignal
      ): Promise<Telegram.TelegramDeleteForumTopicResponse> => {
        return makeRequest<Telegram.TelegramDeleteForumTopicResponse>(
          "/deleteForumTopic",
          req ?? {},
          signal,
          TelegramDeleteForumTopicRequestSchema
        );
      },
      { schema: TelegramDeleteForumTopicRequestSchema }
    );

  // sig-ok: `bot{token}` is Telegram's auth prefix, not a method namespace.
  // POST https://api.telegram.org/bot{token}/deleteMessage
  // Docs: https://core.telegram.org/bots/api#deletemessage
  const deleteMessage: Telegram.TelegramDeleteMessageMethod = Object.assign(
    async (
      req?: Telegram.TelegramDeleteMessageRequest,
      signal?: AbortSignal
    ): Promise<Telegram.TelegramDeleteMessageResponse> => {
      return makeRequest<Telegram.TelegramDeleteMessageResponse>(
        "/deleteMessage",
        req ?? {},
        signal,
        TelegramDeleteMessageRequestSchema
      );
    },
    { schema: TelegramDeleteMessageRequestSchema }
  );

  // sig-ok: `bot{token}` is Telegram's auth prefix, not a method namespace.
  // POST https://api.telegram.org/bot{token}/deleteMessageReaction
  // Docs: https://core.telegram.org/bots/api#deletemessagereaction
  const deleteMessageReaction: Telegram.TelegramDeleteMessageReactionMethod =
    Object.assign(
      async (
        req?: Telegram.TelegramDeleteMessageReactionRequest,
        signal?: AbortSignal
      ): Promise<Telegram.TelegramDeleteMessageReactionResponse> => {
        return makeRequest<Telegram.TelegramDeleteMessageReactionResponse>(
          "/deleteMessageReaction",
          req ?? {},
          signal,
          TelegramDeleteMessageReactionRequestSchema
        );
      },
      { schema: TelegramDeleteMessageReactionRequestSchema }
    );

  // sig-ok: `bot{token}` is Telegram's auth prefix, not a method namespace.
  // POST https://api.telegram.org/bot{token}/deleteMessages
  // Docs: https://core.telegram.org/bots/api#deletemessages
  const deleteMessages: Telegram.TelegramDeleteMessagesMethod = Object.assign(
    async (
      req?: Telegram.TelegramDeleteMessagesRequest,
      signal?: AbortSignal
    ): Promise<Telegram.TelegramDeleteMessagesResponse> => {
      return makeRequest<Telegram.TelegramDeleteMessagesResponse>(
        "/deleteMessages",
        req ?? {},
        signal,
        TelegramDeleteMessagesRequestSchema
      );
    },
    { schema: TelegramDeleteMessagesRequestSchema }
  );

  // sig-ok: `bot{token}` is Telegram's auth prefix, not a method namespace.
  // POST https://api.telegram.org/bot{token}/deleteMyCommands
  // Docs: https://core.telegram.org/bots/api#deletemycommands
  const deleteMyCommands: Telegram.TelegramDeleteMyCommandsMethod =
    Object.assign(
      async (
        req?: Telegram.TelegramDeleteMyCommandsRequest,
        signal?: AbortSignal
      ): Promise<Telegram.TelegramDeleteMyCommandsResponse> => {
        return makeRequest<Telegram.TelegramDeleteMyCommandsResponse>(
          "/deleteMyCommands",
          req ?? {},
          signal,
          TelegramDeleteMyCommandsRequestSchema
        );
      },
      { schema: TelegramDeleteMyCommandsRequestSchema }
    );

  // sig-ok: `bot{token}` is Telegram's auth prefix, not a method namespace.
  // POST https://api.telegram.org/bot{token}/deleteStickerFromSet
  // Docs: https://core.telegram.org/bots/api#deletestickerfromset
  const deleteStickerFromSet: Telegram.TelegramDeleteStickerFromSetMethod =
    Object.assign(
      async (
        req?: Telegram.TelegramDeleteStickerFromSetRequest,
        signal?: AbortSignal
      ): Promise<Telegram.TelegramDeleteStickerFromSetResponse> => {
        return makeRequest<Telegram.TelegramDeleteStickerFromSetResponse>(
          "/deleteStickerFromSet",
          req ?? {},
          signal,
          TelegramDeleteStickerFromSetRequestSchema
        );
      },
      { schema: TelegramDeleteStickerFromSetRequestSchema }
    );

  // sig-ok: `bot{token}` is Telegram's auth prefix, not a method namespace.
  // POST https://api.telegram.org/bot{token}/deleteStickerSet
  // Docs: https://core.telegram.org/bots/api#deletestickerset
  const deleteStickerSet: Telegram.TelegramDeleteStickerSetMethod =
    Object.assign(
      async (
        req?: Telegram.TelegramDeleteStickerSetRequest,
        signal?: AbortSignal
      ): Promise<Telegram.TelegramDeleteStickerSetResponse> => {
        return makeRequest<Telegram.TelegramDeleteStickerSetResponse>(
          "/deleteStickerSet",
          req ?? {},
          signal,
          TelegramDeleteStickerSetRequestSchema
        );
      },
      { schema: TelegramDeleteStickerSetRequestSchema }
    );

  // sig-ok: `bot{token}` is Telegram's auth prefix, not a method namespace.
  // POST https://api.telegram.org/bot{token}/deleteStory
  // Docs: https://core.telegram.org/bots/api#deletestory
  const deleteStory: Telegram.TelegramDeleteStoryMethod = Object.assign(
    async (
      req?: Telegram.TelegramDeleteStoryRequest,
      signal?: AbortSignal
    ): Promise<Telegram.TelegramDeleteStoryResponse> => {
      return makeRequest<Telegram.TelegramDeleteStoryResponse>(
        "/deleteStory",
        req ?? {},
        signal,
        TelegramDeleteStoryRequestSchema
      );
    },
    { schema: TelegramDeleteStoryRequestSchema }
  );

  // sig-ok: `bot{token}` is Telegram's auth prefix, not a method namespace.
  // POST https://api.telegram.org/bot{token}/deleteWebhook
  // Docs: https://core.telegram.org/bots/api#deletewebhook
  const deleteWebhook: Telegram.TelegramDeleteWebhookMethod = Object.assign(
    async (
      req?: Telegram.TelegramDeleteWebhookRequest,
      signal?: AbortSignal
    ): Promise<Telegram.TelegramDeleteWebhookResponse> => {
      return makeRequest<Telegram.TelegramDeleteWebhookResponse>(
        "/deleteWebhook",
        req ?? {},
        signal,
        TelegramDeleteWebhookRequestSchema
      );
    },
    { schema: TelegramDeleteWebhookRequestSchema }
  );

  // sig-ok: `bot{token}` is Telegram's auth prefix, not a method namespace.
  // POST https://api.telegram.org/bot{token}/editChatInviteLink
  // Docs: https://core.telegram.org/bots/api#editchatinvitelink
  const editChatInviteLink: Telegram.TelegramEditChatInviteLinkMethod =
    Object.assign(
      async (
        req?: Telegram.TelegramEditChatInviteLinkRequest,
        signal?: AbortSignal
      ): Promise<Telegram.TelegramEditChatInviteLinkResponse> => {
        return makeRequest<Telegram.TelegramEditChatInviteLinkResponse>(
          "/editChatInviteLink",
          req ?? {},
          signal,
          TelegramEditChatInviteLinkRequestSchema
        );
      },
      { schema: TelegramEditChatInviteLinkRequestSchema }
    );

  // sig-ok: `bot{token}` is Telegram's auth prefix, not a method namespace.
  // POST https://api.telegram.org/bot{token}/editChatSubscriptionInviteLink
  // Docs: https://core.telegram.org/bots/api#editchatsubscriptioninvitelink
  const editChatSubscriptionInviteLink: Telegram.TelegramEditChatSubscriptionInviteLinkMethod =
    Object.assign(
      async (
        req?: Telegram.TelegramEditChatSubscriptionInviteLinkRequest,
        signal?: AbortSignal
      ): Promise<Telegram.TelegramEditChatSubscriptionInviteLinkResponse> => {
        return makeRequest<Telegram.TelegramEditChatSubscriptionInviteLinkResponse>(
          "/editChatSubscriptionInviteLink",
          req ?? {},
          signal,
          TelegramEditChatSubscriptionInviteLinkRequestSchema
        );
      },
      { schema: TelegramEditChatSubscriptionInviteLinkRequestSchema }
    );

  // sig-ok: `bot{token}` is Telegram's auth prefix, not a method namespace.
  // POST https://api.telegram.org/bot{token}/editForumTopic
  // Docs: https://core.telegram.org/bots/api#editforumtopic
  const editForumTopic: Telegram.TelegramEditForumTopicMethod = Object.assign(
    async (
      req?: Telegram.TelegramEditForumTopicRequest,
      signal?: AbortSignal
    ): Promise<Telegram.TelegramEditForumTopicResponse> => {
      return makeRequest<Telegram.TelegramEditForumTopicResponse>(
        "/editForumTopic",
        req ?? {},
        signal,
        TelegramEditForumTopicRequestSchema
      );
    },
    { schema: TelegramEditForumTopicRequestSchema }
  );

  // sig-ok: `bot{token}` is Telegram's auth prefix, not a method namespace.
  // POST https://api.telegram.org/bot{token}/editGeneralForumTopic
  // Docs: https://core.telegram.org/bots/api#editgeneralforumtopic
  const editGeneralForumTopic: Telegram.TelegramEditGeneralForumTopicMethod =
    Object.assign(
      async (
        req?: Telegram.TelegramEditGeneralForumTopicRequest,
        signal?: AbortSignal
      ): Promise<Telegram.TelegramEditGeneralForumTopicResponse> => {
        return makeRequest<Telegram.TelegramEditGeneralForumTopicResponse>(
          "/editGeneralForumTopic",
          req ?? {},
          signal,
          TelegramEditGeneralForumTopicRequestSchema
        );
      },
      { schema: TelegramEditGeneralForumTopicRequestSchema }
    );

  // sig-ok: `bot{token}` is Telegram's auth prefix, not a method namespace.
  // POST https://api.telegram.org/bot{token}/editMessageCaption
  // Docs: https://core.telegram.org/bots/api#editmessagecaption
  const editMessageCaption: Telegram.TelegramEditMessageCaptionMethod =
    Object.assign(
      async (
        req?: Telegram.TelegramEditMessageCaptionRequest,
        signal?: AbortSignal
      ): Promise<Telegram.TelegramEditMessageCaptionResponse> => {
        return makeRequest<Telegram.TelegramEditMessageCaptionResponse>(
          "/editMessageCaption",
          req ?? {},
          signal,
          TelegramEditMessageCaptionRequestSchema
        );
      },
      { schema: TelegramEditMessageCaptionRequestSchema }
    );

  // sig-ok: `bot{token}` is Telegram's auth prefix, not a method namespace.
  // POST https://api.telegram.org/bot{token}/editMessageChecklist
  // Docs: https://core.telegram.org/bots/api#editmessagechecklist
  const editMessageChecklist: Telegram.TelegramEditMessageChecklistMethod =
    Object.assign(
      async (
        req?: Telegram.TelegramEditMessageChecklistRequest,
        signal?: AbortSignal
      ): Promise<Telegram.TelegramEditMessageChecklistResponse> => {
        return makeRequest<Telegram.TelegramEditMessageChecklistResponse>(
          "/editMessageChecklist",
          req ?? {},
          signal,
          TelegramEditMessageChecklistRequestSchema
        );
      },
      { schema: TelegramEditMessageChecklistRequestSchema }
    );

  // sig-ok: `bot{token}` is Telegram's auth prefix, not a method namespace.
  // POST https://api.telegram.org/bot{token}/editMessageLiveLocation
  // Docs: https://core.telegram.org/bots/api#editmessagelivelocation
  const editMessageLiveLocation: Telegram.TelegramEditMessageLiveLocationMethod =
    Object.assign(
      async (
        req?: Telegram.TelegramEditMessageLiveLocationRequest,
        signal?: AbortSignal
      ): Promise<Telegram.TelegramEditMessageLiveLocationResponse> => {
        return makeRequest<Telegram.TelegramEditMessageLiveLocationResponse>(
          "/editMessageLiveLocation",
          req ?? {},
          signal,
          TelegramEditMessageLiveLocationRequestSchema
        );
      },
      { schema: TelegramEditMessageLiveLocationRequestSchema }
    );

  // sig-ok: `bot{token}` is Telegram's auth prefix, not a method namespace.
  // POST https://api.telegram.org/bot{token}/editMessageMedia
  // Docs: https://core.telegram.org/bots/api#editmessagemedia
  const editMessageMedia: Telegram.TelegramEditMessageMediaMethod =
    Object.assign(
      async (
        req?: Telegram.TelegramEditMessageMediaRequest,
        signal?: AbortSignal
      ): Promise<Telegram.TelegramEditMessageMediaResponse> => {
        return makeRequest<Telegram.TelegramEditMessageMediaResponse>(
          "/editMessageMedia",
          req ?? {},
          signal,
          TelegramEditMessageMediaRequestSchema
        );
      },
      { schema: TelegramEditMessageMediaRequestSchema }
    );

  // sig-ok: `bot{token}` is Telegram's auth prefix, not a method namespace.
  // POST https://api.telegram.org/bot{token}/editMessageReplyMarkup
  // Docs: https://core.telegram.org/bots/api#editmessagereplymarkup
  const editMessageReplyMarkup: Telegram.TelegramEditMessageReplyMarkupMethod =
    Object.assign(
      async (
        req?: Telegram.TelegramEditMessageReplyMarkupRequest,
        signal?: AbortSignal
      ): Promise<Telegram.TelegramEditMessageReplyMarkupResponse> => {
        return makeRequest<Telegram.TelegramEditMessageReplyMarkupResponse>(
          "/editMessageReplyMarkup",
          req ?? {},
          signal,
          TelegramEditMessageReplyMarkupRequestSchema
        );
      },
      { schema: TelegramEditMessageReplyMarkupRequestSchema }
    );

  // sig-ok: `bot{token}` is Telegram's auth prefix, not a method namespace.
  // POST https://api.telegram.org/bot{token}/editMessageText
  // Docs: https://core.telegram.org/bots/api#editmessagetext
  const editMessageText: Telegram.TelegramEditMessageTextMethod = Object.assign(
    async (
      req?: Telegram.TelegramEditMessageTextRequest,
      signal?: AbortSignal
    ): Promise<Telegram.TelegramEditMessageTextResponse> => {
      return makeRequest<Telegram.TelegramEditMessageTextResponse>(
        "/editMessageText",
        req ?? {},
        signal,
        TelegramEditMessageTextRequestSchema
      );
    },
    { schema: TelegramEditMessageTextRequestSchema }
  );

  // sig-ok: `bot{token}` is Telegram's auth prefix, not a method namespace.
  // POST https://api.telegram.org/bot{token}/editStory
  // Docs: https://core.telegram.org/bots/api#editstory
  const editStory: Telegram.TelegramEditStoryMethod = Object.assign(
    async (
      req?: Telegram.TelegramEditStoryRequest,
      signal?: AbortSignal
    ): Promise<Telegram.TelegramEditStoryResponse> => {
      return makeRequest<Telegram.TelegramEditStoryResponse>(
        "/editStory",
        req ?? {},
        signal,
        TelegramEditStoryRequestSchema
      );
    },
    { schema: TelegramEditStoryRequestSchema }
  );

  // sig-ok: `bot{token}` is Telegram's auth prefix, not a method namespace.
  // POST https://api.telegram.org/bot{token}/editUserStarSubscription
  // Docs: https://core.telegram.org/bots/api#edituserstarsubscription
  const editUserStarSubscription: Telegram.TelegramEditUserStarSubscriptionMethod =
    Object.assign(
      async (
        req?: Telegram.TelegramEditUserStarSubscriptionRequest,
        signal?: AbortSignal
      ): Promise<Telegram.TelegramEditUserStarSubscriptionResponse> => {
        return makeRequest<Telegram.TelegramEditUserStarSubscriptionResponse>(
          "/editUserStarSubscription",
          req ?? {},
          signal,
          TelegramEditUserStarSubscriptionRequestSchema
        );
      },
      { schema: TelegramEditUserStarSubscriptionRequestSchema }
    );

  // sig-ok: `bot{token}` is Telegram's auth prefix, not a method namespace.
  // POST https://api.telegram.org/bot{token}/exportChatInviteLink
  // Docs: https://core.telegram.org/bots/api#exportchatinvitelink
  const exportChatInviteLink: Telegram.TelegramExportChatInviteLinkMethod =
    Object.assign(
      async (
        req?: Telegram.TelegramExportChatInviteLinkRequest,
        signal?: AbortSignal
      ): Promise<Telegram.TelegramExportChatInviteLinkResponse> => {
        return makeRequest<Telegram.TelegramExportChatInviteLinkResponse>(
          "/exportChatInviteLink",
          req ?? {},
          signal,
          TelegramExportChatInviteLinkRequestSchema
        );
      },
      { schema: TelegramExportChatInviteLinkRequestSchema }
    );

  // sig-ok: `bot{token}` is Telegram's auth prefix, not a method namespace.
  // POST https://api.telegram.org/bot{token}/forwardMessage
  // Docs: https://core.telegram.org/bots/api#forwardmessage
  const forwardMessage: Telegram.TelegramForwardMessageMethod = Object.assign(
    async (
      req?: Telegram.TelegramForwardMessageRequest,
      signal?: AbortSignal
    ): Promise<Telegram.TelegramForwardMessageResponse> => {
      return makeRequest<Telegram.TelegramForwardMessageResponse>(
        "/forwardMessage",
        req ?? {},
        signal,
        TelegramForwardMessageRequestSchema
      );
    },
    { schema: TelegramForwardMessageRequestSchema }
  );

  // sig-ok: `bot{token}` is Telegram's auth prefix, not a method namespace.
  // POST https://api.telegram.org/bot{token}/forwardMessages
  // Docs: https://core.telegram.org/bots/api#forwardmessages
  const forwardMessages: Telegram.TelegramForwardMessagesMethod = Object.assign(
    async (
      req?: Telegram.TelegramForwardMessagesRequest,
      signal?: AbortSignal
    ): Promise<Telegram.TelegramForwardMessagesResponse> => {
      return makeRequest<Telegram.TelegramForwardMessagesResponse>(
        "/forwardMessages",
        req ?? {},
        signal,
        TelegramForwardMessagesRequestSchema
      );
    },
    { schema: TelegramForwardMessagesRequestSchema }
  );

  // sig-ok: `bot{token}` is Telegram's auth prefix, not a method namespace.
  // POST https://api.telegram.org/bot{token}/getAvailableGifts
  // Docs: https://core.telegram.org/bots/api#getavailablegifts
  const getAvailableGifts: Telegram.TelegramGetAvailableGiftsMethod =
    Object.assign(
      async (
        req?: Telegram.TelegramGetAvailableGiftsRequest,
        signal?: AbortSignal
      ): Promise<Telegram.TelegramGetAvailableGiftsResponse> => {
        return makeRequest<Telegram.TelegramGetAvailableGiftsResponse>(
          "/getAvailableGifts",
          req ?? {},
          signal,
          TelegramGetAvailableGiftsRequestSchema
        );
      },
      { schema: TelegramGetAvailableGiftsRequestSchema }
    );

  // sig-ok: `bot{token}` is Telegram's auth prefix, not a method namespace.
  // POST https://api.telegram.org/bot{token}/getBusinessAccountGifts
  // Docs: https://core.telegram.org/bots/api#getbusinessaccountgifts
  const getBusinessAccountGifts: Telegram.TelegramGetBusinessAccountGiftsMethod =
    Object.assign(
      async (
        req?: Telegram.TelegramGetBusinessAccountGiftsRequest,
        signal?: AbortSignal
      ): Promise<Telegram.TelegramGetBusinessAccountGiftsResponse> => {
        return makeRequest<Telegram.TelegramGetBusinessAccountGiftsResponse>(
          "/getBusinessAccountGifts",
          req ?? {},
          signal,
          TelegramGetBusinessAccountGiftsRequestSchema
        );
      },
      { schema: TelegramGetBusinessAccountGiftsRequestSchema }
    );

  // sig-ok: `bot{token}` is Telegram's auth prefix, not a method namespace.
  // POST https://api.telegram.org/bot{token}/getBusinessAccountStarBalance
  // Docs: https://core.telegram.org/bots/api#getbusinessaccountstarbalance
  const getBusinessAccountStarBalance: Telegram.TelegramGetBusinessAccountStarBalanceMethod =
    Object.assign(
      async (
        req?: Telegram.TelegramGetBusinessAccountStarBalanceRequest,
        signal?: AbortSignal
      ): Promise<Telegram.TelegramGetBusinessAccountStarBalanceResponse> => {
        return makeRequest<Telegram.TelegramGetBusinessAccountStarBalanceResponse>(
          "/getBusinessAccountStarBalance",
          req ?? {},
          signal,
          TelegramGetBusinessAccountStarBalanceRequestSchema
        );
      },
      { schema: TelegramGetBusinessAccountStarBalanceRequestSchema }
    );

  // sig-ok: `bot{token}` is Telegram's auth prefix, not a method namespace.
  // POST https://api.telegram.org/bot{token}/getBusinessConnection
  // Docs: https://core.telegram.org/bots/api#getbusinessconnection
  const getBusinessConnection: Telegram.TelegramGetBusinessConnectionMethod =
    Object.assign(
      async (
        req?: Telegram.TelegramGetBusinessConnectionRequest,
        signal?: AbortSignal
      ): Promise<Telegram.TelegramGetBusinessConnectionResponse> => {
        return makeRequest<Telegram.TelegramGetBusinessConnectionResponse>(
          "/getBusinessConnection",
          req ?? {},
          signal,
          TelegramGetBusinessConnectionRequestSchema
        );
      },
      { schema: TelegramGetBusinessConnectionRequestSchema }
    );

  // sig-ok: `bot{token}` is Telegram's auth prefix, not a method namespace.
  // POST https://api.telegram.org/bot{token}/getChat
  // Docs: https://core.telegram.org/bots/api#getchat
  const getChat: Telegram.TelegramGetChatMethod = Object.assign(
    async (
      req?: Telegram.TelegramGetChatRequest,
      signal?: AbortSignal
    ): Promise<Telegram.TelegramGetChatResponse> => {
      return makeRequest<Telegram.TelegramGetChatResponse>(
        "/getChat",
        req ?? {},
        signal,
        TelegramGetChatRequestSchema
      );
    },
    { schema: TelegramGetChatRequestSchema }
  );

  // sig-ok: `bot{token}` is Telegram's auth prefix, not a method namespace.
  // POST https://api.telegram.org/bot{token}/getChatAdministrators
  // Docs: https://core.telegram.org/bots/api#getchatadministrators
  const getChatAdministrators: Telegram.TelegramGetChatAdministratorsMethod =
    Object.assign(
      async (
        req?: Telegram.TelegramGetChatAdministratorsRequest,
        signal?: AbortSignal
      ): Promise<Telegram.TelegramGetChatAdministratorsResponse> => {
        return makeRequest<Telegram.TelegramGetChatAdministratorsResponse>(
          "/getChatAdministrators",
          req ?? {},
          signal,
          TelegramGetChatAdministratorsRequestSchema
        );
      },
      { schema: TelegramGetChatAdministratorsRequestSchema }
    );

  // sig-ok: `bot{token}` is Telegram's auth prefix, not a method namespace.
  // POST https://api.telegram.org/bot{token}/getChatGifts
  // Docs: https://core.telegram.org/bots/api#getchatgifts
  const getChatGifts: Telegram.TelegramGetChatGiftsMethod = Object.assign(
    async (
      req?: Telegram.TelegramGetChatGiftsRequest,
      signal?: AbortSignal
    ): Promise<Telegram.TelegramGetChatGiftsResponse> => {
      return makeRequest<Telegram.TelegramGetChatGiftsResponse>(
        "/getChatGifts",
        req ?? {},
        signal,
        TelegramGetChatGiftsRequestSchema
      );
    },
    { schema: TelegramGetChatGiftsRequestSchema }
  );

  // sig-ok: `bot{token}` is Telegram's auth prefix, not a method namespace.
  // POST https://api.telegram.org/bot{token}/getChatMember
  // Docs: https://core.telegram.org/bots/api#getchatmember
  const getChatMember: Telegram.TelegramGetChatMemberMethod = Object.assign(
    async (
      req?: Telegram.TelegramGetChatMemberRequest,
      signal?: AbortSignal
    ): Promise<Telegram.TelegramGetChatMemberResponse> => {
      return makeRequest<Telegram.TelegramGetChatMemberResponse>(
        "/getChatMember",
        req ?? {},
        signal,
        TelegramGetChatMemberRequestSchema
      );
    },
    { schema: TelegramGetChatMemberRequestSchema }
  );

  // sig-ok: `bot{token}` is Telegram's auth prefix, not a method namespace.
  // POST https://api.telegram.org/bot{token}/getChatMemberCount
  // Docs: https://core.telegram.org/bots/api#getchatmembercount
  const getChatMemberCount: Telegram.TelegramGetChatMemberCountMethod =
    Object.assign(
      async (
        req?: Telegram.TelegramGetChatMemberCountRequest,
        signal?: AbortSignal
      ): Promise<Telegram.TelegramGetChatMemberCountResponse> => {
        return makeRequest<Telegram.TelegramGetChatMemberCountResponse>(
          "/getChatMemberCount",
          req ?? {},
          signal,
          TelegramGetChatMemberCountRequestSchema
        );
      },
      { schema: TelegramGetChatMemberCountRequestSchema }
    );

  // sig-ok: `bot{token}` is Telegram's auth prefix, not a method namespace.
  // POST https://api.telegram.org/bot{token}/getChatMenuButton
  // Docs: https://core.telegram.org/bots/api#getchatmenubutton
  const getChatMenuButton: Telegram.TelegramGetChatMenuButtonMethod =
    Object.assign(
      async (
        req?: Telegram.TelegramGetChatMenuButtonRequest,
        signal?: AbortSignal
      ): Promise<Telegram.TelegramGetChatMenuButtonResponse> => {
        return makeRequest<Telegram.TelegramGetChatMenuButtonResponse>(
          "/getChatMenuButton",
          req ?? {},
          signal,
          TelegramGetChatMenuButtonRequestSchema
        );
      },
      { schema: TelegramGetChatMenuButtonRequestSchema }
    );

  // sig-ok: `bot{token}` is Telegram's auth prefix, not a method namespace.
  // POST https://api.telegram.org/bot{token}/getCustomEmojiStickers
  // Docs: https://core.telegram.org/bots/api#getcustomemojistickers
  const getCustomEmojiStickers: Telegram.TelegramGetCustomEmojiStickersMethod =
    Object.assign(
      async (
        req?: Telegram.TelegramGetCustomEmojiStickersRequest,
        signal?: AbortSignal
      ): Promise<Telegram.TelegramGetCustomEmojiStickersResponse> => {
        return makeRequest<Telegram.TelegramGetCustomEmojiStickersResponse>(
          "/getCustomEmojiStickers",
          req ?? {},
          signal,
          TelegramGetCustomEmojiStickersRequestSchema
        );
      },
      { schema: TelegramGetCustomEmojiStickersRequestSchema }
    );

  // sig-ok: `bot{token}` is Telegram's auth prefix, not a method namespace.
  // POST https://api.telegram.org/bot{token}/getFile
  // Docs: https://core.telegram.org/bots/api#getfile
  const getFile: Telegram.TelegramGetFileMethod = Object.assign(
    async (
      req?: Telegram.TelegramGetFileRequest,
      signal?: AbortSignal
    ): Promise<Telegram.TelegramGetFileResponse> => {
      return makeRequest<Telegram.TelegramGetFileResponse>(
        "/getFile",
        req ?? {},
        signal,
        TelegramGetFileRequestSchema
      );
    },
    { schema: TelegramGetFileRequestSchema }
  );

  // sig-ok: `bot{token}` is Telegram's auth prefix, not a method namespace.
  // POST https://api.telegram.org/bot{token}/getForumTopicIconStickers
  // Docs: https://core.telegram.org/bots/api#getforumtopiciconstickers
  const getForumTopicIconStickers: Telegram.TelegramGetForumTopicIconStickersMethod =
    Object.assign(
      async (
        req?: Telegram.TelegramGetForumTopicIconStickersRequest,
        signal?: AbortSignal
      ): Promise<Telegram.TelegramGetForumTopicIconStickersResponse> => {
        return makeRequest<Telegram.TelegramGetForumTopicIconStickersResponse>(
          "/getForumTopicIconStickers",
          req ?? {},
          signal,
          TelegramGetForumTopicIconStickersRequestSchema
        );
      },
      { schema: TelegramGetForumTopicIconStickersRequestSchema }
    );

  // sig-ok: `bot{token}` is Telegram's auth prefix, not a method namespace.
  // POST https://api.telegram.org/bot{token}/getGameHighScores
  // Docs: https://core.telegram.org/bots/api#getgamehighscores
  const getGameHighScores: Telegram.TelegramGetGameHighScoresMethod =
    Object.assign(
      async (
        req?: Telegram.TelegramGetGameHighScoresRequest,
        signal?: AbortSignal
      ): Promise<Telegram.TelegramGetGameHighScoresResponse> => {
        return makeRequest<Telegram.TelegramGetGameHighScoresResponse>(
          "/getGameHighScores",
          req ?? {},
          signal,
          TelegramGetGameHighScoresRequestSchema
        );
      },
      { schema: TelegramGetGameHighScoresRequestSchema }
    );

  // sig-ok: `bot{token}` is Telegram's auth prefix, not a method namespace.
  // POST https://api.telegram.org/bot{token}/getManagedBotAccessSettings
  // Docs: https://core.telegram.org/bots/api#getmanagedbotaccesssettings
  const getManagedBotAccessSettings: Telegram.TelegramGetManagedBotAccessSettingsMethod =
    Object.assign(
      async (
        req?: Telegram.TelegramGetManagedBotAccessSettingsRequest,
        signal?: AbortSignal
      ): Promise<Telegram.TelegramGetManagedBotAccessSettingsResponse> => {
        return makeRequest<Telegram.TelegramGetManagedBotAccessSettingsResponse>(
          "/getManagedBotAccessSettings",
          req ?? {},
          signal,
          TelegramGetManagedBotAccessSettingsRequestSchema
        );
      },
      { schema: TelegramGetManagedBotAccessSettingsRequestSchema }
    );

  // sig-ok: `bot{token}` is Telegram's auth prefix, not a method namespace.
  // POST https://api.telegram.org/bot{token}/getManagedBotToken
  // Docs: https://core.telegram.org/bots/api#getmanagedbottoken
  const getManagedBotToken: Telegram.TelegramGetManagedBotTokenMethod =
    Object.assign(
      async (
        req?: Telegram.TelegramGetManagedBotTokenRequest,
        signal?: AbortSignal
      ): Promise<Telegram.TelegramGetManagedBotTokenResponse> => {
        return makeRequest<Telegram.TelegramGetManagedBotTokenResponse>(
          "/getManagedBotToken",
          req ?? {},
          signal,
          TelegramGetManagedBotTokenRequestSchema
        );
      },
      { schema: TelegramGetManagedBotTokenRequestSchema }
    );

  // sig-ok: `bot{token}` is Telegram's auth prefix, not a method namespace.
  // POST https://api.telegram.org/bot{token}/getMe
  // Docs: https://core.telegram.org/bots/api#getme
  const getMe: Telegram.TelegramGetMeMethod = Object.assign(
    async (
      req?: Telegram.TelegramGetMeRequest,
      signal?: AbortSignal
    ): Promise<Telegram.TelegramGetMeResponse> => {
      return makeRequest<Telegram.TelegramGetMeResponse>(
        "/getMe",
        req ?? {},
        signal,
        TelegramGetMeRequestSchema
      );
    },
    { schema: TelegramGetMeRequestSchema }
  );

  // sig-ok: `bot{token}` is Telegram's auth prefix, not a method namespace.
  // POST https://api.telegram.org/bot{token}/getMyCommands
  // Docs: https://core.telegram.org/bots/api#getmycommands
  const getMyCommands: Telegram.TelegramGetMyCommandsMethod = Object.assign(
    async (
      req?: Telegram.TelegramGetMyCommandsRequest,
      signal?: AbortSignal
    ): Promise<Telegram.TelegramGetMyCommandsResponse> => {
      return makeRequest<Telegram.TelegramGetMyCommandsResponse>(
        "/getMyCommands",
        req ?? {},
        signal,
        TelegramGetMyCommandsRequestSchema
      );
    },
    { schema: TelegramGetMyCommandsRequestSchema }
  );

  // sig-ok: `bot{token}` is Telegram's auth prefix, not a method namespace.
  // POST https://api.telegram.org/bot{token}/getMyDefaultAdministratorRights
  // Docs: https://core.telegram.org/bots/api#getmydefaultadministratorrights
  const getMyDefaultAdministratorRights: Telegram.TelegramGetMyDefaultAdministratorRightsMethod =
    Object.assign(
      async (
        req?: Telegram.TelegramGetMyDefaultAdministratorRightsRequest,
        signal?: AbortSignal
      ): Promise<Telegram.TelegramGetMyDefaultAdministratorRightsResponse> => {
        return makeRequest<Telegram.TelegramGetMyDefaultAdministratorRightsResponse>(
          "/getMyDefaultAdministratorRights",
          req ?? {},
          signal,
          TelegramGetMyDefaultAdministratorRightsRequestSchema
        );
      },
      { schema: TelegramGetMyDefaultAdministratorRightsRequestSchema }
    );

  // sig-ok: `bot{token}` is Telegram's auth prefix, not a method namespace.
  // POST https://api.telegram.org/bot{token}/getMyDescription
  // Docs: https://core.telegram.org/bots/api#getmydescription
  const getMyDescription: Telegram.TelegramGetMyDescriptionMethod =
    Object.assign(
      async (
        req?: Telegram.TelegramGetMyDescriptionRequest,
        signal?: AbortSignal
      ): Promise<Telegram.TelegramGetMyDescriptionResponse> => {
        return makeRequest<Telegram.TelegramGetMyDescriptionResponse>(
          "/getMyDescription",
          req ?? {},
          signal,
          TelegramGetMyDescriptionRequestSchema
        );
      },
      { schema: TelegramGetMyDescriptionRequestSchema }
    );

  // sig-ok: `bot{token}` is Telegram's auth prefix, not a method namespace.
  // POST https://api.telegram.org/bot{token}/getMyName
  // Docs: https://core.telegram.org/bots/api#getmyname
  const getMyName: Telegram.TelegramGetMyNameMethod = Object.assign(
    async (
      req?: Telegram.TelegramGetMyNameRequest,
      signal?: AbortSignal
    ): Promise<Telegram.TelegramGetMyNameResponse> => {
      return makeRequest<Telegram.TelegramGetMyNameResponse>(
        "/getMyName",
        req ?? {},
        signal,
        TelegramGetMyNameRequestSchema
      );
    },
    { schema: TelegramGetMyNameRequestSchema }
  );

  // sig-ok: `bot{token}` is Telegram's auth prefix, not a method namespace.
  // POST https://api.telegram.org/bot{token}/getMyShortDescription
  // Docs: https://core.telegram.org/bots/api#getmyshortdescription
  const getMyShortDescription: Telegram.TelegramGetMyShortDescriptionMethod =
    Object.assign(
      async (
        req?: Telegram.TelegramGetMyShortDescriptionRequest,
        signal?: AbortSignal
      ): Promise<Telegram.TelegramGetMyShortDescriptionResponse> => {
        return makeRequest<Telegram.TelegramGetMyShortDescriptionResponse>(
          "/getMyShortDescription",
          req ?? {},
          signal,
          TelegramGetMyShortDescriptionRequestSchema
        );
      },
      { schema: TelegramGetMyShortDescriptionRequestSchema }
    );

  // sig-ok: `bot{token}` is Telegram's auth prefix, not a method namespace.
  // POST https://api.telegram.org/bot{token}/getMyStarBalance
  // Docs: https://core.telegram.org/bots/api#getmystarbalance
  const getMyStarBalance: Telegram.TelegramGetMyStarBalanceMethod =
    Object.assign(
      async (
        req?: Telegram.TelegramGetMyStarBalanceRequest,
        signal?: AbortSignal
      ): Promise<Telegram.TelegramGetMyStarBalanceResponse> => {
        return makeRequest<Telegram.TelegramGetMyStarBalanceResponse>(
          "/getMyStarBalance",
          req ?? {},
          signal,
          TelegramGetMyStarBalanceRequestSchema
        );
      },
      { schema: TelegramGetMyStarBalanceRequestSchema }
    );

  // sig-ok: `bot{token}` is Telegram's auth prefix, not a method namespace.
  // POST https://api.telegram.org/bot{token}/getStarTransactions
  // Docs: https://core.telegram.org/bots/api#getstartransactions
  const getStarTransactions: Telegram.TelegramGetStarTransactionsMethod =
    Object.assign(
      async (
        req?: Telegram.TelegramGetStarTransactionsRequest,
        signal?: AbortSignal
      ): Promise<Telegram.TelegramGetStarTransactionsResponse> => {
        return makeRequest<Telegram.TelegramGetStarTransactionsResponse>(
          "/getStarTransactions",
          req ?? {},
          signal,
          TelegramGetStarTransactionsRequestSchema
        );
      },
      { schema: TelegramGetStarTransactionsRequestSchema }
    );

  // sig-ok: `bot{token}` is Telegram's auth prefix, not a method namespace.
  // POST https://api.telegram.org/bot{token}/getStickerSet
  // Docs: https://core.telegram.org/bots/api#getstickerset
  const getStickerSet: Telegram.TelegramGetStickerSetMethod = Object.assign(
    async (
      req?: Telegram.TelegramGetStickerSetRequest,
      signal?: AbortSignal
    ): Promise<Telegram.TelegramGetStickerSetResponse> => {
      return makeRequest<Telegram.TelegramGetStickerSetResponse>(
        "/getStickerSet",
        req ?? {},
        signal,
        TelegramGetStickerSetRequestSchema
      );
    },
    { schema: TelegramGetStickerSetRequestSchema }
  );

  // sig-ok: `bot{token}` is Telegram's auth prefix, not a method namespace.
  // POST https://api.telegram.org/bot{token}/getUpdates
  // Docs: https://core.telegram.org/bots/api#getupdates
  const getUpdates: Telegram.TelegramGetUpdatesMethod = Object.assign(
    async (
      req?: Telegram.TelegramGetUpdatesRequest,
      signal?: AbortSignal
    ): Promise<Telegram.TelegramGetUpdatesResponse> => {
      return makeRequest<Telegram.TelegramGetUpdatesResponse>(
        "/getUpdates",
        req ?? {},
        signal,
        TelegramGetUpdatesRequestSchema
      );
    },
    { schema: TelegramGetUpdatesRequestSchema }
  );

  // sig-ok: `bot{token}` is Telegram's auth prefix, not a method namespace.
  // POST https://api.telegram.org/bot{token}/getUserChatBoosts
  // Docs: https://core.telegram.org/bots/api#getuserchatboosts
  const getUserChatBoosts: Telegram.TelegramGetUserChatBoostsMethod =
    Object.assign(
      async (
        req?: Telegram.TelegramGetUserChatBoostsRequest,
        signal?: AbortSignal
      ): Promise<Telegram.TelegramGetUserChatBoostsResponse> => {
        return makeRequest<Telegram.TelegramGetUserChatBoostsResponse>(
          "/getUserChatBoosts",
          req ?? {},
          signal,
          TelegramGetUserChatBoostsRequestSchema
        );
      },
      { schema: TelegramGetUserChatBoostsRequestSchema }
    );

  // sig-ok: `bot{token}` is Telegram's auth prefix, not a method namespace.
  // POST https://api.telegram.org/bot{token}/getUserGifts
  // Docs: https://core.telegram.org/bots/api#getusergifts
  const getUserGifts: Telegram.TelegramGetUserGiftsMethod = Object.assign(
    async (
      req?: Telegram.TelegramGetUserGiftsRequest,
      signal?: AbortSignal
    ): Promise<Telegram.TelegramGetUserGiftsResponse> => {
      return makeRequest<Telegram.TelegramGetUserGiftsResponse>(
        "/getUserGifts",
        req ?? {},
        signal,
        TelegramGetUserGiftsRequestSchema
      );
    },
    { schema: TelegramGetUserGiftsRequestSchema }
  );

  // sig-ok: `bot{token}` is Telegram's auth prefix, not a method namespace.
  // POST https://api.telegram.org/bot{token}/getUserPersonalChatMessages
  // Docs: https://core.telegram.org/bots/api#getuserpersonalchatmessages
  const getUserPersonalChatMessages: Telegram.TelegramGetUserPersonalChatMessagesMethod =
    Object.assign(
      async (
        req?: Telegram.TelegramGetUserPersonalChatMessagesRequest,
        signal?: AbortSignal
      ): Promise<Telegram.TelegramGetUserPersonalChatMessagesResponse> => {
        return makeRequest<Telegram.TelegramGetUserPersonalChatMessagesResponse>(
          "/getUserPersonalChatMessages",
          req ?? {},
          signal,
          TelegramGetUserPersonalChatMessagesRequestSchema
        );
      },
      { schema: TelegramGetUserPersonalChatMessagesRequestSchema }
    );

  // sig-ok: `bot{token}` is Telegram's auth prefix, not a method namespace.
  // POST https://api.telegram.org/bot{token}/getWebhookInfo
  // Docs: https://core.telegram.org/bots/api#getwebhookinfo
  const getWebhookInfo: Telegram.TelegramGetWebhookInfoMethod = Object.assign(
    async (
      req?: Telegram.TelegramGetWebhookInfoRequest,
      signal?: AbortSignal
    ): Promise<Telegram.TelegramGetWebhookInfoResponse> => {
      return makeRequest<Telegram.TelegramGetWebhookInfoResponse>(
        "/getWebhookInfo",
        req ?? {},
        signal,
        TelegramGetWebhookInfoRequestSchema
      );
    },
    { schema: TelegramGetWebhookInfoRequestSchema }
  );

  // sig-ok: `bot{token}` is Telegram's auth prefix, not a method namespace.
  // POST https://api.telegram.org/bot{token}/giftPremiumSubscription
  // Docs: https://core.telegram.org/bots/api#giftpremiumsubscription
  const giftPremiumSubscription: Telegram.TelegramGiftPremiumSubscriptionMethod =
    Object.assign(
      async (
        req?: Telegram.TelegramGiftPremiumSubscriptionRequest,
        signal?: AbortSignal
      ): Promise<Telegram.TelegramGiftPremiumSubscriptionResponse> => {
        return makeRequest<Telegram.TelegramGiftPremiumSubscriptionResponse>(
          "/giftPremiumSubscription",
          req ?? {},
          signal,
          TelegramGiftPremiumSubscriptionRequestSchema
        );
      },
      { schema: TelegramGiftPremiumSubscriptionRequestSchema }
    );

  // sig-ok: `bot{token}` is Telegram's auth prefix, not a method namespace.
  // POST https://api.telegram.org/bot{token}/hideGeneralForumTopic
  // Docs: https://core.telegram.org/bots/api#hidegeneralforumtopic
  const hideGeneralForumTopic: Telegram.TelegramHideGeneralForumTopicMethod =
    Object.assign(
      async (
        req?: Telegram.TelegramHideGeneralForumTopicRequest,
        signal?: AbortSignal
      ): Promise<Telegram.TelegramHideGeneralForumTopicResponse> => {
        return makeRequest<Telegram.TelegramHideGeneralForumTopicResponse>(
          "/hideGeneralForumTopic",
          req ?? {},
          signal,
          TelegramHideGeneralForumTopicRequestSchema
        );
      },
      { schema: TelegramHideGeneralForumTopicRequestSchema }
    );

  // sig-ok: `bot{token}` is Telegram's auth prefix, not a method namespace.
  // POST https://api.telegram.org/bot{token}/leaveChat
  // Docs: https://core.telegram.org/bots/api#leavechat
  const leaveChat: Telegram.TelegramLeaveChatMethod = Object.assign(
    async (
      req?: Telegram.TelegramLeaveChatRequest,
      signal?: AbortSignal
    ): Promise<Telegram.TelegramLeaveChatResponse> => {
      return makeRequest<Telegram.TelegramLeaveChatResponse>(
        "/leaveChat",
        req ?? {},
        signal,
        TelegramLeaveChatRequestSchema
      );
    },
    { schema: TelegramLeaveChatRequestSchema }
  );

  // sig-ok: `bot{token}` is Telegram's auth prefix, not a method namespace.
  // POST https://api.telegram.org/bot{token}/logOut
  // Docs: https://core.telegram.org/bots/api#logout
  const logOut: Telegram.TelegramLogOutMethod = Object.assign(
    async (
      req?: Telegram.TelegramLogOutRequest,
      signal?: AbortSignal
    ): Promise<Telegram.TelegramLogOutResponse> => {
      return makeRequest<Telegram.TelegramLogOutResponse>(
        "/logOut",
        req ?? {},
        signal,
        TelegramLogOutRequestSchema
      );
    },
    { schema: TelegramLogOutRequestSchema }
  );

  // sig-ok: `bot{token}` is Telegram's auth prefix, not a method namespace.
  // POST https://api.telegram.org/bot{token}/pinChatMessage
  // Docs: https://core.telegram.org/bots/api#pinchatmessage
  const pinChatMessage: Telegram.TelegramPinChatMessageMethod = Object.assign(
    async (
      req?: Telegram.TelegramPinChatMessageRequest,
      signal?: AbortSignal
    ): Promise<Telegram.TelegramPinChatMessageResponse> => {
      return makeRequest<Telegram.TelegramPinChatMessageResponse>(
        "/pinChatMessage",
        req ?? {},
        signal,
        TelegramPinChatMessageRequestSchema
      );
    },
    { schema: TelegramPinChatMessageRequestSchema }
  );

  // sig-ok: `bot{token}` is Telegram's auth prefix, not a method namespace.
  // POST https://api.telegram.org/bot{token}/postStory
  // Docs: https://core.telegram.org/bots/api#poststory
  const postStory: Telegram.TelegramPostStoryMethod = Object.assign(
    async (
      req?: Telegram.TelegramPostStoryRequest,
      signal?: AbortSignal
    ): Promise<Telegram.TelegramPostStoryResponse> => {
      return makeRequest<Telegram.TelegramPostStoryResponse>(
        "/postStory",
        req ?? {},
        signal,
        TelegramPostStoryRequestSchema
      );
    },
    { schema: TelegramPostStoryRequestSchema }
  );

  // sig-ok: `bot{token}` is Telegram's auth prefix, not a method namespace.
  // POST https://api.telegram.org/bot{token}/promoteChatMember
  // Docs: https://core.telegram.org/bots/api#promotechatmember
  const promoteChatMember: Telegram.TelegramPromoteChatMemberMethod =
    Object.assign(
      async (
        req?: Telegram.TelegramPromoteChatMemberRequest,
        signal?: AbortSignal
      ): Promise<Telegram.TelegramPromoteChatMemberResponse> => {
        return makeRequest<Telegram.TelegramPromoteChatMemberResponse>(
          "/promoteChatMember",
          req ?? {},
          signal,
          TelegramPromoteChatMemberRequestSchema
        );
      },
      { schema: TelegramPromoteChatMemberRequestSchema }
    );

  // sig-ok: `bot{token}` is Telegram's auth prefix, not a method namespace.
  // POST https://api.telegram.org/bot{token}/readBusinessMessage
  // Docs: https://core.telegram.org/bots/api#readbusinessmessage
  const readBusinessMessage: Telegram.TelegramReadBusinessMessageMethod =
    Object.assign(
      async (
        req?: Telegram.TelegramReadBusinessMessageRequest,
        signal?: AbortSignal
      ): Promise<Telegram.TelegramReadBusinessMessageResponse> => {
        return makeRequest<Telegram.TelegramReadBusinessMessageResponse>(
          "/readBusinessMessage",
          req ?? {},
          signal,
          TelegramReadBusinessMessageRequestSchema
        );
      },
      { schema: TelegramReadBusinessMessageRequestSchema }
    );

  // sig-ok: `bot{token}` is Telegram's auth prefix, not a method namespace.
  // POST https://api.telegram.org/bot{token}/refundStarPayment
  // Docs: https://core.telegram.org/bots/api#refundstarpayment
  const refundStarPayment: Telegram.TelegramRefundStarPaymentMethod =
    Object.assign(
      async (
        req?: Telegram.TelegramRefundStarPaymentRequest,
        signal?: AbortSignal
      ): Promise<Telegram.TelegramRefundStarPaymentResponse> => {
        return makeRequest<Telegram.TelegramRefundStarPaymentResponse>(
          "/refundStarPayment",
          req ?? {},
          signal,
          TelegramRefundStarPaymentRequestSchema
        );
      },
      { schema: TelegramRefundStarPaymentRequestSchema }
    );

  // sig-ok: `bot{token}` is Telegram's auth prefix, not a method namespace.
  // POST https://api.telegram.org/bot{token}/removeBusinessAccountProfilePhoto
  // Docs: https://core.telegram.org/bots/api#removebusinessaccountprofilephoto
  const removeBusinessAccountProfilePhoto: Telegram.TelegramRemoveBusinessAccountProfilePhotoMethod =
    Object.assign(
      async (
        req?: Telegram.TelegramRemoveBusinessAccountProfilePhotoRequest,
        signal?: AbortSignal
      ): Promise<Telegram.TelegramRemoveBusinessAccountProfilePhotoResponse> => {
        return makeRequest<Telegram.TelegramRemoveBusinessAccountProfilePhotoResponse>(
          "/removeBusinessAccountProfilePhoto",
          req ?? {},
          signal,
          TelegramRemoveBusinessAccountProfilePhotoRequestSchema
        );
      },
      { schema: TelegramRemoveBusinessAccountProfilePhotoRequestSchema }
    );

  // sig-ok: `bot{token}` is Telegram's auth prefix, not a method namespace.
  // POST https://api.telegram.org/bot{token}/removeChatVerification
  // Docs: https://core.telegram.org/bots/api#removechatverification
  const removeChatVerification: Telegram.TelegramRemoveChatVerificationMethod =
    Object.assign(
      async (
        req?: Telegram.TelegramRemoveChatVerificationRequest,
        signal?: AbortSignal
      ): Promise<Telegram.TelegramRemoveChatVerificationResponse> => {
        return makeRequest<Telegram.TelegramRemoveChatVerificationResponse>(
          "/removeChatVerification",
          req ?? {},
          signal,
          TelegramRemoveChatVerificationRequestSchema
        );
      },
      { schema: TelegramRemoveChatVerificationRequestSchema }
    );

  // sig-ok: `bot{token}` is Telegram's auth prefix, not a method namespace.
  // POST https://api.telegram.org/bot{token}/removeUserVerification
  // Docs: https://core.telegram.org/bots/api#removeuserverification
  const removeUserVerification: Telegram.TelegramRemoveUserVerificationMethod =
    Object.assign(
      async (
        req?: Telegram.TelegramRemoveUserVerificationRequest,
        signal?: AbortSignal
      ): Promise<Telegram.TelegramRemoveUserVerificationResponse> => {
        return makeRequest<Telegram.TelegramRemoveUserVerificationResponse>(
          "/removeUserVerification",
          req ?? {},
          signal,
          TelegramRemoveUserVerificationRequestSchema
        );
      },
      { schema: TelegramRemoveUserVerificationRequestSchema }
    );

  // sig-ok: `bot{token}` is Telegram's auth prefix, not a method namespace.
  // POST https://api.telegram.org/bot{token}/reopenForumTopic
  // Docs: https://core.telegram.org/bots/api#reopenforumtopic
  const reopenForumTopic: Telegram.TelegramReopenForumTopicMethod =
    Object.assign(
      async (
        req?: Telegram.TelegramReopenForumTopicRequest,
        signal?: AbortSignal
      ): Promise<Telegram.TelegramReopenForumTopicResponse> => {
        return makeRequest<Telegram.TelegramReopenForumTopicResponse>(
          "/reopenForumTopic",
          req ?? {},
          signal,
          TelegramReopenForumTopicRequestSchema
        );
      },
      { schema: TelegramReopenForumTopicRequestSchema }
    );

  // sig-ok: `bot{token}` is Telegram's auth prefix, not a method namespace.
  // POST https://api.telegram.org/bot{token}/reopenGeneralForumTopic
  // Docs: https://core.telegram.org/bots/api#reopengeneralforumtopic
  const reopenGeneralForumTopic: Telegram.TelegramReopenGeneralForumTopicMethod =
    Object.assign(
      async (
        req?: Telegram.TelegramReopenGeneralForumTopicRequest,
        signal?: AbortSignal
      ): Promise<Telegram.TelegramReopenGeneralForumTopicResponse> => {
        return makeRequest<Telegram.TelegramReopenGeneralForumTopicResponse>(
          "/reopenGeneralForumTopic",
          req ?? {},
          signal,
          TelegramReopenGeneralForumTopicRequestSchema
        );
      },
      { schema: TelegramReopenGeneralForumTopicRequestSchema }
    );

  // sig-ok: `bot{token}` is Telegram's auth prefix, not a method namespace.
  // POST https://api.telegram.org/bot{token}/replaceManagedBotToken
  // Docs: https://core.telegram.org/bots/api#replacemanagedbottoken
  const replaceManagedBotToken: Telegram.TelegramReplaceManagedBotTokenMethod =
    Object.assign(
      async (
        req?: Telegram.TelegramReplaceManagedBotTokenRequest,
        signal?: AbortSignal
      ): Promise<Telegram.TelegramReplaceManagedBotTokenResponse> => {
        return makeRequest<Telegram.TelegramReplaceManagedBotTokenResponse>(
          "/replaceManagedBotToken",
          req ?? {},
          signal,
          TelegramReplaceManagedBotTokenRequestSchema
        );
      },
      { schema: TelegramReplaceManagedBotTokenRequestSchema }
    );

  // sig-ok: `bot{token}` is Telegram's auth prefix, not a method namespace.
  // POST https://api.telegram.org/bot{token}/replaceStickerInSet
  // Docs: https://core.telegram.org/bots/api#replacestickerinset
  const replaceStickerInSet: Telegram.TelegramReplaceStickerInSetMethod =
    Object.assign(
      async (
        req?: Telegram.TelegramReplaceStickerInSetRequest,
        signal?: AbortSignal
      ): Promise<Telegram.TelegramReplaceStickerInSetResponse> => {
        return makeRequest<Telegram.TelegramReplaceStickerInSetResponse>(
          "/replaceStickerInSet",
          req ?? {},
          signal,
          TelegramReplaceStickerInSetRequestSchema
        );
      },
      { schema: TelegramReplaceStickerInSetRequestSchema }
    );

  // sig-ok: `bot{token}` is Telegram's auth prefix, not a method namespace.
  // POST https://api.telegram.org/bot{token}/repostStory
  // Docs: https://core.telegram.org/bots/api#repoststory
  const repostStory: Telegram.TelegramRepostStoryMethod = Object.assign(
    async (
      req?: Telegram.TelegramRepostStoryRequest,
      signal?: AbortSignal
    ): Promise<Telegram.TelegramRepostStoryResponse> => {
      return makeRequest<Telegram.TelegramRepostStoryResponse>(
        "/repostStory",
        req ?? {},
        signal,
        TelegramRepostStoryRequestSchema
      );
    },
    { schema: TelegramRepostStoryRequestSchema }
  );

  // sig-ok: `bot{token}` is Telegram's auth prefix, not a method namespace.
  // POST https://api.telegram.org/bot{token}/restrictChatMember
  // Docs: https://core.telegram.org/bots/api#restrictchatmember
  const restrictChatMember: Telegram.TelegramRestrictChatMemberMethod =
    Object.assign(
      async (
        req?: Telegram.TelegramRestrictChatMemberRequest,
        signal?: AbortSignal
      ): Promise<Telegram.TelegramRestrictChatMemberResponse> => {
        return makeRequest<Telegram.TelegramRestrictChatMemberResponse>(
          "/restrictChatMember",
          req ?? {},
          signal,
          TelegramRestrictChatMemberRequestSchema
        );
      },
      { schema: TelegramRestrictChatMemberRequestSchema }
    );

  // sig-ok: `bot{token}` is Telegram's auth prefix, not a method namespace.
  // POST https://api.telegram.org/bot{token}/revokeChatInviteLink
  // Docs: https://core.telegram.org/bots/api#revokechatinvitelink
  const revokeChatInviteLink: Telegram.TelegramRevokeChatInviteLinkMethod =
    Object.assign(
      async (
        req?: Telegram.TelegramRevokeChatInviteLinkRequest,
        signal?: AbortSignal
      ): Promise<Telegram.TelegramRevokeChatInviteLinkResponse> => {
        return makeRequest<Telegram.TelegramRevokeChatInviteLinkResponse>(
          "/revokeChatInviteLink",
          req ?? {},
          signal,
          TelegramRevokeChatInviteLinkRequestSchema
        );
      },
      { schema: TelegramRevokeChatInviteLinkRequestSchema }
    );

  // sig-ok: `bot{token}` is Telegram's auth prefix, not a method namespace.
  // POST https://api.telegram.org/bot{token}/savePreparedInlineMessage
  // Docs: https://core.telegram.org/bots/api#savepreparedinlinemessage
  const savePreparedInlineMessage: Telegram.TelegramSavePreparedInlineMessageMethod =
    Object.assign(
      async (
        req?: Telegram.TelegramSavePreparedInlineMessageRequest,
        signal?: AbortSignal
      ): Promise<Telegram.TelegramSavePreparedInlineMessageResponse> => {
        return makeRequest<Telegram.TelegramSavePreparedInlineMessageResponse>(
          "/savePreparedInlineMessage",
          req ?? {},
          signal,
          TelegramSavePreparedInlineMessageRequestSchema
        );
      },
      { schema: TelegramSavePreparedInlineMessageRequestSchema }
    );

  // sig-ok: `bot{token}` is Telegram's auth prefix, not a method namespace.
  // POST https://api.telegram.org/bot{token}/savePreparedKeyboardButton
  // Docs: https://core.telegram.org/bots/api#savepreparedkeyboardbutton
  const savePreparedKeyboardButton: Telegram.TelegramSavePreparedKeyboardButtonMethod =
    Object.assign(
      async (
        req?: Telegram.TelegramSavePreparedKeyboardButtonRequest,
        signal?: AbortSignal
      ): Promise<Telegram.TelegramSavePreparedKeyboardButtonResponse> => {
        return makeRequest<Telegram.TelegramSavePreparedKeyboardButtonResponse>(
          "/savePreparedKeyboardButton",
          req ?? {},
          signal,
          TelegramSavePreparedKeyboardButtonRequestSchema
        );
      },
      { schema: TelegramSavePreparedKeyboardButtonRequestSchema }
    );

  // sig-ok: `bot{token}` is Telegram's auth prefix, not a method namespace.
  // POST https://api.telegram.org/bot{token}/sendAnimation
  // Docs: https://core.telegram.org/bots/api#sendanimation
  const sendAnimation: Telegram.TelegramSendAnimationMethod = Object.assign(
    async (
      req?: Telegram.TelegramSendAnimationRequest,
      signal?: AbortSignal
    ): Promise<Telegram.TelegramSendAnimationResponse> => {
      return makeRequest<Telegram.TelegramSendAnimationResponse>(
        "/sendAnimation",
        req ?? {},
        signal,
        TelegramSendAnimationRequestSchema
      );
    },
    { schema: TelegramSendAnimationRequestSchema }
  );

  // sig-ok: `bot{token}` is Telegram's auth prefix, not a method namespace.
  // POST https://api.telegram.org/bot{token}/sendAudio
  // Docs: https://core.telegram.org/bots/api#sendaudio
  const sendAudio: Telegram.TelegramSendAudioMethod = Object.assign(
    async (
      req?: Telegram.TelegramSendAudioRequest,
      signal?: AbortSignal
    ): Promise<Telegram.TelegramSendAudioResponse> => {
      return makeRequest<Telegram.TelegramSendAudioResponse>(
        "/sendAudio",
        req ?? {},
        signal,
        TelegramSendAudioRequestSchema
      );
    },
    { schema: TelegramSendAudioRequestSchema }
  );

  // sig-ok: `bot{token}` is Telegram's auth prefix, not a method namespace.
  // POST https://api.telegram.org/bot{token}/sendChatAction
  // Docs: https://core.telegram.org/bots/api#sendchataction
  const sendChatAction: Telegram.TelegramSendChatActionMethod = Object.assign(
    async (
      req?: Telegram.TelegramSendChatActionRequest,
      signal?: AbortSignal
    ): Promise<Telegram.TelegramSendChatActionResponse> => {
      return makeRequest<Telegram.TelegramSendChatActionResponse>(
        "/sendChatAction",
        req ?? {},
        signal,
        TelegramSendChatActionRequestSchema
      );
    },
    { schema: TelegramSendChatActionRequestSchema }
  );

  // sig-ok: `bot{token}` is Telegram's auth prefix, not a method namespace.
  // POST https://api.telegram.org/bot{token}/sendChatJoinRequestWebApp
  // Docs: https://core.telegram.org/bots/api#sendchatjoinrequestwebapp
  const sendChatJoinRequestWebApp: Telegram.TelegramSendChatJoinRequestWebAppMethod =
    Object.assign(
      async (
        req?: Telegram.TelegramSendChatJoinRequestWebAppRequest,
        signal?: AbortSignal
      ): Promise<Telegram.TelegramSendChatJoinRequestWebAppResponse> => {
        return makeRequest<Telegram.TelegramSendChatJoinRequestWebAppResponse>(
          "/sendChatJoinRequestWebApp",
          req ?? {},
          signal,
          TelegramSendChatJoinRequestWebAppRequestSchema
        );
      },
      { schema: TelegramSendChatJoinRequestWebAppRequestSchema }
    );

  // sig-ok: `bot{token}` is Telegram's auth prefix, not a method namespace.
  // POST https://api.telegram.org/bot{token}/sendChecklist
  // Docs: https://core.telegram.org/bots/api#sendchecklist
  const sendChecklist: Telegram.TelegramSendChecklistMethod = Object.assign(
    async (
      req?: Telegram.TelegramSendChecklistRequest,
      signal?: AbortSignal
    ): Promise<Telegram.TelegramSendChecklistResponse> => {
      return makeRequest<Telegram.TelegramSendChecklistResponse>(
        "/sendChecklist",
        req ?? {},
        signal,
        TelegramSendChecklistRequestSchema
      );
    },
    { schema: TelegramSendChecklistRequestSchema }
  );

  // sig-ok: `bot{token}` is Telegram's auth prefix, not a method namespace.
  // POST https://api.telegram.org/bot{token}/sendContact
  // Docs: https://core.telegram.org/bots/api#sendcontact
  const sendContact: Telegram.TelegramSendContactMethod = Object.assign(
    async (
      req?: Telegram.TelegramSendContactRequest,
      signal?: AbortSignal
    ): Promise<Telegram.TelegramSendContactResponse> => {
      return makeRequest<Telegram.TelegramSendContactResponse>(
        "/sendContact",
        req ?? {},
        signal,
        TelegramSendContactRequestSchema
      );
    },
    { schema: TelegramSendContactRequestSchema }
  );

  // sig-ok: `bot{token}` is Telegram's auth prefix, not a method namespace.
  // POST https://api.telegram.org/bot{token}/sendDice
  // Docs: https://core.telegram.org/bots/api#senddice
  const sendDice: Telegram.TelegramSendDiceMethod = Object.assign(
    async (
      req?: Telegram.TelegramSendDiceRequest,
      signal?: AbortSignal
    ): Promise<Telegram.TelegramSendDiceResponse> => {
      return makeRequest<Telegram.TelegramSendDiceResponse>(
        "/sendDice",
        req ?? {},
        signal,
        TelegramSendDiceRequestSchema
      );
    },
    { schema: TelegramSendDiceRequestSchema }
  );

  // sig-ok: `bot{token}` is Telegram's auth prefix, not a method namespace.
  // POST https://api.telegram.org/bot{token}/sendDocument
  // Docs: https://core.telegram.org/bots/api#senddocument
  const sendDocument: Telegram.TelegramSendDocumentMethod = Object.assign(
    async (
      req?: Telegram.TelegramSendDocumentRequest,
      signal?: AbortSignal
    ): Promise<Telegram.TelegramSendDocumentResponse> => {
      return makeRequest<Telegram.TelegramSendDocumentResponse>(
        "/sendDocument",
        req ?? {},
        signal,
        TelegramSendDocumentRequestSchema
      );
    },
    { schema: TelegramSendDocumentRequestSchema }
  );

  // sig-ok: `bot{token}` is Telegram's auth prefix, not a method namespace.
  // POST https://api.telegram.org/bot{token}/sendGame
  // Docs: https://core.telegram.org/bots/api#sendgame
  const sendGame: Telegram.TelegramSendGameMethod = Object.assign(
    async (
      req?: Telegram.TelegramSendGameRequest,
      signal?: AbortSignal
    ): Promise<Telegram.TelegramSendGameResponse> => {
      return makeRequest<Telegram.TelegramSendGameResponse>(
        "/sendGame",
        req ?? {},
        signal,
        TelegramSendGameRequestSchema
      );
    },
    { schema: TelegramSendGameRequestSchema }
  );

  // sig-ok: `bot{token}` is Telegram's auth prefix, not a method namespace.
  // POST https://api.telegram.org/bot{token}/sendGift
  // Docs: https://core.telegram.org/bots/api#sendgift
  const sendGift: Telegram.TelegramSendGiftMethod = Object.assign(
    async (
      req?: Telegram.TelegramSendGiftRequest,
      signal?: AbortSignal
    ): Promise<Telegram.TelegramSendGiftResponse> => {
      return makeRequest<Telegram.TelegramSendGiftResponse>(
        "/sendGift",
        req ?? {},
        signal,
        TelegramSendGiftRequestSchema
      );
    },
    { schema: TelegramSendGiftRequestSchema }
  );

  // sig-ok: `bot{token}` is Telegram's auth prefix, not a method namespace.
  // POST https://api.telegram.org/bot{token}/sendInvoice
  // Docs: https://core.telegram.org/bots/api#sendinvoice
  const sendInvoice: Telegram.TelegramSendInvoiceMethod = Object.assign(
    async (
      req?: Telegram.TelegramSendInvoiceRequest,
      signal?: AbortSignal
    ): Promise<Telegram.TelegramSendInvoiceResponse> => {
      return makeRequest<Telegram.TelegramSendInvoiceResponse>(
        "/sendInvoice",
        req ?? {},
        signal,
        TelegramSendInvoiceRequestSchema
      );
    },
    { schema: TelegramSendInvoiceRequestSchema }
  );

  // sig-ok: `bot{token}` is Telegram's auth prefix, not a method namespace.
  // POST https://api.telegram.org/bot{token}/sendLivePhoto
  // Docs: https://core.telegram.org/bots/api#sendlivephoto
  const sendLivePhoto: Telegram.TelegramSendLivePhotoMethod = Object.assign(
    async (
      req?: Telegram.TelegramSendLivePhotoRequest,
      signal?: AbortSignal
    ): Promise<Telegram.TelegramSendLivePhotoResponse> => {
      return makeRequest<Telegram.TelegramSendLivePhotoResponse>(
        "/sendLivePhoto",
        req ?? {},
        signal,
        TelegramSendLivePhotoRequestSchema
      );
    },
    { schema: TelegramSendLivePhotoRequestSchema }
  );

  // sig-ok: `bot{token}` is Telegram's auth prefix, not a method namespace.
  // POST https://api.telegram.org/bot{token}/sendLocation
  // Docs: https://core.telegram.org/bots/api#sendlocation
  const sendLocation: Telegram.TelegramSendLocationMethod = Object.assign(
    async (
      req?: Telegram.TelegramSendLocationRequest,
      signal?: AbortSignal
    ): Promise<Telegram.TelegramSendLocationResponse> => {
      return makeRequest<Telegram.TelegramSendLocationResponse>(
        "/sendLocation",
        req ?? {},
        signal,
        TelegramSendLocationRequestSchema
      );
    },
    { schema: TelegramSendLocationRequestSchema }
  );

  // sig-ok: `bot{token}` is Telegram's auth prefix, not a method namespace.
  // POST https://api.telegram.org/bot{token}/sendMediaGroup
  // Docs: https://core.telegram.org/bots/api#sendmediagroup
  const sendMediaGroup: Telegram.TelegramSendMediaGroupMethod = Object.assign(
    async (
      req?: Telegram.TelegramSendMediaGroupRequest,
      signal?: AbortSignal
    ): Promise<Telegram.TelegramSendMediaGroupResponse> => {
      return makeRequest<Telegram.TelegramSendMediaGroupResponse>(
        "/sendMediaGroup",
        req ?? {},
        signal,
        TelegramSendMediaGroupRequestSchema
      );
    },
    { schema: TelegramSendMediaGroupRequestSchema }
  );

  // sig-ok: `bot{token}` is Telegram's auth prefix, not a method namespace.
  // POST https://api.telegram.org/bot{token}/sendMessage
  // Docs: https://core.telegram.org/bots/api#sendmessage
  const sendMessage: Telegram.TelegramSendMessageMethod = Object.assign(
    async (
      req?: Telegram.TelegramSendMessageRequest,
      signal?: AbortSignal
    ): Promise<Telegram.TelegramSendMessageResponse> => {
      return makeRequest<Telegram.TelegramSendMessageResponse>(
        "/sendMessage",
        req ?? {},
        signal,
        TelegramSendMessageRequestSchema
      );
    },
    { schema: TelegramSendMessageRequestSchema }
  );

  // sig-ok: `bot{token}` is Telegram's auth prefix, not a method namespace.
  // POST https://api.telegram.org/bot{token}/sendMessageDraft
  // Docs: https://core.telegram.org/bots/api#sendmessagedraft
  const sendMessageDraft: Telegram.TelegramSendMessageDraftMethod =
    Object.assign(
      async (
        req?: Telegram.TelegramSendMessageDraftRequest,
        signal?: AbortSignal
      ): Promise<Telegram.TelegramSendMessageDraftResponse> => {
        return makeRequest<Telegram.TelegramSendMessageDraftResponse>(
          "/sendMessageDraft",
          req ?? {},
          signal,
          TelegramSendMessageDraftRequestSchema
        );
      },
      { schema: TelegramSendMessageDraftRequestSchema }
    );

  // sig-ok: `bot{token}` is Telegram's auth prefix, not a method namespace.
  // POST https://api.telegram.org/bot{token}/sendPaidMedia
  // Docs: https://core.telegram.org/bots/api#sendpaidmedia
  const sendPaidMedia: Telegram.TelegramSendPaidMediaMethod = Object.assign(
    async (
      req?: Telegram.TelegramSendPaidMediaRequest,
      signal?: AbortSignal
    ): Promise<Telegram.TelegramSendPaidMediaResponse> => {
      return makeRequest<Telegram.TelegramSendPaidMediaResponse>(
        "/sendPaidMedia",
        req ?? {},
        signal,
        TelegramSendPaidMediaRequestSchema
      );
    },
    { schema: TelegramSendPaidMediaRequestSchema }
  );

  // sig-ok: `bot{token}` is Telegram's auth prefix, not a method namespace.
  // POST https://api.telegram.org/bot{token}/sendPhoto
  // Docs: https://core.telegram.org/bots/api#sendphoto
  const sendPhoto: Telegram.TelegramSendPhotoMethod = Object.assign(
    async (
      req?: Telegram.TelegramSendPhotoRequest,
      signal?: AbortSignal
    ): Promise<Telegram.TelegramSendPhotoResponse> => {
      return makeRequest<Telegram.TelegramSendPhotoResponse>(
        "/sendPhoto",
        req ?? {},
        signal,
        TelegramSendPhotoRequestSchema
      );
    },
    { schema: TelegramSendPhotoRequestSchema }
  );

  // sig-ok: `bot{token}` is Telegram's auth prefix, not a method namespace.
  // POST https://api.telegram.org/bot{token}/sendPoll
  // Docs: https://core.telegram.org/bots/api#sendpoll
  const sendPoll: Telegram.TelegramSendPollMethod = Object.assign(
    async (
      req?: Telegram.TelegramSendPollRequest,
      signal?: AbortSignal
    ): Promise<Telegram.TelegramSendPollResponse> => {
      return makeRequest<Telegram.TelegramSendPollResponse>(
        "/sendPoll",
        req ?? {},
        signal,
        TelegramSendPollRequestSchema
      );
    },
    { schema: TelegramSendPollRequestSchema }
  );

  // sig-ok: `bot{token}` is Telegram's auth prefix, not a method namespace.
  // POST https://api.telegram.org/bot{token}/sendRichMessage
  // Docs: https://core.telegram.org/bots/api#sendrichmessage
  const sendRichMessage: Telegram.TelegramSendRichMessageMethod = Object.assign(
    async (
      req?: Telegram.TelegramSendRichMessageRequest,
      signal?: AbortSignal
    ): Promise<Telegram.TelegramSendRichMessageResponse> => {
      return makeRequest<Telegram.TelegramSendRichMessageResponse>(
        "/sendRichMessage",
        req ?? {},
        signal,
        TelegramSendRichMessageRequestSchema
      );
    },
    { schema: TelegramSendRichMessageRequestSchema }
  );

  // sig-ok: `bot{token}` is Telegram's auth prefix, not a method namespace.
  // POST https://api.telegram.org/bot{token}/sendRichMessageDraft
  // Docs: https://core.telegram.org/bots/api#sendrichmessagedraft
  const sendRichMessageDraft: Telegram.TelegramSendRichMessageDraftMethod =
    Object.assign(
      async (
        req?: Telegram.TelegramSendRichMessageDraftRequest,
        signal?: AbortSignal
      ): Promise<Telegram.TelegramSendRichMessageDraftResponse> => {
        return makeRequest<Telegram.TelegramSendRichMessageDraftResponse>(
          "/sendRichMessageDraft",
          req ?? {},
          signal,
          TelegramSendRichMessageDraftRequestSchema
        );
      },
      { schema: TelegramSendRichMessageDraftRequestSchema }
    );

  // sig-ok: `bot{token}` is Telegram's auth prefix, not a method namespace.
  // POST https://api.telegram.org/bot{token}/sendSticker
  // Docs: https://core.telegram.org/bots/api#sendsticker
  const sendSticker: Telegram.TelegramSendStickerMethod = Object.assign(
    async (
      req?: Telegram.TelegramSendStickerRequest,
      signal?: AbortSignal
    ): Promise<Telegram.TelegramSendStickerResponse> => {
      return makeRequest<Telegram.TelegramSendStickerResponse>(
        "/sendSticker",
        req ?? {},
        signal,
        TelegramSendStickerRequestSchema
      );
    },
    { schema: TelegramSendStickerRequestSchema }
  );

  // sig-ok: `bot{token}` is Telegram's auth prefix, not a method namespace.
  // POST https://api.telegram.org/bot{token}/sendVenue
  // Docs: https://core.telegram.org/bots/api#sendvenue
  const sendVenue: Telegram.TelegramSendVenueMethod = Object.assign(
    async (
      req?: Telegram.TelegramSendVenueRequest,
      signal?: AbortSignal
    ): Promise<Telegram.TelegramSendVenueResponse> => {
      return makeRequest<Telegram.TelegramSendVenueResponse>(
        "/sendVenue",
        req ?? {},
        signal,
        TelegramSendVenueRequestSchema
      );
    },
    { schema: TelegramSendVenueRequestSchema }
  );

  // sig-ok: `bot{token}` is Telegram's auth prefix, not a method namespace.
  // POST https://api.telegram.org/bot{token}/sendVideo
  // Docs: https://core.telegram.org/bots/api#sendvideo
  const sendVideo: Telegram.TelegramSendVideoMethod = Object.assign(
    async (
      req?: Telegram.TelegramSendVideoRequest,
      signal?: AbortSignal
    ): Promise<Telegram.TelegramSendVideoResponse> => {
      return makeRequest<Telegram.TelegramSendVideoResponse>(
        "/sendVideo",
        req ?? {},
        signal,
        TelegramSendVideoRequestSchema
      );
    },
    { schema: TelegramSendVideoRequestSchema }
  );

  // sig-ok: `bot{token}` is Telegram's auth prefix, not a method namespace.
  // POST https://api.telegram.org/bot{token}/sendVideoNote
  // Docs: https://core.telegram.org/bots/api#sendvideonote
  const sendVideoNote: Telegram.TelegramSendVideoNoteMethod = Object.assign(
    async (
      req?: Telegram.TelegramSendVideoNoteRequest,
      signal?: AbortSignal
    ): Promise<Telegram.TelegramSendVideoNoteResponse> => {
      return makeRequest<Telegram.TelegramSendVideoNoteResponse>(
        "/sendVideoNote",
        req ?? {},
        signal,
        TelegramSendVideoNoteRequestSchema
      );
    },
    { schema: TelegramSendVideoNoteRequestSchema }
  );

  // sig-ok: `bot{token}` is Telegram's auth prefix, not a method namespace.
  // POST https://api.telegram.org/bot{token}/sendVoice
  // Docs: https://core.telegram.org/bots/api#sendvoice
  const sendVoice: Telegram.TelegramSendVoiceMethod = Object.assign(
    async (
      req?: Telegram.TelegramSendVoiceRequest,
      signal?: AbortSignal
    ): Promise<Telegram.TelegramSendVoiceResponse> => {
      return makeRequest<Telegram.TelegramSendVoiceResponse>(
        "/sendVoice",
        req ?? {},
        signal,
        TelegramSendVoiceRequestSchema
      );
    },
    { schema: TelegramSendVoiceRequestSchema }
  );

  // sig-ok: `bot{token}` is Telegram's auth prefix, not a method namespace.
  // POST https://api.telegram.org/bot{token}/setBusinessAccountBio
  // Docs: https://core.telegram.org/bots/api#setbusinessaccountbio
  const setBusinessAccountBio: Telegram.TelegramSetBusinessAccountBioMethod =
    Object.assign(
      async (
        req?: Telegram.TelegramSetBusinessAccountBioRequest,
        signal?: AbortSignal
      ): Promise<Telegram.TelegramSetBusinessAccountBioResponse> => {
        return makeRequest<Telegram.TelegramSetBusinessAccountBioResponse>(
          "/setBusinessAccountBio",
          req ?? {},
          signal,
          TelegramSetBusinessAccountBioRequestSchema
        );
      },
      { schema: TelegramSetBusinessAccountBioRequestSchema }
    );

  // sig-ok: `bot{token}` is Telegram's auth prefix, not a method namespace.
  // POST https://api.telegram.org/bot{token}/setBusinessAccountGiftSettings
  // Docs: https://core.telegram.org/bots/api#setbusinessaccountgiftsettings
  const setBusinessAccountGiftSettings: Telegram.TelegramSetBusinessAccountGiftSettingsMethod =
    Object.assign(
      async (
        req?: Telegram.TelegramSetBusinessAccountGiftSettingsRequest,
        signal?: AbortSignal
      ): Promise<Telegram.TelegramSetBusinessAccountGiftSettingsResponse> => {
        return makeRequest<Telegram.TelegramSetBusinessAccountGiftSettingsResponse>(
          "/setBusinessAccountGiftSettings",
          req ?? {},
          signal,
          TelegramSetBusinessAccountGiftSettingsRequestSchema
        );
      },
      { schema: TelegramSetBusinessAccountGiftSettingsRequestSchema }
    );

  // sig-ok: `bot{token}` is Telegram's auth prefix, not a method namespace.
  // POST https://api.telegram.org/bot{token}/setBusinessAccountName
  // Docs: https://core.telegram.org/bots/api#setbusinessaccountname
  const setBusinessAccountName: Telegram.TelegramSetBusinessAccountNameMethod =
    Object.assign(
      async (
        req?: Telegram.TelegramSetBusinessAccountNameRequest,
        signal?: AbortSignal
      ): Promise<Telegram.TelegramSetBusinessAccountNameResponse> => {
        return makeRequest<Telegram.TelegramSetBusinessAccountNameResponse>(
          "/setBusinessAccountName",
          req ?? {},
          signal,
          TelegramSetBusinessAccountNameRequestSchema
        );
      },
      { schema: TelegramSetBusinessAccountNameRequestSchema }
    );

  // sig-ok: `bot{token}` is Telegram's auth prefix, not a method namespace.
  // POST https://api.telegram.org/bot{token}/setBusinessAccountProfilePhoto
  // Docs: https://core.telegram.org/bots/api#setbusinessaccountprofilephoto
  const setBusinessAccountProfilePhoto: Telegram.TelegramSetBusinessAccountProfilePhotoMethod =
    Object.assign(
      async (
        req?: Telegram.TelegramSetBusinessAccountProfilePhotoRequest,
        signal?: AbortSignal
      ): Promise<Telegram.TelegramSetBusinessAccountProfilePhotoResponse> => {
        return makeRequest<Telegram.TelegramSetBusinessAccountProfilePhotoResponse>(
          "/setBusinessAccountProfilePhoto",
          req ?? {},
          signal,
          TelegramSetBusinessAccountProfilePhotoRequestSchema
        );
      },
      { schema: TelegramSetBusinessAccountProfilePhotoRequestSchema }
    );

  // sig-ok: `bot{token}` is Telegram's auth prefix, not a method namespace.
  // POST https://api.telegram.org/bot{token}/setBusinessAccountUsername
  // Docs: https://core.telegram.org/bots/api#setbusinessaccountusername
  const setBusinessAccountUsername: Telegram.TelegramSetBusinessAccountUsernameMethod =
    Object.assign(
      async (
        req?: Telegram.TelegramSetBusinessAccountUsernameRequest,
        signal?: AbortSignal
      ): Promise<Telegram.TelegramSetBusinessAccountUsernameResponse> => {
        return makeRequest<Telegram.TelegramSetBusinessAccountUsernameResponse>(
          "/setBusinessAccountUsername",
          req ?? {},
          signal,
          TelegramSetBusinessAccountUsernameRequestSchema
        );
      },
      { schema: TelegramSetBusinessAccountUsernameRequestSchema }
    );

  // sig-ok: `bot{token}` is Telegram's auth prefix, not a method namespace.
  // POST https://api.telegram.org/bot{token}/setChatAdministratorCustomTitle
  // Docs: https://core.telegram.org/bots/api#setchatadministratorcustomtitle
  const setChatAdministratorCustomTitle: Telegram.TelegramSetChatAdministratorCustomTitleMethod =
    Object.assign(
      async (
        req?: Telegram.TelegramSetChatAdministratorCustomTitleRequest,
        signal?: AbortSignal
      ): Promise<Telegram.TelegramSetChatAdministratorCustomTitleResponse> => {
        return makeRequest<Telegram.TelegramSetChatAdministratorCustomTitleResponse>(
          "/setChatAdministratorCustomTitle",
          req ?? {},
          signal,
          TelegramSetChatAdministratorCustomTitleRequestSchema
        );
      },
      { schema: TelegramSetChatAdministratorCustomTitleRequestSchema }
    );

  // sig-ok: `bot{token}` is Telegram's auth prefix, not a method namespace.
  // POST https://api.telegram.org/bot{token}/setChatDescription
  // Docs: https://core.telegram.org/bots/api#setchatdescription
  const setChatDescription: Telegram.TelegramSetChatDescriptionMethod =
    Object.assign(
      async (
        req?: Telegram.TelegramSetChatDescriptionRequest,
        signal?: AbortSignal
      ): Promise<Telegram.TelegramSetChatDescriptionResponse> => {
        return makeRequest<Telegram.TelegramSetChatDescriptionResponse>(
          "/setChatDescription",
          req ?? {},
          signal,
          TelegramSetChatDescriptionRequestSchema
        );
      },
      { schema: TelegramSetChatDescriptionRequestSchema }
    );

  // sig-ok: `bot{token}` is Telegram's auth prefix, not a method namespace.
  // POST https://api.telegram.org/bot{token}/setChatMemberTag
  // Docs: https://core.telegram.org/bots/api#setchatmembertag
  const setChatMemberTag: Telegram.TelegramSetChatMemberTagMethod =
    Object.assign(
      async (
        req?: Telegram.TelegramSetChatMemberTagRequest,
        signal?: AbortSignal
      ): Promise<Telegram.TelegramSetChatMemberTagResponse> => {
        return makeRequest<Telegram.TelegramSetChatMemberTagResponse>(
          "/setChatMemberTag",
          req ?? {},
          signal,
          TelegramSetChatMemberTagRequestSchema
        );
      },
      { schema: TelegramSetChatMemberTagRequestSchema }
    );

  // sig-ok: `bot{token}` is Telegram's auth prefix, not a method namespace.
  // POST https://api.telegram.org/bot{token}/setChatMenuButton
  // Docs: https://core.telegram.org/bots/api#setchatmenubutton
  const setChatMenuButton: Telegram.TelegramSetChatMenuButtonMethod =
    Object.assign(
      async (
        req?: Telegram.TelegramSetChatMenuButtonRequest,
        signal?: AbortSignal
      ): Promise<Telegram.TelegramSetChatMenuButtonResponse> => {
        return makeRequest<Telegram.TelegramSetChatMenuButtonResponse>(
          "/setChatMenuButton",
          req ?? {},
          signal,
          TelegramSetChatMenuButtonRequestSchema
        );
      },
      { schema: TelegramSetChatMenuButtonRequestSchema }
    );

  // sig-ok: `bot{token}` is Telegram's auth prefix, not a method namespace.
  // POST https://api.telegram.org/bot{token}/setChatPermissions
  // Docs: https://core.telegram.org/bots/api#setchatpermissions
  const setChatPermissions: Telegram.TelegramSetChatPermissionsMethod =
    Object.assign(
      async (
        req?: Telegram.TelegramSetChatPermissionsRequest,
        signal?: AbortSignal
      ): Promise<Telegram.TelegramSetChatPermissionsResponse> => {
        return makeRequest<Telegram.TelegramSetChatPermissionsResponse>(
          "/setChatPermissions",
          req ?? {},
          signal,
          TelegramSetChatPermissionsRequestSchema
        );
      },
      { schema: TelegramSetChatPermissionsRequestSchema }
    );

  // sig-ok: `bot{token}` is Telegram's auth prefix, not a method namespace.
  // POST https://api.telegram.org/bot{token}/setChatPhoto
  // Docs: https://core.telegram.org/bots/api#setchatphoto
  const setChatPhoto: Telegram.TelegramSetChatPhotoMethod = Object.assign(
    async (
      req?: Telegram.TelegramSetChatPhotoRequest,
      signal?: AbortSignal
    ): Promise<Telegram.TelegramSetChatPhotoResponse> => {
      return makeRequest<Telegram.TelegramSetChatPhotoResponse>(
        "/setChatPhoto",
        req ?? {},
        signal,
        TelegramSetChatPhotoRequestSchema
      );
    },
    { schema: TelegramSetChatPhotoRequestSchema }
  );

  // sig-ok: `bot{token}` is Telegram's auth prefix, not a method namespace.
  // POST https://api.telegram.org/bot{token}/setChatStickerSet
  // Docs: https://core.telegram.org/bots/api#setchatstickerset
  const setChatStickerSet: Telegram.TelegramSetChatStickerSetMethod =
    Object.assign(
      async (
        req?: Telegram.TelegramSetChatStickerSetRequest,
        signal?: AbortSignal
      ): Promise<Telegram.TelegramSetChatStickerSetResponse> => {
        return makeRequest<Telegram.TelegramSetChatStickerSetResponse>(
          "/setChatStickerSet",
          req ?? {},
          signal,
          TelegramSetChatStickerSetRequestSchema
        );
      },
      { schema: TelegramSetChatStickerSetRequestSchema }
    );

  // sig-ok: `bot{token}` is Telegram's auth prefix, not a method namespace.
  // POST https://api.telegram.org/bot{token}/setChatTitle
  // Docs: https://core.telegram.org/bots/api#setchattitle
  const setChatTitle: Telegram.TelegramSetChatTitleMethod = Object.assign(
    async (
      req?: Telegram.TelegramSetChatTitleRequest,
      signal?: AbortSignal
    ): Promise<Telegram.TelegramSetChatTitleResponse> => {
      return makeRequest<Telegram.TelegramSetChatTitleResponse>(
        "/setChatTitle",
        req ?? {},
        signal,
        TelegramSetChatTitleRequestSchema
      );
    },
    { schema: TelegramSetChatTitleRequestSchema }
  );

  // sig-ok: `bot{token}` is Telegram's auth prefix, not a method namespace.
  // POST https://api.telegram.org/bot{token}/setCustomEmojiStickerSetThumbnail
  // Docs: https://core.telegram.org/bots/api#setcustomemojistickersetthumbnail
  const setCustomEmojiStickerSetThumbnail: Telegram.TelegramSetCustomEmojiStickerSetThumbnailMethod =
    Object.assign(
      async (
        req?: Telegram.TelegramSetCustomEmojiStickerSetThumbnailRequest,
        signal?: AbortSignal
      ): Promise<Telegram.TelegramSetCustomEmojiStickerSetThumbnailResponse> => {
        return makeRequest<Telegram.TelegramSetCustomEmojiStickerSetThumbnailResponse>(
          "/setCustomEmojiStickerSetThumbnail",
          req ?? {},
          signal,
          TelegramSetCustomEmojiStickerSetThumbnailRequestSchema
        );
      },
      { schema: TelegramSetCustomEmojiStickerSetThumbnailRequestSchema }
    );

  // sig-ok: `bot{token}` is Telegram's auth prefix, not a method namespace.
  // POST https://api.telegram.org/bot{token}/setGameScore
  // Docs: https://core.telegram.org/bots/api#setgamescore
  const setGameScore: Telegram.TelegramSetGameScoreMethod = Object.assign(
    async (
      req?: Telegram.TelegramSetGameScoreRequest,
      signal?: AbortSignal
    ): Promise<Telegram.TelegramSetGameScoreResponse> => {
      return makeRequest<Telegram.TelegramSetGameScoreResponse>(
        "/setGameScore",
        req ?? {},
        signal,
        TelegramSetGameScoreRequestSchema
      );
    },
    { schema: TelegramSetGameScoreRequestSchema }
  );

  // sig-ok: `bot{token}` is Telegram's auth prefix, not a method namespace.
  // POST https://api.telegram.org/bot{token}/setManagedBotAccessSettings
  // Docs: https://core.telegram.org/bots/api#setmanagedbotaccesssettings
  const setManagedBotAccessSettings: Telegram.TelegramSetManagedBotAccessSettingsMethod =
    Object.assign(
      async (
        req?: Telegram.TelegramSetManagedBotAccessSettingsRequest,
        signal?: AbortSignal
      ): Promise<Telegram.TelegramSetManagedBotAccessSettingsResponse> => {
        return makeRequest<Telegram.TelegramSetManagedBotAccessSettingsResponse>(
          "/setManagedBotAccessSettings",
          req ?? {},
          signal,
          TelegramSetManagedBotAccessSettingsRequestSchema
        );
      },
      { schema: TelegramSetManagedBotAccessSettingsRequestSchema }
    );

  // sig-ok: `bot{token}` is Telegram's auth prefix, not a method namespace.
  // POST https://api.telegram.org/bot{token}/setMessageReaction
  // Docs: https://core.telegram.org/bots/api#setmessagereaction
  const setMessageReaction: Telegram.TelegramSetMessageReactionMethod =
    Object.assign(
      async (
        req?: Telegram.TelegramSetMessageReactionRequest,
        signal?: AbortSignal
      ): Promise<Telegram.TelegramSetMessageReactionResponse> => {
        return makeRequest<Telegram.TelegramSetMessageReactionResponse>(
          "/setMessageReaction",
          req ?? {},
          signal,
          TelegramSetMessageReactionRequestSchema
        );
      },
      { schema: TelegramSetMessageReactionRequestSchema }
    );

  // sig-ok: `bot{token}` is Telegram's auth prefix, not a method namespace.
  // POST https://api.telegram.org/bot{token}/setMyCommands
  // Docs: https://core.telegram.org/bots/api#setmycommands
  const setMyCommands: Telegram.TelegramSetMyCommandsMethod = Object.assign(
    async (
      req?: Telegram.TelegramSetMyCommandsRequest,
      signal?: AbortSignal
    ): Promise<Telegram.TelegramSetMyCommandsResponse> => {
      return makeRequest<Telegram.TelegramSetMyCommandsResponse>(
        "/setMyCommands",
        req ?? {},
        signal,
        TelegramSetMyCommandsRequestSchema
      );
    },
    { schema: TelegramSetMyCommandsRequestSchema }
  );

  // sig-ok: `bot{token}` is Telegram's auth prefix, not a method namespace.
  // POST https://api.telegram.org/bot{token}/setMyDefaultAdministratorRights
  // Docs: https://core.telegram.org/bots/api#setmydefaultadministratorrights
  const setMyDefaultAdministratorRights: Telegram.TelegramSetMyDefaultAdministratorRightsMethod =
    Object.assign(
      async (
        req?: Telegram.TelegramSetMyDefaultAdministratorRightsRequest,
        signal?: AbortSignal
      ): Promise<Telegram.TelegramSetMyDefaultAdministratorRightsResponse> => {
        return makeRequest<Telegram.TelegramSetMyDefaultAdministratorRightsResponse>(
          "/setMyDefaultAdministratorRights",
          req ?? {},
          signal,
          TelegramSetMyDefaultAdministratorRightsRequestSchema
        );
      },
      { schema: TelegramSetMyDefaultAdministratorRightsRequestSchema }
    );

  // sig-ok: `bot{token}` is Telegram's auth prefix, not a method namespace.
  // POST https://api.telegram.org/bot{token}/setMyDescription
  // Docs: https://core.telegram.org/bots/api#setmydescription
  const setMyDescription: Telegram.TelegramSetMyDescriptionMethod =
    Object.assign(
      async (
        req?: Telegram.TelegramSetMyDescriptionRequest,
        signal?: AbortSignal
      ): Promise<Telegram.TelegramSetMyDescriptionResponse> => {
        return makeRequest<Telegram.TelegramSetMyDescriptionResponse>(
          "/setMyDescription",
          req ?? {},
          signal,
          TelegramSetMyDescriptionRequestSchema
        );
      },
      { schema: TelegramSetMyDescriptionRequestSchema }
    );

  // sig-ok: `bot{token}` is Telegram's auth prefix, not a method namespace.
  // POST https://api.telegram.org/bot{token}/setMyName
  // Docs: https://core.telegram.org/bots/api#setmyname
  const setMyName: Telegram.TelegramSetMyNameMethod = Object.assign(
    async (
      req?: Telegram.TelegramSetMyNameRequest,
      signal?: AbortSignal
    ): Promise<Telegram.TelegramSetMyNameResponse> => {
      return makeRequest<Telegram.TelegramSetMyNameResponse>(
        "/setMyName",
        req ?? {},
        signal,
        TelegramSetMyNameRequestSchema
      );
    },
    { schema: TelegramSetMyNameRequestSchema }
  );

  // sig-ok: `bot{token}` is Telegram's auth prefix, not a method namespace.
  // POST https://api.telegram.org/bot{token}/setMyShortDescription
  // Docs: https://core.telegram.org/bots/api#setmyshortdescription
  const setMyShortDescription: Telegram.TelegramSetMyShortDescriptionMethod =
    Object.assign(
      async (
        req?: Telegram.TelegramSetMyShortDescriptionRequest,
        signal?: AbortSignal
      ): Promise<Telegram.TelegramSetMyShortDescriptionResponse> => {
        return makeRequest<Telegram.TelegramSetMyShortDescriptionResponse>(
          "/setMyShortDescription",
          req ?? {},
          signal,
          TelegramSetMyShortDescriptionRequestSchema
        );
      },
      { schema: TelegramSetMyShortDescriptionRequestSchema }
    );

  // sig-ok: `bot{token}` is Telegram's auth prefix, not a method namespace.
  // POST https://api.telegram.org/bot{token}/setPassportDataErrors
  // Docs: https://core.telegram.org/bots/api#setpassportdataerrors
  const setPassportDataErrors: Telegram.TelegramSetPassportDataErrorsMethod =
    Object.assign(
      async (
        req?: Telegram.TelegramSetPassportDataErrorsRequest,
        signal?: AbortSignal
      ): Promise<Telegram.TelegramSetPassportDataErrorsResponse> => {
        return makeRequest<Telegram.TelegramSetPassportDataErrorsResponse>(
          "/setPassportDataErrors",
          req ?? {},
          signal,
          TelegramSetPassportDataErrorsRequestSchema
        );
      },
      { schema: TelegramSetPassportDataErrorsRequestSchema }
    );

  // sig-ok: `bot{token}` is Telegram's auth prefix, not a method namespace.
  // POST https://api.telegram.org/bot{token}/setStickerEmojiList
  // Docs: https://core.telegram.org/bots/api#setstickeremojilist
  const setStickerEmojiList: Telegram.TelegramSetStickerEmojiListMethod =
    Object.assign(
      async (
        req?: Telegram.TelegramSetStickerEmojiListRequest,
        signal?: AbortSignal
      ): Promise<Telegram.TelegramSetStickerEmojiListResponse> => {
        return makeRequest<Telegram.TelegramSetStickerEmojiListResponse>(
          "/setStickerEmojiList",
          req ?? {},
          signal,
          TelegramSetStickerEmojiListRequestSchema
        );
      },
      { schema: TelegramSetStickerEmojiListRequestSchema }
    );

  // sig-ok: `bot{token}` is Telegram's auth prefix, not a method namespace.
  // POST https://api.telegram.org/bot{token}/setStickerKeywords
  // Docs: https://core.telegram.org/bots/api#setstickerkeywords
  const setStickerKeywords: Telegram.TelegramSetStickerKeywordsMethod =
    Object.assign(
      async (
        req?: Telegram.TelegramSetStickerKeywordsRequest,
        signal?: AbortSignal
      ): Promise<Telegram.TelegramSetStickerKeywordsResponse> => {
        return makeRequest<Telegram.TelegramSetStickerKeywordsResponse>(
          "/setStickerKeywords",
          req ?? {},
          signal,
          TelegramSetStickerKeywordsRequestSchema
        );
      },
      { schema: TelegramSetStickerKeywordsRequestSchema }
    );

  // sig-ok: `bot{token}` is Telegram's auth prefix, not a method namespace.
  // POST https://api.telegram.org/bot{token}/setStickerMaskPosition
  // Docs: https://core.telegram.org/bots/api#setstickermaskposition
  const setStickerMaskPosition: Telegram.TelegramSetStickerMaskPositionMethod =
    Object.assign(
      async (
        req?: Telegram.TelegramSetStickerMaskPositionRequest,
        signal?: AbortSignal
      ): Promise<Telegram.TelegramSetStickerMaskPositionResponse> => {
        return makeRequest<Telegram.TelegramSetStickerMaskPositionResponse>(
          "/setStickerMaskPosition",
          req ?? {},
          signal,
          TelegramSetStickerMaskPositionRequestSchema
        );
      },
      { schema: TelegramSetStickerMaskPositionRequestSchema }
    );

  // sig-ok: `bot{token}` is Telegram's auth prefix, not a method namespace.
  // POST https://api.telegram.org/bot{token}/setStickerPositionInSet
  // Docs: https://core.telegram.org/bots/api#setstickerpositioninset
  const setStickerPositionInSet: Telegram.TelegramSetStickerPositionInSetMethod =
    Object.assign(
      async (
        req?: Telegram.TelegramSetStickerPositionInSetRequest,
        signal?: AbortSignal
      ): Promise<Telegram.TelegramSetStickerPositionInSetResponse> => {
        return makeRequest<Telegram.TelegramSetStickerPositionInSetResponse>(
          "/setStickerPositionInSet",
          req ?? {},
          signal,
          TelegramSetStickerPositionInSetRequestSchema
        );
      },
      { schema: TelegramSetStickerPositionInSetRequestSchema }
    );

  // sig-ok: `bot{token}` is Telegram's auth prefix, not a method namespace.
  // POST https://api.telegram.org/bot{token}/setStickerSetThumbnail
  // Docs: https://core.telegram.org/bots/api#setstickersetthumbnail
  const setStickerSetThumbnail: Telegram.TelegramSetStickerSetThumbnailMethod =
    Object.assign(
      async (
        req?: Telegram.TelegramSetStickerSetThumbnailRequest,
        signal?: AbortSignal
      ): Promise<Telegram.TelegramSetStickerSetThumbnailResponse> => {
        return makeRequest<Telegram.TelegramSetStickerSetThumbnailResponse>(
          "/setStickerSetThumbnail",
          req ?? {},
          signal,
          TelegramSetStickerSetThumbnailRequestSchema
        );
      },
      { schema: TelegramSetStickerSetThumbnailRequestSchema }
    );

  // sig-ok: `bot{token}` is Telegram's auth prefix, not a method namespace.
  // POST https://api.telegram.org/bot{token}/setStickerSetTitle
  // Docs: https://core.telegram.org/bots/api#setstickersettitle
  const setStickerSetTitle: Telegram.TelegramSetStickerSetTitleMethod =
    Object.assign(
      async (
        req?: Telegram.TelegramSetStickerSetTitleRequest,
        signal?: AbortSignal
      ): Promise<Telegram.TelegramSetStickerSetTitleResponse> => {
        return makeRequest<Telegram.TelegramSetStickerSetTitleResponse>(
          "/setStickerSetTitle",
          req ?? {},
          signal,
          TelegramSetStickerSetTitleRequestSchema
        );
      },
      { schema: TelegramSetStickerSetTitleRequestSchema }
    );

  // sig-ok: `bot{token}` is Telegram's auth prefix, not a method namespace.
  // POST https://api.telegram.org/bot{token}/setUserEmojiStatus
  // Docs: https://core.telegram.org/bots/api#setuseremojistatus
  const setUserEmojiStatus: Telegram.TelegramSetUserEmojiStatusMethod =
    Object.assign(
      async (
        req?: Telegram.TelegramSetUserEmojiStatusRequest,
        signal?: AbortSignal
      ): Promise<Telegram.TelegramSetUserEmojiStatusResponse> => {
        return makeRequest<Telegram.TelegramSetUserEmojiStatusResponse>(
          "/setUserEmojiStatus",
          req ?? {},
          signal,
          TelegramSetUserEmojiStatusRequestSchema
        );
      },
      { schema: TelegramSetUserEmojiStatusRequestSchema }
    );

  // sig-ok: `bot{token}` is Telegram's auth prefix, not a method namespace.
  // POST https://api.telegram.org/bot{token}/setWebhook
  // Docs: https://core.telegram.org/bots/api#setwebhook
  const setWebhook: Telegram.TelegramSetWebhookMethod = Object.assign(
    async (
      req?: Telegram.TelegramSetWebhookRequest,
      signal?: AbortSignal
    ): Promise<Telegram.TelegramSetWebhookResponse> => {
      return makeRequest<Telegram.TelegramSetWebhookResponse>(
        "/setWebhook",
        req ?? {},
        signal,
        TelegramSetWebhookRequestSchema
      );
    },
    { schema: TelegramSetWebhookRequestSchema }
  );

  // sig-ok: `bot{token}` is Telegram's auth prefix, not a method namespace.
  // POST https://api.telegram.org/bot{token}/stopMessageLiveLocation
  // Docs: https://core.telegram.org/bots/api#stopmessagelivelocation
  const stopMessageLiveLocation: Telegram.TelegramStopMessageLiveLocationMethod =
    Object.assign(
      async (
        req?: Telegram.TelegramStopMessageLiveLocationRequest,
        signal?: AbortSignal
      ): Promise<Telegram.TelegramStopMessageLiveLocationResponse> => {
        return makeRequest<Telegram.TelegramStopMessageLiveLocationResponse>(
          "/stopMessageLiveLocation",
          req ?? {},
          signal,
          TelegramStopMessageLiveLocationRequestSchema
        );
      },
      { schema: TelegramStopMessageLiveLocationRequestSchema }
    );

  // sig-ok: `bot{token}` is Telegram's auth prefix, not a method namespace.
  // POST https://api.telegram.org/bot{token}/stopPoll
  // Docs: https://core.telegram.org/bots/api#stoppoll
  const stopPoll: Telegram.TelegramStopPollMethod = Object.assign(
    async (
      req?: Telegram.TelegramStopPollRequest,
      signal?: AbortSignal
    ): Promise<Telegram.TelegramStopPollResponse> => {
      return makeRequest<Telegram.TelegramStopPollResponse>(
        "/stopPoll",
        req ?? {},
        signal,
        TelegramStopPollRequestSchema
      );
    },
    { schema: TelegramStopPollRequestSchema }
  );

  // sig-ok: `bot{token}` is Telegram's auth prefix, not a method namespace.
  // POST https://api.telegram.org/bot{token}/transferBusinessAccountStars
  // Docs: https://core.telegram.org/bots/api#transferbusinessaccountstars
  const transferBusinessAccountStars: Telegram.TelegramTransferBusinessAccountStarsMethod =
    Object.assign(
      async (
        req?: Telegram.TelegramTransferBusinessAccountStarsRequest,
        signal?: AbortSignal
      ): Promise<Telegram.TelegramTransferBusinessAccountStarsResponse> => {
        return makeRequest<Telegram.TelegramTransferBusinessAccountStarsResponse>(
          "/transferBusinessAccountStars",
          req ?? {},
          signal,
          TelegramTransferBusinessAccountStarsRequestSchema
        );
      },
      { schema: TelegramTransferBusinessAccountStarsRequestSchema }
    );

  // sig-ok: `bot{token}` is Telegram's auth prefix, not a method namespace.
  // POST https://api.telegram.org/bot{token}/transferGift
  // Docs: https://core.telegram.org/bots/api#transfergift
  const transferGift: Telegram.TelegramTransferGiftMethod = Object.assign(
    async (
      req?: Telegram.TelegramTransferGiftRequest,
      signal?: AbortSignal
    ): Promise<Telegram.TelegramTransferGiftResponse> => {
      return makeRequest<Telegram.TelegramTransferGiftResponse>(
        "/transferGift",
        req ?? {},
        signal,
        TelegramTransferGiftRequestSchema
      );
    },
    { schema: TelegramTransferGiftRequestSchema }
  );

  // sig-ok: `bot{token}` is Telegram's auth prefix, not a method namespace.
  // POST https://api.telegram.org/bot{token}/unbanChatMember
  // Docs: https://core.telegram.org/bots/api#unbanchatmember
  const unbanChatMember: Telegram.TelegramUnbanChatMemberMethod = Object.assign(
    async (
      req?: Telegram.TelegramUnbanChatMemberRequest,
      signal?: AbortSignal
    ): Promise<Telegram.TelegramUnbanChatMemberResponse> => {
      return makeRequest<Telegram.TelegramUnbanChatMemberResponse>(
        "/unbanChatMember",
        req ?? {},
        signal,
        TelegramUnbanChatMemberRequestSchema
      );
    },
    { schema: TelegramUnbanChatMemberRequestSchema }
  );

  // sig-ok: `bot{token}` is Telegram's auth prefix, not a method namespace.
  // POST https://api.telegram.org/bot{token}/unbanChatSenderChat
  // Docs: https://core.telegram.org/bots/api#unbanchatsenderchat
  const unbanChatSenderChat: Telegram.TelegramUnbanChatSenderChatMethod =
    Object.assign(
      async (
        req?: Telegram.TelegramUnbanChatSenderChatRequest,
        signal?: AbortSignal
      ): Promise<Telegram.TelegramUnbanChatSenderChatResponse> => {
        return makeRequest<Telegram.TelegramUnbanChatSenderChatResponse>(
          "/unbanChatSenderChat",
          req ?? {},
          signal,
          TelegramUnbanChatSenderChatRequestSchema
        );
      },
      { schema: TelegramUnbanChatSenderChatRequestSchema }
    );

  // sig-ok: `bot{token}` is Telegram's auth prefix, not a method namespace.
  // POST https://api.telegram.org/bot{token}/unhideGeneralForumTopic
  // Docs: https://core.telegram.org/bots/api#unhidegeneralforumtopic
  const unhideGeneralForumTopic: Telegram.TelegramUnhideGeneralForumTopicMethod =
    Object.assign(
      async (
        req?: Telegram.TelegramUnhideGeneralForumTopicRequest,
        signal?: AbortSignal
      ): Promise<Telegram.TelegramUnhideGeneralForumTopicResponse> => {
        return makeRequest<Telegram.TelegramUnhideGeneralForumTopicResponse>(
          "/unhideGeneralForumTopic",
          req ?? {},
          signal,
          TelegramUnhideGeneralForumTopicRequestSchema
        );
      },
      { schema: TelegramUnhideGeneralForumTopicRequestSchema }
    );

  // sig-ok: `bot{token}` is Telegram's auth prefix, not a method namespace.
  // POST https://api.telegram.org/bot{token}/unpinAllChatMessages
  // Docs: https://core.telegram.org/bots/api#unpinallchatmessages
  const unpinAllChatMessages: Telegram.TelegramUnpinAllChatMessagesMethod =
    Object.assign(
      async (
        req?: Telegram.TelegramUnpinAllChatMessagesRequest,
        signal?: AbortSignal
      ): Promise<Telegram.TelegramUnpinAllChatMessagesResponse> => {
        return makeRequest<Telegram.TelegramUnpinAllChatMessagesResponse>(
          "/unpinAllChatMessages",
          req ?? {},
          signal,
          TelegramUnpinAllChatMessagesRequestSchema
        );
      },
      { schema: TelegramUnpinAllChatMessagesRequestSchema }
    );

  // sig-ok: `bot{token}` is Telegram's auth prefix, not a method namespace.
  // POST https://api.telegram.org/bot{token}/unpinAllForumTopicMessages
  // Docs: https://core.telegram.org/bots/api#unpinallforumtopicmessages
  const unpinAllForumTopicMessages: Telegram.TelegramUnpinAllForumTopicMessagesMethod =
    Object.assign(
      async (
        req?: Telegram.TelegramUnpinAllForumTopicMessagesRequest,
        signal?: AbortSignal
      ): Promise<Telegram.TelegramUnpinAllForumTopicMessagesResponse> => {
        return makeRequest<Telegram.TelegramUnpinAllForumTopicMessagesResponse>(
          "/unpinAllForumTopicMessages",
          req ?? {},
          signal,
          TelegramUnpinAllForumTopicMessagesRequestSchema
        );
      },
      { schema: TelegramUnpinAllForumTopicMessagesRequestSchema }
    );

  // sig-ok: `bot{token}` is Telegram's auth prefix, not a method namespace.
  // POST https://api.telegram.org/bot{token}/unpinAllGeneralForumTopicMessages
  // Docs: https://core.telegram.org/bots/api#unpinallgeneralforumtopicmessages
  const unpinAllGeneralForumTopicMessages: Telegram.TelegramUnpinAllGeneralForumTopicMessagesMethod =
    Object.assign(
      async (
        req?: Telegram.TelegramUnpinAllGeneralForumTopicMessagesRequest,
        signal?: AbortSignal
      ): Promise<Telegram.TelegramUnpinAllGeneralForumTopicMessagesResponse> => {
        return makeRequest<Telegram.TelegramUnpinAllGeneralForumTopicMessagesResponse>(
          "/unpinAllGeneralForumTopicMessages",
          req ?? {},
          signal,
          TelegramUnpinAllGeneralForumTopicMessagesRequestSchema
        );
      },
      { schema: TelegramUnpinAllGeneralForumTopicMessagesRequestSchema }
    );

  // sig-ok: `bot{token}` is Telegram's auth prefix, not a method namespace.
  // POST https://api.telegram.org/bot{token}/unpinChatMessage
  // Docs: https://core.telegram.org/bots/api#unpinchatmessage
  const unpinChatMessage: Telegram.TelegramUnpinChatMessageMethod =
    Object.assign(
      async (
        req?: Telegram.TelegramUnpinChatMessageRequest,
        signal?: AbortSignal
      ): Promise<Telegram.TelegramUnpinChatMessageResponse> => {
        return makeRequest<Telegram.TelegramUnpinChatMessageResponse>(
          "/unpinChatMessage",
          req ?? {},
          signal,
          TelegramUnpinChatMessageRequestSchema
        );
      },
      { schema: TelegramUnpinChatMessageRequestSchema }
    );

  // sig-ok: `bot{token}` is Telegram's auth prefix, not a method namespace.
  // POST https://api.telegram.org/bot{token}/upgradeGift
  // Docs: https://core.telegram.org/bots/api#upgradegift
  const upgradeGift: Telegram.TelegramUpgradeGiftMethod = Object.assign(
    async (
      req?: Telegram.TelegramUpgradeGiftRequest,
      signal?: AbortSignal
    ): Promise<Telegram.TelegramUpgradeGiftResponse> => {
      return makeRequest<Telegram.TelegramUpgradeGiftResponse>(
        "/upgradeGift",
        req ?? {},
        signal,
        TelegramUpgradeGiftRequestSchema
      );
    },
    { schema: TelegramUpgradeGiftRequestSchema }
  );

  // sig-ok: `bot{token}` is Telegram's auth prefix, not a method namespace.
  // POST https://api.telegram.org/bot{token}/uploadStickerFile
  // Docs: https://core.telegram.org/bots/api#uploadstickerfile
  const uploadStickerFile: Telegram.TelegramUploadStickerFileMethod =
    Object.assign(
      async (
        req?: Telegram.TelegramUploadStickerFileRequest,
        signal?: AbortSignal
      ): Promise<Telegram.TelegramUploadStickerFileResponse> => {
        return makeRequest<Telegram.TelegramUploadStickerFileResponse>(
          "/uploadStickerFile",
          req ?? {},
          signal,
          TelegramUploadStickerFileRequestSchema
        );
      },
      { schema: TelegramUploadStickerFileRequestSchema }
    );

  // sig-ok: `bot{token}` is Telegram's auth prefix, not a method namespace.
  // POST https://api.telegram.org/bot{token}/verifyChat
  // Docs: https://core.telegram.org/bots/api#verifychat
  const verifyChat: Telegram.TelegramVerifyChatMethod = Object.assign(
    async (
      req?: Telegram.TelegramVerifyChatRequest,
      signal?: AbortSignal
    ): Promise<Telegram.TelegramVerifyChatResponse> => {
      return makeRequest<Telegram.TelegramVerifyChatResponse>(
        "/verifyChat",
        req ?? {},
        signal,
        TelegramVerifyChatRequestSchema
      );
    },
    { schema: TelegramVerifyChatRequestSchema }
  );

  // sig-ok: `bot{token}` is Telegram's auth prefix, not a method namespace.
  // POST https://api.telegram.org/bot{token}/verifyUser
  // Docs: https://core.telegram.org/bots/api#verifyuser
  const verifyUser: Telegram.TelegramVerifyUserMethod = Object.assign(
    async (
      req?: Telegram.TelegramVerifyUserRequest,
      signal?: AbortSignal
    ): Promise<Telegram.TelegramVerifyUserResponse> => {
      return makeRequest<Telegram.TelegramVerifyUserResponse>(
        "/verifyUser",
        req ?? {},
        signal,
        TelegramVerifyUserRequestSchema
      );
    },
    { schema: TelegramVerifyUserRequestSchema }
  );

  // sig-ok: `bot{token}` is Telegram's auth prefix, not a method namespace.
  // POST https://api.telegram.org/bot{token}/approveSuggestedPost
  // Docs: https://core.telegram.org/bots/api#approvesuggestedpost
  const approveSuggestedPost: Telegram.TelegramApproveSuggestedPostMethod =
    Object.assign(
      async (
        req?: Telegram.TelegramApproveSuggestedPostRequest,
        signal?: AbortSignal
      ): Promise<Telegram.TelegramApproveSuggestedPostResponse> => {
        return makeRequest<Telegram.TelegramApproveSuggestedPostResponse>(
          "/approveSuggestedPost",
          req ?? {},
          signal,
          TelegramApproveSuggestedPostRequestSchema
        );
      },
      { schema: TelegramApproveSuggestedPostRequestSchema }
    );

  // sig-ok: `bot{token}` is Telegram's auth prefix, not a method namespace.
  // POST https://api.telegram.org/bot{token}/declineSuggestedPost
  // Docs: https://core.telegram.org/bots/api#declinesuggestedpost
  const declineSuggestedPost: Telegram.TelegramDeclineSuggestedPostMethod =
    Object.assign(
      async (
        req?: Telegram.TelegramDeclineSuggestedPostRequest,
        signal?: AbortSignal
      ): Promise<Telegram.TelegramDeclineSuggestedPostResponse> => {
        return makeRequest<Telegram.TelegramDeclineSuggestedPostResponse>(
          "/declineSuggestedPost",
          req ?? {},
          signal,
          TelegramDeclineSuggestedPostRequestSchema
        );
      },
      { schema: TelegramDeclineSuggestedPostRequestSchema }
    );

  // sig-ok: `bot{token}` is Telegram's auth prefix, not a method namespace.
  // POST https://api.telegram.org/bot{token}/getUserProfileAudios
  // Docs: https://core.telegram.org/bots/api#getuserprofileaudios
  const getUserProfileAudios: Telegram.TelegramGetUserProfileAudiosMethod =
    Object.assign(
      async (
        req?: Telegram.TelegramGetUserProfileAudiosRequest,
        signal?: AbortSignal
      ): Promise<Telegram.TelegramGetUserProfileAudiosResponse> => {
        return makeRequest<Telegram.TelegramGetUserProfileAudiosResponse>(
          "/getUserProfileAudios",
          req ?? {},
          signal,
          TelegramGetUserProfileAudiosRequestSchema
        );
      },
      { schema: TelegramGetUserProfileAudiosRequestSchema }
    );

  // sig-ok: `bot{token}` is Telegram's auth prefix, not a method namespace.
  // POST https://api.telegram.org/bot{token}/getUserProfilePhotos
  // Docs: https://core.telegram.org/bots/api#getuserprofilephotos
  const getUserProfilePhotos: Telegram.TelegramGetUserProfilePhotosMethod =
    Object.assign(
      async (
        req?: Telegram.TelegramGetUserProfilePhotosRequest,
        signal?: AbortSignal
      ): Promise<Telegram.TelegramGetUserProfilePhotosResponse> => {
        return makeRequest<Telegram.TelegramGetUserProfilePhotosResponse>(
          "/getUserProfilePhotos",
          req ?? {},
          signal,
          TelegramGetUserProfilePhotosRequestSchema
        );
      },
      { schema: TelegramGetUserProfilePhotosRequestSchema }
    );

  // sig-ok: `bot{token}` is Telegram's auth prefix, not a method namespace.
  // POST https://api.telegram.org/bot{token}/removeMyProfilePhoto
  // Docs: https://core.telegram.org/bots/api#removemyprofilephoto
  const removeMyProfilePhoto: Telegram.TelegramRemoveMyProfilePhotoMethod =
    Object.assign(
      async (
        req?: Telegram.TelegramRemoveMyProfilePhotoRequest,
        signal?: AbortSignal
      ): Promise<Telegram.TelegramRemoveMyProfilePhotoResponse> => {
        return makeRequest<Telegram.TelegramRemoveMyProfilePhotoResponse>(
          "/removeMyProfilePhoto",
          req ?? {},
          signal,
          TelegramRemoveMyProfilePhotoRequestSchema
        );
      },
      { schema: TelegramRemoveMyProfilePhotoRequestSchema }
    );

  // sig-ok: `bot{token}` is Telegram's auth prefix, not a method namespace.
  // POST https://api.telegram.org/bot{token}/setMyProfilePhoto
  // Docs: https://core.telegram.org/bots/api#setmyprofilephoto
  const setMyProfilePhoto: Telegram.TelegramSetMyProfilePhotoMethod =
    Object.assign(
      async (
        req?: Telegram.TelegramSetMyProfilePhotoRequest,
        signal?: AbortSignal
      ): Promise<Telegram.TelegramSetMyProfilePhotoResponse> => {
        return makeRequest<Telegram.TelegramSetMyProfilePhotoResponse>(
          "/setMyProfilePhoto",
          req ?? {},
          signal,
          TelegramSetMyProfilePhotoRequestSchema
        );
      },
      { schema: TelegramSetMyProfilePhotoRequestSchema }
    );

  const post: Telegram.TelegramPostNamespace = {
    approveSuggestedPost,
    declineSuggestedPost,
    getUserProfileAudios,
    getUserProfilePhotos,
    removeMyProfilePhoto,
    setMyProfilePhoto,
    addStickerToSet,
    answerCallbackQuery,
    answerChatJoinRequestQuery,
    answerGuestQuery,
    answerInlineQuery,
    answerPreCheckoutQuery,
    answerShippingQuery,
    answerWebAppQuery,
    approveChatJoinRequest,
    banChatMember,
    banChatSenderChat,
    close,
    closeForumTopic,
    closeGeneralForumTopic,
    convertGiftToStars,
    copyMessage,
    copyMessages,
    createChatInviteLink,
    createChatSubscriptionInviteLink,
    createForumTopic,
    createInvoiceLink,
    createNewStickerSet,
    declineChatJoinRequest,
    deleteAllMessageReactions,
    deleteBusinessMessages,
    deleteChatPhoto,
    deleteChatStickerSet,
    deleteForumTopic,
    deleteMessage,
    deleteMessageReaction,
    deleteMessages,
    deleteMyCommands,
    deleteStickerFromSet,
    deleteStickerSet,
    deleteStory,
    deleteWebhook,
    editChatInviteLink,
    editChatSubscriptionInviteLink,
    editForumTopic,
    editGeneralForumTopic,
    editMessageCaption,
    editMessageChecklist,
    editMessageLiveLocation,
    editMessageMedia,
    editMessageReplyMarkup,
    editMessageText,
    editStory,
    editUserStarSubscription,
    exportChatInviteLink,
    forwardMessage,
    forwardMessages,
    getAvailableGifts,
    getBusinessAccountGifts,
    getBusinessAccountStarBalance,
    getBusinessConnection,
    getChat,
    getChatAdministrators,
    getChatGifts,
    getChatMember,
    getChatMemberCount,
    getChatMenuButton,
    getCustomEmojiStickers,
    getFile,
    getForumTopicIconStickers,
    getGameHighScores,
    getManagedBotAccessSettings,
    getManagedBotToken,
    getMe,
    getMyCommands,
    getMyDefaultAdministratorRights,
    getMyDescription,
    getMyName,
    getMyShortDescription,
    getMyStarBalance,
    getStarTransactions,
    getStickerSet,
    getUpdates,
    getUserChatBoosts,
    getUserGifts,
    getUserPersonalChatMessages,
    getWebhookInfo,
    giftPremiumSubscription,
    hideGeneralForumTopic,
    leaveChat,
    logOut,
    pinChatMessage,
    postStory,
    promoteChatMember,
    readBusinessMessage,
    refundStarPayment,
    removeBusinessAccountProfilePhoto,
    removeChatVerification,
    removeUserVerification,
    reopenForumTopic,
    reopenGeneralForumTopic,
    replaceManagedBotToken,
    replaceStickerInSet,
    repostStory,
    restrictChatMember,
    revokeChatInviteLink,
    savePreparedInlineMessage,
    savePreparedKeyboardButton,
    sendAnimation,
    sendAudio,
    sendChatAction,
    sendChatJoinRequestWebApp,
    sendChecklist,
    sendContact,
    sendDice,
    sendDocument,
    sendGame,
    sendGift,
    sendInvoice,
    sendLivePhoto,
    sendLocation,
    sendMediaGroup,
    sendMessage,
    sendMessageDraft,
    sendPaidMedia,
    sendPhoto,
    sendPoll,
    sendRichMessage,
    sendRichMessageDraft,
    sendSticker,
    sendVenue,
    sendVideo,
    sendVideoNote,
    sendVoice,
    setBusinessAccountBio,
    setBusinessAccountGiftSettings,
    setBusinessAccountName,
    setBusinessAccountProfilePhoto,
    setBusinessAccountUsername,
    setChatAdministratorCustomTitle,
    setChatDescription,
    setChatMemberTag,
    setChatMenuButton,
    setChatPermissions,
    setChatPhoto,
    setChatStickerSet,
    setChatTitle,
    setCustomEmojiStickerSetThumbnail,
    setGameScore,
    setManagedBotAccessSettings,
    setMessageReaction,
    setMyCommands,
    setMyDefaultAdministratorRights,
    setMyDescription,
    setMyName,
    setMyShortDescription,
    setPassportDataErrors,
    setStickerEmojiList,
    setStickerKeywords,
    setStickerMaskPosition,
    setStickerPositionInSet,
    setStickerSetThumbnail,
    setStickerSetTitle,
    setUserEmojiStatus,
    setWebhook,
    stopMessageLiveLocation,
    stopPoll,
    transferBusinessAccountStars,
    transferGift,
    unbanChatMember,
    unbanChatSenderChat,
    unhideGeneralForumTopic,
    unpinAllChatMessages,
    unpinAllForumTopicMessages,
    unpinAllGeneralForumTopicMessages,
    unpinChatMessage,
    upgradeGift,
    uploadStickerFile,
    verifyChat,
    verifyUser,
  };

  return attachExamples({
    ...post,
    post,
  });
}
