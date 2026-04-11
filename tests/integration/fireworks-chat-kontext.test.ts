import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { setupPolly, teardownPolly, type PollyContext } from "../harness";
import { fireworks } from "@nakedapi/fireworks";

describe("fireworks kontext endpoint integration", () => {
  let ctx: PollyContext;

  describe("kontext async job creation", () => {
    beforeEach(() => {
      ctx = setupPolly("fireworks/kontext-async-job");
    });

    afterEach(async () => {
      await teardownPolly(ctx);
    });

    it("should submit a kontext job and poll its result", async () => {
      const provider = fireworks({
        apiKey: process.env.FIREWORKS_API_KEY ?? "fw-test-key",
      });

      const createResult = await provider.v1.workflows.kontext(
        "flux-kontext-pro",
        {
          prompt: "A cat sitting on a windowsill",
          seed: 123,
          output_format: "png",
        }
      );

      expect(createResult).toBeDefined();
      expect(createResult.request_id).toBeTruthy();
      expect(typeof createResult.request_id).toBe("string");

      const pollResult = await provider.v1.workflows.getResult(
        "flux-kontext-pro",
        { id: createResult.request_id }
      );

      expect(pollResult).toBeDefined();
      expect(pollResult.id).toBe(createResult.request_id);
      expect(typeof pollResult.status).toBe("string");
      expect(pollResult.status.length).toBeGreaterThan(0);
    });
  });

  describe("kontext with streaming", () => {
    beforeEach(() => {
      ctx = setupPolly("fireworks/kontext-streaming");
    });

    afterEach(async () => {
      await teardownPolly(ctx);
    });

    it("should support streaming kontext response", async () => {
      const provider = fireworks({
        apiKey: process.env.FIREWORKS_API_KEY ?? "fw-test-key",
      });

      // Submit kontext job that supports streaming
      const result = await provider.v1.workflows.kontext("flux-kontext-pro", {
        prompt: "A serene landscape",
        stream: true,
        seed: 42,
        output_format: "png",
      });

      expect(result).toBeDefined();
      expect(result.request_id).toBeTruthy();
    });
  });

  describe("payload validation", () => {
    it("should validate kontext payload with required fields", () => {
      const provider = fireworks({ apiKey: "test" });
      const valid = provider.v1.workflows.kontext.validatePayload({
        prompt: "A beautiful landscape",
      });
      expect(valid.valid).toBe(true);
      expect(valid.errors).toHaveLength(0);
    });

    it("should reject kontext payload missing prompt", () => {
      const provider = fireworks({ apiKey: "test" });
      const invalid = provider.v1.workflows.kontext.validatePayload({});
      expect(invalid.valid).toBe(false);
      expect(invalid.errors).toContain("prompt is required");
    });

    it("should validate kontext payload with all options", () => {
      const provider = fireworks({ apiKey: "test" });
      const valid = provider.v1.workflows.kontext.validatePayload({
        prompt: "A beautiful landscape",
        seed: 42,
        output_format: "png",
        width: 1024,
        height: 768,
        stream: false,
      });
      expect(valid.valid).toBe(true);
    });

    it("should expose kontext payload schema", () => {
      const provider = fireworks({ apiKey: "test" });
      const schema = provider.v1.workflows.kontext.payloadSchema;
      expect(schema.method).toBe("POST");
      expect(schema.path).toBe("/workflows/accounts/fireworks/models/{model}");
      expect(schema.fields.prompt.required).toBe(true);
    });

    it("should validate getResult payload", () => {
      const provider = fireworks({ apiKey: "test" });
      const valid = provider.v1.workflows.getResult.validatePayload({
        id: "abc-123",
      });
      expect(valid.valid).toBe(true);

      const invalid = provider.v1.workflows.getResult.validatePayload({});
      expect(invalid.valid).toBe(false);
      expect(invalid.errors).toContain("id is required");
    });
  });

  describe("namespace structure", () => {
    it("should expose workflows namespace with kontext and getResult", () => {
      const provider = fireworks({ apiKey: "test" });
      expect(typeof provider.v1.workflows.kontext).toBe("function");
      expect(typeof provider.v1.workflows.getResult).toBe("function");
      expect(typeof provider.v1.workflows.textToImage).toBe("function");
    });

    it("should expose payload schemas on workflow methods", () => {
      const provider = fireworks({ apiKey: "test" });
      expect(provider.v1.workflows.kontext.payloadSchema).toBeDefined();
      expect(provider.v1.workflows.getResult.payloadSchema).toBeDefined();
      expect(provider.v1.workflows.textToImage.payloadSchema).toBeDefined();
    });
  });
});
