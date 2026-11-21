import { describe, it, expect, afterEach } from "vitest";
import {
  recordingExists,
  setupPolly,
  teardownPolly,
  type PollyContext,
} from "../harness";
import { createGoogle, GoogleError } from "@apicity/google";

const RECORDING_NOT_FOUND = "google/nano-banana-2-1-not-found";
const RECORDING_IMAGE = "google/nano-banana-2-1";
const DEFAULT_PROJECT = "477314613503";

function shouldUseLiveKey(ctx: PollyContext, recordingName: string): boolean {
  if (ctx.mode === "record" || ctx.mode === "passthrough") return true;
  if (ctx.mode === "record-missing") return !recordingExists(recordingName);
  return false;
}

function apiKeyForMode(ctx: PollyContext, recordingName: string): string {
  if (!shouldUseLiveKey(ctx, recordingName)) return "test-key";
  const key = process.env.GOOGLE_API_KEY ?? process.env.GEMINI_API_KEY;
  if (!key) {
    throw new Error("GOOGLE_API_KEY is required to record Google HARs");
  }
  return key;
}

function projectForMode(ctx: PollyContext, recordingName: string): string {
  if (!shouldUseLiveKey(ctx, recordingName)) return DEFAULT_PROJECT;
  return process.env.GOOGLE_CLOUD_PROJECT ?? DEFAULT_PROJECT;
}

describe("google Nano Banana 2.1 global generateContent", () => {
  let ctx: PollyContext;

  afterEach(async () => {
    await teardownPolly(ctx);
  });

  it("returns 404 NOT_FOUND for a bogus model on the global project route", async () => {
    ctx = setupPolly(RECORDING_NOT_FOUND);
    const google = createGoogle({
      apiKey: apiKeyForMode(ctx, RECORDING_NOT_FOUND),
      timeout: 30000,
    });

    let caught: unknown;
    try {
      await google.v1.projects.locations.global.publishers.google.models.generateContent(
        projectForMode(ctx, RECORDING_NOT_FOUND),
        "gemini-nano-banana-nonexistent",
        {
          contents: [{ role: "user", parts: [{ text: "A red circle." }] }],
        }
      );
    } catch (error) {
      caught = error;
    }

    expect(caught).toBeInstanceOf(GoogleError);
    expect(caught).toMatchObject({ status: 404, code: "NOT_FOUND" });
  });

  it("generates a 1K 1:1 image with gemini-nano-banana-2.1", async () => {
    ctx = setupPolly(RECORDING_IMAGE);
    const google = createGoogle({
      apiKey: apiKeyForMode(ctx, RECORDING_IMAGE),
      timeout: 120000,
    });

    const result =
      await google.v1.projects.locations.global.publishers.google.models.generateContent(
        projectForMode(ctx, RECORDING_IMAGE),
        "gemini-nano-banana-2.1",
        {
          contents: [
            {
              role: "user",
              parts: [
                {
                  text: "A single red origami crane centered on plain white paper.",
                },
              ],
            },
          ],
          generationConfig: {
            responseModalities: ["IMAGE"],
            imageConfig: { aspectRatio: "1:1", imageSize: "1K" },
          },
        }
      );

    const imagePart = result.candidates?.[0]?.content?.parts?.find(
      (part) =>
        part.inlineData?.mimeType?.startsWith("image/") &&
        typeof part.inlineData.data === "string" &&
        part.inlineData.data.length > 100
    );
    expect(imagePart?.inlineData?.mimeType).toMatch(/^image\//);
    expect(result.usageMetadata?.candidatesTokenCount).toBeGreaterThan(0);
    expect(result.usageMetadata?.totalTokenCount).toBeGreaterThan(0);
  }, 120000);
});
