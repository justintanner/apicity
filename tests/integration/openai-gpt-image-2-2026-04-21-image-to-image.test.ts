import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import {
  setupPollyForFileUploads,
  teardownPolly,
  type PollyContext,
} from "../harness";
import { openai } from "@apicity/openai";

describe("openai gpt-image-2-2026-04-21 image-to-image integration", () => {
  let ctx: PollyContext;

  beforeEach(() => {
    ctx = setupPollyForFileUploads(
      "openai/gpt-image-2-2026-04-21-image-to-image"
    );
  });

  afterEach(async () => {
    await teardownPolly(ctx);
  });

  it("should edit the cat2 reference image", { timeout: 120_000 }, async () => {
    const provider = openai({
      apiKey: process.env.OPENAI_API_KEY ?? "sk-test-key",
      timeout: 120_000,
    });

    const imageBuffer = readFileSync(
      resolve(__dirname, "../fixtures/cat2.jpg")
    );
    const image = new Blob([imageBuffer], { type: "image/jpeg" });

    const result = await provider.post.v1.images.edits({
      image,
      prompt:
        "Keep the same white cat and outdoor garden setting, but add a small red bow tie around the cat's neck.",
      model: "gpt-image-2-2026-04-21",
      size: "1024x1024",
      n: 1,
    });

    expect(result.created).toBeGreaterThan(0);
    expect(result.data).toHaveLength(1);
    expect(result.data?.[0]?.b64_json).toBeTruthy();
  });
});
