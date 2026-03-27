import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { setupPolly, teardownPolly, type PollyContext } from "../harness";
import { openai } from "@nakedapi/openai";

describe("openai images integration", () => {
  let ctx: PollyContext;

  beforeEach(() => {
    ctx = setupPolly("openai/images-generations");
  });

  afterEach(async () => {
    await teardownPolly(ctx);
  });

  it("should generate an image", async () => {
    const provider = openai({
      apiKey: process.env.OPENAI_API_KEY ?? "sk-test-key",
    });
    const result = await provider.v1.images.generations({
      prompt: "A white siamese cat",
      model: "dall-e-2",
      n: 1,
      size: "256x256",
    });
    expect(result.created).toBeGreaterThan(0);
    expect(result.data).toHaveLength(1);
    expect(result.data[0].url ?? result.data[0].b64_json).toBeTruthy();
  });
});
