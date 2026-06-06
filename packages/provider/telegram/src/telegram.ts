import { TelegramError } from "./types";
import type {
  TelegramOptions,
  TelegramProvider,
  TelegramSendAudioRequest,
  TelegramSendAudioResponse,
  TelegramSendMessageRequest,
  TelegramSendMessageResponse,
  TelegramSendPhotoRequest,
  TelegramSendPhotoResponse,
  TelegramSendVideoRequest,
  TelegramSendVideoResponse,
} from "./types";
import {
  TelegramSendAudioRequestSchema,
  TelegramSendMessageRequestSchema,
  TelegramSendPhotoRequestSchema,
  TelegramSendVideoRequestSchema,
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

  const post = {
    sendMessage,
    sendPhoto,
    sendVideo,
    sendAudio,
  };

  return attachExamples({
    sendMessage,
    sendPhoto,
    sendVideo,
    sendAudio,
    post,
  });
}
