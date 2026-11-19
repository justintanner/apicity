import { readFileSync } from "node:fs";
import { afterEach, describe, expect, it } from "vitest";
import { createNunchux, NunchuxError } from "@apicity/nunchux";
import { setupPolly, teardownPolly, type PollyContext } from "../harness";

const cat = readFileSync(new URL("../fixtures/cat1.jpg", import.meta.url));
const catImage = {
  image_url: `data:image/jpeg;base64,${cat.toString("base64")}`,
};

describe("nunchux v2.openai.images.edits", () => {
  let ctx: PollyContext;

  afterEach(async () => {
    await teardownPolly(ctx);
  });

  it("rejects a model id outside the GPT Image 2.6 pair before any charge", async () => {
    ctx = setupPolly("nunchux/gpt-image-2-6-edit-unknown-model");
    const client = createNunchux({
      apiKey: process.env.NUNCHUX_API_KEY ?? "nunchux-test-key",
      timeout: 30_000,
    });
    const before = await client.v1.credits();
    const error = await client.v2.openai.images
      .edits({
        model: "gpt-image-9",
        prompt: "add a small red bow tie",
        images: [catImage],
        size: "1024x1024",
        quality: "low",
      })
      .catch((caught: unknown) => caught);
    const after = await client.v1.credits();
    expect(error).toBeInstanceOf(NunchuxError);
    expect(error).toMatchObject({ status: 400, code: "unknown_model" });
    expect(after.credits_remaining).toBe(before.credits_remaining);
  });

  it("edits the owned cat photo on Flare at low quality", async () => {
    ctx = setupPolly("nunchux/gpt-image-2-6-flare-image-edit");
    const client = createNunchux({
      apiKey: process.env.NUNCHUX_API_KEY ?? "nunchux-test-key",
      timeout: 120_000,
    });
    const before = await client.v1.credits();
    const response = await client.v2.openai.images.edits({
      model: "gpt-image-2.6-flare",
      prompt: "add a small red bow tie",
      images: [catImage],
      size: "1024x1024",
      quality: "low",
    });
    const after = await client.v1.credits();
    expect(response.data).toHaveLength(1);
    expect(response.data[0]?.b64_json.length).toBeGreaterThan(100);
    expect(response.size).toBe("1024x1024");
    expect(response.quality).toBe("low");
    expect(response.usage?.output_tokens).toBeGreaterThan(0);
    expect(response.usage?.input_tokens_details?.image_tokens).toBeGreaterThan(
      0
    );
    expect(after.credits_remaining).toBeLessThan(before.credits_remaining);
  }, 180_000);
});
