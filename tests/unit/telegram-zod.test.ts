import { describe, expect, it } from "vitest";

import {
  TelegramBotCommandSchema,
  TelegramGetFileRequestSchema,
  TelegramGetUpdatesRequestSchema,
  TelegramSetManagedBotAccessSettingsRequestSchema,
  TelegramSetMyCommandsRequestSchema,
  TelegramSetMyDescriptionRequestSchema,
  TelegramSetMyNameRequestSchema,
  TelegramSetMyShortDescriptionRequestSchema,
  TelegramSetWebhookRequestSchema,
  TelegramSendAudioRequestSchema,
  TelegramSendMessageRequestSchema,
  TelegramSendPhotoRequestSchema,
  TelegramSendVideoRequestSchema,
} from "../../packages/provider/telegram/src/zod";

describe("Telegram Zod schema validation", () => {
  it("validates a text message payload", () => {
    const result = TelegramSendMessageRequestSchema.safeParse({
      chat_id: 123456789,
      text: "hello from apicitylogbot",
      parse_mode: "HTML",
      link_preview_options: { is_disabled: true },
    });

    expect(result.success).toBe(true);
  });

  it("rejects a message payload without text", () => {
    const result = TelegramSendMessageRequestSchema.safeParse({
      chat_id: 123456789,
    });

    expect(result.success).toBe(false);
    expect(result.error?.issues.some((i) => i.path.includes("text"))).toBe(
      true
    );
  });

  it("validates photo payloads with string media and Blob uploads", () => {
    const byUrl = TelegramSendPhotoRequestSchema.safeParse({
      chat_id: "@apicitylogbot",
      photo: "https://example.com/image.png",
      caption: "from a URL",
    });
    const byBlob = TelegramSendPhotoRequestSchema.safeParse({
      chat_id: "@apicitylogbot",
      photo: new Blob(["image"], { type: "image/png" }),
    });

    expect(byUrl.success).toBe(true);
    expect(byBlob.success).toBe(true);
  });

  it("validates video payloads with uploadable thumbnails and covers", () => {
    const result = TelegramSendVideoRequestSchema.safeParse({
      chat_id: "@apicitylogbot",
      video: new Blob(["video"], { type: "video/mp4" }),
      thumbnail: new Blob(["thumb"], { type: "image/jpeg" }),
      cover: "attach://cover",
      supports_streaming: true,
      duration: 5,
    });

    expect(result.success).toBe(true);
  });

  it("validates audio payloads with metadata", () => {
    const result = TelegramSendAudioRequestSchema.safeParse({
      chat_id: "@apicitylogbot",
      audio: "file_id",
      performer: "Apicity",
      title: "Status update",
      duration: 3,
    });

    expect(result.success).toBe(true);
  });

  it("rejects empty media strings", () => {
    const result = TelegramSendPhotoRequestSchema.safeParse({
      chat_id: "@apicitylogbot",
      photo: "",
    });

    expect(result.success).toBe(false);
    expect(result.error?.issues.some((i) => i.path.includes("photo"))).toBe(
      true
    );
  });

  it("validates update and file lookup payloads", () => {
    const updates = TelegramGetUpdatesRequestSchema.safeParse({
      offset: 10,
      limit: 50,
      timeout: 1,
      allowed_updates: ["message", "managed_bot"],
    });
    const file = TelegramGetFileRequestSchema.safeParse({
      file_id: "AgACAgQAAxkBAAI",
    });

    expect(updates.success).toBe(true);
    expect(file.success).toBe(true);
  });

  it("validates webhook payloads and secret token characters", () => {
    const byUrl = TelegramSetWebhookRequestSchema.safeParse({
      url: "https://example.com/telegram",
      allowed_updates: ["message"],
      secret_token: "secret-token_1",
    });
    const byBlob = TelegramSetWebhookRequestSchema.safeParse({
      url: "https://example.com/telegram",
      certificate: new Blob(["pem"], { type: "application/x-pem-file" }),
    });
    const invalidSecret = TelegramSetWebhookRequestSchema.safeParse({
      url: "https://example.com/telegram",
      secret_token: "not allowed",
    });

    expect(byUrl.success).toBe(true);
    expect(byBlob.success).toBe(true);
    expect(invalidSecret.success).toBe(false);
  });

  it("validates bot commands and command metadata payloads", () => {
    const command = TelegramBotCommandSchema.safeParse({
      command: "status_1",
      description: "Show current status",
    });
    const uppercaseCommand = TelegramBotCommandSchema.safeParse({
      command: "Status",
      description: "Show current status",
    });
    const setCommands = TelegramSetMyCommandsRequestSchema.safeParse({
      commands: [{ command: "start", description: "Start the bot" }],
      scope: { type: "default" },
      language_code: "en",
    });

    expect(command.success).toBe(true);
    expect(uppercaseCommand.success).toBe(false);
    expect(setCommands.success).toBe(true);
  });

  it("validates bot profile metadata limits", () => {
    const name = TelegramSetMyNameRequestSchema.safeParse({
      name: "Apicity",
      language_code: "en",
    });
    const description = TelegramSetMyDescriptionRequestSchema.safeParse({
      description: "A fixture bot for Apicity Telegram tests",
    });
    const shortDescription =
      TelegramSetMyShortDescriptionRequestSchema.safeParse({
        short_description: "Fixture updates",
      });

    expect(name.success).toBe(true);
    expect(description.success).toBe(true);
    expect(shortDescription.success).toBe(true);
  });

  it("validates managed-bot access settings", () => {
    const allowed = TelegramSetManagedBotAccessSettingsRequestSchema.safeParse({
      user_id: 1001,
      is_access_restricted: true,
      added_user_ids: [2001, 2002],
    });
    const tooManyUsers =
      TelegramSetManagedBotAccessSettingsRequestSchema.safeParse({
        user_id: 1001,
        is_access_restricted: true,
        added_user_ids: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11],
      });

    expect(allowed.success).toBe(true);
    expect(tooManyUsers.success).toBe(false);
  });
});
