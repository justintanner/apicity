import { describe, it, expect, afterEach } from "vitest";
import { setupPolly, teardownPolly, type PollyContext } from "../harness";
import { xai } from "@apicity/xai";

describe("xAI text-to-speech integration", () => {
  let ctx: PollyContext;

  afterEach(async () => {
    await teardownPolly(ctx);
  });

  it("should synthesize speech audio from text", async () => {
    ctx = setupPolly("xai/tts-welcome");

    const provider = xai({
      apiKey: process.env.XAI_API_KEY ?? "xai-test-key",
    });

    const result = await provider.post.v1.tts({
      text: "Welcome to xAI. How can I help you today?",
      voice_id: "eve",
      language: "en",
    });

    expect(result).toBeInstanceOf(ArrayBuffer);
    expect(result.byteLength).toBeGreaterThan(0);
  });

  it("should validate tts payload", () => {
    const provider = xai({ apiKey: "xai-test-key" });

    const valid = provider.post.v1.tts.schema.safeParse({
      text: "Hello",
      voice_id: "eve",
    });
    expect(valid.success).toBe(true);

    const missing = provider.post.v1.tts.schema.safeParse({
      voice_id: "eve",
    });
    expect(missing.success).toBe(false);

    const empty = provider.post.v1.tts.schema.safeParse({
      text: "",
      voice_id: "eve",
    });
    expect(empty.success).toBe(false);
  });

  it("should expose tts schema", () => {
    const provider = xai({ apiKey: "xai-test-key" });
    expect(provider.post.v1.tts.schema).toBeDefined();
    expect(typeof provider.post.v1.tts.schema.safeParse).toBe("function");
  });
});
