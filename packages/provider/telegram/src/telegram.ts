import { attachExamples } from "./example";
import { TelegramError } from "./types";
import type {
  TelegramOptions,
  TelegramProvider,
  TelegramSendAnimationMethod,
  TelegramSendAnimationRequest,
  TelegramSendAnimationResponse,
  TelegramSendAudioMethod,
  TelegramSendAudioRequest,
  TelegramSendAudioResponse,
  TelegramSendChatActionMethod,
  TelegramSendChatActionRequest,
  TelegramSendChatActionResponse,
  TelegramSendChecklistMethod,
  TelegramSendChecklistRequest,
  TelegramSendChecklistResponse,
  TelegramSendContactMethod,
  TelegramSendContactRequest,
  TelegramSendContactResponse,
  TelegramSendDiceMethod,
  TelegramSendDiceRequest,
  TelegramSendDiceResponse,
  TelegramSendDocumentMethod,
  TelegramSendDocumentRequest,
  TelegramSendDocumentResponse,
  TelegramSendLivePhotoMethod,
  TelegramSendLivePhotoRequest,
  TelegramSendLivePhotoResponse,
  TelegramSendLocationMethod,
  TelegramSendLocationRequest,
  TelegramSendLocationResponse,
  TelegramSendMediaGroupMethod,
  TelegramSendMediaGroupRequest,
  TelegramSendMediaGroupResponse,
  TelegramSendMessageDraftMethod,
  TelegramSendMessageDraftRequest,
  TelegramSendMessageDraftResponse,
  TelegramSendMessageMethod,
  TelegramSendMessageRequest,
  TelegramSendMessageResponse,
  TelegramSendPaidMediaMethod,
  TelegramSendPaidMediaRequest,
  TelegramSendPaidMediaResponse,
  TelegramSendPhotoMethod,
  TelegramSendPhotoRequest,
  TelegramSendPhotoResponse,
  TelegramSendPollMethod,
  TelegramSendPollRequest,
  TelegramSendPollResponse,
  TelegramSendRichMessageDraftMethod,
  TelegramSendRichMessageDraftRequest,
  TelegramSendRichMessageDraftResponse,
  TelegramSendRichMessageMethod,
  TelegramSendRichMessageRequest,
  TelegramSendRichMessageResponse,
  TelegramSendVenueMethod,
  TelegramSendVenueRequest,
  TelegramSendVenueResponse,
  TelegramSendVideoMethod,
  TelegramSendVideoNoteMethod,
  TelegramSendVideoNoteRequest,
  TelegramSendVideoNoteResponse,
  TelegramSendVideoRequest,
  TelegramSendVideoResponse,
  TelegramSendVoiceMethod,
  TelegramSendVoiceRequest,
  TelegramSendVoiceResponse,
} from "./types";
import {
  TelegramSendAnimationRequestSchema,
  TelegramSendAudioRequestSchema,
  TelegramSendChatActionRequestSchema,
  TelegramSendChecklistRequestSchema,
  TelegramSendContactRequestSchema,
  TelegramSendDiceRequestSchema,
  TelegramSendDocumentRequestSchema,
  TelegramSendLivePhotoRequestSchema,
  TelegramSendLocationRequestSchema,
  TelegramSendMediaGroupRequestSchema,
  TelegramSendMessageDraftRequestSchema,
  TelegramSendMessageRequestSchema,
  TelegramSendPaidMediaRequestSchema,
  TelegramSendPhotoRequestSchema,
  TelegramSendPollRequestSchema,
  TelegramSendRichMessageDraftRequestSchema,
  TelegramSendRichMessageRequestSchema,
  TelegramSendVenueRequestSchema,
  TelegramSendVideoNoteRequestSchema,
  TelegramSendVideoRequestSchema,
  TelegramSendVoiceRequestSchema,
} from "./zod";

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

  function attachmentName(path: string[]): string {
    return path
      .map((part) => part.replace(/[^A-Za-z0-9_]/g, "_"))
      .filter(Boolean)
      .join("_");
  }

  function multipartJsonValue(
    form: FormData,
    value: unknown,
    path: string[]
  ): unknown {
    if (value === undefined) return undefined;
    if (value === null) return null;
    if (value instanceof Blob) {
      const name = attachmentName(path);
      form.append(name, value);
      return `attach://${name}`;
    }
    if (Array.isArray(value)) {
      return value.map((item, index) =>
        multipartJsonValue(form, item, [...path, String(index)])
      );
    }
    if (typeof value === "object") {
      const out: Record<string, unknown> = {};
      for (const [key, item] of Object.entries(value)) {
        const encoded = multipartJsonValue(form, item, [...path, key]);
        if (encoded !== undefined) {
          out[key] = encoded;
        }
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
    form.append(key, JSON.stringify(multipartJsonValue(form, value, [key])));
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
  const sendMessage: TelegramSendMessageMethod = Object.assign(
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
  const sendPhoto: TelegramSendPhotoMethod = Object.assign(
    async (
      req: TelegramSendPhotoRequest,
      signal?: AbortSignal
    ): Promise<TelegramSendPhotoResponse> => {
      return makeRequest<TelegramSendPhotoResponse>("/sendPhoto", req, signal);
    },
    { schema: TelegramSendPhotoRequestSchema }
  );

  // sig-ok: `bot{token}` is Telegram's auth prefix, not a method namespace.
  // POST https://api.telegram.org/bot{token}/sendLivePhoto
  // Docs: https://core.telegram.org/bots/api#sendlivephoto
  const sendLivePhoto: TelegramSendLivePhotoMethod = Object.assign(
    async (
      req: TelegramSendLivePhotoRequest,
      signal?: AbortSignal
    ): Promise<TelegramSendLivePhotoResponse> => {
      return makeRequest<TelegramSendLivePhotoResponse>(
        "/sendLivePhoto",
        req,
        signal
      );
    },
    { schema: TelegramSendLivePhotoRequestSchema }
  );

  // sig-ok: `bot{token}` is Telegram's auth prefix, not a method namespace.
  // POST https://api.telegram.org/bot{token}/sendAudio
  // Docs: https://core.telegram.org/bots/api#sendaudio
  const sendAudio: TelegramSendAudioMethod = Object.assign(
    async (
      req: TelegramSendAudioRequest,
      signal?: AbortSignal
    ): Promise<TelegramSendAudioResponse> => {
      return makeRequest<TelegramSendAudioResponse>("/sendAudio", req, signal);
    },
    { schema: TelegramSendAudioRequestSchema }
  );

  // sig-ok: `bot{token}` is Telegram's auth prefix, not a method namespace.
  // POST https://api.telegram.org/bot{token}/sendDocument
  // Docs: https://core.telegram.org/bots/api#senddocument
  const sendDocument: TelegramSendDocumentMethod = Object.assign(
    async (
      req: TelegramSendDocumentRequest,
      signal?: AbortSignal
    ): Promise<TelegramSendDocumentResponse> => {
      return makeRequest<TelegramSendDocumentResponse>(
        "/sendDocument",
        req,
        signal
      );
    },
    { schema: TelegramSendDocumentRequestSchema }
  );

  // sig-ok: `bot{token}` is Telegram's auth prefix, not a method namespace.
  // POST https://api.telegram.org/bot{token}/sendVideo
  // Docs: https://core.telegram.org/bots/api#sendvideo
  const sendVideo: TelegramSendVideoMethod = Object.assign(
    async (
      req: TelegramSendVideoRequest,
      signal?: AbortSignal
    ): Promise<TelegramSendVideoResponse> => {
      return makeRequest<TelegramSendVideoResponse>("/sendVideo", req, signal);
    },
    { schema: TelegramSendVideoRequestSchema }
  );

  // sig-ok: `bot{token}` is Telegram's auth prefix, not a method namespace.
  // POST https://api.telegram.org/bot{token}/sendAnimation
  // Docs: https://core.telegram.org/bots/api#sendanimation
  const sendAnimation: TelegramSendAnimationMethod = Object.assign(
    async (
      req: TelegramSendAnimationRequest,
      signal?: AbortSignal
    ): Promise<TelegramSendAnimationResponse> => {
      return makeRequest<TelegramSendAnimationResponse>(
        "/sendAnimation",
        req,
        signal
      );
    },
    { schema: TelegramSendAnimationRequestSchema }
  );

  // sig-ok: `bot{token}` is Telegram's auth prefix, not a method namespace.
  // POST https://api.telegram.org/bot{token}/sendVoice
  // Docs: https://core.telegram.org/bots/api#sendvoice
  const sendVoice: TelegramSendVoiceMethod = Object.assign(
    async (
      req: TelegramSendVoiceRequest,
      signal?: AbortSignal
    ): Promise<TelegramSendVoiceResponse> => {
      return makeRequest<TelegramSendVoiceResponse>("/sendVoice", req, signal);
    },
    { schema: TelegramSendVoiceRequestSchema }
  );

  // sig-ok: `bot{token}` is Telegram's auth prefix, not a method namespace.
  // POST https://api.telegram.org/bot{token}/sendVideoNote
  // Docs: https://core.telegram.org/bots/api#sendvideonote
  const sendVideoNote: TelegramSendVideoNoteMethod = Object.assign(
    async (
      req: TelegramSendVideoNoteRequest,
      signal?: AbortSignal
    ): Promise<TelegramSendVideoNoteResponse> => {
      return makeRequest<TelegramSendVideoNoteResponse>(
        "/sendVideoNote",
        req,
        signal
      );
    },
    { schema: TelegramSendVideoNoteRequestSchema }
  );

  // sig-ok: `bot{token}` is Telegram's auth prefix, not a method namespace.
  // POST https://api.telegram.org/bot{token}/sendPaidMedia
  // Docs: https://core.telegram.org/bots/api#sendpaidmedia
  const sendPaidMedia: TelegramSendPaidMediaMethod = Object.assign(
    async (
      req: TelegramSendPaidMediaRequest,
      signal?: AbortSignal
    ): Promise<TelegramSendPaidMediaResponse> => {
      return makeRequest<TelegramSendPaidMediaResponse>(
        "/sendPaidMedia",
        req,
        signal
      );
    },
    { schema: TelegramSendPaidMediaRequestSchema }
  );

  // sig-ok: `bot{token}` is Telegram's auth prefix, not a method namespace.
  // POST https://api.telegram.org/bot{token}/sendMediaGroup
  // Docs: https://core.telegram.org/bots/api#sendmediagroup
  const sendMediaGroup: TelegramSendMediaGroupMethod = Object.assign(
    async (
      req: TelegramSendMediaGroupRequest,
      signal?: AbortSignal
    ): Promise<TelegramSendMediaGroupResponse> => {
      return makeRequest<TelegramSendMediaGroupResponse>(
        "/sendMediaGroup",
        req,
        signal
      );
    },
    { schema: TelegramSendMediaGroupRequestSchema }
  );

  // sig-ok: `bot{token}` is Telegram's auth prefix, not a method namespace.
  // POST https://api.telegram.org/bot{token}/sendLocation
  // Docs: https://core.telegram.org/bots/api#sendlocation
  const sendLocation: TelegramSendLocationMethod = Object.assign(
    async (
      req: TelegramSendLocationRequest,
      signal?: AbortSignal
    ): Promise<TelegramSendLocationResponse> => {
      return makeRequest<TelegramSendLocationResponse>(
        "/sendLocation",
        req,
        signal
      );
    },
    { schema: TelegramSendLocationRequestSchema }
  );

  // sig-ok: `bot{token}` is Telegram's auth prefix, not a method namespace.
  // POST https://api.telegram.org/bot{token}/sendVenue
  // Docs: https://core.telegram.org/bots/api#sendvenue
  const sendVenue: TelegramSendVenueMethod = Object.assign(
    async (
      req: TelegramSendVenueRequest,
      signal?: AbortSignal
    ): Promise<TelegramSendVenueResponse> => {
      return makeRequest<TelegramSendVenueResponse>("/sendVenue", req, signal);
    },
    { schema: TelegramSendVenueRequestSchema }
  );

  // sig-ok: `bot{token}` is Telegram's auth prefix, not a method namespace.
  // POST https://api.telegram.org/bot{token}/sendContact
  // Docs: https://core.telegram.org/bots/api#sendcontact
  const sendContact: TelegramSendContactMethod = Object.assign(
    async (
      req: TelegramSendContactRequest,
      signal?: AbortSignal
    ): Promise<TelegramSendContactResponse> => {
      return makeRequest<TelegramSendContactResponse>(
        "/sendContact",
        req,
        signal
      );
    },
    { schema: TelegramSendContactRequestSchema }
  );

  // sig-ok: `bot{token}` is Telegram's auth prefix, not a method namespace.
  // POST https://api.telegram.org/bot{token}/sendPoll
  // Docs: https://core.telegram.org/bots/api#sendpoll
  const sendPoll: TelegramSendPollMethod = Object.assign(
    async (
      req: TelegramSendPollRequest,
      signal?: AbortSignal
    ): Promise<TelegramSendPollResponse> => {
      return makeRequest<TelegramSendPollResponse>("/sendPoll", req, signal);
    },
    { schema: TelegramSendPollRequestSchema }
  );

  // sig-ok: `bot{token}` is Telegram's auth prefix, not a method namespace.
  // POST https://api.telegram.org/bot{token}/sendChecklist
  // Docs: https://core.telegram.org/bots/api#sendchecklist
  const sendChecklist: TelegramSendChecklistMethod = Object.assign(
    async (
      req: TelegramSendChecklistRequest,
      signal?: AbortSignal
    ): Promise<TelegramSendChecklistResponse> => {
      return makeRequest<TelegramSendChecklistResponse>(
        "/sendChecklist",
        req,
        signal
      );
    },
    { schema: TelegramSendChecklistRequestSchema }
  );

  // sig-ok: `bot{token}` is Telegram's auth prefix, not a method namespace.
  // POST https://api.telegram.org/bot{token}/sendDice
  // Docs: https://core.telegram.org/bots/api#senddice
  const sendDice: TelegramSendDiceMethod = Object.assign(
    async (
      req: TelegramSendDiceRequest,
      signal?: AbortSignal
    ): Promise<TelegramSendDiceResponse> => {
      return makeRequest<TelegramSendDiceResponse>("/sendDice", req, signal);
    },
    { schema: TelegramSendDiceRequestSchema }
  );

  // sig-ok: `bot{token}` is Telegram's auth prefix, not a method namespace.
  // POST https://api.telegram.org/bot{token}/sendMessageDraft
  // Docs: https://core.telegram.org/bots/api#sendmessagedraft
  const sendMessageDraft: TelegramSendMessageDraftMethod = Object.assign(
    async (
      req: TelegramSendMessageDraftRequest,
      signal?: AbortSignal
    ): Promise<TelegramSendMessageDraftResponse> => {
      return makeRequest<TelegramSendMessageDraftResponse>(
        "/sendMessageDraft",
        req,
        signal
      );
    },
    { schema: TelegramSendMessageDraftRequestSchema }
  );

  // sig-ok: `bot{token}` is Telegram's auth prefix, not a method namespace.
  // POST https://api.telegram.org/bot{token}/sendChatAction
  // Docs: https://core.telegram.org/bots/api#sendchataction
  const sendChatAction: TelegramSendChatActionMethod = Object.assign(
    async (
      req: TelegramSendChatActionRequest,
      signal?: AbortSignal
    ): Promise<TelegramSendChatActionResponse> => {
      return makeRequest<TelegramSendChatActionResponse>(
        "/sendChatAction",
        req,
        signal
      );
    },
    { schema: TelegramSendChatActionRequestSchema }
  );

  // sig-ok: `bot{token}` is Telegram's auth prefix, not a method namespace.
  // POST https://api.telegram.org/bot{token}/sendRichMessage
  // Docs: https://core.telegram.org/bots/api#sendrichmessage
  const sendRichMessage: TelegramSendRichMessageMethod = Object.assign(
    async (
      req: TelegramSendRichMessageRequest,
      signal?: AbortSignal
    ): Promise<TelegramSendRichMessageResponse> => {
      return makeRequest<TelegramSendRichMessageResponse>(
        "/sendRichMessage",
        req,
        signal
      );
    },
    { schema: TelegramSendRichMessageRequestSchema }
  );

  // sig-ok: `bot{token}` is Telegram's auth prefix, not a method namespace.
  // POST https://api.telegram.org/bot{token}/sendRichMessageDraft
  // Docs: https://core.telegram.org/bots/api#sendrichmessagedraft
  const sendRichMessageDraft: TelegramSendRichMessageDraftMethod =
    Object.assign(
      async (
        req: TelegramSendRichMessageDraftRequest,
        signal?: AbortSignal
      ): Promise<TelegramSendRichMessageDraftResponse> => {
        return makeRequest<TelegramSendRichMessageDraftResponse>(
          "/sendRichMessageDraft",
          req,
          signal
        );
      },
      { schema: TelegramSendRichMessageDraftRequestSchema }
    );

  const post = {
    sendAnimation,
    sendAudio,
    sendChatAction,
    sendChecklist,
    sendContact,
    sendDice,
    sendDocument,
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
    sendVenue,
    sendVideo,
    sendVideoNote,
    sendVoice,
  };

  return attachExamples({
    ...post,
    post,
  });
}
