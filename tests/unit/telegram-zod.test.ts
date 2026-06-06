import { describe, expect, it } from "vitest";

import {
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
});
