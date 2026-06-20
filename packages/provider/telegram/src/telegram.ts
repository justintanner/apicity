import { TelegramError } from "./types";
import type * as Types from "./types";
import * as Schemas from "./zod";
import { attachExamples } from "./example";

export function createTelegram(
  opts: Types.TelegramOptions
): Types.TelegramProvider {
  const baseURL = (opts.baseURL ?? "https://api.telegram.org/bot{token}")
    .replace("{token}", opts.botToken)
    .replace(/\/+$/, "");
  const doFetch = opts.fetch ?? fetch;
  const timeout = opts.timeout ?? 30000;

  function attachAbortHandler(
    signal: AbortSignal,
    controller: AbortController
  ): void {
    if (signal.aborted) {
      controller.abort();
      return;
    }
    signal.addEventListener("abort", () => controller.abort(), { once: true });
  }

  function formatErrorMessage(status: number, body: unknown): string {
    if (typeof body === "object" && body !== null) {
      const b = body as { description?: string; error_code?: number };
      if (b.description) {
        return `Telegram API error ${status}: ${b.description}`;
      }
    }
    return `Telegram API error: ${status}`;
  }

  function errorCode(body: unknown): string | undefined {
    if (typeof body === "object" && body !== null) {
      const code = (body as { error_code?: number }).error_code;
      if (typeof code === "number") return String(code);
    }
    return undefined;
  }

  function hasBlob(value: unknown): boolean {
    if (value instanceof Blob) return true;
    if (Array.isArray(value)) return value.some(hasBlob);
    if (typeof value === "object" && value !== null) {
      return Object.values(value).some(hasBlob);
    }
    return false;
  }

  function formFileName(path: Array<string | number>): string {
    return path
      .map((part) => String(part).replace(/[^A-Za-z0-9_]+/g, "_"))
      .join("_");
  }

  function multipartJsonValue(
    form: FormData,
    value: unknown,
    path: Array<string | number>
  ): unknown {
    if (value instanceof Blob) {
      const name = formFileName(path);
      form.append(name, value);
      return `attach://${name}`;
    }
    if (Array.isArray(value)) {
      return value.map((item, index) =>
        multipartJsonValue(form, item, [...path, index])
      );
    }
    if (typeof value === "object" && value !== null) {
      const out: Record<string, unknown> = {};
      for (const [key, nested] of Object.entries(value)) {
        if (nested === undefined || nested === null) continue;
        out[key] = multipartJsonValue(form, nested, [...path, key]);
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
    if (typeof value === "string") {
      form.append(key, value);
      return;
    }
    if (typeof value === "boolean" || typeof value === "number") {
      form.append(key, String(value));
      return;
    }
    if (hasBlob(value)) {
      form.append(key, JSON.stringify(multipartJsonValue(form, value, [key])));
      return;
    }
    form.append(key, JSON.stringify(value));
  }

  function multipartBody(body: unknown): FormData {
    const form = new FormData();
    if (typeof body !== "object" || body === null || Array.isArray(body)) {
      return form;
    }
    for (const [key, value] of Object.entries(body)) {
      appendFormField(form, key, value);
    }
    return form;
  }

  async function makeRequest<T>(
    path: string,
    body: unknown,
    signal?: AbortSignal
  ): Promise<T> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    if (signal) {
      attachAbortHandler(signal, controller);
    }

    try {
      const headers: Record<string, string> = {};
      const init: RequestInit = {
        method: "POST",
        signal: controller.signal,
      };

      if (hasBlob(body)) {
        init.body = multipartBody(body);
      } else {
        headers["Content-Type"] = "application/json";
        init.headers = headers;
        init.body = JSON.stringify(body);
      }

      const res = await doFetch(`${baseURL}${path}`, init);

      clearTimeout(timeoutId);

      if (!res.ok) {
        let resBody: unknown = null;
        try {
          resBody = await res.json();
        } catch {
          // ignore parse errors
        }
        throw new TelegramError(
          formatErrorMessage(res.status, resBody),
          res.status,
          resBody,
          errorCode(resBody)
        );
      }

      return (await res.json()) as T;
    } catch (error) {
      clearTimeout(timeoutId);
      if (error instanceof TelegramError) throw error;
      throw new TelegramError(`Telegram request failed: ${error}`, 500);
    }
  }

  // sig-ok: `bot{token}` is Telegram's auth prefix, not a method namespace.
  // POST https://api.telegram.org/bot{token}/sendMessage
  // Docs: https://core.telegram.org/bots/api#sendmessage
  const sendMessage: Types.TelegramSendMessageMethod = Object.assign(
    async (
      req: Types.TelegramSendMessageRequest,
      signal?: AbortSignal
    ): Promise<Types.TelegramSendMessageResponse> => {
      return makeRequest<Types.TelegramSendMessageResponse>(
        "/sendMessage",
        req,
        signal
      );
    },
    { schema: Schemas.TelegramSendMessageRequestSchema }
  );

  // sig-ok: `bot{token}` is Telegram's auth prefix, not a method namespace.
  // POST https://api.telegram.org/bot{token}/sendPhoto
  // Docs: https://core.telegram.org/bots/api#sendphoto
  const sendPhoto: Types.TelegramSendPhotoMethod = Object.assign(
    async (
      req: Types.TelegramSendPhotoRequest,
      signal?: AbortSignal
    ): Promise<Types.TelegramSendPhotoResponse> => {
      return makeRequest<Types.TelegramSendPhotoResponse>(
        "/sendPhoto",
        req,
        signal
      );
    },
    { schema: Schemas.TelegramSendPhotoRequestSchema }
  );

  // sig-ok: `bot{token}` is Telegram's auth prefix, not a method namespace.
  // POST https://api.telegram.org/bot{token}/sendVideo
  // Docs: https://core.telegram.org/bots/api#sendvideo
  const sendVideo: Types.TelegramSendVideoMethod = Object.assign(
    async (
      req: Types.TelegramSendVideoRequest,
      signal?: AbortSignal
    ): Promise<Types.TelegramSendVideoResponse> => {
      return makeRequest<Types.TelegramSendVideoResponse>(
        "/sendVideo",
        req,
        signal
      );
    },
    { schema: Schemas.TelegramSendVideoRequestSchema }
  );

  // sig-ok: `bot{token}` is Telegram's auth prefix, not a method namespace.
  // POST https://api.telegram.org/bot{token}/sendAudio
  // Docs: https://core.telegram.org/bots/api#sendaudio
  const sendAudio: Types.TelegramSendAudioMethod = Object.assign(
    async (
      req: Types.TelegramSendAudioRequest,
      signal?: AbortSignal
    ): Promise<Types.TelegramSendAudioResponse> => {
      return makeRequest<Types.TelegramSendAudioResponse>(
        "/sendAudio",
        req,
        signal
      );
    },
    { schema: Schemas.TelegramSendAudioRequestSchema }
  );

  // sig-ok: `bot{token}` is Telegram's auth prefix, not a method namespace.
  // POST https://api.telegram.org/bot{token}/answerCallbackQuery
  // Docs: https://core.telegram.org/bots/api#answercallbackquery
  const answerCallbackQuery: Types.TelegramAnswerCallbackQueryMethod =
    Object.assign(
      async (
        req: Types.TelegramAnswerCallbackQueryRequest,
        signal?: AbortSignal
      ): Promise<Types.TelegramAnswerCallbackQueryResponse> => {
        return makeRequest<Types.TelegramAnswerCallbackQueryResponse>(
          "/answerCallbackQuery",
          req,
          signal
        );
      },
      { schema: Schemas.TelegramAnswerCallbackQueryRequestSchema }
    );

  // sig-ok: `bot{token}` is Telegram's auth prefix, not a method namespace.
  // POST https://api.telegram.org/bot{token}/answerWebAppQuery
  // Docs: https://core.telegram.org/bots/api#answerwebappquery
  const answerWebAppQuery: Types.TelegramAnswerWebAppQueryMethod =
    Object.assign(
      async (
        req: Types.TelegramAnswerWebAppQueryRequest,
        signal?: AbortSignal
      ): Promise<Types.TelegramAnswerWebAppQueryResponse> => {
        return makeRequest<Types.TelegramAnswerWebAppQueryResponse>(
          "/answerWebAppQuery",
          req,
          signal
        );
      },
      { schema: Schemas.TelegramAnswerWebAppQueryRequestSchema }
    );

  // sig-ok: `bot{token}` is Telegram's auth prefix, not a method namespace.
  // POST https://api.telegram.org/bot{token}/savePreparedInlineMessage
  // Docs: https://core.telegram.org/bots/api#savepreparedinlinemessage
  const savePreparedInlineMessage: Types.TelegramSavePreparedInlineMessageMethod =
    Object.assign(
      async (
        req: Types.TelegramSavePreparedInlineMessageRequest,
        signal?: AbortSignal
      ): Promise<Types.TelegramSavePreparedInlineMessageResponse> => {
        return makeRequest<Types.TelegramSavePreparedInlineMessageResponse>(
          "/savePreparedInlineMessage",
          req,
          signal
        );
      },
      { schema: Schemas.TelegramSavePreparedInlineMessageRequestSchema }
    );

  // sig-ok: `bot{token}` is Telegram's auth prefix, not a method namespace.
  // POST https://api.telegram.org/bot{token}/savePreparedKeyboardButton
  // Docs: https://core.telegram.org/bots/api#savepreparedkeyboardbutton
  const savePreparedKeyboardButton: Types.TelegramSavePreparedKeyboardButtonMethod =
    Object.assign(
      async (
        req: Types.TelegramSavePreparedKeyboardButtonRequest,
        signal?: AbortSignal
      ): Promise<Types.TelegramSavePreparedKeyboardButtonResponse> => {
        return makeRequest<Types.TelegramSavePreparedKeyboardButtonResponse>(
          "/savePreparedKeyboardButton",
          req,
          signal
        );
      },
      { schema: Schemas.TelegramSavePreparedKeyboardButtonRequestSchema }
    );

  // sig-ok: `bot{token}` is Telegram's auth prefix, not a method namespace.
  // POST https://api.telegram.org/bot{token}/answerInlineQuery
  // Docs: https://core.telegram.org/bots/api#answerinlinequery
  const answerInlineQuery: Types.TelegramAnswerInlineQueryMethod =
    Object.assign(
      async (
        req: Types.TelegramAnswerInlineQueryRequest,
        signal?: AbortSignal
      ): Promise<Types.TelegramAnswerInlineQueryResponse> => {
        return makeRequest<Types.TelegramAnswerInlineQueryResponse>(
          "/answerInlineQuery",
          req,
          signal
        );
      },
      { schema: Schemas.TelegramAnswerInlineQueryRequestSchema }
    );

  // sig-ok: `bot{token}` is Telegram's auth prefix, not a method namespace.
  // POST https://api.telegram.org/bot{token}/sendInvoice
  // Docs: https://core.telegram.org/bots/api#sendinvoice
  const sendInvoice: Types.TelegramSendInvoiceMethod = Object.assign(
    async (
      req: Types.TelegramSendInvoiceRequest,
      signal?: AbortSignal
    ): Promise<Types.TelegramSendInvoiceResponse> => {
      return makeRequest<Types.TelegramSendInvoiceResponse>(
        "/sendInvoice",
        req,
        signal
      );
    },
    { schema: Schemas.TelegramSendInvoiceRequestSchema }
  );

  // sig-ok: `bot{token}` is Telegram's auth prefix, not a method namespace.
  // POST https://api.telegram.org/bot{token}/createInvoiceLink
  // Docs: https://core.telegram.org/bots/api#createinvoicelink
  const createInvoiceLink: Types.TelegramCreateInvoiceLinkMethod =
    Object.assign(
      async (
        req: Types.TelegramCreateInvoiceLinkRequest,
        signal?: AbortSignal
      ): Promise<Types.TelegramCreateInvoiceLinkResponse> => {
        return makeRequest<Types.TelegramCreateInvoiceLinkResponse>(
          "/createInvoiceLink",
          req,
          signal
        );
      },
      { schema: Schemas.TelegramCreateInvoiceLinkRequestSchema }
    );

  // sig-ok: `bot{token}` is Telegram's auth prefix, not a method namespace.
  // POST https://api.telegram.org/bot{token}/answerShippingQuery
  // Docs: https://core.telegram.org/bots/api#answershippingquery
  const answerShippingQuery: Types.TelegramAnswerShippingQueryMethod =
    Object.assign(
      async (
        req: Types.TelegramAnswerShippingQueryRequest,
        signal?: AbortSignal
      ): Promise<Types.TelegramAnswerShippingQueryResponse> => {
        return makeRequest<Types.TelegramAnswerShippingQueryResponse>(
          "/answerShippingQuery",
          req,
          signal
        );
      },
      { schema: Schemas.TelegramAnswerShippingQueryRequestSchema }
    );

  // sig-ok: `bot{token}` is Telegram's auth prefix, not a method namespace.
  // POST https://api.telegram.org/bot{token}/answerPreCheckoutQuery
  // Docs: https://core.telegram.org/bots/api#answerprecheckoutquery
  const answerPreCheckoutQuery: Types.TelegramAnswerPreCheckoutQueryMethod =
    Object.assign(
      async (
        req: Types.TelegramAnswerPreCheckoutQueryRequest,
        signal?: AbortSignal
      ): Promise<Types.TelegramAnswerPreCheckoutQueryResponse> => {
        return makeRequest<Types.TelegramAnswerPreCheckoutQueryResponse>(
          "/answerPreCheckoutQuery",
          req,
          signal
        );
      },
      { schema: Schemas.TelegramAnswerPreCheckoutQueryRequestSchema }
    );

  // sig-ok: `bot{token}` is Telegram's auth prefix, not a method namespace.
  // POST https://api.telegram.org/bot{token}/getMyStarBalance
  // Docs: https://core.telegram.org/bots/api#getmystarbalance
  const getMyStarBalance: Types.TelegramGetMyStarBalanceMethod = Object.assign(
    async (
      req: Types.TelegramGetMyStarBalanceRequest,
      signal?: AbortSignal
    ): Promise<Types.TelegramGetMyStarBalanceResponse> => {
      return makeRequest<Types.TelegramGetMyStarBalanceResponse>(
        "/getMyStarBalance",
        req,
        signal
      );
    },
    { schema: Schemas.TelegramGetMyStarBalanceRequestSchema }
  );

  // sig-ok: `bot{token}` is Telegram's auth prefix, not a method namespace.
  // POST https://api.telegram.org/bot{token}/getStarTransactions
  // Docs: https://core.telegram.org/bots/api#getstartransactions
  const getStarTransactions: Types.TelegramGetStarTransactionsMethod =
    Object.assign(
      async (
        req: Types.TelegramGetStarTransactionsRequest,
        signal?: AbortSignal
      ): Promise<Types.TelegramGetStarTransactionsResponse> => {
        return makeRequest<Types.TelegramGetStarTransactionsResponse>(
          "/getStarTransactions",
          req,
          signal
        );
      },
      { schema: Schemas.TelegramGetStarTransactionsRequestSchema }
    );

  // sig-ok: `bot{token}` is Telegram's auth prefix, not a method namespace.
  // POST https://api.telegram.org/bot{token}/refundStarPayment
  // Docs: https://core.telegram.org/bots/api#refundstarpayment
  const refundStarPayment: Types.TelegramRefundStarPaymentMethod =
    Object.assign(
      async (
        req: Types.TelegramRefundStarPaymentRequest,
        signal?: AbortSignal
      ): Promise<Types.TelegramRefundStarPaymentResponse> => {
        return makeRequest<Types.TelegramRefundStarPaymentResponse>(
          "/refundStarPayment",
          req,
          signal
        );
      },
      { schema: Schemas.TelegramRefundStarPaymentRequestSchema }
    );

  // sig-ok: `bot{token}` is Telegram's auth prefix, not a method namespace.
  // POST https://api.telegram.org/bot{token}/editUserStarSubscription
  // Docs: https://core.telegram.org/bots/api#edituserstarsubscription
  const editUserStarSubscription: Types.TelegramEditUserStarSubscriptionMethod =
    Object.assign(
      async (
        req: Types.TelegramEditUserStarSubscriptionRequest,
        signal?: AbortSignal
      ): Promise<Types.TelegramEditUserStarSubscriptionResponse> => {
        return makeRequest<Types.TelegramEditUserStarSubscriptionResponse>(
          "/editUserStarSubscription",
          req,
          signal
        );
      },
      { schema: Schemas.TelegramEditUserStarSubscriptionRequestSchema }
    );

  // sig-ok: `bot{token}` is Telegram's auth prefix, not a method namespace.
  // POST https://api.telegram.org/bot{token}/sendSticker
  // Docs: https://core.telegram.org/bots/api#sendsticker
  const sendSticker: Types.TelegramSendStickerMethod = Object.assign(
    async (
      req: Types.TelegramSendStickerRequest,
      signal?: AbortSignal
    ): Promise<Types.TelegramSendStickerResponse> => {
      return makeRequest<Types.TelegramSendStickerResponse>(
        "/sendSticker",
        req,
        signal
      );
    },
    { schema: Schemas.TelegramSendStickerRequestSchema }
  );

  // sig-ok: `bot{token}` is Telegram's auth prefix, not a method namespace.
  // POST https://api.telegram.org/bot{token}/getStickerSet
  // Docs: https://core.telegram.org/bots/api#getstickerset
  const getStickerSet: Types.TelegramGetStickerSetMethod = Object.assign(
    async (
      req: Types.TelegramGetStickerSetRequest,
      signal?: AbortSignal
    ): Promise<Types.TelegramGetStickerSetResponse> => {
      return makeRequest<Types.TelegramGetStickerSetResponse>(
        "/getStickerSet",
        req,
        signal
      );
    },
    { schema: Schemas.TelegramGetStickerSetRequestSchema }
  );

  // sig-ok: `bot{token}` is Telegram's auth prefix, not a method namespace.
  // POST https://api.telegram.org/bot{token}/getCustomEmojiStickers
  // Docs: https://core.telegram.org/bots/api#getcustomemojistickers
  const getCustomEmojiStickers: Types.TelegramGetCustomEmojiStickersMethod =
    Object.assign(
      async (
        req: Types.TelegramGetCustomEmojiStickersRequest,
        signal?: AbortSignal
      ): Promise<Types.TelegramGetCustomEmojiStickersResponse> => {
        return makeRequest<Types.TelegramGetCustomEmojiStickersResponse>(
          "/getCustomEmojiStickers",
          req,
          signal
        );
      },
      { schema: Schemas.TelegramGetCustomEmojiStickersRequestSchema }
    );

  // sig-ok: `bot{token}` is Telegram's auth prefix, not a method namespace.
  // POST https://api.telegram.org/bot{token}/uploadStickerFile
  // Docs: https://core.telegram.org/bots/api#uploadstickerfile
  const uploadStickerFile: Types.TelegramUploadStickerFileMethod =
    Object.assign(
      async (
        req: Types.TelegramUploadStickerFileRequest,
        signal?: AbortSignal
      ): Promise<Types.TelegramUploadStickerFileResponse> => {
        return makeRequest<Types.TelegramUploadStickerFileResponse>(
          "/uploadStickerFile",
          req,
          signal
        );
      },
      { schema: Schemas.TelegramUploadStickerFileRequestSchema }
    );

  // sig-ok: `bot{token}` is Telegram's auth prefix, not a method namespace.
  // POST https://api.telegram.org/bot{token}/createNewStickerSet
  // Docs: https://core.telegram.org/bots/api#createnewstickerset
  const createNewStickerSet: Types.TelegramCreateNewStickerSetMethod =
    Object.assign(
      async (
        req: Types.TelegramCreateNewStickerSetRequest,
        signal?: AbortSignal
      ): Promise<Types.TelegramCreateNewStickerSetResponse> => {
        return makeRequest<Types.TelegramCreateNewStickerSetResponse>(
          "/createNewStickerSet",
          req,
          signal
        );
      },
      { schema: Schemas.TelegramCreateNewStickerSetRequestSchema }
    );

  // sig-ok: `bot{token}` is Telegram's auth prefix, not a method namespace.
  // POST https://api.telegram.org/bot{token}/addStickerToSet
  // Docs: https://core.telegram.org/bots/api#addstickertoset
  const addStickerToSet: Types.TelegramAddStickerToSetMethod = Object.assign(
    async (
      req: Types.TelegramAddStickerToSetRequest,
      signal?: AbortSignal
    ): Promise<Types.TelegramAddStickerToSetResponse> => {
      return makeRequest<Types.TelegramAddStickerToSetResponse>(
        "/addStickerToSet",
        req,
        signal
      );
    },
    { schema: Schemas.TelegramAddStickerToSetRequestSchema }
  );

  // sig-ok: `bot{token}` is Telegram's auth prefix, not a method namespace.
  // POST https://api.telegram.org/bot{token}/setStickerPositionInSet
  // Docs: https://core.telegram.org/bots/api#setstickerpositioninset
  const setStickerPositionInSet: Types.TelegramSetStickerPositionInSetMethod =
    Object.assign(
      async (
        req: Types.TelegramSetStickerPositionInSetRequest,
        signal?: AbortSignal
      ): Promise<Types.TelegramSetStickerPositionInSetResponse> => {
        return makeRequest<Types.TelegramSetStickerPositionInSetResponse>(
          "/setStickerPositionInSet",
          req,
          signal
        );
      },
      { schema: Schemas.TelegramSetStickerPositionInSetRequestSchema }
    );

  // sig-ok: `bot{token}` is Telegram's auth prefix, not a method namespace.
  // POST https://api.telegram.org/bot{token}/deleteStickerFromSet
  // Docs: https://core.telegram.org/bots/api#deletestickerfromset
  const deleteStickerFromSet: Types.TelegramDeleteStickerFromSetMethod =
    Object.assign(
      async (
        req: Types.TelegramDeleteStickerFromSetRequest,
        signal?: AbortSignal
      ): Promise<Types.TelegramDeleteStickerFromSetResponse> => {
        return makeRequest<Types.TelegramDeleteStickerFromSetResponse>(
          "/deleteStickerFromSet",
          req,
          signal
        );
      },
      { schema: Schemas.TelegramDeleteStickerFromSetRequestSchema }
    );

  // sig-ok: `bot{token}` is Telegram's auth prefix, not a method namespace.
  // POST https://api.telegram.org/bot{token}/replaceStickerInSet
  // Docs: https://core.telegram.org/bots/api#replacestickerinset
  const replaceStickerInSet: Types.TelegramReplaceStickerInSetMethod =
    Object.assign(
      async (
        req: Types.TelegramReplaceStickerInSetRequest,
        signal?: AbortSignal
      ): Promise<Types.TelegramReplaceStickerInSetResponse> => {
        return makeRequest<Types.TelegramReplaceStickerInSetResponse>(
          "/replaceStickerInSet",
          req,
          signal
        );
      },
      { schema: Schemas.TelegramReplaceStickerInSetRequestSchema }
    );

  // sig-ok: `bot{token}` is Telegram's auth prefix, not a method namespace.
  // POST https://api.telegram.org/bot{token}/setStickerEmojiList
  // Docs: https://core.telegram.org/bots/api#setstickeremojilist
  const setStickerEmojiList: Types.TelegramSetStickerEmojiListMethod =
    Object.assign(
      async (
        req: Types.TelegramSetStickerEmojiListRequest,
        signal?: AbortSignal
      ): Promise<Types.TelegramSetStickerEmojiListResponse> => {
        return makeRequest<Types.TelegramSetStickerEmojiListResponse>(
          "/setStickerEmojiList",
          req,
          signal
        );
      },
      { schema: Schemas.TelegramSetStickerEmojiListRequestSchema }
    );

  // sig-ok: `bot{token}` is Telegram's auth prefix, not a method namespace.
  // POST https://api.telegram.org/bot{token}/setStickerKeywords
  // Docs: https://core.telegram.org/bots/api#setstickerkeywords
  const setStickerKeywords: Types.TelegramSetStickerKeywordsMethod =
    Object.assign(
      async (
        req: Types.TelegramSetStickerKeywordsRequest,
        signal?: AbortSignal
      ): Promise<Types.TelegramSetStickerKeywordsResponse> => {
        return makeRequest<Types.TelegramSetStickerKeywordsResponse>(
          "/setStickerKeywords",
          req,
          signal
        );
      },
      { schema: Schemas.TelegramSetStickerKeywordsRequestSchema }
    );

  // sig-ok: `bot{token}` is Telegram's auth prefix, not a method namespace.
  // POST https://api.telegram.org/bot{token}/setStickerMaskPosition
  // Docs: https://core.telegram.org/bots/api#setstickermaskposition
  const setStickerMaskPosition: Types.TelegramSetStickerMaskPositionMethod =
    Object.assign(
      async (
        req: Types.TelegramSetStickerMaskPositionRequest,
        signal?: AbortSignal
      ): Promise<Types.TelegramSetStickerMaskPositionResponse> => {
        return makeRequest<Types.TelegramSetStickerMaskPositionResponse>(
          "/setStickerMaskPosition",
          req,
          signal
        );
      },
      { schema: Schemas.TelegramSetStickerMaskPositionRequestSchema }
    );

  // sig-ok: `bot{token}` is Telegram's auth prefix, not a method namespace.
  // POST https://api.telegram.org/bot{token}/setStickerSetTitle
  // Docs: https://core.telegram.org/bots/api#setstickersettitle
  const setStickerSetTitle: Types.TelegramSetStickerSetTitleMethod =
    Object.assign(
      async (
        req: Types.TelegramSetStickerSetTitleRequest,
        signal?: AbortSignal
      ): Promise<Types.TelegramSetStickerSetTitleResponse> => {
        return makeRequest<Types.TelegramSetStickerSetTitleResponse>(
          "/setStickerSetTitle",
          req,
          signal
        );
      },
      { schema: Schemas.TelegramSetStickerSetTitleRequestSchema }
    );

  // sig-ok: `bot{token}` is Telegram's auth prefix, not a method namespace.
  // POST https://api.telegram.org/bot{token}/setStickerSetThumbnail
  // Docs: https://core.telegram.org/bots/api#setstickersetthumbnail
  const setStickerSetThumbnail: Types.TelegramSetStickerSetThumbnailMethod =
    Object.assign(
      async (
        req: Types.TelegramSetStickerSetThumbnailRequest,
        signal?: AbortSignal
      ): Promise<Types.TelegramSetStickerSetThumbnailResponse> => {
        return makeRequest<Types.TelegramSetStickerSetThumbnailResponse>(
          "/setStickerSetThumbnail",
          req,
          signal
        );
      },
      { schema: Schemas.TelegramSetStickerSetThumbnailRequestSchema }
    );

  // sig-ok: `bot{token}` is Telegram's auth prefix, not a method namespace.
  // POST https://api.telegram.org/bot{token}/setCustomEmojiStickerSetThumbnail
  // Docs: https://core.telegram.org/bots/api#setcustomemojistickersetthumbnail
  const setCustomEmojiStickerSetThumbnail: Types.TelegramSetCustomEmojiStickerSetThumbnailMethod =
    Object.assign(
      async (
        req: Types.TelegramSetCustomEmojiStickerSetThumbnailRequest,
        signal?: AbortSignal
      ): Promise<Types.TelegramSetCustomEmojiStickerSetThumbnailResponse> => {
        return makeRequest<Types.TelegramSetCustomEmojiStickerSetThumbnailResponse>(
          "/setCustomEmojiStickerSetThumbnail",
          req,
          signal
        );
      },
      {
        schema: Schemas.TelegramSetCustomEmojiStickerSetThumbnailRequestSchema,
      }
    );

  // sig-ok: `bot{token}` is Telegram's auth prefix, not a method namespace.
  // POST https://api.telegram.org/bot{token}/deleteStickerSet
  // Docs: https://core.telegram.org/bots/api#deletestickerset
  const deleteStickerSet: Types.TelegramDeleteStickerSetMethod = Object.assign(
    async (
      req: Types.TelegramDeleteStickerSetRequest,
      signal?: AbortSignal
    ): Promise<Types.TelegramDeleteStickerSetResponse> => {
      return makeRequest<Types.TelegramDeleteStickerSetResponse>(
        "/deleteStickerSet",
        req,
        signal
      );
    },
    { schema: Schemas.TelegramDeleteStickerSetRequestSchema }
  );

  // sig-ok: `bot{token}` is Telegram's auth prefix, not a method namespace.
  // POST https://api.telegram.org/bot{token}/getAvailableGifts
  // Docs: https://core.telegram.org/bots/api#getavailablegifts
  const getAvailableGifts: Types.TelegramGetAvailableGiftsMethod =
    Object.assign(
      async (
        req: Types.TelegramGetAvailableGiftsRequest,
        signal?: AbortSignal
      ): Promise<Types.TelegramGetAvailableGiftsResponse> => {
        return makeRequest<Types.TelegramGetAvailableGiftsResponse>(
          "/getAvailableGifts",
          req,
          signal
        );
      },
      { schema: Schemas.TelegramGetAvailableGiftsRequestSchema }
    );

  // sig-ok: `bot{token}` is Telegram's auth prefix, not a method namespace.
  // POST https://api.telegram.org/bot{token}/sendGift
  // Docs: https://core.telegram.org/bots/api#sendgift
  const sendGift: Types.TelegramSendGiftMethod = Object.assign(
    async (
      req: Types.TelegramSendGiftRequest,
      signal?: AbortSignal
    ): Promise<Types.TelegramSendGiftResponse> => {
      return makeRequest<Types.TelegramSendGiftResponse>(
        "/sendGift",
        req,
        signal
      );
    },
    { schema: Schemas.TelegramSendGiftRequestSchema }
  );

  // sig-ok: `bot{token}` is Telegram's auth prefix, not a method namespace.
  // POST https://api.telegram.org/bot{token}/giftPremiumSubscription
  // Docs: https://core.telegram.org/bots/api#giftpremiumsubscription
  const giftPremiumSubscription: Types.TelegramGiftPremiumSubscriptionMethod =
    Object.assign(
      async (
        req: Types.TelegramGiftPremiumSubscriptionRequest,
        signal?: AbortSignal
      ): Promise<Types.TelegramGiftPremiumSubscriptionResponse> => {
        return makeRequest<Types.TelegramGiftPremiumSubscriptionResponse>(
          "/giftPremiumSubscription",
          req,
          signal
        );
      },
      { schema: Schemas.TelegramGiftPremiumSubscriptionRequestSchema }
    );

  // sig-ok: `bot{token}` is Telegram's auth prefix, not a method namespace.
  // POST https://api.telegram.org/bot{token}/verifyUser
  // Docs: https://core.telegram.org/bots/api#verifyuser
  const verifyUser: Types.TelegramVerifyUserMethod = Object.assign(
    async (
      req: Types.TelegramVerifyUserRequest,
      signal?: AbortSignal
    ): Promise<Types.TelegramVerifyUserResponse> => {
      return makeRequest<Types.TelegramVerifyUserResponse>(
        "/verifyUser",
        req,
        signal
      );
    },
    { schema: Schemas.TelegramVerifyUserRequestSchema }
  );

  // sig-ok: `bot{token}` is Telegram's auth prefix, not a method namespace.
  // POST https://api.telegram.org/bot{token}/verifyChat
  // Docs: https://core.telegram.org/bots/api#verifychat
  const verifyChat: Types.TelegramVerifyChatMethod = Object.assign(
    async (
      req: Types.TelegramVerifyChatRequest,
      signal?: AbortSignal
    ): Promise<Types.TelegramVerifyChatResponse> => {
      return makeRequest<Types.TelegramVerifyChatResponse>(
        "/verifyChat",
        req,
        signal
      );
    },
    { schema: Schemas.TelegramVerifyChatRequestSchema }
  );

  // sig-ok: `bot{token}` is Telegram's auth prefix, not a method namespace.
  // POST https://api.telegram.org/bot{token}/removeUserVerification
  // Docs: https://core.telegram.org/bots/api#removeuserverification
  const removeUserVerification: Types.TelegramRemoveUserVerificationMethod =
    Object.assign(
      async (
        req: Types.TelegramRemoveUserVerificationRequest,
        signal?: AbortSignal
      ): Promise<Types.TelegramRemoveUserVerificationResponse> => {
        return makeRequest<Types.TelegramRemoveUserVerificationResponse>(
          "/removeUserVerification",
          req,
          signal
        );
      },
      { schema: Schemas.TelegramRemoveUserVerificationRequestSchema }
    );

  // sig-ok: `bot{token}` is Telegram's auth prefix, not a method namespace.
  // POST https://api.telegram.org/bot{token}/removeChatVerification
  // Docs: https://core.telegram.org/bots/api#removechatverification
  const removeChatVerification: Types.TelegramRemoveChatVerificationMethod =
    Object.assign(
      async (
        req: Types.TelegramRemoveChatVerificationRequest,
        signal?: AbortSignal
      ): Promise<Types.TelegramRemoveChatVerificationResponse> => {
        return makeRequest<Types.TelegramRemoveChatVerificationResponse>(
          "/removeChatVerification",
          req,
          signal
        );
      },
      { schema: Schemas.TelegramRemoveChatVerificationRequestSchema }
    );

  // sig-ok: `bot{token}` is Telegram's auth prefix, not a method namespace.
  // POST https://api.telegram.org/bot{token}/getUserGifts
  // Docs: https://core.telegram.org/bots/api#getusergifts
  const getUserGifts: Types.TelegramGetUserGiftsMethod = Object.assign(
    async (
      req: Types.TelegramGetUserGiftsRequest,
      signal?: AbortSignal
    ): Promise<Types.TelegramGetUserGiftsResponse> => {
      return makeRequest<Types.TelegramGetUserGiftsResponse>(
        "/getUserGifts",
        req,
        signal
      );
    },
    { schema: Schemas.TelegramGetUserGiftsRequestSchema }
  );

  // sig-ok: `bot{token}` is Telegram's auth prefix, not a method namespace.
  // POST https://api.telegram.org/bot{token}/getChatGifts
  // Docs: https://core.telegram.org/bots/api#getchatgifts
  const getChatGifts: Types.TelegramGetChatGiftsMethod = Object.assign(
    async (
      req: Types.TelegramGetChatGiftsRequest,
      signal?: AbortSignal
    ): Promise<Types.TelegramGetChatGiftsResponse> => {
      return makeRequest<Types.TelegramGetChatGiftsResponse>(
        "/getChatGifts",
        req,
        signal
      );
    },
    { schema: Schemas.TelegramGetChatGiftsRequestSchema }
  );

  // sig-ok: `bot{token}` is Telegram's auth prefix, not a method namespace.
  // POST https://api.telegram.org/bot{token}/setUserEmojiStatus
  // Docs: https://core.telegram.org/bots/api#setuseremojistatus
  const setUserEmojiStatus: Types.TelegramSetUserEmojiStatusMethod =
    Object.assign(
      async (
        req: Types.TelegramSetUserEmojiStatusRequest,
        signal?: AbortSignal
      ): Promise<Types.TelegramSetUserEmojiStatusResponse> => {
        return makeRequest<Types.TelegramSetUserEmojiStatusResponse>(
          "/setUserEmojiStatus",
          req,
          signal
        );
      },
      { schema: Schemas.TelegramSetUserEmojiStatusRequestSchema }
    );

  // sig-ok: `bot{token}` is Telegram's auth prefix, not a method namespace.
  // POST https://api.telegram.org/bot{token}/getBusinessConnection
  // Docs: https://core.telegram.org/bots/api#getbusinessconnection
  const getBusinessConnection: Types.TelegramGetBusinessConnectionMethod =
    Object.assign(
      async (
        req: Types.TelegramGetBusinessConnectionRequest,
        signal?: AbortSignal
      ): Promise<Types.TelegramGetBusinessConnectionResponse> => {
        return makeRequest<Types.TelegramGetBusinessConnectionResponse>(
          "/getBusinessConnection",
          req,
          signal
        );
      },
      { schema: Schemas.TelegramGetBusinessConnectionRequestSchema }
    );

  // sig-ok: `bot{token}` is Telegram's auth prefix, not a method namespace.
  // POST https://api.telegram.org/bot{token}/readBusinessMessage
  // Docs: https://core.telegram.org/bots/api#readbusinessmessage
  const readBusinessMessage: Types.TelegramReadBusinessMessageMethod =
    Object.assign(
      async (
        req: Types.TelegramReadBusinessMessageRequest,
        signal?: AbortSignal
      ): Promise<Types.TelegramReadBusinessMessageResponse> => {
        return makeRequest<Types.TelegramReadBusinessMessageResponse>(
          "/readBusinessMessage",
          req,
          signal
        );
      },
      { schema: Schemas.TelegramReadBusinessMessageRequestSchema }
    );

  // sig-ok: `bot{token}` is Telegram's auth prefix, not a method namespace.
  // POST https://api.telegram.org/bot{token}/deleteBusinessMessages
  // Docs: https://core.telegram.org/bots/api#deletebusinessmessages
  const deleteBusinessMessages: Types.TelegramDeleteBusinessMessagesMethod =
    Object.assign(
      async (
        req: Types.TelegramDeleteBusinessMessagesRequest,
        signal?: AbortSignal
      ): Promise<Types.TelegramDeleteBusinessMessagesResponse> => {
        return makeRequest<Types.TelegramDeleteBusinessMessagesResponse>(
          "/deleteBusinessMessages",
          req,
          signal
        );
      },
      { schema: Schemas.TelegramDeleteBusinessMessagesRequestSchema }
    );

  // sig-ok: `bot{token}` is Telegram's auth prefix, not a method namespace.
  // POST https://api.telegram.org/bot{token}/setBusinessAccountName
  // Docs: https://core.telegram.org/bots/api#setbusinessaccountname
  const setBusinessAccountName: Types.TelegramSetBusinessAccountNameMethod =
    Object.assign(
      async (
        req: Types.TelegramSetBusinessAccountNameRequest,
        signal?: AbortSignal
      ): Promise<Types.TelegramSetBusinessAccountNameResponse> => {
        return makeRequest<Types.TelegramSetBusinessAccountNameResponse>(
          "/setBusinessAccountName",
          req,
          signal
        );
      },
      { schema: Schemas.TelegramSetBusinessAccountNameRequestSchema }
    );

  // sig-ok: `bot{token}` is Telegram's auth prefix, not a method namespace.
  // POST https://api.telegram.org/bot{token}/setBusinessAccountUsername
  // Docs: https://core.telegram.org/bots/api#setbusinessaccountusername
  const setBusinessAccountUsername: Types.TelegramSetBusinessAccountUsernameMethod =
    Object.assign(
      async (
        req: Types.TelegramSetBusinessAccountUsernameRequest,
        signal?: AbortSignal
      ): Promise<Types.TelegramSetBusinessAccountUsernameResponse> => {
        return makeRequest<Types.TelegramSetBusinessAccountUsernameResponse>(
          "/setBusinessAccountUsername",
          req,
          signal
        );
      },
      { schema: Schemas.TelegramSetBusinessAccountUsernameRequestSchema }
    );

  // sig-ok: `bot{token}` is Telegram's auth prefix, not a method namespace.
  // POST https://api.telegram.org/bot{token}/setBusinessAccountBio
  // Docs: https://core.telegram.org/bots/api#setbusinessaccountbio
  const setBusinessAccountBio: Types.TelegramSetBusinessAccountBioMethod =
    Object.assign(
      async (
        req: Types.TelegramSetBusinessAccountBioRequest,
        signal?: AbortSignal
      ): Promise<Types.TelegramSetBusinessAccountBioResponse> => {
        return makeRequest<Types.TelegramSetBusinessAccountBioResponse>(
          "/setBusinessAccountBio",
          req,
          signal
        );
      },
      { schema: Schemas.TelegramSetBusinessAccountBioRequestSchema }
    );

  // sig-ok: `bot{token}` is Telegram's auth prefix, not a method namespace.
  // POST https://api.telegram.org/bot{token}/setBusinessAccountProfilePhoto
  // Docs: https://core.telegram.org/bots/api#setbusinessaccountprofilephoto
  const setBusinessAccountProfilePhoto: Types.TelegramSetBusinessAccountProfilePhotoMethod =
    Object.assign(
      async (
        req: Types.TelegramSetBusinessAccountProfilePhotoRequest,
        signal?: AbortSignal
      ): Promise<Types.TelegramSetBusinessAccountProfilePhotoResponse> => {
        return makeRequest<Types.TelegramSetBusinessAccountProfilePhotoResponse>(
          "/setBusinessAccountProfilePhoto",
          req,
          signal
        );
      },
      {
        schema: Schemas.TelegramSetBusinessAccountProfilePhotoRequestSchema,
      }
    );

  // sig-ok: `bot{token}` is Telegram's auth prefix, not a method namespace.
  // POST https://api.telegram.org/bot{token}/removeBusinessAccountProfilePhoto
  // Docs: https://core.telegram.org/bots/api#removebusinessaccountprofilephoto
  const removeBusinessAccountProfilePhoto: Types.TelegramRemoveBusinessAccountProfilePhotoMethod =
    Object.assign(
      async (
        req: Types.TelegramRemoveBusinessAccountProfilePhotoRequest,
        signal?: AbortSignal
      ): Promise<Types.TelegramRemoveBusinessAccountProfilePhotoResponse> => {
        return makeRequest<Types.TelegramRemoveBusinessAccountProfilePhotoResponse>(
          "/removeBusinessAccountProfilePhoto",
          req,
          signal
        );
      },
      {
        schema: Schemas.TelegramRemoveBusinessAccountProfilePhotoRequestSchema,
      }
    );

  // sig-ok: `bot{token}` is Telegram's auth prefix, not a method namespace.
  // POST https://api.telegram.org/bot{token}/setBusinessAccountGiftSettings
  // Docs: https://core.telegram.org/bots/api#setbusinessaccountgiftsettings
  const setBusinessAccountGiftSettings: Types.TelegramSetBusinessAccountGiftSettingsMethod =
    Object.assign(
      async (
        req: Types.TelegramSetBusinessAccountGiftSettingsRequest,
        signal?: AbortSignal
      ): Promise<Types.TelegramSetBusinessAccountGiftSettingsResponse> => {
        return makeRequest<Types.TelegramSetBusinessAccountGiftSettingsResponse>(
          "/setBusinessAccountGiftSettings",
          req,
          signal
        );
      },
      { schema: Schemas.TelegramSetBusinessAccountGiftSettingsRequestSchema }
    );

  // sig-ok: `bot{token}` is Telegram's auth prefix, not a method namespace.
  // POST https://api.telegram.org/bot{token}/getBusinessAccountStarBalance
  // Docs: https://core.telegram.org/bots/api#getbusinessaccountstarbalance
  const getBusinessAccountStarBalance: Types.TelegramGetBusinessAccountStarBalanceMethod =
    Object.assign(
      async (
        req: Types.TelegramGetBusinessAccountStarBalanceRequest,
        signal?: AbortSignal
      ): Promise<Types.TelegramGetBusinessAccountStarBalanceResponse> => {
        return makeRequest<Types.TelegramGetBusinessAccountStarBalanceResponse>(
          "/getBusinessAccountStarBalance",
          req,
          signal
        );
      },
      { schema: Schemas.TelegramGetBusinessAccountStarBalanceRequestSchema }
    );

  // sig-ok: `bot{token}` is Telegram's auth prefix, not a method namespace.
  // POST https://api.telegram.org/bot{token}/transferBusinessAccountStars
  // Docs: https://core.telegram.org/bots/api#transferbusinessaccountstars
  const transferBusinessAccountStars: Types.TelegramTransferBusinessAccountStarsMethod =
    Object.assign(
      async (
        req: Types.TelegramTransferBusinessAccountStarsRequest,
        signal?: AbortSignal
      ): Promise<Types.TelegramTransferBusinessAccountStarsResponse> => {
        return makeRequest<Types.TelegramTransferBusinessAccountStarsResponse>(
          "/transferBusinessAccountStars",
          req,
          signal
        );
      },
      { schema: Schemas.TelegramTransferBusinessAccountStarsRequestSchema }
    );

  // sig-ok: `bot{token}` is Telegram's auth prefix, not a method namespace.
  // POST https://api.telegram.org/bot{token}/getBusinessAccountGifts
  // Docs: https://core.telegram.org/bots/api#getbusinessaccountgifts
  const getBusinessAccountGifts: Types.TelegramGetBusinessAccountGiftsMethod =
    Object.assign(
      async (
        req: Types.TelegramGetBusinessAccountGiftsRequest,
        signal?: AbortSignal
      ): Promise<Types.TelegramGetBusinessAccountGiftsResponse> => {
        return makeRequest<Types.TelegramGetBusinessAccountGiftsResponse>(
          "/getBusinessAccountGifts",
          req,
          signal
        );
      },
      { schema: Schemas.TelegramGetBusinessAccountGiftsRequestSchema }
    );

  // sig-ok: `bot{token}` is Telegram's auth prefix, not a method namespace.
  // POST https://api.telegram.org/bot{token}/convertGiftToStars
  // Docs: https://core.telegram.org/bots/api#convertgifttostars
  const convertGiftToStars: Types.TelegramConvertGiftToStarsMethod =
    Object.assign(
      async (
        req: Types.TelegramConvertGiftToStarsRequest,
        signal?: AbortSignal
      ): Promise<Types.TelegramConvertGiftToStarsResponse> => {
        return makeRequest<Types.TelegramConvertGiftToStarsResponse>(
          "/convertGiftToStars",
          req,
          signal
        );
      },
      { schema: Schemas.TelegramConvertGiftToStarsRequestSchema }
    );

  // sig-ok: `bot{token}` is Telegram's auth prefix, not a method namespace.
  // POST https://api.telegram.org/bot{token}/upgradeGift
  // Docs: https://core.telegram.org/bots/api#upgradegift
  const upgradeGift: Types.TelegramUpgradeGiftMethod = Object.assign(
    async (
      req: Types.TelegramUpgradeGiftRequest,
      signal?: AbortSignal
    ): Promise<Types.TelegramUpgradeGiftResponse> => {
      return makeRequest<Types.TelegramUpgradeGiftResponse>(
        "/upgradeGift",
        req,
        signal
      );
    },
    { schema: Schemas.TelegramUpgradeGiftRequestSchema }
  );

  // sig-ok: `bot{token}` is Telegram's auth prefix, not a method namespace.
  // POST https://api.telegram.org/bot{token}/transferGift
  // Docs: https://core.telegram.org/bots/api#transfergift
  const transferGift: Types.TelegramTransferGiftMethod = Object.assign(
    async (
      req: Types.TelegramTransferGiftRequest,
      signal?: AbortSignal
    ): Promise<Types.TelegramTransferGiftResponse> => {
      return makeRequest<Types.TelegramTransferGiftResponse>(
        "/transferGift",
        req,
        signal
      );
    },
    { schema: Schemas.TelegramTransferGiftRequestSchema }
  );

  // sig-ok: `bot{token}` is Telegram's auth prefix, not a method namespace.
  // POST https://api.telegram.org/bot{token}/postStory
  // Docs: https://core.telegram.org/bots/api#poststory
  const postStory: Types.TelegramPostStoryMethod = Object.assign(
    async (
      req: Types.TelegramPostStoryRequest,
      signal?: AbortSignal
    ): Promise<Types.TelegramPostStoryResponse> => {
      return makeRequest<Types.TelegramPostStoryResponse>(
        "/postStory",
        req,
        signal
      );
    },
    { schema: Schemas.TelegramPostStoryRequestSchema }
  );

  // sig-ok: `bot{token}` is Telegram's auth prefix, not a method namespace.
  // POST https://api.telegram.org/bot{token}/repostStory
  // Docs: https://core.telegram.org/bots/api#repoststory
  const repostStory: Types.TelegramRepostStoryMethod = Object.assign(
    async (
      req: Types.TelegramRepostStoryRequest,
      signal?: AbortSignal
    ): Promise<Types.TelegramRepostStoryResponse> => {
      return makeRequest<Types.TelegramRepostStoryResponse>(
        "/repostStory",
        req,
        signal
      );
    },
    { schema: Schemas.TelegramRepostStoryRequestSchema }
  );

  // sig-ok: `bot{token}` is Telegram's auth prefix, not a method namespace.
  // POST https://api.telegram.org/bot{token}/editStory
  // Docs: https://core.telegram.org/bots/api#editstory
  const editStory: Types.TelegramEditStoryMethod = Object.assign(
    async (
      req: Types.TelegramEditStoryRequest,
      signal?: AbortSignal
    ): Promise<Types.TelegramEditStoryResponse> => {
      return makeRequest<Types.TelegramEditStoryResponse>(
        "/editStory",
        req,
        signal
      );
    },
    { schema: Schemas.TelegramEditStoryRequestSchema }
  );

  // sig-ok: `bot{token}` is Telegram's auth prefix, not a method namespace.
  // POST https://api.telegram.org/bot{token}/deleteStory
  // Docs: https://core.telegram.org/bots/api#deletestory
  const deleteStory: Types.TelegramDeleteStoryMethod = Object.assign(
    async (
      req: Types.TelegramDeleteStoryRequest,
      signal?: AbortSignal
    ): Promise<Types.TelegramDeleteStoryResponse> => {
      return makeRequest<Types.TelegramDeleteStoryResponse>(
        "/deleteStory",
        req,
        signal
      );
    },
    { schema: Schemas.TelegramDeleteStoryRequestSchema }
  );

  // sig-ok: `bot{token}` is Telegram's auth prefix, not a method namespace.
  // POST https://api.telegram.org/bot{token}/setPassportDataErrors
  // Docs: https://core.telegram.org/bots/api#setpassportdataerrors
  const setPassportDataErrors: Types.TelegramSetPassportDataErrorsMethod =
    Object.assign(
      async (
        req: Types.TelegramSetPassportDataErrorsRequest,
        signal?: AbortSignal
      ): Promise<Types.TelegramSetPassportDataErrorsResponse> => {
        return makeRequest<Types.TelegramSetPassportDataErrorsResponse>(
          "/setPassportDataErrors",
          req,
          signal
        );
      },
      { schema: Schemas.TelegramSetPassportDataErrorsRequestSchema }
    );

  // sig-ok: `bot{token}` is Telegram's auth prefix, not a method namespace.
  // POST https://api.telegram.org/bot{token}/sendGame
  // Docs: https://core.telegram.org/bots/api#sendgame
  const sendGame: Types.TelegramSendGameMethod = Object.assign(
    async (
      req: Types.TelegramSendGameRequest,
      signal?: AbortSignal
    ): Promise<Types.TelegramSendGameResponse> => {
      return makeRequest<Types.TelegramSendGameResponse>(
        "/sendGame",
        req,
        signal
      );
    },
    { schema: Schemas.TelegramSendGameRequestSchema }
  );

  // sig-ok: `bot{token}` is Telegram's auth prefix, not a method namespace.
  // POST https://api.telegram.org/bot{token}/setGameScore
  // Docs: https://core.telegram.org/bots/api#setgamescore
  const setGameScore: Types.TelegramSetGameScoreMethod = Object.assign(
    async (
      req: Types.TelegramSetGameScoreRequest,
      signal?: AbortSignal
    ): Promise<Types.TelegramSetGameScoreResponse> => {
      return makeRequest<Types.TelegramSetGameScoreResponse>(
        "/setGameScore",
        req,
        signal
      );
    },
    { schema: Schemas.TelegramSetGameScoreRequestSchema }
  );

  // sig-ok: `bot{token}` is Telegram's auth prefix, not a method namespace.
  // POST https://api.telegram.org/bot{token}/getGameHighScores
  // Docs: https://core.telegram.org/bots/api#getgamehighscores
  const getGameHighScores: Types.TelegramGetGameHighScoresMethod =
    Object.assign(
      async (
        req: Types.TelegramGetGameHighScoresRequest,
        signal?: AbortSignal
      ): Promise<Types.TelegramGetGameHighScoresResponse> => {
        return makeRequest<Types.TelegramGetGameHighScoresResponse>(
          "/getGameHighScores",
          req,
          signal
        );
      },
      { schema: Schemas.TelegramGetGameHighScoresRequestSchema }
    );

  const post = {
    sendMessage,
    sendPhoto,
    sendVideo,
    sendAudio,
    answerCallbackQuery,
    answerWebAppQuery,
    savePreparedInlineMessage,
    savePreparedKeyboardButton,
    answerInlineQuery,
    sendInvoice,
    createInvoiceLink,
    answerShippingQuery,
    answerPreCheckoutQuery,
    getMyStarBalance,
    getStarTransactions,
    refundStarPayment,
    editUserStarSubscription,
    sendSticker,
    getStickerSet,
    getCustomEmojiStickers,
    uploadStickerFile,
    createNewStickerSet,
    addStickerToSet,
    setStickerPositionInSet,
    deleteStickerFromSet,
    replaceStickerInSet,
    setStickerEmojiList,
    setStickerKeywords,
    setStickerMaskPosition,
    setStickerSetTitle,
    setStickerSetThumbnail,
    setCustomEmojiStickerSetThumbnail,
    deleteStickerSet,
    getAvailableGifts,
    sendGift,
    giftPremiumSubscription,
    verifyUser,
    verifyChat,
    removeUserVerification,
    removeChatVerification,
    getUserGifts,
    getChatGifts,
    setUserEmojiStatus,
    getBusinessConnection,
    readBusinessMessage,
    deleteBusinessMessages,
    setBusinessAccountName,
    setBusinessAccountUsername,
    setBusinessAccountBio,
    setBusinessAccountProfilePhoto,
    removeBusinessAccountProfilePhoto,
    setBusinessAccountGiftSettings,
    getBusinessAccountStarBalance,
    transferBusinessAccountStars,
    getBusinessAccountGifts,
    convertGiftToStars,
    upgradeGift,
    transferGift,
    postStory,
    repostStory,
    editStory,
    deleteStory,
    setPassportDataErrors,
    sendGame,
    setGameScore,
    getGameHighScores,
  };

  return attachExamples({
    sendMessage,
    sendPhoto,
    sendVideo,
    sendAudio,
    answerCallbackQuery,
    answerWebAppQuery,
    savePreparedInlineMessage,
    savePreparedKeyboardButton,
    answerInlineQuery,
    sendInvoice,
    createInvoiceLink,
    answerShippingQuery,
    answerPreCheckoutQuery,
    getMyStarBalance,
    getStarTransactions,
    refundStarPayment,
    editUserStarSubscription,
    sendSticker,
    getStickerSet,
    getCustomEmojiStickers,
    uploadStickerFile,
    createNewStickerSet,
    addStickerToSet,
    setStickerPositionInSet,
    deleteStickerFromSet,
    replaceStickerInSet,
    setStickerEmojiList,
    setStickerKeywords,
    setStickerMaskPosition,
    setStickerSetTitle,
    setStickerSetThumbnail,
    setCustomEmojiStickerSetThumbnail,
    deleteStickerSet,
    getAvailableGifts,
    sendGift,
    giftPremiumSubscription,
    verifyUser,
    verifyChat,
    removeUserVerification,
    removeChatVerification,
    getUserGifts,
    getChatGifts,
    setUserEmojiStatus,
    getBusinessConnection,
    readBusinessMessage,
    deleteBusinessMessages,
    setBusinessAccountName,
    setBusinessAccountUsername,
    setBusinessAccountBio,
    setBusinessAccountProfilePhoto,
    removeBusinessAccountProfilePhoto,
    setBusinessAccountGiftSettings,
    getBusinessAccountStarBalance,
    transferBusinessAccountStars,
    getBusinessAccountGifts,
    convertGiftToStars,
    upgradeGift,
    transferGift,
    postStory,
    repostStory,
    editStory,
    deleteStory,
    setPassportDataErrors,
    sendGame,
    setGameScore,
    getGameHighScores,
    post,
  });
}
