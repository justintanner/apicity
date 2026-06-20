import { describe, expect, it, vi } from "vitest";

import {
  createTelegram,
  TelegramError,
} from "../../packages/provider/telegram/src";

function telegramResponse(result: unknown): Response {
  return new Response(JSON.stringify({ ok: true, result }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}

function jsonBody(init: RequestInit): Record<string, unknown> {
  expect(typeof init.body).toBe("string");
  return JSON.parse(init.body as string) as Record<string, unknown>;
}

describe("Telegram endpoint wiring", () => {
  it("posts JSON requests to the bot-token URL", async () => {
    const mockFetch = vi.fn().mockResolvedValue(
      telegramResponse({
        message_id: 1,
        date: 1770300000,
        chat: { id: 42, type: "private" },
        text: "hello",
      })
    );
    const telegram = createTelegram({
      botToken: "123456:ABC-DEF",
      fetch: mockFetch,
    });

    const result = await telegram.sendMessage({
      chat_id: 42,
      text: "hello",
    });

    expect(result.result.text).toBe("hello");
    const [url, init] = mockFetch.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("https://api.telegram.org/bot123456:ABC-DEF/sendMessage");
    expect(init.method).toBe("POST");
    expect(init.headers).toEqual({ "Content-Type": "application/json" });
    expect(jsonBody(init)).toEqual({ chat_id: 42, text: "hello" });
  });

  it("exposes wrappers at the root and post namespace", () => {
    const telegram = createTelegram({ botToken: "test", fetch: vi.fn() });
    const root = telegram as unknown as Record<string, unknown>;
    const post = telegram.post as unknown as Record<string, unknown>;

    for (const method of [
      "approveSuggestedPost",
      "declineSuggestedPost",
      "getUserProfileAudios",
      "getUserProfilePhotos",
      "removeMyProfilePhoto",
      "setMyProfilePhoto",
      "addStickerToSet",
      "answerCallbackQuery",
      "answerChatJoinRequestQuery",
      "answerGuestQuery",
      "answerInlineQuery",
      "answerPreCheckoutQuery",
      "answerShippingQuery",
      "answerWebAppQuery",
      "approveChatJoinRequest",
      "banChatMember",
      "banChatSenderChat",
      "close",
      "closeForumTopic",
      "closeGeneralForumTopic",
      "convertGiftToStars",
      "copyMessage",
      "copyMessages",
      "createChatInviteLink",
      "createChatSubscriptionInviteLink",
      "createForumTopic",
      "createInvoiceLink",
      "createNewStickerSet",
      "declineChatJoinRequest",
      "deleteAllMessageReactions",
      "deleteBusinessMessages",
      "deleteChatPhoto",
      "deleteChatStickerSet",
      "deleteForumTopic",
      "deleteMessage",
      "deleteMessageReaction",
      "deleteMessages",
      "deleteMyCommands",
      "deleteStickerFromSet",
      "deleteStickerSet",
      "deleteStory",
      "deleteWebhook",
      "editChatInviteLink",
      "editChatSubscriptionInviteLink",
      "editForumTopic",
      "editGeneralForumTopic",
      "editMessageCaption",
      "editMessageChecklist",
      "editMessageLiveLocation",
      "editMessageMedia",
      "editMessageReplyMarkup",
      "editMessageText",
      "editStory",
      "editUserStarSubscription",
      "exportChatInviteLink",
      "forwardMessage",
      "forwardMessages",
      "getAvailableGifts",
      "getBusinessAccountGifts",
      "getBusinessAccountStarBalance",
      "getBusinessConnection",
      "getChat",
      "getChatAdministrators",
      "getChatGifts",
      "getChatMember",
      "getChatMemberCount",
      "getChatMenuButton",
      "getCustomEmojiStickers",
      "getFile",
      "getForumTopicIconStickers",
      "getGameHighScores",
      "getManagedBotAccessSettings",
      "getManagedBotToken",
      "getMe",
      "getMyCommands",
      "getMyDefaultAdministratorRights",
      "getMyDescription",
      "getMyName",
      "getMyShortDescription",
      "getMyStarBalance",
      "getStarTransactions",
      "getStickerSet",
      "getUpdates",
      "getUserChatBoosts",
      "getUserGifts",
      "getUserPersonalChatMessages",
      "getWebhookInfo",
      "giftPremiumSubscription",
      "hideGeneralForumTopic",
      "leaveChat",
      "logOut",
      "pinChatMessage",
      "postStory",
      "promoteChatMember",
      "readBusinessMessage",
      "refundStarPayment",
      "removeBusinessAccountProfilePhoto",
      "removeChatVerification",
      "removeUserVerification",
      "reopenForumTopic",
      "reopenGeneralForumTopic",
      "replaceManagedBotToken",
      "replaceStickerInSet",
      "repostStory",
      "restrictChatMember",
      "revokeChatInviteLink",
      "savePreparedInlineMessage",
      "savePreparedKeyboardButton",
      "sendAnimation",
      "sendAudio",
      "sendChatAction",
      "sendChatJoinRequestWebApp",
      "sendChecklist",
      "sendContact",
      "sendDice",
      "sendDocument",
      "sendGame",
      "sendGift",
      "sendInvoice",
      "sendLivePhoto",
      "sendLocation",
      "sendMediaGroup",
      "sendMessage",
      "sendMessageDraft",
      "sendPaidMedia",
      "sendPhoto",
      "sendPoll",
      "sendRichMessage",
      "sendRichMessageDraft",
      "sendSticker",
      "sendVenue",
      "sendVideo",
      "sendVideoNote",
      "sendVoice",
      "setBusinessAccountBio",
      "setBusinessAccountGiftSettings",
      "setBusinessAccountName",
      "setBusinessAccountProfilePhoto",
      "setBusinessAccountUsername",
      "setChatAdministratorCustomTitle",
      "setChatDescription",
      "setChatMemberTag",
      "setChatMenuButton",
      "setChatPermissions",
      "setChatPhoto",
      "setChatStickerSet",
      "setChatTitle",
      "setCustomEmojiStickerSetThumbnail",
      "setGameScore",
      "setManagedBotAccessSettings",
      "setMessageReaction",
      "setMyCommands",
      "setMyDefaultAdministratorRights",
      "setMyDescription",
      "setMyName",
      "setMyShortDescription",
      "setPassportDataErrors",
      "setStickerEmojiList",
      "setStickerKeywords",
      "setStickerMaskPosition",
      "setStickerPositionInSet",
      "setStickerSetThumbnail",
      "setStickerSetTitle",
      "setUserEmojiStatus",
      "setWebhook",
      "stopMessageLiveLocation",
      "stopPoll",
      "transferBusinessAccountStars",
      "transferGift",
      "unbanChatMember",
      "unbanChatSenderChat",
      "unhideGeneralForumTopic",
      "unpinAllChatMessages",
      "unpinAllForumTopicMessages",
      "unpinAllGeneralForumTopicMessages",
      "unpinChatMessage",
      "upgradeGift",
      "uploadStickerFile",
      "verifyChat",
      "verifyUser",
    ]) {
      expect(typeof root[method], method).toBe("function");
      expect(root[method], method).toBe(post[method]);
    }
  });

  it("posts no-parameter methods with empty JSON bodies", async () => {
    const mockFetch = vi
      .fn()
      .mockResolvedValueOnce(telegramResponse({ first_name: "Apicity" }))
      .mockResolvedValueOnce(telegramResponse({ pending_update_count: 0 }))
      .mockResolvedValueOnce(telegramResponse(true))
      .mockResolvedValueOnce(telegramResponse(true));
    const telegram = createTelegram({
      botToken: "123456:ABC-DEF",
      baseURL: "https://telegram.local/bot{token}",
      fetch: mockFetch,
    });

    await telegram.getMe();
    await telegram.getWebhookInfo();
    await telegram.logOut();
    await telegram.close();

    expect(
      (mockFetch.mock.calls as Array<[string, RequestInit]>).map(([url]) => url)
    ).toEqual([
      "https://telegram.local/bot123456:ABC-DEF/getMe",
      "https://telegram.local/bot123456:ABC-DEF/getWebhookInfo",
      "https://telegram.local/bot123456:ABC-DEF/logOut",
      "https://telegram.local/bot123456:ABC-DEF/close",
    ]);
    for (const [, init] of mockFetch.mock.calls as Array<
      [string, RequestInit]
    >) {
      expect(init.headers).toEqual({ "Content-Type": "application/json" });
      expect(jsonBody(init)).toEqual({});
    }
  });

  it("uses multipart form data for top-level and nested Blob uploads", async () => {
    const mockFetch = vi.fn().mockResolvedValue(telegramResponse(true));
    const telegram = createTelegram({ botToken: "test", fetch: mockFetch });
    const photo = new Blob(["photo"], { type: "image/png" });
    const thumb = new Blob(["thumb"], { type: "image/jpeg" });

    await telegram.sendMediaGroup({
      chat_id: "@fixture",
      media: [
        { type: "photo", media: photo, thumbnail: thumb, caption: "local" },
        { type: "photo", media: "https://example.com/remote.png" },
      ],
    });

    const [, init] = mockFetch.mock.calls[0] as [string, RequestInit];
    expect(init.headers).toBeUndefined();
    expect(init.body).toBeInstanceOf(FormData);
    const form = init.body as FormData;
    expect(form.get("chat_id")).toBe("@fixture");
    expect(form.get("media_0_media")).toBeInstanceOf(Blob);
    expect(form.get("media_0_thumbnail")).toBeInstanceOf(Blob);
    expect(JSON.parse(String(form.get("media")))).toEqual([
      {
        type: "photo",
        media: "attach://media_0_media",
        thumbnail: "attach://media_0_thumbnail",
        caption: "local",
      },
      { type: "photo", media: "https://example.com/remote.png" },
    ]);
  });

  it("surfaces Telegram error responses", async () => {
    const mockFetch = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          ok: false,
          error_code: 400,
          description: "Bad Request: chat not found",
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      )
    );
    const telegram = createTelegram({ botToken: "test", fetch: mockFetch });

    await expect(
      telegram.sendMessage({ chat_id: 42, text: "hello" })
    ).rejects.toMatchObject({
      name: "TelegramError",
      status: 400,
      code: "400",
    } satisfies Partial<TelegramError>);
  });
});
