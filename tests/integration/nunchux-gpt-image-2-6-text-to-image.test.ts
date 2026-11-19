import { afterEach, describe, expect, it } from "vitest";
import { createNunchux, NunchuxError } from "@apicity/nunchux";
import { setupPolly, teardownPolly, type PollyContext } from "../harness";

describe("nunchux v2.openai.images.generations", () => {
  let ctx: PollyContext;

  afterEach(async () => {
    await teardownPolly(ctx);
  });

  it("rejects a model id outside the GPT Image 2.6 pair before any charge", async () => {
    ctx = setupPolly("nunchux/gpt-image-2-6-unknown-model");
    const client = createNunchux({
      apiKey: process.env.NUNCHUX_API_KEY ?? "nunchux-test-key",
      timeout: 30_000,
    });
    const before = await client.v1.credits();
    const error = await client.v2.openai.images
      .generations({
        model: "gpt-image-9",
        prompt: "a red paper lantern",
        size: "1024x1024",
        quality: "low",
      })
      .catch((caught: unknown) => caught);
    const after = await client.v1.credits();
    expect(error).toBeInstanceOf(NunchuxError);
    expect(error).toMatchObject({ status: 400, code: "unknown_model" });
    expect(after.credits_remaining).toBe(before.credits_remaining);
  });

  it("draws one low 1024 image on Flare", async () => {
    ctx = setupPolly("nunchux/gpt-image-2-6-flare-text-to-image");
    const client = createNunchux({
      apiKey: process.env.NUNCHUX_API_KEY ?? "nunchux-test-key",
      timeout: 120_000,
    });
    const before = await client.v1.credits();
    const response = await client.v2.openai.images.generations({
      model: "gpt-image-2.6-flare",
      prompt: "a red paper lantern",
      size: "1024x1024",
      quality: "low",
    });
    const after = await client.v1.credits();
    expect(response.data).toHaveLength(1);
    expect(response.data[0]?.b64_json.length).toBeGreaterThan(100);
    expect(response.size).toBe("1024x1024");
    expect(response.quality).toBe("low");
    expect(response.usage?.output_tokens).toBeGreaterThan(0);
    expect(response.usage?.input_tokens_details?.image_tokens).toBe(0);
    expect(after.credits_remaining).toBeLessThan(before.credits_remaining);
  }, 180_000);
});
