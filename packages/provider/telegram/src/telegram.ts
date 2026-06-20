import { attachExamples } from "./example";
import { TelegramError } from "./types";
import type * as Telegram from "./types";
import * as schemas from "./zod";

export function createTelegram(
  opts: Telegram.TelegramOptions
): Telegram.TelegramProvider {
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
  // POST https://api.telegram.org/bot{token}/answerChatJoinRequestQuery
  // Docs: https://core.telegram.org/bots/api#answerchatjoinrequestquery
  const answerChatJoinRequestQuery: Telegram.TelegramAnswerChatJoinRequestQueryMethod =
    Object.assign(
      async (
        req: Telegram.TelegramAnswerChatJoinRequestQueryRequest,
        signal?: AbortSignal
      ) => {
        return makeRequest<Telegram.TelegramTrueResponse>(
          "/answerChatJoinRequestQuery",
          req,
          signal
        );
      },
      { schema: schemas.TelegramAnswerChatJoinRequestQueryRequestSchema }
    );

  // sig-ok: `bot{token}` is Telegram's auth prefix, not a method namespace.
  // POST https://api.telegram.org/bot{token}/answerGuestQuery
  // Docs: https://core.telegram.org/bots/api#answerguestquery
  const answerGuestQuery: Telegram.TelegramAnswerGuestQueryMethod =
    Object.assign(
      async (
        req: Telegram.TelegramAnswerGuestQueryRequest,
        signal?: AbortSignal
      ) => {
        return makeRequest<Telegram.TelegramAnswerGuestQueryResponse>(
          "/answerGuestQuery",
          req,
          signal
        );
      },
      { schema: schemas.TelegramAnswerGuestQueryRequestSchema }
    );

  // sig-ok: `bot{token}` is Telegram's auth prefix, not a method namespace.
  // POST https://api.telegram.org/bot{token}/approveChatJoinRequest
  // Docs: https://core.telegram.org/bots/api#approvechatjoinrequest
  const approveChatJoinRequest: Telegram.TelegramApproveChatJoinRequestMethod =
    Object.assign(
      async (
        req: Telegram.TelegramApproveChatJoinRequestRequest,
        signal?: AbortSignal
      ) => {
        return makeRequest<Telegram.TelegramTrueResponse>(
          "/approveChatJoinRequest",
          req,
          signal
        );
      },
      { schema: schemas.TelegramApproveChatJoinRequestRequestSchema }
    );

  // sig-ok: `bot{token}` is Telegram's auth prefix, not a method namespace.
  // POST https://api.telegram.org/bot{token}/banChatMember
  // Docs: https://core.telegram.org/bots/api#banchatmember
  const banChatMember: Telegram.TelegramBanChatMemberMethod = Object.assign(
    async (
      req: Telegram.TelegramBanChatMemberRequest,
      signal?: AbortSignal
    ) => {
      return makeRequest<Telegram.TelegramTrueResponse>(
        "/banChatMember",
        req,
        signal
      );
    },
    { schema: schemas.TelegramBanChatMemberRequestSchema }
  );

  // sig-ok: `bot{token}` is Telegram's auth prefix, not a method namespace.
  // POST https://api.telegram.org/bot{token}/banChatSenderChat
  // Docs: https://core.telegram.org/bots/api#banchatsenderchat
  const banChatSenderChat: Telegram.TelegramBanChatSenderChatMethod =
    Object.assign(
      async (
        req: Telegram.TelegramBanChatSenderChatRequest,
        signal?: AbortSignal
      ) => {
        return makeRequest<Telegram.TelegramTrueResponse>(
          "/banChatSenderChat",
          req,
          signal
        );
      },
      { schema: schemas.TelegramBanChatSenderChatRequestSchema }
    );

  // sig-ok: `bot{token}` is Telegram's auth prefix, not a method namespace.
  // POST https://api.telegram.org/bot{token}/closeForumTopic
  // Docs: https://core.telegram.org/bots/api#closeforumtopic
  const closeForumTopic: Telegram.TelegramCloseForumTopicMethod = Object.assign(
    async (
      req: Telegram.TelegramCloseForumTopicRequest,
      signal?: AbortSignal
    ) => {
      return makeRequest<Telegram.TelegramTrueResponse>(
        "/closeForumTopic",
        req,
        signal
      );
    },
    { schema: schemas.TelegramCloseForumTopicRequestSchema }
  );

  // sig-ok: `bot{token}` is Telegram's auth prefix, not a method namespace.
  // POST https://api.telegram.org/bot{token}/closeGeneralForumTopic
  // Docs: https://core.telegram.org/bots/api#closegeneralforumtopic
  const closeGeneralForumTopic: Telegram.TelegramCloseGeneralForumTopicMethod =
    Object.assign(
      async (
        req: Telegram.TelegramCloseGeneralForumTopicRequest,
        signal?: AbortSignal
      ) => {
        return makeRequest<Telegram.TelegramTrueResponse>(
          "/closeGeneralForumTopic",
          req,
          signal
        );
      },
      { schema: schemas.TelegramCloseGeneralForumTopicRequestSchema }
    );

  // sig-ok: `bot{token}` is Telegram's auth prefix, not a method namespace.
  // POST https://api.telegram.org/bot{token}/createChatInviteLink
  // Docs: https://core.telegram.org/bots/api#createchatinvitelink
  const createChatInviteLink: Telegram.TelegramCreateChatInviteLinkMethod =
    Object.assign(
      async (
        req: Telegram.TelegramCreateChatInviteLinkRequest,
        signal?: AbortSignal
      ) => {
        return makeRequest<Telegram.TelegramInviteLinkResponse>(
          "/createChatInviteLink",
          req,
          signal
        );
      },
      { schema: schemas.TelegramCreateChatInviteLinkRequestSchema }
    );

  // sig-ok: `bot{token}` is Telegram's auth prefix, not a method namespace.
  // POST https://api.telegram.org/bot{token}/createChatSubscriptionInviteLink
  // Docs: https://core.telegram.org/bots/api#createchatsubscriptioninvitelink
  const createChatSubscriptionInviteLink: Telegram.TelegramCreateChatSubscriptionInviteLinkMethod =
    Object.assign(
      async (
        req: Telegram.TelegramCreateChatSubscriptionInviteLinkRequest,
        signal?: AbortSignal
      ) => {
        return makeRequest<Telegram.TelegramInviteLinkResponse>(
          "/createChatSubscriptionInviteLink",
          req,
          signal
        );
      },
      {
        schema: schemas.TelegramCreateChatSubscriptionInviteLinkRequestSchema,
      }
    );

  // sig-ok: `bot{token}` is Telegram's auth prefix, not a method namespace.
  // POST https://api.telegram.org/bot{token}/createForumTopic
  // Docs: https://core.telegram.org/bots/api#createforumtopic
  const createForumTopic: Telegram.TelegramCreateForumTopicMethod =
    Object.assign(
      async (
        req: Telegram.TelegramCreateForumTopicRequest,
        signal?: AbortSignal
      ) => {
        return makeRequest<Telegram.TelegramCreateForumTopicResponse>(
          "/createForumTopic",
          req,
          signal
        );
      },
      { schema: schemas.TelegramCreateForumTopicRequestSchema }
    );

  // sig-ok: `bot{token}` is Telegram's auth prefix, not a method namespace.
  // POST https://api.telegram.org/bot{token}/declineChatJoinRequest
  // Docs: https://core.telegram.org/bots/api#declinechatjoinrequest
  const declineChatJoinRequest: Telegram.TelegramDeclineChatJoinRequestMethod =
    Object.assign(
      async (
        req: Telegram.TelegramDeclineChatJoinRequestRequest,
        signal?: AbortSignal
      ) => {
        return makeRequest<Telegram.TelegramTrueResponse>(
          "/declineChatJoinRequest",
          req,
          signal
        );
      },
      { schema: schemas.TelegramDeclineChatJoinRequestRequestSchema }
    );

  // sig-ok: `bot{token}` is Telegram's auth prefix, not a method namespace.
  // POST https://api.telegram.org/bot{token}/deleteChatPhoto
  // Docs: https://core.telegram.org/bots/api#deletechatphoto
  const deleteChatPhoto: Telegram.TelegramDeleteChatPhotoMethod = Object.assign(
    async (
      req: Telegram.TelegramDeleteChatPhotoRequest,
      signal?: AbortSignal
    ) => {
      return makeRequest<Telegram.TelegramTrueResponse>(
        "/deleteChatPhoto",
        req,
        signal
      );
    },
    { schema: schemas.TelegramDeleteChatPhotoRequestSchema }
  );

  // sig-ok: `bot{token}` is Telegram's auth prefix, not a method namespace.
  // POST https://api.telegram.org/bot{token}/deleteChatStickerSet
  // Docs: https://core.telegram.org/bots/api#deletechatstickerset
  const deleteChatStickerSet: Telegram.TelegramDeleteChatStickerSetMethod =
    Object.assign(
      async (
        req: Telegram.TelegramDeleteChatStickerSetRequest,
        signal?: AbortSignal
      ) => {
        return makeRequest<Telegram.TelegramTrueResponse>(
          "/deleteChatStickerSet",
          req,
          signal
        );
      },
      { schema: schemas.TelegramDeleteChatStickerSetRequestSchema }
    );

  // sig-ok: `bot{token}` is Telegram's auth prefix, not a method namespace.
  // POST https://api.telegram.org/bot{token}/deleteForumTopic
  // Docs: https://core.telegram.org/bots/api#deleteforumtopic
  const deleteForumTopic: Telegram.TelegramDeleteForumTopicMethod =
    Object.assign(
      async (
        req: Telegram.TelegramDeleteForumTopicRequest,
        signal?: AbortSignal
      ) => {
        return makeRequest<Telegram.TelegramTrueResponse>(
          "/deleteForumTopic",
          req,
          signal
        );
      },
      { schema: schemas.TelegramDeleteForumTopicRequestSchema }
    );

  // sig-ok: `bot{token}` is Telegram's auth prefix, not a method namespace.
  // POST https://api.telegram.org/bot{token}/editChatInviteLink
  // Docs: https://core.telegram.org/bots/api#editchatinvitelink
  const editChatInviteLink: Telegram.TelegramEditChatInviteLinkMethod =
    Object.assign(
      async (
        req: Telegram.TelegramEditChatInviteLinkRequest,
        signal?: AbortSignal
      ) => {
        return makeRequest<Telegram.TelegramInviteLinkResponse>(
          "/editChatInviteLink",
          req,
          signal
        );
      },
      { schema: schemas.TelegramEditChatInviteLinkRequestSchema }
    );

  // sig-ok: `bot{token}` is Telegram's auth prefix, not a method namespace.
  // POST https://api.telegram.org/bot{token}/editChatSubscriptionInviteLink
  // Docs: https://core.telegram.org/bots/api#editchatsubscriptioninvitelink
  const editChatSubscriptionInviteLink: Telegram.TelegramEditChatSubscriptionInviteLinkMethod =
    Object.assign(
      async (
        req: Telegram.TelegramEditChatSubscriptionInviteLinkRequest,
        signal?: AbortSignal
      ) => {
        return makeRequest<Telegram.TelegramInviteLinkResponse>(
          "/editChatSubscriptionInviteLink",
          req,
          signal
        );
      },
      {
        schema: schemas.TelegramEditChatSubscriptionInviteLinkRequestSchema,
      }
    );

  // sig-ok: `bot{token}` is Telegram's auth prefix, not a method namespace.
  // POST https://api.telegram.org/bot{token}/editForumTopic
  // Docs: https://core.telegram.org/bots/api#editforumtopic
  const editForumTopic: Telegram.TelegramEditForumTopicMethod = Object.assign(
    async (
      req: Telegram.TelegramEditForumTopicRequest,
      signal?: AbortSignal
    ) => {
      return makeRequest<Telegram.TelegramTrueResponse>(
        "/editForumTopic",
        req,
        signal
      );
    },
    { schema: schemas.TelegramEditForumTopicRequestSchema }
  );

  // sig-ok: `bot{token}` is Telegram's auth prefix, not a method namespace.
  // POST https://api.telegram.org/bot{token}/editGeneralForumTopic
  // Docs: https://core.telegram.org/bots/api#editgeneralforumtopic
  const editGeneralForumTopic: Telegram.TelegramEditGeneralForumTopicMethod =
    Object.assign(
      async (
        req: Telegram.TelegramEditGeneralForumTopicRequest,
        signal?: AbortSignal
      ) => {
        return makeRequest<Telegram.TelegramTrueResponse>(
          "/editGeneralForumTopic",
          req,
          signal
        );
      },
      { schema: schemas.TelegramEditGeneralForumTopicRequestSchema }
    );

  // sig-ok: `bot{token}` is Telegram's auth prefix, not a method namespace.
  // POST https://api.telegram.org/bot{token}/exportChatInviteLink
  // Docs: https://core.telegram.org/bots/api#exportchatinvitelink
  const exportChatInviteLink: Telegram.TelegramExportChatInviteLinkMethod =
    Object.assign(
      async (
        req: Telegram.TelegramExportChatInviteLinkRequest,
        signal?: AbortSignal
      ) => {
        return makeRequest<Telegram.TelegramStringResponse>(
          "/exportChatInviteLink",
          req,
          signal
        );
      },
      { schema: schemas.TelegramExportChatInviteLinkRequestSchema }
    );

  // sig-ok: `bot{token}` is Telegram's auth prefix, not a method namespace.
  // POST https://api.telegram.org/bot{token}/getChat
  // Docs: https://core.telegram.org/bots/api#getchat
  const getChat: Telegram.TelegramGetChatMethod = Object.assign(
    async (req: Telegram.TelegramGetChatRequest, signal?: AbortSignal) => {
      return makeRequest<Telegram.TelegramGetChatResponse>(
        "/getChat",
        req,
        signal
      );
    },
    { schema: schemas.TelegramGetChatRequestSchema }
  );

  // sig-ok: `bot{token}` is Telegram's auth prefix, not a method namespace.
  // POST https://api.telegram.org/bot{token}/getChatAdministrators
  // Docs: https://core.telegram.org/bots/api#getchatadministrators
  const getChatAdministrators: Telegram.TelegramGetChatAdministratorsMethod =
    Object.assign(
      async (
        req: Telegram.TelegramGetChatAdministratorsRequest,
        signal?: AbortSignal
      ) => {
        return makeRequest<Telegram.TelegramGetChatAdministratorsResponse>(
          "/getChatAdministrators",
          req,
          signal
        );
      },
      { schema: schemas.TelegramGetChatAdministratorsRequestSchema }
    );

  // sig-ok: `bot{token}` is Telegram's auth prefix, not a method namespace.
  // POST https://api.telegram.org/bot{token}/getChatMember
  // Docs: https://core.telegram.org/bots/api#getchatmember
  const getChatMember: Telegram.TelegramGetChatMemberMethod = Object.assign(
    async (
      req: Telegram.TelegramGetChatMemberRequest,
      signal?: AbortSignal
    ) => {
      return makeRequest<Telegram.TelegramGetChatMemberResponse>(
        "/getChatMember",
        req,
        signal
      );
    },
    { schema: schemas.TelegramGetChatMemberRequestSchema }
  );

  // sig-ok: `bot{token}` is Telegram's auth prefix, not a method namespace.
  // POST https://api.telegram.org/bot{token}/getChatMemberCount
  // Docs: https://core.telegram.org/bots/api#getchatmembercount
  const getChatMemberCount: Telegram.TelegramGetChatMemberCountMethod =
    Object.assign(
      async (
        req: Telegram.TelegramGetChatMemberCountRequest,
        signal?: AbortSignal
      ) => {
        return makeRequest<Telegram.TelegramNumberResponse>(
          "/getChatMemberCount",
          req,
          signal
        );
      },
      { schema: schemas.TelegramGetChatMemberCountRequestSchema }
    );

  // sig-ok: `bot{token}` is Telegram's auth prefix, not a method namespace.
  // POST https://api.telegram.org/bot{token}/getForumTopicIconStickers
  // Docs: https://core.telegram.org/bots/api#getforumtopiciconstickers
  const getForumTopicIconStickers: Telegram.TelegramGetForumTopicIconStickersMethod =
    Object.assign(
      async (
        req: Telegram.TelegramGetForumTopicIconStickersRequest = {},
        signal?: AbortSignal
      ) => {
        return makeRequest<Telegram.TelegramGetForumTopicIconStickersResponse>(
          "/getForumTopicIconStickers",
          req,
          signal
        );
      },
      { schema: schemas.TelegramGetForumTopicIconStickersRequestSchema }
    );

  // sig-ok: `bot{token}` is Telegram's auth prefix, not a method namespace.
  // POST https://api.telegram.org/bot{token}/getUserChatBoosts
  // Docs: https://core.telegram.org/bots/api#getuserchatboosts
  const getUserChatBoosts: Telegram.TelegramGetUserChatBoostsMethod =
    Object.assign(
      async (
        req: Telegram.TelegramGetUserChatBoostsRequest,
        signal?: AbortSignal
      ) => {
        return makeRequest<Telegram.TelegramGetUserChatBoostsResponse>(
          "/getUserChatBoosts",
          req,
          signal
        );
      },
      { schema: schemas.TelegramGetUserChatBoostsRequestSchema }
    );

  // sig-ok: `bot{token}` is Telegram's auth prefix, not a method namespace.
  // POST https://api.telegram.org/bot{token}/getUserPersonalChatMessages
  // Docs: https://core.telegram.org/bots/api#getuserpersonalchatmessages
  const getUserPersonalChatMessages: Telegram.TelegramGetUserPersonalChatMessagesMethod =
    Object.assign(
      async (
        req: Telegram.TelegramGetUserPersonalChatMessagesRequest,
        signal?: AbortSignal
      ) => {
        return makeRequest<Telegram.TelegramGetUserPersonalChatMessagesResponse>(
          "/getUserPersonalChatMessages",
          req,
          signal
        );
      },
      { schema: schemas.TelegramGetUserPersonalChatMessagesRequestSchema }
    );

  // sig-ok: `bot{token}` is Telegram's auth prefix, not a method namespace.
  // POST https://api.telegram.org/bot{token}/hideGeneralForumTopic
  // Docs: https://core.telegram.org/bots/api#hidegeneralforumtopic
  const hideGeneralForumTopic: Telegram.TelegramHideGeneralForumTopicMethod =
    Object.assign(
      async (
        req: Telegram.TelegramHideGeneralForumTopicRequest,
        signal?: AbortSignal
      ) => {
        return makeRequest<Telegram.TelegramTrueResponse>(
          "/hideGeneralForumTopic",
          req,
          signal
        );
      },
      { schema: schemas.TelegramHideGeneralForumTopicRequestSchema }
    );

  // sig-ok: `bot{token}` is Telegram's auth prefix, not a method namespace.
  // POST https://api.telegram.org/bot{token}/leaveChat
  // Docs: https://core.telegram.org/bots/api#leavechat
  const leaveChat: Telegram.TelegramLeaveChatMethod = Object.assign(
    async (req: Telegram.TelegramLeaveChatRequest, signal?: AbortSignal) => {
      return makeRequest<Telegram.TelegramTrueResponse>(
        "/leaveChat",
        req,
        signal
      );
    },
    { schema: schemas.TelegramLeaveChatRequestSchema }
  );

  // sig-ok: `bot{token}` is Telegram's auth prefix, not a method namespace.
  // POST https://api.telegram.org/bot{token}/promoteChatMember
  // Docs: https://core.telegram.org/bots/api#promotechatmember
  const promoteChatMember: Telegram.TelegramPromoteChatMemberMethod =
    Object.assign(
      async (
        req: Telegram.TelegramPromoteChatMemberRequest,
        signal?: AbortSignal
      ) => {
        return makeRequest<Telegram.TelegramTrueResponse>(
          "/promoteChatMember",
          req,
          signal
        );
      },
      { schema: schemas.TelegramPromoteChatMemberRequestSchema }
    );

  // sig-ok: `bot{token}` is Telegram's auth prefix, not a method namespace.
  // POST https://api.telegram.org/bot{token}/reopenForumTopic
  // Docs: https://core.telegram.org/bots/api#reopenforumtopic
  const reopenForumTopic: Telegram.TelegramReopenForumTopicMethod =
    Object.assign(
      async (
        req: Telegram.TelegramReopenForumTopicRequest,
        signal?: AbortSignal
      ) => {
        return makeRequest<Telegram.TelegramTrueResponse>(
          "/reopenForumTopic",
          req,
          signal
        );
      },
      { schema: schemas.TelegramReopenForumTopicRequestSchema }
    );

  // sig-ok: `bot{token}` is Telegram's auth prefix, not a method namespace.
  // POST https://api.telegram.org/bot{token}/reopenGeneralForumTopic
  // Docs: https://core.telegram.org/bots/api#reopengeneralforumtopic
  const reopenGeneralForumTopic: Telegram.TelegramReopenGeneralForumTopicMethod =
    Object.assign(
      async (
        req: Telegram.TelegramReopenGeneralForumTopicRequest,
        signal?: AbortSignal
      ) => {
        return makeRequest<Telegram.TelegramTrueResponse>(
          "/reopenGeneralForumTopic",
          req,
          signal
        );
      },
      { schema: schemas.TelegramReopenGeneralForumTopicRequestSchema }
    );

  // sig-ok: `bot{token}` is Telegram's auth prefix, not a method namespace.
  // POST https://api.telegram.org/bot{token}/restrictChatMember
  // Docs: https://core.telegram.org/bots/api#restrictchatmember
  const restrictChatMember: Telegram.TelegramRestrictChatMemberMethod =
    Object.assign(
      async (
        req: Telegram.TelegramRestrictChatMemberRequest,
        signal?: AbortSignal
      ) => {
        return makeRequest<Telegram.TelegramTrueResponse>(
          "/restrictChatMember",
          req,
          signal
        );
      },
      { schema: schemas.TelegramRestrictChatMemberRequestSchema }
    );

  // sig-ok: `bot{token}` is Telegram's auth prefix, not a method namespace.
  // POST https://api.telegram.org/bot{token}/revokeChatInviteLink
  // Docs: https://core.telegram.org/bots/api#revokechatinvitelink
  const revokeChatInviteLink: Telegram.TelegramRevokeChatInviteLinkMethod =
    Object.assign(
      async (
        req: Telegram.TelegramRevokeChatInviteLinkRequest,
        signal?: AbortSignal
      ) => {
        return makeRequest<Telegram.TelegramInviteLinkResponse>(
          "/revokeChatInviteLink",
          req,
          signal
        );
      },
      { schema: schemas.TelegramRevokeChatInviteLinkRequestSchema }
    );

  // sig-ok: `bot{token}` is Telegram's auth prefix, not a method namespace.
  // POST https://api.telegram.org/bot{token}/sendAudio
  // Docs: https://core.telegram.org/bots/api#sendaudio
  const sendAudio: Telegram.TelegramSendAudioMethod = Object.assign(
    async (req: Telegram.TelegramSendAudioRequest, signal?: AbortSignal) => {
      return makeRequest<Telegram.TelegramSendAudioResponse>(
        "/sendAudio",
        req,
        signal
      );
    },
    { schema: schemas.TelegramSendAudioRequestSchema }
  );

  // sig-ok: `bot{token}` is Telegram's auth prefix, not a method namespace.
  // POST https://api.telegram.org/bot{token}/sendChatJoinRequestWebApp
  // Docs: https://core.telegram.org/bots/api#sendchatjoinrequestwebapp
  const sendChatJoinRequestWebApp: Telegram.TelegramSendChatJoinRequestWebAppMethod =
    Object.assign(
      async (
        req: Telegram.TelegramSendChatJoinRequestWebAppRequest,
        signal?: AbortSignal
      ) => {
        return makeRequest<Telegram.TelegramTrueResponse>(
          "/sendChatJoinRequestWebApp",
          req,
          signal
        );
      },
      { schema: schemas.TelegramSendChatJoinRequestWebAppRequestSchema }
    );

  // sig-ok: `bot{token}` is Telegram's auth prefix, not a method namespace.
  // POST https://api.telegram.org/bot{token}/sendMessage
  // Docs: https://core.telegram.org/bots/api#sendmessage
  const sendMessage: Telegram.TelegramSendMessageMethod = Object.assign(
    async (req: Telegram.TelegramSendMessageRequest, signal?: AbortSignal) => {
      return makeRequest<Telegram.TelegramSendMessageResponse>(
        "/sendMessage",
        req,
        signal
      );
    },
    { schema: schemas.TelegramSendMessageRequestSchema }
  );

  // sig-ok: `bot{token}` is Telegram's auth prefix, not a method namespace.
  // POST https://api.telegram.org/bot{token}/sendPhoto
  // Docs: https://core.telegram.org/bots/api#sendphoto
  const sendPhoto: Telegram.TelegramSendPhotoMethod = Object.assign(
    async (req: Telegram.TelegramSendPhotoRequest, signal?: AbortSignal) => {
      return makeRequest<Telegram.TelegramSendPhotoResponse>(
        "/sendPhoto",
        req,
        signal
      );
    },
    { schema: schemas.TelegramSendPhotoRequestSchema }
  );

  // sig-ok: `bot{token}` is Telegram's auth prefix, not a method namespace.
  // POST https://api.telegram.org/bot{token}/sendVideo
  // Docs: https://core.telegram.org/bots/api#sendvideo
  const sendVideo: Telegram.TelegramSendVideoMethod = Object.assign(
    async (req: Telegram.TelegramSendVideoRequest, signal?: AbortSignal) => {
      return makeRequest<Telegram.TelegramSendVideoResponse>(
        "/sendVideo",
        req,
        signal
      );
    },
    { schema: schemas.TelegramSendVideoRequestSchema }
  );

  // sig-ok: `bot{token}` is Telegram's auth prefix, not a method namespace.
  // POST https://api.telegram.org/bot{token}/setChatAdministratorCustomTitle
  // Docs: https://core.telegram.org/bots/api#setchatadministratorcustomtitle
  const setChatAdministratorCustomTitle: Telegram.TelegramSetChatAdministratorCustomTitleMethod =
    Object.assign(
      async (
        req: Telegram.TelegramSetChatAdministratorCustomTitleRequest,
        signal?: AbortSignal
      ) => {
        return makeRequest<Telegram.TelegramTrueResponse>(
          "/setChatAdministratorCustomTitle",
          req,
          signal
        );
      },
      {
        schema: schemas.TelegramSetChatAdministratorCustomTitleRequestSchema,
      }
    );

  // sig-ok: `bot{token}` is Telegram's auth prefix, not a method namespace.
  // POST https://api.telegram.org/bot{token}/setChatDescription
  // Docs: https://core.telegram.org/bots/api#setchatdescription
  const setChatDescription: Telegram.TelegramSetChatDescriptionMethod =
    Object.assign(
      async (
        req: Telegram.TelegramSetChatDescriptionRequest,
        signal?: AbortSignal
      ) => {
        return makeRequest<Telegram.TelegramTrueResponse>(
          "/setChatDescription",
          req,
          signal
        );
      },
      { schema: schemas.TelegramSetChatDescriptionRequestSchema }
    );

  // sig-ok: `bot{token}` is Telegram's auth prefix, not a method namespace.
  // POST https://api.telegram.org/bot{token}/setChatMemberTag
  // Docs: https://core.telegram.org/bots/api#setchatmembertag
  const setChatMemberTag: Telegram.TelegramSetChatMemberTagMethod =
    Object.assign(
      async (
        req: Telegram.TelegramSetChatMemberTagRequest,
        signal?: AbortSignal
      ) => {
        return makeRequest<Telegram.TelegramTrueResponse>(
          "/setChatMemberTag",
          req,
          signal
        );
      },
      { schema: schemas.TelegramSetChatMemberTagRequestSchema }
    );

  // sig-ok: `bot{token}` is Telegram's auth prefix, not a method namespace.
  // POST https://api.telegram.org/bot{token}/setChatPermissions
  // Docs: https://core.telegram.org/bots/api#setchatpermissions
  const setChatPermissions: Telegram.TelegramSetChatPermissionsMethod =
    Object.assign(
      async (
        req: Telegram.TelegramSetChatPermissionsRequest,
        signal?: AbortSignal
      ) => {
        return makeRequest<Telegram.TelegramTrueResponse>(
          "/setChatPermissions",
          req,
          signal
        );
      },
      { schema: schemas.TelegramSetChatPermissionsRequestSchema }
    );

  // sig-ok: `bot{token}` is Telegram's auth prefix, not a method namespace.
  // POST https://api.telegram.org/bot{token}/setChatPhoto
  // Docs: https://core.telegram.org/bots/api#setchatphoto
  const setChatPhoto: Telegram.TelegramSetChatPhotoMethod = Object.assign(
    async (req: Telegram.TelegramSetChatPhotoRequest, signal?: AbortSignal) => {
      return makeRequest<Telegram.TelegramTrueResponse>(
        "/setChatPhoto",
        req,
        signal
      );
    },
    { schema: schemas.TelegramSetChatPhotoRequestSchema }
  );

  // sig-ok: `bot{token}` is Telegram's auth prefix, not a method namespace.
  // POST https://api.telegram.org/bot{token}/setChatStickerSet
  // Docs: https://core.telegram.org/bots/api#setchatstickerset
  const setChatStickerSet: Telegram.TelegramSetChatStickerSetMethod =
    Object.assign(
      async (
        req: Telegram.TelegramSetChatStickerSetRequest,
        signal?: AbortSignal
      ) => {
        return makeRequest<Telegram.TelegramTrueResponse>(
          "/setChatStickerSet",
          req,
          signal
        );
      },
      { schema: schemas.TelegramSetChatStickerSetRequestSchema }
    );

  // sig-ok: `bot{token}` is Telegram's auth prefix, not a method namespace.
  // POST https://api.telegram.org/bot{token}/setChatTitle
  // Docs: https://core.telegram.org/bots/api#setchattitle
  const setChatTitle: Telegram.TelegramSetChatTitleMethod = Object.assign(
    async (req: Telegram.TelegramSetChatTitleRequest, signal?: AbortSignal) => {
      return makeRequest<Telegram.TelegramTrueResponse>(
        "/setChatTitle",
        req,
        signal
      );
    },
    { schema: schemas.TelegramSetChatTitleRequestSchema }
  );

  // sig-ok: `bot{token}` is Telegram's auth prefix, not a method namespace.
  // POST https://api.telegram.org/bot{token}/unbanChatMember
  // Docs: https://core.telegram.org/bots/api#unbanchatmember
  const unbanChatMember: Telegram.TelegramUnbanChatMemberMethod = Object.assign(
    async (
      req: Telegram.TelegramUnbanChatMemberRequest,
      signal?: AbortSignal
    ) => {
      return makeRequest<Telegram.TelegramTrueResponse>(
        "/unbanChatMember",
        req,
        signal
      );
    },
    { schema: schemas.TelegramUnbanChatMemberRequestSchema }
  );

  // sig-ok: `bot{token}` is Telegram's auth prefix, not a method namespace.
  // POST https://api.telegram.org/bot{token}/unbanChatSenderChat
  // Docs: https://core.telegram.org/bots/api#unbanchatsenderchat
  const unbanChatSenderChat: Telegram.TelegramUnbanChatSenderChatMethod =
    Object.assign(
      async (
        req: Telegram.TelegramUnbanChatSenderChatRequest,
        signal?: AbortSignal
      ) => {
        return makeRequest<Telegram.TelegramTrueResponse>(
          "/unbanChatSenderChat",
          req,
          signal
        );
      },
      { schema: schemas.TelegramUnbanChatSenderChatRequestSchema }
    );

  // sig-ok: `bot{token}` is Telegram's auth prefix, not a method namespace.
  // POST https://api.telegram.org/bot{token}/unhideGeneralForumTopic
  // Docs: https://core.telegram.org/bots/api#unhidegeneralforumtopic
  const unhideGeneralForumTopic: Telegram.TelegramUnhideGeneralForumTopicMethod =
    Object.assign(
      async (
        req: Telegram.TelegramUnhideGeneralForumTopicRequest,
        signal?: AbortSignal
      ) => {
        return makeRequest<Telegram.TelegramTrueResponse>(
          "/unhideGeneralForumTopic",
          req,
          signal
        );
      },
      { schema: schemas.TelegramUnhideGeneralForumTopicRequestSchema }
    );

  // sig-ok: `bot{token}` is Telegram's auth prefix, not a method namespace.
  // POST https://api.telegram.org/bot{token}/unpinAllForumTopicMessages
  // Docs: https://core.telegram.org/bots/api#unpinallforumtopicmessages
  const unpinAllForumTopicMessages: Telegram.TelegramUnpinAllForumTopicMessagesMethod =
    Object.assign(
      async (
        req: Telegram.TelegramUnpinAllForumTopicMessagesRequest,
        signal?: AbortSignal
      ) => {
        return makeRequest<Telegram.TelegramTrueResponse>(
          "/unpinAllForumTopicMessages",
          req,
          signal
        );
      },
      { schema: schemas.TelegramUnpinAllForumTopicMessagesRequestSchema }
    );

  // sig-ok: `bot{token}` is Telegram's auth prefix, not a method namespace.
  // POST https://api.telegram.org/bot{token}/unpinAllGeneralForumTopicMessages
  // Docs: https://core.telegram.org/bots/api#unpinallgeneralforumtopicmessages
  const unpinAllGeneralForumTopicMessages: Telegram.TelegramUnpinAllGeneralForumTopicMessagesMethod =
    Object.assign(
      async (
        req: Telegram.TelegramUnpinAllGeneralForumTopicMessagesRequest,
        signal?: AbortSignal
      ) => {
        return makeRequest<Telegram.TelegramTrueResponse>(
          "/unpinAllGeneralForumTopicMessages",
          req,
          signal
        );
      },
      {
        schema: schemas.TelegramUnpinAllGeneralForumTopicMessagesRequestSchema,
      }
    );

  const post: Telegram.TelegramPostNamespace = {
    answerChatJoinRequestQuery,
    answerGuestQuery,
    approveChatJoinRequest,
    banChatMember,
    banChatSenderChat,
    closeForumTopic,
    closeGeneralForumTopic,
    createChatInviteLink,
    createChatSubscriptionInviteLink,
    createForumTopic,
    declineChatJoinRequest,
    deleteChatPhoto,
    deleteChatStickerSet,
    deleteForumTopic,
    editChatInviteLink,
    editChatSubscriptionInviteLink,
    editForumTopic,
    editGeneralForumTopic,
    exportChatInviteLink,
    getChat,
    getChatAdministrators,
    getChatMember,
    getChatMemberCount,
    getForumTopicIconStickers,
    getUserChatBoosts,
    getUserPersonalChatMessages,
    hideGeneralForumTopic,
    leaveChat,
    promoteChatMember,
    reopenForumTopic,
    reopenGeneralForumTopic,
    restrictChatMember,
    revokeChatInviteLink,
    sendAudio,
    sendChatJoinRequestWebApp,
    sendMessage,
    sendPhoto,
    sendVideo,
    setChatAdministratorCustomTitle,
    setChatDescription,
    setChatMemberTag,
    setChatPermissions,
    setChatPhoto,
    setChatStickerSet,
    setChatTitle,
    unbanChatMember,
    unbanChatSenderChat,
    unhideGeneralForumTopic,
    unpinAllForumTopicMessages,
    unpinAllGeneralForumTopicMessages,
  };

  return attachExamples({
    ...post,
    post,
  });
}
