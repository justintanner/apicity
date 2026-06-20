import { describe, expect, it } from "vitest";

import {
  TelegramAnswerInlineQueryRequestSchema,
  TelegramCreateNewStickerSetRequestSchema,
  TelegramGiftPremiumSubscriptionRequestSchema,
  TelegramGetBusinessConnectionRequestSchema,
  TelegramPostStoryRequestSchema,
  TelegramSendAudioRequestSchema,
  TelegramSendInvoiceRequestSchema,
  TelegramSendGameRequestSchema,
  TelegramSendMessageRequestSchema,
  TelegramSendPhotoRequestSchema,
  TelegramSendVideoRequestSchema,
  TelegramSetPassportDataErrorsRequestSchema,
  TelegramSetUserEmojiStatusRequestSchema,
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

  it("validates inline query answers", () => {
    const result = TelegramAnswerInlineQueryRequestSchema.safeParse({
      inline_query_id: "inline-1",
      results: [
        {
          type: "article",
          id: "article-1",
          title: "Result",
          input_message_content: { message_text: "hello" },
        },
      ],
      cache_time: 30,
      is_personal: true,
    });

    expect(result.success).toBe(true);
  });

  it("validates invoice and premium gift payloads", () => {
    const invoice = TelegramSendInvoiceRequestSchema.safeParse({
      chat_id: 123456789,
      title: "Premium pack",
      description: "Stars payment",
      payload: "payment-payload",
      currency: "XTR",
      prices: [{ label: "Stars", amount: 10 }],
      need_email: true,
    });
    const gift = TelegramGiftPremiumSubscriptionRequestSchema.safeParse({
      user_id: 123456789,
      month_count: 3,
      star_count: 1000,
      text: "thanks",
    });

    expect(invoice.success).toBe(true);
    expect(gift.success).toBe(true);
  });

  it("validates sticker sets with uploadable nested stickers", () => {
    const result = TelegramCreateNewStickerSetRequestSchema.safeParse({
      user_id: 123456789,
      name: "apicity_test_by_fixture_bot",
      title: "Apicity test",
      stickers: [
        {
          sticker: new Blob(["sticker"], { type: "image/png" }),
          format: "static",
          emoji_list: ["smile"],
          keywords: ["test"],
        },
      ],
      sticker_type: "regular",
    });

    expect(result.success).toBe(true);
  });

  it("validates business and story payloads with nested media", () => {
    const business = TelegramGetBusinessConnectionRequestSchema.safeParse({
      business_connection_id: "business-1",
    });
    const story = TelegramPostStoryRequestSchema.safeParse({
      business_connection_id: "business-1",
      content: {
        type: "photo",
        photo: new Blob(["photo"], { type: "image/jpeg" }),
      },
      active_period: 86400,
      caption: "daily update",
    });

    expect(business.success).toBe(true);
    expect(story.success).toBe(true);
  });

  it("validates passport, game, and custom emoji status helpers", () => {
    const passport = TelegramSetPassportDataErrorsRequestSchema.safeParse({
      user_id: 123456789,
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
    const game = TelegramSendGameRequestSchema.safeParse({
      chat_id: 123456789,
      game_short_name: "test_game",
    });
    const emoji = TelegramSetUserEmojiStatusRequestSchema.safeParse({
      user_id: 123456789,
      emoji_status_custom_emoji_id: "custom-emoji",
    });

    expect(passport.success).toBe(true);
    expect(game.success).toBe(true);
    expect(emoji.success).toBe(true);
  });

  it("rejects sticker sets without required sticker metadata", () => {
    const result = TelegramCreateNewStickerSetRequestSchema.safeParse({
      user_id: 123456789,
      name: "apicity_test_by_fixture_bot",
      title: "Apicity test",
      stickers: [{ sticker: "file-id", format: "static" }],
    });

    expect(result.success).toBe(false);
    expect(
      result.error?.issues.some((i) => i.path.includes("emoji_list"))
    ).toBe(true);
  });
});
