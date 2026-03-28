import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { setupPolly, teardownPolly, type PollyContext } from "../harness";
import { fireworks } from "@nakedapi/fireworks";

describe("fireworks messages integration", () => {
  let ctx: PollyContext;

  describe("non-streaming", () => {
    beforeEach(() => {
      ctx = setupPolly("fireworks/messages-hello");
    });

    afterEach(async () => {
      await teardownPolly(ctx);
    });

    it("should send a messages request", async () => {
      const provider = fireworks({
        apiKey: process.env.FIREWORKS_API_KEY ?? "fw-test-key",
      });
      const result = await provider.v1.messages({
        model: "accounts/fireworks/models/llama-v3p3-70b-instruct",
        messages: [{ role: "user", content: "Say hello in one sentence." }],
        max_tokens: 64,
      });
      expect(result.type).toBe("message");
      expect(result.role).toBe("assistant");
      expect(result.content.length).toBeGreaterThan(0);
      expect(result.content[0].type).toBe("text");
      expect(result.stop_reason).toBeTruthy();
    });
  });

  describe("streaming", () => {
    beforeEach(() => {
      ctx = setupPolly("fireworks/messages-stream-hello");
    });

    afterEach(async () => {
      await teardownPolly(ctx);
    });

    it("should stream a messages response", async () => {
      const provider = fireworks({
        apiKey: process.env.FIREWORKS_API_KEY ?? "fw-test-key",
      });
      const events: unknown[] = [];
      for await (const event of provider.v1.messages.stream({
        model: "accounts/fireworks/models/llama-v3p3-70b-instruct",
        messages: [{ role: "user", content: "Say hello in one sentence." }],
        max_tokens: 64,
        stream: true,
      })) {
        events.push(event);
      }
      expect(events.length).toBeGreaterThan(0);
      const types = events.map((e) => (e as { type: string }).type);
      expect(types).toContain("message_start");
    });
  });

  describe("schema validation", () => {
    it("should validate a valid payload", () => {
      const provider = fireworks({
        apiKey: "test-key",
      });
      const result = provider.v1.messages.validatePayload({
        model: "accounts/fireworks/models/llama-v3p3-70b-instruct",
        messages: [{ role: "user", content: "Hello" }],
      });
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it("should reject a payload missing model", () => {
      const provider = fireworks({
        apiKey: "test-key",
      });
      const result = provider.v1.messages.validatePayload({
        messages: [{ role: "user", content: "Hello" }],
      });
      expect(result.valid).toBe(false);
      expect(result.errors).toContain("model is required");
    });

    it("should expose payloadSchema", () => {
      const provider = fireworks({
        apiKey: "test-key",
      });
      expect(provider.v1.messages.payloadSchema.path).toBe("/v1/messages");
      expect(provider.v1.messages.payloadSchema.method).toBe("POST");
    });
  });
});
