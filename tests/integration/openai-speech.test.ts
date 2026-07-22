import { describe, it, expect, afterEach } from "vitest";
import { setupPolly, teardownPolly, type PollyContext } from "../harness";
import { createOpenAi } from "@apicity/openai";
import { OpenAiSpeechRequestSchema } from "@apicity/openai/zod";

describe("openai speech", () => {
  let ctx: PollyContext;

  afterEach(async () => {
    await teardownPolly(ctx);
  });

  it("should generate speech audio from text", async () => {
    ctx = setupPolly("openai/speech-hello");

    const provider = createOpenAi({
      apiKey: process.env.OPENAI_API_KEY ?? "sk-test-key",
    });

    const result = await provider.post.v1.audio.speech({
      model: "tts-1",
      input: "Hello, world!",
      voice: "alloy",
      response_format: "mp3",
    });

    expect(result).toBeInstanceOf(ArrayBuffer);
    expect(result.byteLength).toBeGreaterThan(0);
  });

  it("should validate speech payload", () => {
    const provider = createOpenAi({ apiKey: "sk-test-key" });

    const valid = provider.post.v1.audio.speech.schema.safeParse({
      model: "tts-1",
      input: "Hello",
      voice: "alloy",
    });
    expect(valid.success).toBe(true);

    const missing = provider.post.v1.audio.speech.schema.safeParse({
      model: "tts-1",
    });
    expect(missing.success).toBe(false);
    expect(missing.error?.issues.length).toBeGreaterThanOrEqual(2);
  });

  it("should expose speech schema", () => {
    const provider = createOpenAi({ apiKey: "sk-test-key" });
    // Bind the identity, not just presence: the MCP server derives this
    // endpoint's tool input JSON Schema from `.schema`, so attaching a
    // sibling's schema here would ship a wrong tool contract silently.
    expect(provider.post.v1.audio.speech.schema).toBe(
      OpenAiSpeechRequestSchema
    );
    expect(typeof provider.post.v1.audio.speech.schema.safeParse).toBe(
      "function"
    );
  });
});
