import { TelegramError } from "./types";
import type {
  TelegramCopyMessageRequest,
  TelegramCopyMessageResponse,
  TelegramCopyMessagesRequest,
  TelegramCopyMessagesResponse,
  TelegramDeleteAllMessageReactionsRequest,
  TelegramDeleteAllMessageReactionsResponse,
  TelegramDeleteMessageReactionRequest,
  TelegramDeleteMessageReactionResponse,
  TelegramDeleteMessageRequest,
  TelegramDeleteMessageResponse,
  TelegramDeleteMessagesRequest,
  TelegramDeleteMessagesResponse,
  TelegramEditMessageCaptionRequest,
  TelegramEditMessageCaptionResponse,
  TelegramEditMessageChecklistRequest,
  TelegramEditMessageChecklistResponse,
  TelegramEditMessageLiveLocationRequest,
  TelegramEditMessageLiveLocationResponse,
  TelegramEditMessageMediaRequest,
  TelegramEditMessageMediaResponse,
  TelegramEditMessageReplyMarkupRequest,
  TelegramEditMessageReplyMarkupResponse,
  TelegramEditMessageTextRequest,
  TelegramEditMessageTextResponse,
  TelegramForwardMessageRequest,
  TelegramForwardMessageResponse,
  TelegramForwardMessagesRequest,
  TelegramForwardMessagesResponse,
  TelegramOptions,
  TelegramPinChatMessageRequest,
  TelegramPinChatMessageResponse,
  TelegramProvider,
  TelegramSendAudioRequest,
  TelegramSendAudioResponse,
  TelegramSendMessageRequest,
  TelegramSendMessageResponse,
  TelegramSendPhotoRequest,
  TelegramSendPhotoResponse,
  TelegramSendVideoRequest,
  TelegramSendVideoResponse,
  TelegramSetMessageReactionRequest,
  TelegramSetMessageReactionResponse,
  TelegramStopMessageLiveLocationRequest,
  TelegramStopMessageLiveLocationResponse,
  TelegramStopPollRequest,
  TelegramStopPollResponse,
  TelegramUnpinAllChatMessagesRequest,
  TelegramUnpinAllChatMessagesResponse,
  TelegramUnpinChatMessageRequest,
  TelegramUnpinChatMessageResponse,
} from "./types";
import {
  TelegramCopyMessageRequestSchema,
  TelegramCopyMessagesRequestSchema,
  TelegramDeleteAllMessageReactionsRequestSchema,
  TelegramDeleteMessageReactionRequestSchema,
  TelegramDeleteMessageRequestSchema,
  TelegramDeleteMessagesRequestSchema,
  TelegramEditMessageCaptionRequestSchema,
  TelegramEditMessageChecklistRequestSchema,
  TelegramEditMessageLiveLocationRequestSchema,
  TelegramEditMessageMediaRequestSchema,
  TelegramEditMessageReplyMarkupRequestSchema,
  TelegramEditMessageTextRequestSchema,
  TelegramForwardMessageRequestSchema,
  TelegramForwardMessagesRequestSchema,
  TelegramPinChatMessageRequestSchema,
  TelegramSendAudioRequestSchema,
  TelegramSendMessageRequestSchema,
  TelegramSendPhotoRequestSchema,
  TelegramSendVideoRequestSchema,
  TelegramSetMessageReactionRequestSchema,
  TelegramStopMessageLiveLocationRequestSchema,
  TelegramStopPollRequestSchema,
  TelegramUnpinAllChatMessagesRequestSchema,
  TelegramUnpinChatMessageRequestSchema,
} from "./zod";
import { attachExamples } from "./example";

export function createTelegram(opts: TelegramOptions): TelegramProvider {
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
  const sendMessage = Object.assign(
    async (
      req: TelegramSendMessageRequest,
      signal?: AbortSignal
    ): Promise<TelegramSendMessageResponse> => {
      return makeRequest<TelegramSendMessageResponse>(
        "/sendMessage",
        req,
        signal
      );
    },
    { schema: TelegramSendMessageRequestSchema }
  );

  // sig-ok: `bot{token}` is Telegram's auth prefix, not a method namespace.
  // POST https://api.telegram.org/bot{token}/sendPhoto
  // Docs: https://core.telegram.org/bots/api#sendphoto
  const sendPhoto = Object.assign(
    async (
      req: TelegramSendPhotoRequest,
      signal?: AbortSignal
    ): Promise<TelegramSendPhotoResponse> => {
      return makeRequest<TelegramSendPhotoResponse>("/sendPhoto", req, signal);
    },
    { schema: TelegramSendPhotoRequestSchema }
  );

  // sig-ok: `bot{token}` is Telegram's auth prefix, not a method namespace.
  // POST https://api.telegram.org/bot{token}/sendVideo
  // Docs: https://core.telegram.org/bots/api#sendvideo
  const sendVideo = Object.assign(
    async (
      req: TelegramSendVideoRequest,
      signal?: AbortSignal
    ): Promise<TelegramSendVideoResponse> => {
      return makeRequest<TelegramSendVideoResponse>("/sendVideo", req, signal);
    },
    { schema: TelegramSendVideoRequestSchema }
  );

  // sig-ok: `bot{token}` is Telegram's auth prefix, not a method namespace.
  // POST https://api.telegram.org/bot{token}/sendAudio
  // Docs: https://core.telegram.org/bots/api#sendaudio
  const sendAudio = Object.assign(
    async (
      req: TelegramSendAudioRequest,
      signal?: AbortSignal
    ): Promise<TelegramSendAudioResponse> => {
      return makeRequest<TelegramSendAudioResponse>("/sendAudio", req, signal);
    },
    { schema: TelegramSendAudioRequestSchema }
  );

  // sig-ok: `bot{token}` is Telegram's auth prefix, not a method namespace.
  // POST https://api.telegram.org/bot{token}/forwardMessage
  // Docs: https://core.telegram.org/bots/api#forwardmessage
  const forwardMessage = Object.assign(
    async (
      req: TelegramForwardMessageRequest,
      signal?: AbortSignal
    ): Promise<TelegramForwardMessageResponse> => {
      return makeRequest<TelegramForwardMessageResponse>(
        "/forwardMessage",
        req,
        signal
      );
    },
    { schema: TelegramForwardMessageRequestSchema }
  );

  // sig-ok: `bot{token}` is Telegram's auth prefix, not a method namespace.
  // POST https://api.telegram.org/bot{token}/forwardMessages
  // Docs: https://core.telegram.org/bots/api#forwardmessages
  const forwardMessages = Object.assign(
    async (
      req: TelegramForwardMessagesRequest,
      signal?: AbortSignal
    ): Promise<TelegramForwardMessagesResponse> => {
      return makeRequest<TelegramForwardMessagesResponse>(
        "/forwardMessages",
        req,
        signal
      );
    },
    { schema: TelegramForwardMessagesRequestSchema }
  );

  // sig-ok: `bot{token}` is Telegram's auth prefix, not a method namespace.
  // POST https://api.telegram.org/bot{token}/copyMessage
  // Docs: https://core.telegram.org/bots/api#copymessage
  const copyMessage = Object.assign(
    async (
      req: TelegramCopyMessageRequest,
      signal?: AbortSignal
    ): Promise<TelegramCopyMessageResponse> => {
      return makeRequest<TelegramCopyMessageResponse>(
        "/copyMessage",
        req,
        signal
      );
    },
    { schema: TelegramCopyMessageRequestSchema }
  );

  // sig-ok: `bot{token}` is Telegram's auth prefix, not a method namespace.
  // POST https://api.telegram.org/bot{token}/copyMessages
  // Docs: https://core.telegram.org/bots/api#copymessages
  const copyMessages = Object.assign(
    async (
      req: TelegramCopyMessagesRequest,
      signal?: AbortSignal
    ): Promise<TelegramCopyMessagesResponse> => {
      return makeRequest<TelegramCopyMessagesResponse>(
        "/copyMessages",
        req,
        signal
      );
    },
    { schema: TelegramCopyMessagesRequestSchema }
  );

  // sig-ok: `bot{token}` is Telegram's auth prefix, not a method namespace.
  // POST https://api.telegram.org/bot{token}/deleteMessage
  // Docs: https://core.telegram.org/bots/api#deletemessage
  const deleteMessage = Object.assign(
    async (
      req: TelegramDeleteMessageRequest,
      signal?: AbortSignal
    ): Promise<TelegramDeleteMessageResponse> => {
      return makeRequest<TelegramDeleteMessageResponse>(
        "/deleteMessage",
        req,
        signal
      );
    },
    { schema: TelegramDeleteMessageRequestSchema }
  );

  // sig-ok: `bot{token}` is Telegram's auth prefix, not a method namespace.
  // POST https://api.telegram.org/bot{token}/deleteMessages
  // Docs: https://core.telegram.org/bots/api#deletemessages
  const deleteMessages = Object.assign(
    async (
      req: TelegramDeleteMessagesRequest,
      signal?: AbortSignal
    ): Promise<TelegramDeleteMessagesResponse> => {
      return makeRequest<TelegramDeleteMessagesResponse>(
        "/deleteMessages",
        req,
        signal
      );
    },
    { schema: TelegramDeleteMessagesRequestSchema }
  );

  // sig-ok: `bot{token}` is Telegram's auth prefix, not a method namespace.
  // POST https://api.telegram.org/bot{token}/pinChatMessage
  // Docs: https://core.telegram.org/bots/api#pinchatmessage
  const pinChatMessage = Object.assign(
    async (
      req: TelegramPinChatMessageRequest,
      signal?: AbortSignal
    ): Promise<TelegramPinChatMessageResponse> => {
      return makeRequest<TelegramPinChatMessageResponse>(
        "/pinChatMessage",
        req,
        signal
      );
    },
    { schema: TelegramPinChatMessageRequestSchema }
  );

  // sig-ok: `bot{token}` is Telegram's auth prefix, not a method namespace.
  // POST https://api.telegram.org/bot{token}/unpinChatMessage
  // Docs: https://core.telegram.org/bots/api#unpinchatmessage
  const unpinChatMessage = Object.assign(
    async (
      req: TelegramUnpinChatMessageRequest,
      signal?: AbortSignal
    ): Promise<TelegramUnpinChatMessageResponse> => {
      return makeRequest<TelegramUnpinChatMessageResponse>(
        "/unpinChatMessage",
        req,
        signal
      );
    },
    { schema: TelegramUnpinChatMessageRequestSchema }
  );

  // sig-ok: `bot{token}` is Telegram's auth prefix, not a method namespace.
  // POST https://api.telegram.org/bot{token}/unpinAllChatMessages
  // Docs: https://core.telegram.org/bots/api#unpinallchatmessages
  const unpinAllChatMessages = Object.assign(
    async (
      req: TelegramUnpinAllChatMessagesRequest,
      signal?: AbortSignal
    ): Promise<TelegramUnpinAllChatMessagesResponse> => {
      return makeRequest<TelegramUnpinAllChatMessagesResponse>(
        "/unpinAllChatMessages",
        req,
        signal
      );
    },
    { schema: TelegramUnpinAllChatMessagesRequestSchema }
  );

  // sig-ok: `bot{token}` is Telegram's auth prefix, not a method namespace.
  // POST https://api.telegram.org/bot{token}/editMessageText
  // Docs: https://core.telegram.org/bots/api#editmessagetext
  const editMessageText = Object.assign(
    async (
      req: TelegramEditMessageTextRequest,
      signal?: AbortSignal
    ): Promise<TelegramEditMessageTextResponse> => {
      return makeRequest<TelegramEditMessageTextResponse>(
        "/editMessageText",
        req,
        signal
      );
    },
    { schema: TelegramEditMessageTextRequestSchema }
  );

  // sig-ok: `bot{token}` is Telegram's auth prefix, not a method namespace.
  // POST https://api.telegram.org/bot{token}/editMessageCaption
  // Docs: https://core.telegram.org/bots/api#editmessagecaption
  const editMessageCaption = Object.assign(
    async (
      req: TelegramEditMessageCaptionRequest,
      signal?: AbortSignal
    ): Promise<TelegramEditMessageCaptionResponse> => {
      return makeRequest<TelegramEditMessageCaptionResponse>(
        "/editMessageCaption",
        req,
        signal
      );
    },
    { schema: TelegramEditMessageCaptionRequestSchema }
  );

  // sig-ok: `bot{token}` is Telegram's auth prefix, not a method namespace.
  // POST https://api.telegram.org/bot{token}/editMessageMedia
  // Docs: https://core.telegram.org/bots/api#editmessagemedia
  const editMessageMedia = Object.assign(
    async (
      req: TelegramEditMessageMediaRequest,
      signal?: AbortSignal
    ): Promise<TelegramEditMessageMediaResponse> => {
      return makeRequest<TelegramEditMessageMediaResponse>(
        "/editMessageMedia",
        req,
        signal
      );
    },
    { schema: TelegramEditMessageMediaRequestSchema }
  );

  // sig-ok: `bot{token}` is Telegram's auth prefix, not a method namespace.
  // POST https://api.telegram.org/bot{token}/editMessageLiveLocation
  // Docs: https://core.telegram.org/bots/api#editmessagelivelocation
  const editMessageLiveLocation = Object.assign(
    async (
      req: TelegramEditMessageLiveLocationRequest,
      signal?: AbortSignal
    ): Promise<TelegramEditMessageLiveLocationResponse> => {
      return makeRequest<TelegramEditMessageLiveLocationResponse>(
        "/editMessageLiveLocation",
        req,
        signal
      );
    },
    { schema: TelegramEditMessageLiveLocationRequestSchema }
  );

  // sig-ok: `bot{token}` is Telegram's auth prefix, not a method namespace.
  // POST https://api.telegram.org/bot{token}/stopMessageLiveLocation
  // Docs: https://core.telegram.org/bots/api#stopmessagelivelocation
  const stopMessageLiveLocation = Object.assign(
    async (
      req: TelegramStopMessageLiveLocationRequest,
      signal?: AbortSignal
    ): Promise<TelegramStopMessageLiveLocationResponse> => {
      return makeRequest<TelegramStopMessageLiveLocationResponse>(
        "/stopMessageLiveLocation",
        req,
        signal
      );
    },
    { schema: TelegramStopMessageLiveLocationRequestSchema }
  );

  // sig-ok: `bot{token}` is Telegram's auth prefix, not a method namespace.
  // POST https://api.telegram.org/bot{token}/editMessageChecklist
  // Docs: https://core.telegram.org/bots/api#editmessagechecklist
  const editMessageChecklist = Object.assign(
    async (
      req: TelegramEditMessageChecklistRequest,
      signal?: AbortSignal
    ): Promise<TelegramEditMessageChecklistResponse> => {
      return makeRequest<TelegramEditMessageChecklistResponse>(
        "/editMessageChecklist",
        req,
        signal
      );
    },
    { schema: TelegramEditMessageChecklistRequestSchema }
  );

  // sig-ok: `bot{token}` is Telegram's auth prefix, not a method namespace.
  // POST https://api.telegram.org/bot{token}/editMessageReplyMarkup
  // Docs: https://core.telegram.org/bots/api#editmessagereplymarkup
  const editMessageReplyMarkup = Object.assign(
    async (
      req: TelegramEditMessageReplyMarkupRequest,
      signal?: AbortSignal
    ): Promise<TelegramEditMessageReplyMarkupResponse> => {
      return makeRequest<TelegramEditMessageReplyMarkupResponse>(
        "/editMessageReplyMarkup",
        req,
        signal
      );
    },
    { schema: TelegramEditMessageReplyMarkupRequestSchema }
  );

  // sig-ok: `bot{token}` is Telegram's auth prefix, not a method namespace.
  // POST https://api.telegram.org/bot{token}/stopPoll
  // Docs: https://core.telegram.org/bots/api#stoppoll
  const stopPoll = Object.assign(
    async (
      req: TelegramStopPollRequest,
      signal?: AbortSignal
    ): Promise<TelegramStopPollResponse> => {
      return makeRequest<TelegramStopPollResponse>("/stopPoll", req, signal);
    },
    { schema: TelegramStopPollRequestSchema }
  );

  // sig-ok: `bot{token}` is Telegram's auth prefix, not a method namespace.
  // POST https://api.telegram.org/bot{token}/setMessageReaction
  // Docs: https://core.telegram.org/bots/api#setmessagereaction
  const setMessageReaction = Object.assign(
    async (
      req: TelegramSetMessageReactionRequest,
      signal?: AbortSignal
    ): Promise<TelegramSetMessageReactionResponse> => {
      return makeRequest<TelegramSetMessageReactionResponse>(
        "/setMessageReaction",
        req,
        signal
      );
    },
    { schema: TelegramSetMessageReactionRequestSchema }
  );

  // sig-ok: `bot{token}` is Telegram's auth prefix, not a method namespace.
  // POST https://api.telegram.org/bot{token}/deleteMessageReaction
  // Docs: https://core.telegram.org/bots/api#deletemessagereaction
  const deleteMessageReaction = Object.assign(
    async (
      req: TelegramDeleteMessageReactionRequest,
      signal?: AbortSignal
    ): Promise<TelegramDeleteMessageReactionResponse> => {
      return makeRequest<TelegramDeleteMessageReactionResponse>(
        "/deleteMessageReaction",
        req,
        signal
      );
    },
    { schema: TelegramDeleteMessageReactionRequestSchema }
  );

  // sig-ok: `bot{token}` is Telegram's auth prefix, not a method namespace.
  // POST https://api.telegram.org/bot{token}/deleteAllMessageReactions
  // Docs: https://core.telegram.org/bots/api#deleteallmessagereactions
  const deleteAllMessageReactions = Object.assign(
    async (
      req: TelegramDeleteAllMessageReactionsRequest,
      signal?: AbortSignal
    ): Promise<TelegramDeleteAllMessageReactionsResponse> => {
      return makeRequest<TelegramDeleteAllMessageReactionsResponse>(
        "/deleteAllMessageReactions",
        req,
        signal
      );
    },
    { schema: TelegramDeleteAllMessageReactionsRequestSchema }
  );

  const post = {
    copyMessage,
    copyMessages,
    deleteAllMessageReactions,
    deleteMessage,
    deleteMessageReaction,
    deleteMessages,
    editMessageCaption,
    editMessageChecklist,
    editMessageLiveLocation,
    editMessageMedia,
    editMessageReplyMarkup,
    editMessageText,
    forwardMessage,
    forwardMessages,
    pinChatMessage,
    sendMessage,
    sendPhoto,
    sendVideo,
    sendAudio,
    setMessageReaction,
    stopMessageLiveLocation,
    stopPoll,
    unpinAllChatMessages,
    unpinChatMessage,
  };

  return attachExamples({
    copyMessage,
    copyMessages,
    deleteAllMessageReactions,
    deleteMessage,
    deleteMessageReaction,
    deleteMessages,
    editMessageCaption,
    editMessageChecklist,
    editMessageLiveLocation,
    editMessageMedia,
    editMessageReplyMarkup,
    editMessageText,
    forwardMessage,
    forwardMessages,
    pinChatMessage,
    sendMessage,
    sendPhoto,
    sendVideo,
    sendAudio,
    setMessageReaction,
    stopMessageLiveLocation,
    stopPoll,
    unpinAllChatMessages,
    unpinChatMessage,
    post,
  });
}
