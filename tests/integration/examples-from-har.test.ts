import { describe, expect, test } from "vitest";
import { createOpenAi } from "@apicity/openai";
import { createAlibaba } from "@apicity/alibaba";
import { createXai } from "@apicity/xai";

// Replay-safe: no Polly, no network. These tests verify that the
// HAR-derived examples extracted by `pnpm run gen:examples` end up
// attached to endpoint functions at runtime and pass schema validation.
describe("HAR-derived examples on endpoints", () => {
  test("openai chat completions has the chat-hello payload attached", () => {
    const client = createOpenAi({ apiKey: "test-key" });
    const ex = client.post.v1.chat.completions.example;
    expect(ex).toBeDefined();
    expect(ex?.source).toBe("openai/chat-hello");
    expect(ex?.payload).toMatchObject({
      model: expect.any(String),
      messages: expect.any(Array),
    });
  });

  test("an example payload validates against its endpoint's schema", () => {
    const client = createOpenAi({ apiKey: "test-key" });
    const fn = client.post.v1.chat.completions;
    const example = fn.example;
    const schema = fn.schema;
    expect(example).toBeDefined();
    expect(schema).toBeDefined();
    const result = (
      schema as { safeParse: (v: unknown) => { success: boolean } }
    ).safeParse(example?.payload);
    expect(result.success).toBe(true);
  });

  test("alibaba multimodal generation preserves real upstream quirks", () => {
    // The Alibaba payload nests `input.messages` and uses the qwen-image-edit
    // shape. This sanity-checks that the extractor picks a faithful payload
    // and didn't strip out distinguishing fields.
    const client = createAlibaba({ apiKey: "test-key" });
    const ex =
      client.post.api.v1.services.aigc.multimodalGeneration.generation.example;
    expect(ex).toBeDefined();
    const payload = ex?.payload as Record<string, unknown>;
    expect(payload).toHaveProperty("model");
    expect(payload).toHaveProperty("input.messages");
  });

  test("xai chat completions gets a green-path example via the lenient matcher", () => {
    const client = createXai({ apiKey: "test-key" });
    const ex = client.post.v1.chat.completions.example;
    expect(ex).toBeDefined();
    expect(ex?.source).toBe("xai/chat-hello");
  });
});
