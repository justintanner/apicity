import { describe, expect, it } from "vitest";

import {
  TelegramCopyMessageRequestSchema,
  TelegramDeleteAllMessageReactionsRequestSchema,
  TelegramDeleteMessageReactionRequestSchema,
  TelegramEditMessageChecklistRequestSchema,
  TelegramEditMessageTextRequestSchema,
  TelegramForwardMessagesRequestSchema,
  TelegramSendAudioRequestSchema,
  TelegramSendMessageRequestSchema,
  TelegramSendPhotoRequestSchema,
  TelegramSendVideoRequestSchema,
  TelegramSetMessageReactionRequestSchema,
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

  it("validates forwarding and copying existing messages", () => {
    const forward = TelegramForwardMessagesRequestSchema.safeParse({
      chat_id: "@target",
      from_chat_id: "@source",
      message_ids: [11, 12],
      protect_content: true,
    });
    const copy = TelegramCopyMessageRequestSchema.safeParse({
      chat_id: "@target",
      from_chat_id: "@source",
      message_id: 11,
      caption: "copied",
      parse_mode: "HTML",
    });

    expect(forward.success).toBe(true);
    expect(copy.success).toBe(true);
  });

  it("rejects message id lists outside Telegram bounds", () => {
    const result = TelegramForwardMessagesRequestSchema.safeParse({
      chat_id: "@target",
      from_chat_id: "@source",
      message_ids: Array.from({ length: 101 }, (_, i) => i + 1),
    });

    expect(result.success).toBe(false);
    expect(
      result.error?.issues.some((i) => i.path.includes("message_ids"))
    ).toBe(true);
  });

  it("validates current editing payload shapes", () => {
    const richText = TelegramEditMessageTextRequestSchema.safeParse({
      inline_message_id: "inline-1",
      rich_message: { blocks: [] },
      reply_markup: { inline_keyboard: [] },
    });
    const checklist = TelegramEditMessageChecklistRequestSchema.safeParse({
      business_connection_id: "biz-1",
      chat_id: "@apicitylogbot",
      message_id: 11,
      checklist: { title: "Deploy", tasks: [] },
    });

    expect(richText.success).toBe(true);
    expect(checklist.success).toBe(true);
  });

  it("requires business connection context for checklist edits", () => {
    const result = TelegramEditMessageChecklistRequestSchema.safeParse({
      chat_id: "@apicitylogbot",
      message_id: 11,
      checklist: { title: "Deploy", tasks: [] },
    });

    expect(result.success).toBe(false);
    expect(
      result.error?.issues.some((i) =>
        i.path.includes("business_connection_id")
      )
    ).toBe(true);
  });

  it("validates message reaction management payloads", () => {
    const setReaction = TelegramSetMessageReactionRequestSchema.safeParse({
      chat_id: "@apicitylogbot",
      message_id: 11,
      reaction: [{ type: "emoji", emoji: "ok" }],
      is_big: true,
    });
    const deleteReaction = TelegramDeleteMessageReactionRequestSchema.safeParse(
      {
        chat_id: "@apicitylogbot",
        message_id: 11,
        user_id: 123,
      }
    );
    const deleteAll = TelegramDeleteAllMessageReactionsRequestSchema.safeParse({
      chat_id: "@apicitylogbot",
      actor_chat_id: -100123,
    });

    expect(setReaction.success).toBe(true);
    expect(deleteReaction.success).toBe(true);
    expect(deleteAll.success).toBe(true);
  });
});
