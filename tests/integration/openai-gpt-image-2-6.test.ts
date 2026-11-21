import { afterEach, describe, expect, it } from "vitest";
import { createOpenAi, OpenAiError } from "@apicity/openai";
import {
  setupPollyIgnoringBody,
  teardownPolly,
  type PollyContext,
} from "../harness";

describe("openai gpt-image-2.6 integration", () => {
  let ctx: PollyContext | undefined;

  afterEach(async () => {
    if (ctx) {
      await teardownPolly(ctx);
      ctx = undefined;
    }
  });

  it("rejects an unknown model id on GET /v1/models/{id}", async () => {
    ctx = setupPollyIgnoringBody("openai/gpt-image-2-6-not-found");
    const provider = createOpenAi({
      apiKey: process.env.OPENAI_API_KEY ?? "sk-test-key",
    });

    await expect(
      provider.get.v1.models("gpt-image-2.6-nonexistent")
    ).rejects.toSatisfy(
      (err: unknown) => err instanceof OpenAiError && err.status === 404
    );
  });

  it(
    "generates a minimal low 1024x1024 image with gpt-image-2.6-flare",
    { timeout: 120_000 },
    async () => {
      ctx = setupPollyIgnoringBody("openai/gpt-image-2-6");
      const provider = createOpenAi({
        apiKey: process.env.OPENAI_API_KEY ?? "sk-test-key",
        timeout: 120_000,
      });

      const result = await provider.post.v1.images.generations({
        model: "gpt-image-2.6-flare",
        prompt: "A minimal white studio cube on white paper.",
        quality: "low",
        complexity: "low",
        size: "1024x1024",
        n: 1,
      });

      expect(result.created).toBeGreaterThan(0);
      expect(result.data).toHaveLength(1);
      expect(result.data[0]?.b64_json).toBeTruthy();
      expect(result.output_format).toBe("png");
      expect(result.usage?.output_tokens).toBe(824);
    }
  );
});
