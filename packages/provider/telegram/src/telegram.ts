import { TelegramError } from "./types";
import type {
  TelegramCloseResponse,
  TelegramDeleteMyCommandsRequest,
  TelegramDeleteMyCommandsResponse,
  TelegramDeleteWebhookRequest,
  TelegramDeleteWebhookResponse,
  TelegramGetChatMenuButtonRequest,
  TelegramGetChatMenuButtonResponse,
  TelegramGetFileRequest,
  TelegramGetFileResponse,
  TelegramGetManagedBotAccessSettingsResponse,
  TelegramGetManagedBotTokenResponse,
  TelegramGetMeResponse,
  TelegramGetMyCommandsRequest,
  TelegramGetMyCommandsResponse,
  TelegramGetMyDefaultAdministratorRightsRequest,
  TelegramGetMyDefaultAdministratorRightsResponse,
  TelegramGetMyDescriptionResponse,
  TelegramGetMyNameResponse,
  TelegramGetMyShortDescriptionResponse,
  TelegramGetUpdatesRequest,
  TelegramGetUpdatesResponse,
  TelegramGetWebhookInfoResponse,
  TelegramLanguageCodeRequest,
  TelegramLogOutResponse,
  TelegramManagedBotUserRequest,
  TelegramOptions,
  TelegramPostNamespace,
  TelegramProvider,
  TelegramReplaceManagedBotTokenResponse,
  TelegramSendAudioRequest,
  TelegramSendAudioResponse,
  TelegramSendMessageRequest,
  TelegramSendMessageResponse,
  TelegramSendPhotoRequest,
  TelegramSendPhotoResponse,
  TelegramSendVideoRequest,
  TelegramSendVideoResponse,
  TelegramSetChatMenuButtonRequest,
  TelegramSetChatMenuButtonResponse,
  TelegramSetManagedBotAccessSettingsRequest,
  TelegramSetManagedBotAccessSettingsResponse,
  TelegramSetMyCommandsRequest,
  TelegramSetMyCommandsResponse,
  TelegramSetMyDefaultAdministratorRightsRequest,
  TelegramSetMyDefaultAdministratorRightsResponse,
  TelegramSetMyDescriptionRequest,
  TelegramSetMyDescriptionResponse,
  TelegramSetMyNameRequest,
  TelegramSetMyNameResponse,
  TelegramSetMyShortDescriptionRequest,
  TelegramSetMyShortDescriptionResponse,
  TelegramSetWebhookRequest,
  TelegramSetWebhookResponse,
} from "./types";
import {
  TelegramDeleteMyCommandsRequestSchema,
  TelegramDeleteWebhookRequestSchema,
  TelegramEmptyRequestSchema,
  TelegramGetChatMenuButtonRequestSchema,
  TelegramGetFileRequestSchema,
  TelegramGetMyCommandsRequestSchema,
  TelegramGetMyDefaultAdministratorRightsRequestSchema,
  TelegramGetUpdatesRequestSchema,
  TelegramLanguageCodeRequestSchema,
  TelegramManagedBotUserRequestSchema,
  TelegramSendAudioRequestSchema,
  TelegramSendMessageRequestSchema,
  TelegramSendPhotoRequestSchema,
  TelegramSendVideoRequestSchema,
  TelegramSetChatMenuButtonRequestSchema,
  TelegramSetManagedBotAccessSettingsRequestSchema,
  TelegramSetMyCommandsRequestSchema,
  TelegramSetMyDefaultAdministratorRightsRequestSchema,
  TelegramSetMyDescriptionRequestSchema,
  TelegramSetMyNameRequestSchema,
  TelegramSetMyShortDescriptionRequestSchema,
  TelegramSetWebhookRequestSchema,
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
  // POST https://api.telegram.org/bot{token}/getUpdates
  // Docs: https://core.telegram.org/bots/api#getupdates
  const getUpdates = Object.assign(
    async (
      req: TelegramGetUpdatesRequest = {},
      signal?: AbortSignal
    ): Promise<TelegramGetUpdatesResponse> => {
      return makeRequest<TelegramGetUpdatesResponse>(
        "/getUpdates",
        req,
        signal
      );
    },
    { schema: TelegramGetUpdatesRequestSchema }
  );

  // sig-ok: `bot{token}` is Telegram's auth prefix, not a method namespace.
  // POST https://api.telegram.org/bot{token}/setWebhook
  // Docs: https://core.telegram.org/bots/api#setwebhook
  const setWebhook = Object.assign(
    async (
      req: TelegramSetWebhookRequest,
      signal?: AbortSignal
    ): Promise<TelegramSetWebhookResponse> => {
      return makeRequest<TelegramSetWebhookResponse>(
        "/setWebhook",
        req,
        signal
      );
    },
    { schema: TelegramSetWebhookRequestSchema }
  );

  // sig-ok: `bot{token}` is Telegram's auth prefix, not a method namespace.
  // POST https://api.telegram.org/bot{token}/deleteWebhook
  // Docs: https://core.telegram.org/bots/api#deletewebhook
  const deleteWebhook = Object.assign(
    async (
      req: TelegramDeleteWebhookRequest = {},
      signal?: AbortSignal
    ): Promise<TelegramDeleteWebhookResponse> => {
      return makeRequest<TelegramDeleteWebhookResponse>(
        "/deleteWebhook",
        req,
        signal
      );
    },
    { schema: TelegramDeleteWebhookRequestSchema }
  );

  // sig-ok: `bot{token}` is Telegram's auth prefix, not a method namespace.
  // POST https://api.telegram.org/bot{token}/getWebhookInfo
  // Docs: https://core.telegram.org/bots/api#getwebhookinfo
  const getWebhookInfo = Object.assign(
    async (
      req = {},
      signal?: AbortSignal
    ): Promise<TelegramGetWebhookInfoResponse> => {
      return makeRequest<TelegramGetWebhookInfoResponse>(
        "/getWebhookInfo",
        req,
        signal
      );
    },
    { schema: TelegramEmptyRequestSchema }
  );

  // sig-ok: `bot{token}` is Telegram's auth prefix, not a method namespace.
  // POST https://api.telegram.org/bot{token}/getMe
  // Docs: https://core.telegram.org/bots/api#getme
  const getMe = Object.assign(
    async (req = {}, signal?: AbortSignal): Promise<TelegramGetMeResponse> => {
      return makeRequest<TelegramGetMeResponse>("/getMe", req, signal);
    },
    { schema: TelegramEmptyRequestSchema }
  );

  // sig-ok: `bot{token}` is Telegram's auth prefix, not a method namespace.
  // POST https://api.telegram.org/bot{token}/logOut
  // Docs: https://core.telegram.org/bots/api#logout
  const logOut = Object.assign(
    async (req = {}, signal?: AbortSignal): Promise<TelegramLogOutResponse> => {
      return makeRequest<TelegramLogOutResponse>("/logOut", req, signal);
    },
    { schema: TelegramEmptyRequestSchema }
  );

  // sig-ok: `bot{token}` is Telegram's auth prefix, not a method namespace.
  // POST https://api.telegram.org/bot{token}/close
  // Docs: https://core.telegram.org/bots/api#close
  const close = Object.assign(
    async (req = {}, signal?: AbortSignal): Promise<TelegramCloseResponse> => {
      return makeRequest<TelegramCloseResponse>("/close", req, signal);
    },
    { schema: TelegramEmptyRequestSchema }
  );

  // sig-ok: `bot{token}` is Telegram's auth prefix, not a method namespace.
  // POST https://api.telegram.org/bot{token}/getFile
  // Docs: https://core.telegram.org/bots/api#getfile
  const getFile = Object.assign(
    async (
      req: TelegramGetFileRequest,
      signal?: AbortSignal
    ): Promise<TelegramGetFileResponse> => {
      return makeRequest<TelegramGetFileResponse>("/getFile", req, signal);
    },
    { schema: TelegramGetFileRequestSchema }
  );

  // sig-ok: `bot{token}` is Telegram's auth prefix, not a method namespace.
  // POST https://api.telegram.org/bot{token}/getManagedBotToken
  // Docs: https://core.telegram.org/bots/api#getmanagedbottoken
  const getManagedBotToken = Object.assign(
    async (
      req: TelegramManagedBotUserRequest,
      signal?: AbortSignal
    ): Promise<TelegramGetManagedBotTokenResponse> => {
      return makeRequest<TelegramGetManagedBotTokenResponse>(
        "/getManagedBotToken",
        req,
        signal
      );
    },
    { schema: TelegramManagedBotUserRequestSchema }
  );

  // sig-ok: `bot{token}` is Telegram's auth prefix, not a method namespace.
  // POST https://api.telegram.org/bot{token}/replaceManagedBotToken
  // Docs: https://core.telegram.org/bots/api#replacemanagedbottoken
  const replaceManagedBotToken = Object.assign(
    async (
      req: TelegramManagedBotUserRequest,
      signal?: AbortSignal
    ): Promise<TelegramReplaceManagedBotTokenResponse> => {
      return makeRequest<TelegramReplaceManagedBotTokenResponse>(
        "/replaceManagedBotToken",
        req,
        signal
      );
    },
    { schema: TelegramManagedBotUserRequestSchema }
  );

  // sig-ok: `bot{token}` is Telegram's auth prefix, not a method namespace.
  // POST https://api.telegram.org/bot{token}/getManagedBotAccessSettings
  // Docs: https://core.telegram.org/bots/api#getmanagedbotaccesssettings
  const getManagedBotAccessSettings = Object.assign(
    async (
      req: TelegramManagedBotUserRequest,
      signal?: AbortSignal
    ): Promise<TelegramGetManagedBotAccessSettingsResponse> => {
      return makeRequest<TelegramGetManagedBotAccessSettingsResponse>(
        "/getManagedBotAccessSettings",
        req,
        signal
      );
    },
    { schema: TelegramManagedBotUserRequestSchema }
  );

  // sig-ok: `bot{token}` is Telegram's auth prefix, not a method namespace.
  // POST https://api.telegram.org/bot{token}/setManagedBotAccessSettings
  // Docs: https://core.telegram.org/bots/api#setmanagedbotaccesssettings
  const setManagedBotAccessSettings = Object.assign(
    async (
      req: TelegramSetManagedBotAccessSettingsRequest,
      signal?: AbortSignal
    ): Promise<TelegramSetManagedBotAccessSettingsResponse> => {
      return makeRequest<TelegramSetManagedBotAccessSettingsResponse>(
        "/setManagedBotAccessSettings",
        req,
        signal
      );
    },
    { schema: TelegramSetManagedBotAccessSettingsRequestSchema }
  );

  // sig-ok: `bot{token}` is Telegram's auth prefix, not a method namespace.
  // POST https://api.telegram.org/bot{token}/setMyCommands
  // Docs: https://core.telegram.org/bots/api#setmycommands
  const setMyCommands = Object.assign(
    async (
      req: TelegramSetMyCommandsRequest,
      signal?: AbortSignal
    ): Promise<TelegramSetMyCommandsResponse> => {
      return makeRequest<TelegramSetMyCommandsResponse>(
        "/setMyCommands",
        req,
        signal
      );
    },
    { schema: TelegramSetMyCommandsRequestSchema }
  );

  // sig-ok: `bot{token}` is Telegram's auth prefix, not a method namespace.
  // POST https://api.telegram.org/bot{token}/deleteMyCommands
  // Docs: https://core.telegram.org/bots/api#deletemycommands
  const deleteMyCommands = Object.assign(
    async (
      req: TelegramDeleteMyCommandsRequest = {},
      signal?: AbortSignal
    ): Promise<TelegramDeleteMyCommandsResponse> => {
      return makeRequest<TelegramDeleteMyCommandsResponse>(
        "/deleteMyCommands",
        req,
        signal
      );
    },
    { schema: TelegramDeleteMyCommandsRequestSchema }
  );

  // sig-ok: `bot{token}` is Telegram's auth prefix, not a method namespace.
  // POST https://api.telegram.org/bot{token}/getMyCommands
  // Docs: https://core.telegram.org/bots/api#getmycommands
  const getMyCommands = Object.assign(
    async (
      req: TelegramGetMyCommandsRequest = {},
      signal?: AbortSignal
    ): Promise<TelegramGetMyCommandsResponse> => {
      return makeRequest<TelegramGetMyCommandsResponse>(
        "/getMyCommands",
        req,
        signal
      );
    },
    { schema: TelegramGetMyCommandsRequestSchema }
  );

  // sig-ok: `bot{token}` is Telegram's auth prefix, not a method namespace.
  // POST https://api.telegram.org/bot{token}/setMyName
  // Docs: https://core.telegram.org/bots/api#setmyname
  const setMyName = Object.assign(
    async (
      req: TelegramSetMyNameRequest = {},
      signal?: AbortSignal
    ): Promise<TelegramSetMyNameResponse> => {
      return makeRequest<TelegramSetMyNameResponse>("/setMyName", req, signal);
    },
    { schema: TelegramSetMyNameRequestSchema }
  );

  // sig-ok: `bot{token}` is Telegram's auth prefix, not a method namespace.
  // POST https://api.telegram.org/bot{token}/getMyName
  // Docs: https://core.telegram.org/bots/api#getmyname
  const getMyName = Object.assign(
    async (
      req: TelegramLanguageCodeRequest = {},
      signal?: AbortSignal
    ): Promise<TelegramGetMyNameResponse> => {
      return makeRequest<TelegramGetMyNameResponse>("/getMyName", req, signal);
    },
    { schema: TelegramLanguageCodeRequestSchema }
  );

  // sig-ok: `bot{token}` is Telegram's auth prefix, not a method namespace.
  // POST https://api.telegram.org/bot{token}/setMyDescription
  // Docs: https://core.telegram.org/bots/api#setmydescription
  const setMyDescription = Object.assign(
    async (
      req: TelegramSetMyDescriptionRequest = {},
      signal?: AbortSignal
    ): Promise<TelegramSetMyDescriptionResponse> => {
      return makeRequest<TelegramSetMyDescriptionResponse>(
        "/setMyDescription",
        req,
        signal
      );
    },
    { schema: TelegramSetMyDescriptionRequestSchema }
  );

  // sig-ok: `bot{token}` is Telegram's auth prefix, not a method namespace.
  // POST https://api.telegram.org/bot{token}/getMyDescription
  // Docs: https://core.telegram.org/bots/api#getmydescription
  const getMyDescription = Object.assign(
    async (
      req: TelegramLanguageCodeRequest = {},
      signal?: AbortSignal
    ): Promise<TelegramGetMyDescriptionResponse> => {
      return makeRequest<TelegramGetMyDescriptionResponse>(
        "/getMyDescription",
        req,
        signal
      );
    },
    { schema: TelegramLanguageCodeRequestSchema }
  );

  // sig-ok: `bot{token}` is Telegram's auth prefix, not a method namespace.
  // POST https://api.telegram.org/bot{token}/setMyShortDescription
  // Docs: https://core.telegram.org/bots/api#setmyshortdescription
  const setMyShortDescription = Object.assign(
    async (
      req: TelegramSetMyShortDescriptionRequest = {},
      signal?: AbortSignal
    ): Promise<TelegramSetMyShortDescriptionResponse> => {
      return makeRequest<TelegramSetMyShortDescriptionResponse>(
        "/setMyShortDescription",
        req,
        signal
      );
    },
    { schema: TelegramSetMyShortDescriptionRequestSchema }
  );

  // sig-ok: `bot{token}` is Telegram's auth prefix, not a method namespace.
  // POST https://api.telegram.org/bot{token}/getMyShortDescription
  // Docs: https://core.telegram.org/bots/api#getmyshortdescription
  const getMyShortDescription = Object.assign(
    async (
      req: TelegramLanguageCodeRequest = {},
      signal?: AbortSignal
    ): Promise<TelegramGetMyShortDescriptionResponse> => {
      return makeRequest<TelegramGetMyShortDescriptionResponse>(
        "/getMyShortDescription",
        req,
        signal
      );
    },
    { schema: TelegramLanguageCodeRequestSchema }
  );

  // sig-ok: `bot{token}` is Telegram's auth prefix, not a method namespace.
  // POST https://api.telegram.org/bot{token}/setChatMenuButton
  // Docs: https://core.telegram.org/bots/api#setchatmenubutton
  const setChatMenuButton = Object.assign(
    async (
      req: TelegramSetChatMenuButtonRequest = {},
      signal?: AbortSignal
    ): Promise<TelegramSetChatMenuButtonResponse> => {
      return makeRequest<TelegramSetChatMenuButtonResponse>(
        "/setChatMenuButton",
        req,
        signal
      );
    },
    { schema: TelegramSetChatMenuButtonRequestSchema }
  );

  // sig-ok: `bot{token}` is Telegram's auth prefix, not a method namespace.
  // POST https://api.telegram.org/bot{token}/getChatMenuButton
  // Docs: https://core.telegram.org/bots/api#getchatmenubutton
  const getChatMenuButton = Object.assign(
    async (
      req: TelegramGetChatMenuButtonRequest = {},
      signal?: AbortSignal
    ): Promise<TelegramGetChatMenuButtonResponse> => {
      return makeRequest<TelegramGetChatMenuButtonResponse>(
        "/getChatMenuButton",
        req,
        signal
      );
    },
    { schema: TelegramGetChatMenuButtonRequestSchema }
  );

  // sig-ok: `bot{token}` is Telegram's auth prefix, not a method namespace.
  // POST https://api.telegram.org/bot{token}/setMyDefaultAdministratorRights
  // Docs: https://core.telegram.org/bots/api#setmydefaultadministratorrights
  const setMyDefaultAdministratorRights = Object.assign(
    async (
      req: TelegramSetMyDefaultAdministratorRightsRequest = {},
      signal?: AbortSignal
    ): Promise<TelegramSetMyDefaultAdministratorRightsResponse> => {
      return makeRequest<TelegramSetMyDefaultAdministratorRightsResponse>(
        "/setMyDefaultAdministratorRights",
        req,
        signal
      );
    },
    { schema: TelegramSetMyDefaultAdministratorRightsRequestSchema }
  );

  // sig-ok: `bot{token}` is Telegram's auth prefix, not a method namespace.
  // POST https://api.telegram.org/bot{token}/getMyDefaultAdministratorRights
  // Docs: https://core.telegram.org/bots/api#getmydefaultadministratorrights
  const getMyDefaultAdministratorRights = Object.assign(
    async (
      req: TelegramGetMyDefaultAdministratorRightsRequest = {},
      signal?: AbortSignal
    ): Promise<TelegramGetMyDefaultAdministratorRightsResponse> => {
      return makeRequest<TelegramGetMyDefaultAdministratorRightsResponse>(
        "/getMyDefaultAdministratorRights",
        req,
        signal
      );
    },
    { schema: TelegramGetMyDefaultAdministratorRightsRequestSchema }
  );

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

  const post: TelegramPostNamespace = {
    getUpdates,
    setWebhook,
    deleteWebhook,
    getWebhookInfo,
    getMe,
    logOut,
    close,
    getFile,
    getManagedBotToken,
    replaceManagedBotToken,
    getManagedBotAccessSettings,
    setManagedBotAccessSettings,
    setMyCommands,
    deleteMyCommands,
    getMyCommands,
    setMyName,
    getMyName,
    setMyDescription,
    getMyDescription,
    setMyShortDescription,
    getMyShortDescription,
    setChatMenuButton,
    getChatMenuButton,
    setMyDefaultAdministratorRights,
    getMyDefaultAdministratorRights,
    sendMessage,
    sendPhoto,
    sendVideo,
    sendAudio,
  };

  return attachExamples({
    ...post,
    post,
  });
}
