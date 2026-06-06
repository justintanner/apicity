import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import {
  recordingExists,
  setupPollyForFileUploads,
  teardownPolly,
  type PollyContext,
} from "../harness";
import { createTelegram } from "@apicity/telegram";

const RECORDING_NAME = "telegram/send-all-types";
const DEFAULT_CHAT_ID = "@justintanner";

function shouldUseLiveToken(ctx: PollyContext): boolean {
  if (ctx.mode === "record" || ctx.mode === "passthrough") return true;
  if (ctx.mode === "record-missing") return !recordingExists(RECORDING_NAME);
  return false;
}

function botTokenForMode(ctx: PollyContext): string {
  if (!shouldUseLiveToken(ctx)) return "***";
  const token = process.env.TELEGRAM_BOT_KEY;
  if (!token) {
    throw new Error("TELEGRAM_BOT_KEY is required to record Telegram HARs");
  }
  return token;
}

function chatIdForMode(ctx: PollyContext): string {
  if (!shouldUseLiveToken(ctx)) return DEFAULT_CHAT_ID;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (!chatId) {
    throw new Error("TELEGRAM_CHAT_ID is required to record Telegram HARs");
  }
  return chatId;
}

describe("telegram send all message types", () => {
  let ctx: PollyContext;

  beforeEach(() => {
    ctx = setupPollyForFileUploads(RECORDING_NAME);
  });

  afterEach(async () => {
    await teardownPolly(ctx);
  });

  it("sends text, photo, video, and audio messages to @justintanner", async () => {
    const telegram = createTelegram({
      botToken: botTokenForMode(ctx),
      timeout: 60000,
    });
    const chatId = chatIdForMode(ctx);
    const suffix = new Date().toISOString();

    const text = await telegram.sendMessage({
      chat_id: chatId,
      text: `apicity telegram HAR text ${suffix}`,
    });

    const photoBytes = readFileSync(resolve(__dirname, "../fixtures/red.png"));
    const photo = await telegram.sendPhoto({
      chat_id: chatId,
      photo: new Blob([photoBytes], { type: "image/png" }),
      caption: `apicity telegram HAR photo ${suffix}`,
    });

    const videoBytes = readFileSync(resolve(__dirname, "../fixtures/jump.mp4"));
    const video = await telegram.sendVideo({
      chat_id: chatId,
      video: new Blob([videoBytes], { type: "video/mp4" }),
      caption: `apicity telegram HAR video ${suffix}`,
      supports_streaming: true,
    });

    const audioBytes = readFileSync(resolve(__dirname, "../fixtures/tone.mp3"));
    const audio = await telegram.sendAudio({
      chat_id: chatId,
      audio: new Blob([audioBytes], { type: "audio/mpeg" }),
      caption: `apicity telegram HAR audio ${suffix}`,
      title: "apicity HAR tone",
      performer: "apicity",
    });

    expect(text.ok).toBe(true);
    expect(text.result.text).toMatch(/^apicity telegram HAR text/);
    expect(photo.ok).toBe(true);
    expect(photo.result.caption).toMatch(/^apicity telegram HAR photo/);
    expect(photo.result.photo?.length).toBeGreaterThan(0);
    expect(video.ok).toBe(true);
    expect(video.result.caption).toMatch(/^apicity telegram HAR video/);
    expect(video.result.video).toBeTruthy();
    expect(audio.ok).toBe(true);
    expect(audio.result.caption).toMatch(/^apicity telegram HAR audio/);
    expect(audio.result.audio).toBeTruthy();
  });
});
