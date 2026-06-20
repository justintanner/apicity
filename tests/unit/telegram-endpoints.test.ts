import { describe, expect, it, vi } from "vitest";

import {
  createTelegram,
  TelegramError,
} from "../../packages/provider/telegram/src";

function telegramApiResponse(result: unknown): Response {
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

function telegramMessageResponse(result: Record<string, unknown>): Response {
  return telegramApiResponse({
    message_id: 1,
    date: 1770300000,
    chat: { id: 42, type: "private" },
    ...result,
  });
}

function jsonBody(init: RequestInit): unknown {
  return JSON.parse(init.body as string);
}

describe("Telegram endpoint wiring", () => {
  it("posts sendMessage requests to the bot-token URL", async () => {
    const mockFetch = vi
      .fn()
      .mockResolvedValue(telegramMessageResponse({ text: "hello" }));
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
    expect(jsonBody(init)).toEqual({
      chat_id: 42,
      text: "hello",
    });
  });

  it("exposes the same methods under the post namespace", () => {
    const telegram = createTelegram({
      botToken: "123456:ABC-DEF",
      fetch: vi.fn(),
    });
    const methodNames = [
      "getUpdates",
      "setWebhook",
      "deleteWebhook",
      "getWebhookInfo",
      "getMe",
      "logOut",
      "close",
      "getFile",
      "getManagedBotToken",
      "replaceManagedBotToken",
      "getManagedBotAccessSettings",
      "setManagedBotAccessSettings",
      "setMyCommands",
      "deleteMyCommands",
      "getMyCommands",
      "setMyName",
      "getMyName",
      "setMyDescription",
      "getMyDescription",
      "setMyShortDescription",
      "getMyShortDescription",
      "setChatMenuButton",
      "getChatMenuButton",
      "setMyDefaultAdministratorRights",
      "getMyDefaultAdministratorRights",
      "sendMessage",
      "sendPhoto",
      "sendVideo",
      "sendAudio",
    ] as const;

    for (const methodName of methodNames) {
      expect(telegram.post[methodName]).toBe(telegram[methodName]);
    }
  });

  it("posts no-parameter methods with empty JSON bodies", async () => {
    const mockFetch = vi
      .fn()
      .mockResolvedValueOnce(
        telegramApiResponse({
          id: 123456,
          is_bot: true,
          first_name: "Apicity",
        })
      )
      .mockResolvedValueOnce(
        telegramApiResponse({
          url: "",
          has_custom_certificate: false,
          pending_update_count: 0,
        })
      )
      .mockResolvedValueOnce(telegramApiResponse(true))
      .mockResolvedValueOnce(telegramApiResponse(true));
    const telegram = createTelegram({
      botToken: "123456:ABC-DEF",
      baseURL: "https://telegram.local/bot{token}",
      fetch: mockFetch,
    });

    const me = await telegram.getMe();
    const webhook = await telegram.getWebhookInfo();
    const logout = await telegram.logOut();
    const close = await telegram.close();

    expect(me.result.first_name).toBe("Apicity");
    expect(webhook.result.pending_update_count).toBe(0);
    expect(logout.result).toBe(true);
    expect(close.result).toBe(true);
    const calls = mockFetch.mock.calls as Array<[string, RequestInit]>;
    expect(calls.map(([url]) => url)).toEqual([
      "https://telegram.local/bot123456:ABC-DEF/getMe",
      "https://telegram.local/bot123456:ABC-DEF/getWebhookInfo",
      "https://telegram.local/bot123456:ABC-DEF/logOut",
      "https://telegram.local/bot123456:ABC-DEF/close",
    ]);
    for (const [, init] of calls) {
      expect(init.headers).toEqual({ "Content-Type": "application/json" });
      expect(jsonBody(init)).toEqual({});
    }
  });

  it("posts update, webhook, file, and managed-bot request bodies", async () => {
    const mockFetch = vi
      .fn()
      .mockImplementation(() => Promise.resolve(telegramApiResponse(true)));
    const telegram = createTelegram({
      botToken: "123456:ABC-DEF",
      baseURL: "https://telegram.local/bot{token}",
      fetch: mockFetch,
    });

    await telegram.getUpdates({
      offset: 7,
      limit: 10,
      timeout: 1,
      allowed_updates: ["message", "managed_bot"],
    });
    await telegram.deleteWebhook({ drop_pending_updates: true });
    await telegram.getFile({ file_id: "AgACAgQAAxkBAAI" });
    await telegram.getManagedBotToken({ user_id: 1001 });
    await telegram.replaceManagedBotToken({ user_id: 1001 });
    await telegram.getManagedBotAccessSettings({ user_id: 1001 });
    await telegram.setManagedBotAccessSettings({
      user_id: 1001,
      is_access_restricted: true,
      added_user_ids: [2001, 2002],
    });

    const calls = mockFetch.mock.calls as Array<[string, RequestInit]>;
    expect(calls.map(([url]) => url)).toEqual([
      "https://telegram.local/bot123456:ABC-DEF/getUpdates",
      "https://telegram.local/bot123456:ABC-DEF/deleteWebhook",
      "https://telegram.local/bot123456:ABC-DEF/getFile",
      "https://telegram.local/bot123456:ABC-DEF/getManagedBotToken",
      "https://telegram.local/bot123456:ABC-DEF/replaceManagedBotToken",
      "https://telegram.local/bot123456:ABC-DEF/getManagedBotAccessSettings",
      "https://telegram.local/bot123456:ABC-DEF/setManagedBotAccessSettings",
    ]);
    expect(jsonBody(calls[0][1])).toEqual({
      offset: 7,
      limit: 10,
      timeout: 1,
      allowed_updates: ["message", "managed_bot"],
    });
    expect(jsonBody(calls[1][1])).toEqual({ drop_pending_updates: true });
    expect(jsonBody(calls[2][1])).toEqual({ file_id: "AgACAgQAAxkBAAI" });
    expect(jsonBody(calls[3][1])).toEqual({ user_id: 1001 });
    expect(jsonBody(calls[4][1])).toEqual({ user_id: 1001 });
    expect(jsonBody(calls[5][1])).toEqual({ user_id: 1001 });
    expect(jsonBody(calls[6][1])).toEqual({
      user_id: 1001,
      is_access_restricted: true,
      added_user_ids: [2001, 2002],
    });
  });

  it("posts webhook certificates as multipart form-data", async () => {
    const mockFetch = vi
      .fn()
      .mockImplementation(() => Promise.resolve(telegramApiResponse(true)));
    const telegram = createTelegram({
      botToken: "123456:ABC-DEF",
      fetch: mockFetch,
    });
    const certificate = new Blob(["pem bytes"], {
      type: "application/x-pem-file",
    });

    await telegram.setWebhook({
      url: "https://example.com/telegram",
      certificate,
      allowed_updates: ["message"],
      secret_token: "secret-token_1",
    });

    const [url, init] = mockFetch.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("https://api.telegram.org/bot123456:ABC-DEF/setWebhook");
    expect(init.headers).toBeUndefined();
    expect(init.body).toBeInstanceOf(FormData);

    const form = init.body as FormData;
    const formCertificate = form.get("certificate");
    expect(form.get("url")).toBe("https://example.com/telegram");
    expect(form.get("allowed_updates")).toBe(JSON.stringify(["message"]));
    expect(form.get("secret_token")).toBe("secret-token_1");
    expect(formCertificate).toBeInstanceOf(Blob);
    expect((formCertificate as Blob).type).toBe("application/x-pem-file");
    expect(await (formCertificate as Blob).text()).toBe("pem bytes");
  });

  it("posts command, menu, profile, and administrator-rights metadata", async () => {
    const mockFetch = vi
      .fn()
      .mockImplementation(() => Promise.resolve(telegramApiResponse(true)));
    const telegram = createTelegram({
      botToken: "123456:ABC-DEF",
      baseURL: "https://telegram.local/bot{token}",
      fetch: mockFetch,
    });

    await telegram.setMyCommands({
      commands: [{ command: "start", description: "Start the bot" }],
      scope: { type: "default" },
      language_code: "en",
    });
    await telegram.getMyCommands({ scope: { type: "default" } });
    await telegram.deleteMyCommands({ language_code: "en" });
    await telegram.setChatMenuButton({
      chat_id: 42,
      menu_button: { type: "commands" },
    });
    await telegram.getChatMenuButton({ chat_id: 42 });
    await telegram.setMyName({ name: "Apicity", language_code: "en" });
    await telegram.getMyName({ language_code: "en" });
    await telegram.setMyDescription({ description: "Fixture bot" });
    await telegram.getMyDescription();
    await telegram.setMyShortDescription({ short_description: "Fixtures" });
    await telegram.getMyShortDescription();
    await telegram.setMyDefaultAdministratorRights({
      rights: { can_delete_messages: true },
      for_channels: true,
    });
    await telegram.getMyDefaultAdministratorRights({ for_channels: true });

    const calls = mockFetch.mock.calls as Array<[string, RequestInit]>;
    expect(calls.map(([url]) => url)).toEqual([
      "https://telegram.local/bot123456:ABC-DEF/setMyCommands",
      "https://telegram.local/bot123456:ABC-DEF/getMyCommands",
      "https://telegram.local/bot123456:ABC-DEF/deleteMyCommands",
      "https://telegram.local/bot123456:ABC-DEF/setChatMenuButton",
      "https://telegram.local/bot123456:ABC-DEF/getChatMenuButton",
      "https://telegram.local/bot123456:ABC-DEF/setMyName",
      "https://telegram.local/bot123456:ABC-DEF/getMyName",
      "https://telegram.local/bot123456:ABC-DEF/setMyDescription",
      "https://telegram.local/bot123456:ABC-DEF/getMyDescription",
      "https://telegram.local/bot123456:ABC-DEF/setMyShortDescription",
      "https://telegram.local/bot123456:ABC-DEF/getMyShortDescription",
      "https://telegram.local/bot123456:ABC-DEF/setMyDefaultAdministratorRights",
      "https://telegram.local/bot123456:ABC-DEF/getMyDefaultAdministratorRights",
    ]);
    expect(jsonBody(calls[0][1])).toEqual({
      commands: [{ command: "start", description: "Start the bot" }],
      scope: { type: "default" },
      language_code: "en",
    });
    expect(jsonBody(calls[3][1])).toEqual({
      chat_id: 42,
      menu_button: { type: "commands" },
    });
    expect(jsonBody(calls[8][1])).toEqual({});
    expect(jsonBody(calls[11][1])).toEqual({
      rights: { can_delete_messages: true },
      for_channels: true,
    });
  });

  it("posts string media as JSON for photo, video, and audio messages", async () => {
    const mockFetch = vi
      .fn()
      .mockImplementation(() => Promise.resolve(telegramMessageResponse({})));
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
    expect(jsonBody(calls[0][1])).toEqual({
      chat_id: "@channel",
      photo: "https://example.com/photo.png",
    });
    expect(jsonBody(calls[1][1])).toEqual({
      chat_id: "@channel",
      video: "telegram-file-id",
      supports_streaming: true,
    });
    expect(jsonBody(calls[2][1])).toEqual({
      chat_id: "@channel",
      audio: "https://example.com/audio.mp3",
      performer: "Apicity",
    });
  });

  it("posts Blob media as multipart form-data", async () => {
    const mockFetch = vi
      .fn()
      .mockResolvedValue(telegramMessageResponse({ caption: "uploaded" }));
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
