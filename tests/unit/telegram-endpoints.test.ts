import { describe, expect, it, vi } from "vitest";

import {
  createTelegram,
  TelegramError,
} from "../../packages/provider/telegram/src";

function telegramResponse(result: Record<string, unknown>): Response {
  return new Response(
    JSON.stringify({
      ok: true,
      result: {
        message_id: 1,
        date: 1770300000,
        chat: { id: 42, type: "private" },
        ...result,
      },
    }),
    {
      status: 200,
      headers: { "Content-Type": "application/json" },
    }
  );
}

function telegramApiResponse(result: unknown): Response {
  return new Response(JSON.stringify({ ok: true, result }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}

describe("Telegram endpoint wiring", () => {
  it("posts sendMessage requests to the bot-token URL", async () => {
    const mockFetch = vi
      .fn()
      .mockResolvedValue(telegramResponse({ text: "hello" }));
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
    expect(JSON.parse(init.body as string)).toEqual({
      chat_id: 42,
      text: "hello",
    });
  });

  it("exposes the same methods under the post namespace", () => {
    const telegram = createTelegram({
      botToken: "123456:ABC-DEF",
      fetch: vi.fn(),
    });
    const endpointNames = [
      "sendMessage",
      "sendPhoto",
      "sendVideo",
      "sendAudio",
      "answerCallbackQuery",
      "answerWebAppQuery",
      "savePreparedInlineMessage",
      "savePreparedKeyboardButton",
      "answerInlineQuery",
      "sendInvoice",
      "createInvoiceLink",
      "answerShippingQuery",
      "answerPreCheckoutQuery",
      "getMyStarBalance",
      "getStarTransactions",
      "refundStarPayment",
      "editUserStarSubscription",
      "sendSticker",
      "getStickerSet",
      "getCustomEmojiStickers",
      "uploadStickerFile",
      "createNewStickerSet",
      "addStickerToSet",
      "setStickerPositionInSet",
      "deleteStickerFromSet",
      "replaceStickerInSet",
      "setStickerEmojiList",
      "setStickerKeywords",
      "setStickerMaskPosition",
      "setStickerSetTitle",
      "setStickerSetThumbnail",
      "setCustomEmojiStickerSetThumbnail",
      "deleteStickerSet",
      "getAvailableGifts",
      "sendGift",
      "giftPremiumSubscription",
      "verifyUser",
      "verifyChat",
      "removeUserVerification",
      "removeChatVerification",
      "getUserGifts",
      "getChatGifts",
      "setUserEmojiStatus",
      "getBusinessConnection",
      "readBusinessMessage",
      "deleteBusinessMessages",
      "setBusinessAccountName",
      "setBusinessAccountUsername",
      "setBusinessAccountBio",
      "setBusinessAccountProfilePhoto",
      "removeBusinessAccountProfilePhoto",
      "setBusinessAccountGiftSettings",
      "getBusinessAccountStarBalance",
      "transferBusinessAccountStars",
      "getBusinessAccountGifts",
      "convertGiftToStars",
      "upgradeGift",
      "transferGift",
      "postStory",
      "repostStory",
      "editStory",
      "deleteStory",
      "setPassportDataErrors",
      "sendGame",
      "setGameScore",
      "getGameHighScores",
    ] as const;

    for (const name of endpointNames) {
      expect(telegram.post[name]).toBe(telegram[name]);
    }
  });

  it("posts specialized JSON endpoints to Telegram method URLs", async () => {
    const mockFetch = vi
      .fn()
      .mockImplementation(() => Promise.resolve(telegramApiResponse(true)));
    const telegram = createTelegram({
      botToken: "123456:ABC-DEF",
      baseURL: "https://telegram.local/bot{token}",
      fetch: mockFetch,
    });

    await telegram.answerCallbackQuery({
      callback_query_id: "callback-1",
      text: "accepted",
    });
    await telegram.answerInlineQuery({
      inline_query_id: "inline-1",
      results: [
        {
          type: "article",
          id: "article-1",
          title: "Result",
          input_message_content: { message_text: "hello" },
        },
      ],
    });
    await telegram.sendInvoice({
      chat_id: 42,
      title: "Premium pack",
      description: "Stars payment",
      payload: "payment-payload",
      currency: "XTR",
      prices: [{ label: "Stars", amount: 10 }],
    });
    await telegram.getBusinessConnection({
      business_connection_id: "business-1",
    });
    await telegram.setPassportDataErrors({
      user_id: 42,
      errors: [
        {
          source: "data",
          type: "passport",
          field_name: "first_name",
          data_hash: "hash",
          message: "invalid",
        },
      ],
    });
    await telegram.sendGame({
      chat_id: 42,
      game_short_name: "test_game",
    });

    const calls = mockFetch.mock.calls as Array<[string, RequestInit]>;
    expect(calls.map(([url]) => url)).toEqual([
      "https://telegram.local/bot123456:ABC-DEF/answerCallbackQuery",
      "https://telegram.local/bot123456:ABC-DEF/answerInlineQuery",
      "https://telegram.local/bot123456:ABC-DEF/sendInvoice",
      "https://telegram.local/bot123456:ABC-DEF/getBusinessConnection",
      "https://telegram.local/bot123456:ABC-DEF/setPassportDataErrors",
      "https://telegram.local/bot123456:ABC-DEF/sendGame",
    ]);

    for (const [, init] of calls) {
      expect(init.method).toBe("POST");
      expect(init.headers).toEqual({ "Content-Type": "application/json" });
    }

    expect(JSON.parse(calls[2][1].body as string)).toEqual({
      chat_id: 42,
      title: "Premium pack",
      description: "Stars payment",
      payload: "payment-payload",
      currency: "XTR",
      prices: [{ label: "Stars", amount: 10 }],
    });
  });

  it("posts string media as JSON for photo, video, and audio messages", async () => {
    const mockFetch = vi
      .fn()
      .mockImplementation(() => Promise.resolve(telegramResponse({})));
    const telegram = createTelegram({
      botToken: "123456:ABC-DEF",
      baseURL: "https://telegram.local/bot{token}",
      fetch: mockFetch,
    });

    await telegram.sendPhoto({
      chat_id: "@channel",
      photo: "https://example.com/photo.png",
    });
    await telegram.sendVideo({
      chat_id: "@channel",
      video: "telegram-file-id",
      supports_streaming: true,
    });
    await telegram.sendAudio({
      chat_id: "@channel",
      audio: "https://example.com/audio.mp3",
      performer: "Apicity",
    });

    expect(mockFetch).toHaveBeenCalledTimes(3);
    const calls = mockFetch.mock.calls as Array<[string, RequestInit]>;
    expect(calls.map(([url]) => url)).toEqual([
      "https://telegram.local/bot123456:ABC-DEF/sendPhoto",
      "https://telegram.local/bot123456:ABC-DEF/sendVideo",
      "https://telegram.local/bot123456:ABC-DEF/sendAudio",
    ]);

    for (const [, init] of calls) {
      expect(init.headers).toEqual({ "Content-Type": "application/json" });
    }
    expect(JSON.parse(calls[0][1].body as string)).toEqual({
      chat_id: "@channel",
      photo: "https://example.com/photo.png",
    });
    expect(JSON.parse(calls[1][1].body as string)).toEqual({
      chat_id: "@channel",
      video: "telegram-file-id",
      supports_streaming: true,
    });
    expect(JSON.parse(calls[2][1].body as string)).toEqual({
      chat_id: "@channel",
      audio: "https://example.com/audio.mp3",
      performer: "Apicity",
    });
  });

  it("posts Blob media as multipart form-data", async () => {
    const mockFetch = vi
      .fn()
      .mockResolvedValue(telegramResponse({ caption: "uploaded" }));
    const telegram = createTelegram({
      botToken: "123456:ABC-DEF",
      fetch: mockFetch,
    });
    const photo = new Blob(["image bytes"], { type: "image/png" });

    await telegram.sendPhoto({
      chat_id: "@channel",
      photo,
      caption: "uploaded",
      has_spoiler: true,
    });

    const [, init] = mockFetch.mock.calls[0] as [string, RequestInit];
    expect(init.headers).toBeUndefined();
    expect(init.body).toBeInstanceOf(FormData);

    const form = init.body as FormData;
    const formPhoto = form.get("photo");
    expect(form.get("chat_id")).toBe("@channel");
    expect(form.get("caption")).toBe("uploaded");
    expect(form.get("has_spoiler")).toBe("true");
    expect(formPhoto).toBeInstanceOf(Blob);
    expect((formPhoto as Blob).type).toBe("image/png");
    expect(await (formPhoto as Blob).text()).toBe("image bytes");
  });

  it("posts nested sticker files as multipart attach references", async () => {
    const mockFetch = vi.fn().mockResolvedValue(telegramApiResponse(true));
    const telegram = createTelegram({
      botToken: "123456:ABC-DEF",
      fetch: mockFetch,
    });
    const sticker = new Blob(["sticker bytes"], { type: "image/png" });

    await telegram.createNewStickerSet({
      user_id: 42,
      name: "apicity_test_by_fixture_bot",
      title: "Apicity test",
      stickers: [
        {
          sticker,
          format: "static",
          emoji_list: ["smile"],
          keywords: ["test"],
        },
      ],
    });

    const [url, init] = mockFetch.mock.calls[0] as [string, RequestInit];
    expect(url).toBe(
      "https://api.telegram.org/bot123456:ABC-DEF/createNewStickerSet"
    );
    expect(init.headers).toBeUndefined();
    expect(init.body).toBeInstanceOf(FormData);

    const form = init.body as FormData;
    expect(form.get("user_id")).toBe("42");
    expect(form.get("name")).toBe("apicity_test_by_fixture_bot");
    expect(JSON.parse(form.get("stickers") as string)).toEqual([
      {
        sticker: "attach://stickers_0_sticker",
        format: "static",
        emoji_list: ["smile"],
        keywords: ["test"],
      },
    ]);

    const uploaded = form.get("stickers_0_sticker");
    expect(uploaded).toBeInstanceOf(Blob);
    expect((uploaded as Blob).type).toBe("image/png");
    expect(await (uploaded as Blob).text()).toBe("sticker bytes");
  });

  it("surfaces Telegram error responses", async () => {
    const errorBody = {
      ok: false,
      error_code: 400,
      description: "Bad Request: chat not found",
    };
    const mockFetch = vi.fn().mockResolvedValue(
      new Response(JSON.stringify(errorBody), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      })
    );
    const telegram = createTelegram({
      botToken: "123456:ABC-DEF",
      fetch: mockFetch,
    });

    try {
      await telegram.sendMessage({
        chat_id: 42,
        text: "hello",
      });
    } catch (error) {
      expect(error).toBeInstanceOf(TelegramError);
      expect(error).toMatchObject({
        status: 400,
        code: "400",
        body: errorBody,
      });
      expect((error as Error).message).toBe(
        "Telegram API error 400: Bad Request: chat not found"
      );
      return;
    }

    throw new Error("Expected TelegramError");
  });
});
