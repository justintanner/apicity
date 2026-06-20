import { describe, expect, it, vi } from "vitest";

import {
  createTelegram,
  TelegramError,
} from "../../packages/provider/telegram/src";

function telegramResult(result: unknown): Response {
  return new Response(
    JSON.stringify({
      ok: true,
      result,
    }),
    {
      status: 200,
      headers: { "Content-Type": "application/json" },
    }
  );
}

function telegramResponse(result: Record<string, unknown>): Response {
  return telegramResult({
    message_id: 1,
    date: 1770300000,
    chat: { id: 42, type: "private" },
    ...result,
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

    expect(telegram.post.copyMessage).toBe(telegram.copyMessage);
    expect(telegram.post.copyMessages).toBe(telegram.copyMessages);
    expect(telegram.post.deleteAllMessageReactions).toBe(
      telegram.deleteAllMessageReactions
    );
    expect(telegram.post.deleteMessage).toBe(telegram.deleteMessage);
    expect(telegram.post.deleteMessageReaction).toBe(
      telegram.deleteMessageReaction
    );
    expect(telegram.post.deleteMessages).toBe(telegram.deleteMessages);
    expect(telegram.post.editMessageCaption).toBe(telegram.editMessageCaption);
    expect(telegram.post.editMessageChecklist).toBe(
      telegram.editMessageChecklist
    );
    expect(telegram.post.editMessageLiveLocation).toBe(
      telegram.editMessageLiveLocation
    );
    expect(telegram.post.editMessageMedia).toBe(telegram.editMessageMedia);
    expect(telegram.post.editMessageReplyMarkup).toBe(
      telegram.editMessageReplyMarkup
    );
    expect(telegram.post.editMessageText).toBe(telegram.editMessageText);
    expect(telegram.post.forwardMessage).toBe(telegram.forwardMessage);
    expect(telegram.post.forwardMessages).toBe(telegram.forwardMessages);
    expect(telegram.post.pinChatMessage).toBe(telegram.pinChatMessage);
    expect(telegram.post.sendMessage).toBe(telegram.sendMessage);
    expect(telegram.post.sendPhoto).toBe(telegram.sendPhoto);
    expect(telegram.post.sendVideo).toBe(telegram.sendVideo);
    expect(telegram.post.sendAudio).toBe(telegram.sendAudio);
    expect(telegram.post.setMessageReaction).toBe(telegram.setMessageReaction);
    expect(telegram.post.stopMessageLiveLocation).toBe(
      telegram.stopMessageLiveLocation
    );
    expect(telegram.post.stopPoll).toBe(telegram.stopPoll);
    expect(telegram.post.unpinAllChatMessages).toBe(
      telegram.unpinAllChatMessages
    );
    expect(telegram.post.unpinChatMessage).toBe(telegram.unpinChatMessage);
  });

  it("posts message management, editing, poll, and reaction requests", async () => {
    type TelegramRequestMethod = (
      req: Record<string, unknown>
    ) => Promise<unknown>;
    interface EndpointCase {
      name: string;
      path: string;
      payload: Record<string, unknown>;
    }

    const endpointCases: EndpointCase[] = [
      {
        name: "forwardMessage",
        path: "/forwardMessage",
        payload: {
          chat_id: 42,
          from_chat_id: 43,
          message_id: 7,
          disable_notification: true,
        },
      },
      {
        name: "forwardMessages",
        path: "/forwardMessages",
        payload: {
          chat_id: 42,
          from_chat_id: 43,
          message_ids: [7, 8],
        },
      },
      {
        name: "copyMessage",
        path: "/copyMessage",
        payload: {
          chat_id: "@target",
          from_chat_id: "@source",
          message_id: 9,
          caption: "copied",
        },
      },
      {
        name: "copyMessages",
        path: "/copyMessages",
        payload: {
          chat_id: "@target",
          from_chat_id: "@source",
          message_ids: [9, 10],
          remove_caption: true,
        },
      },
      {
        name: "deleteMessage",
        path: "/deleteMessage",
        payload: { chat_id: 42, message_id: 7 },
      },
      {
        name: "deleteMessages",
        path: "/deleteMessages",
        payload: { chat_id: 42, message_ids: [7, 8] },
      },
      {
        name: "pinChatMessage",
        path: "/pinChatMessage",
        payload: {
          chat_id: 42,
          message_id: 7,
          disable_notification: true,
        },
      },
      {
        name: "unpinChatMessage",
        path: "/unpinChatMessage",
        payload: { chat_id: 42, message_id: 7 },
      },
      {
        name: "unpinAllChatMessages",
        path: "/unpinAllChatMessages",
        payload: { chat_id: 42 },
      },
      {
        name: "editMessageText",
        path: "/editMessageText",
        payload: {
          chat_id: 42,
          message_id: 7,
          text: "updated",
          link_preview_options: { is_disabled: true },
        },
      },
      {
        name: "editMessageCaption",
        path: "/editMessageCaption",
        payload: {
          chat_id: 42,
          message_id: 7,
          caption: "new caption",
        },
      },
      {
        name: "editMessageMedia",
        path: "/editMessageMedia",
        payload: {
          chat_id: 42,
          message_id: 7,
          media: { type: "photo", media: "telegram-file-id" },
        },
      },
      {
        name: "editMessageLiveLocation",
        path: "/editMessageLiveLocation",
        payload: {
          chat_id: 42,
          message_id: 7,
          latitude: 37.78,
          longitude: -122.42,
        },
      },
      {
        name: "stopMessageLiveLocation",
        path: "/stopMessageLiveLocation",
        payload: { chat_id: 42, message_id: 7 },
      },
      {
        name: "editMessageChecklist",
        path: "/editMessageChecklist",
        payload: {
          business_connection_id: "biz-1",
          chat_id: 42,
          message_id: 7,
          checklist: { title: "Tasks", tasks: [] },
        },
      },
      {
        name: "editMessageReplyMarkup",
        path: "/editMessageReplyMarkup",
        payload: {
          inline_message_id: "inline-1",
          reply_markup: { inline_keyboard: [] },
        },
      },
      {
        name: "stopPoll",
        path: "/stopPoll",
        payload: { chat_id: 42, message_id: 7 },
      },
      {
        name: "setMessageReaction",
        path: "/setMessageReaction",
        payload: {
          chat_id: 42,
          message_id: 7,
          reaction: [{ type: "emoji", emoji: "ok" }],
          is_big: true,
        },
      },
      {
        name: "deleteMessageReaction",
        path: "/deleteMessageReaction",
        payload: { chat_id: 42, message_id: 7, user_id: 1001 },
      },
      {
        name: "deleteAllMessageReactions",
        path: "/deleteAllMessageReactions",
        payload: { chat_id: 42, actor_chat_id: -1001 },
      },
    ];

    const mockFetch = vi.fn().mockImplementation(() => telegramResult(true));
    const telegram = createTelegram({
      botToken: "123456:ABC-DEF",
      baseURL: "https://telegram.local/bot{token}",
      fetch: mockFetch,
    });

    for (const endpointCase of endpointCases) {
      const endpoint = telegram[
        endpointCase.name as keyof typeof telegram
      ] as unknown as TelegramRequestMethod;
      await endpoint(endpointCase.payload);
    }

    expect(mockFetch).toHaveBeenCalledTimes(endpointCases.length);
    const calls = mockFetch.mock.calls as Array<[string, RequestInit]>;
    expect(calls.map(([url]) => url)).toEqual(
      endpointCases.map(
        (endpointCase) =>
          `https://telegram.local/bot123456:ABC-DEF${endpointCase.path}`
      )
    );

    for (const [index, [, init]] of calls.entries()) {
      expect(init.method).toBe("POST");
      expect(init.headers).toEqual({ "Content-Type": "application/json" });
      expect(JSON.parse(init.body as string)).toEqual(
        endpointCases[index].payload
      );
    }
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
