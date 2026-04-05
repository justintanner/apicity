import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { setupPolly, teardownPolly, type PollyContext } from "../harness";
import { fireworks } from "@nakedapi/fireworks";

describe("fireworks messages with text to image", () => {
  let ctx: PollyContext;

  // TODO: re-record missing "fireworks/messages-text-to-image" and
  // "fireworks/messages-workflow-text-to-image" HARs. Skipped because the
  // recording directories were never committed alongside the tests.
  describe.skip("messages with image generation", () => {
    beforeEach(() => {
      ctx = setupPolly("fireworks/messages-text-to-image");
    });

    afterEach(async () => {
      await teardownPolly(ctx);
    });

    it("should send message request for image generation", async () => {
      const provider = fireworks({
        apiKey: process.env.FIREWORKS_API_KEY ?? "fw-test-key",
      });

      // Use messages endpoint with image generation model
      const result = await provider.v1.messages({
        model: "accounts/fireworks/models/flux-dev",
        messages: [
          {
            role: "user",
            content: "Generate an image of a sunset over mountains",
          },
        ],
        max_tokens: 1024,
        temperature: 0.7,
      });

      expect(result).toBeDefined();
      expect(result.id).toBeTruthy();
      expect(result.model).toBeTruthy();
      expect(result.content).toBeDefined();
    });

    it("should support streaming messages for image generation", async () => {
      const provider = fireworks({
        apiKey: process.env.FIREWORKS_API_KEY ?? "fw-test-key",
      });

      const chunks = [];
      for await (const chunk of provider.post.stream.v1.messages({
        model: "accounts/fireworks/models/flux-dev",
        messages: [
          {
            role: "user",
            content: "Generate an image of a futuristic city",
          },
        ],
        max_tokens: 1024,
        stream: true,
      })) {
        chunks.push(chunk);
      }

      expect(chunks.length).toBeGreaterThan(0);
    });
  });

  describe.skip("messages with textToImage workflow", () => {
    beforeEach(() => {
      ctx = setupPolly("fireworks/messages-workflow-text-to-image");
    });

    afterEach(async () => {
      await teardownPolly(ctx);
    });

    it("should combine messages with textToImage parameters", async () => {
      const provider = fireworks({
        apiKey: process.env.FIREWORKS_API_KEY ?? "fw-test-key",
      });

      // Send message request with image generation parameters
      const result = await provider.v1.messages({
        model: "accounts/fireworks/models/flux-dev",
        messages: [
          {
            role: "user",
            content: "Create a beautiful mountain landscape",
          },
        ],
        max_tokens: 1024,
      });

      expect(result).toBeDefined();
      expect(result.stop_reason).toBeDefined();
    });
  });

  describe("payload validation", () => {
    it("should validate messages payload with required fields", () => {
      const provider = fireworks({ apiKey: "test" });
      const valid = provider.v1.messages.validatePayload({
        model: "accounts/fireworks/models/flux-dev",
        messages: [
          {
            role: "user",
            content: "Generate an image of a cat",
          },
        ],
        max_tokens: 1024,
      });
      expect(valid.valid).toBe(true);
      expect(valid.errors).toHaveLength(0);
    });

    it("should reject messages payload missing required fields", () => {
      const provider = fireworks({ apiKey: "test" });
      const invalid = provider.v1.messages.validatePayload({
        messages: [{ role: "user", content: "Hello" }],
      });
      expect(invalid.valid).toBe(false);
      expect(invalid.errors).toContain("model is required");
    });

    it("should validate messages with system prompt", () => {
      const provider = fireworks({ apiKey: "test" });
      const valid = provider.v1.messages.validatePayload({
        model: "accounts/fireworks/models/flux-dev",
        system: "You are an image generation assistant.",
        messages: [
          {
            role: "user",
            content: "Generate an image of a forest",
          },
        ],
        max_tokens: 1024,
        temperature: 0.8,
      });
      expect(valid.valid).toBe(true);
    });

    it("should expose messages payload schema", () => {
      const provider = fireworks({ apiKey: "test" });
      const schema = provider.v1.messages.payloadSchema;
      expect(schema.method).toBe("POST");
      expect(schema.path).toBe("/v1/messages");
      expect(schema.fields.model.required).toBe(true);
      expect(schema.fields.messages.required).toBe(true);
    });
  });

  describe("namespace structure", () => {
    it("should expose messages method on v1 namespace", () => {
      const provider = fireworks({ apiKey: "test" });
      expect(typeof provider.v1.messages).toBe("function");
    });

    it("should expose streaming messages on post.stream.v1 namespace", () => {
      const provider = fireworks({ apiKey: "test" });
      expect(typeof provider.post.stream.v1.messages).toBe("function");
    });

    it("should expose payload schemas on messages methods", () => {
      const provider = fireworks({ apiKey: "test" });
      expect(provider.v1.messages.payloadSchema).toBeDefined();
      expect(provider.post.stream.v1.messages.payloadSchema).toBeDefined();
    });

    it("should expose validatePayload on messages methods", () => {
      const provider = fireworks({ apiKey: "test" });
      expect(typeof provider.v1.messages.validatePayload).toBe("function");
      expect(typeof provider.post.stream.v1.messages.validatePayload).toBe(
        "function"
      );
    });
  });
});
