import { describe, it, expect, beforeEach, afterEach } from "vitest";
import {
  setupPollyIgnoringBody,
  teardownPolly,
  type PollyContext,
} from "../harness";
import { openai } from "@apicity/openai";

describe("openai gpt-image-2-2026-04-21 text-to-image integration", () => {
  let ctx: PollyContext;

  beforeEach(() => {
    ctx = setupPollyIgnoringBody("openai/gpt-image-2-2026-04-21-text-to-image");
  });

  afterEach(async () => {
    await teardownPolly(ctx);
  });

  it(
    "should generate an image from the cat2 reference prompt",
    { timeout: 120_000 },
    async () => {
      const provider = openai({
        apiKey: process.env.OPENAI_API_KEY ?? "sk-test-key",
        timeout: 120_000,
      });

      const result = await provider.post.v1.images.generations({
        // Mirrors tests/fixtures/cat2.jpg, which matches the uploaded reference image.
        prompt:
          "A photorealistic side-profile portrait of a fluffy white cat with one blue eye and one amber eye, sitting on grass with a soft green garden background in natural daylight.",
        model: "gpt-image-2-2026-04-21",
        n: 1,
        size: "1024x1024",
      });

      expect(result.created).toBeGreaterThan(0);
      expect(result.data).toHaveLength(1);
      expect(result.data[0].b64_json).toBeTruthy();
    }
  );
});
