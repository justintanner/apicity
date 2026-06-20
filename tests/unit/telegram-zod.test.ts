import { describe, expect, it } from "vitest";

import {
  TelegramAnswerChatJoinRequestQueryRequestSchema,
  TelegramBotCommandSchema,
  TelegramForwardMessagesRequestSchema,
  TelegramSendAudioRequestSchema,
  TelegramSendMediaGroupRequestSchema,
  TelegramSendMessageRequestSchema,
  TelegramSendPhotoRequestSchema,
  TelegramSendVideoRequestSchema,
  TelegramSetManagedBotAccessSettingsRequestSchema,
  TelegramSetWebhookRequestSchema,
} from "../../packages/provider/telegram/src/zod";

describe("Telegram Zod schema validation", () => {
  it("validates common message payloads", () => {
    expect(
      TelegramSendMessageRequestSchema.safeParse({
        chat_id: 123456789,
        text: "hello",
        parse_mode: "HTML",
      }).success
    ).toBe(true);
    expect(
      TelegramSendMessageRequestSchema.safeParse({ chat_id: 1 }).success
    ).toBe(false);
    expect(
      TelegramSendPhotoRequestSchema.safeParse({
        chat_id: "@fixture",
        photo: new Blob(["image"], { type: "image/png" }),
      }).success
    ).toBe(true);
    expect(
      TelegramSendVideoRequestSchema.safeParse({
        chat_id: "@fixture",
        video: "file_id",
        cover: "attach://cover",
      }).success
    ).toBe(true);
    expect(
      TelegramSendAudioRequestSchema.safeParse({
        chat_id: "@fixture",
        audio: "file_id",
        performer: "Apicity",
      }).success
    ).toBe(true);
  });

  it("validates multipart media arrays", () => {
    expect(
      TelegramSendMediaGroupRequestSchema.safeParse({
        chat_id: "@fixture",
        media: [{ type: "photo", media: new Blob(["photo"]) }],
      }).success
    ).toBe(true);
  });

  it("validates webhook and command constraints", () => {
    expect(
      TelegramSetWebhookRequestSchema.safeParse({
        url: "https://example.com/telegram",
        secret_token: "secret-token_1",
      }).success
    ).toBe(true);
    expect(
      TelegramSetWebhookRequestSchema.safeParse({
        url: "https://example.com/telegram",
        secret_token: "not allowed",
      }).success
    ).toBe(false);
    expect(
      TelegramBotCommandSchema.safeParse({
        command: "status_1",
        description: "Show current status",
      }).success
    ).toBe(true);
    expect(
      TelegramBotCommandSchema.safeParse({
        command: "Status",
        description: "Show current status",
      }).success
    ).toBe(false);
  });

  it("validates representative admin and reaction payloads", () => {
    expect(
      TelegramForwardMessagesRequestSchema.safeParse({
        chat_id: "@target",
        from_chat_id: "@source",
        message_ids: [11, 12],
      }).success
    ).toBe(true);
    expect(
      TelegramForwardMessagesRequestSchema.safeParse({
        chat_id: "@target",
        from_chat_id: "@source",
        message_ids: Array.from({ length: 101 }, (_, i) => i + 1),
      }).success
    ).toBe(false);
    expect(
      TelegramSetManagedBotAccessSettingsRequestSchema.safeParse({
        user_id: 1001,
        is_access_restricted: true,
        added_user_ids: [2001, 2002],
      }).success
    ).toBe(true);
    expect(
      TelegramAnswerChatJoinRequestQueryRequestSchema.safeParse({
        chat_join_request_query_id: "join-query",
        result: "hold",
      }).success
    ).toBe(false);
  });
});
