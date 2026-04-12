import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { setupPolly, teardownPolly, type PollyContext } from "../harness";
import {
  fireworks,
  type FireworksChatStreamChunk,
  type FireworksCompletionStreamChunk,
} from "@apicity/fireworks";

describe("fireworks streaming integration", () => {
  let ctx: PollyContext;

  describe("chat completions streaming", () => {
    beforeEach(() => {
      ctx = setupPolly("fireworks/chat-stream-hello");
    });

    afterEach(async () => {
      await teardownPolly(ctx);
    });

    it("should stream chat completion chunks", async () => {
      const provider = fireworks({
        apiKey: process.env.FIREWORKS_API_KEY ?? "fw-test-key",
      });
      const chunks: FireworksChatStreamChunk[] = [];
      for await (const chunk of provider.post.stream.v1.chat.completions({
        model: "accounts/fireworks/models/llama-v3p3-70b-instruct",
        messages: [{ role: "user", content: "Say hello in one sentence." }],
        temperature: 0,
        max_tokens: 64,
      })) {
        chunks.push(chunk);
      }
      expect(chunks.length).toBeGreaterThan(0);
      expect(chunks[0].object).toBe("chat.completion.chunk");
      expect(chunks[0].model).toBeTruthy();

      const lastChunk = chunks[chunks.length - 1];
      expect(lastChunk.choices[0].finish_reason).toBeTruthy();
    });
  });

  describe("completions streaming", () => {
    beforeEach(() => {
      ctx = setupPolly("fireworks/completions-stream-hello");
    });

    afterEach(async () => {
      await teardownPolly(ctx);
    });

    it("should stream completion chunks", async () => {
      const provider = fireworks({
        apiKey: process.env.FIREWORKS_API_KEY ?? "fw-test-key",
      });
      const chunks: FireworksCompletionStreamChunk[] = [];
      for await (const chunk of provider.post.stream.v1.completions({
        model: "accounts/fireworks/models/llama-v3p3-70b-instruct",
        prompt: "Once upon a time",
        temperature: 0,
        max_tokens: 32,
      })) {
        chunks.push(chunk);
      }
      expect(chunks.length).toBeGreaterThan(0);
      expect(chunks[0].model).toBeTruthy();

      const lastChunk = chunks[chunks.length - 1];
      expect(lastChunk.choices[0].finish_reason).toBeTruthy();
    });
  });

  describe("schema validation", () => {
    it("should expose payloadSchema on stream methods", () => {
      const provider = fireworks({
        apiKey: "test-key",
      });
      expect(
        typeof provider.post.stream.v1.chat.completions.schema.safeParse
      ).toBe("function");
      expect(typeof provider.post.stream.v1.completions.schema.safeParse).toBe(
        "function"
      );
    });

    it("should validate payloads on stream methods", () => {
      const provider = fireworks({
        apiKey: "test-key",
      });
      const valid = provider.post.stream.v1.chat.completions.schema.safeParse({
        model: "test-model",
        messages: [{ role: "user", content: "Hello" }],
      });
      expect(valid.success).toBe(true);

      const invalid = provider.post.stream.v1.chat.completions.schema.safeParse(
        {
          messages: [{ role: "user", content: "Hello" }],
        }
      );
      expect(invalid.success).toBe(false);
    });
  });
});
