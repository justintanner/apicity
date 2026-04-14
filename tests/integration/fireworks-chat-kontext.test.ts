import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { setupPolly, teardownPolly, type PollyContext } from "../harness";
import { fireworks } from "@apicity/fireworks";

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

      const createResult = await provider.inference.v1.workflows.kontext(
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

      const pollResult = await provider.inference.v1.workflows.getResult(
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
      const result = await provider.inference.v1.workflows.kontext(
        "flux-kontext-pro",
        {
          prompt: "A serene landscape",
          stream: true,
          seed: 42,
          output_format: "png",
        }
      );

      expect(result).toBeDefined();
      expect(result.request_id).toBeTruthy();
    });
  });

  describe("payload validation", () => {
    it("should validate kontext payload with required fields", () => {
      const provider = fireworks({ apiKey: "test" });
      const valid = provider.inference.v1.workflows.kontext.schema.safeParse({
        prompt: "A beautiful landscape",
      });
      expect(valid.success).toBe(true);
      // errors checked via success;
    });

    it("should reject kontext payload missing prompt", () => {
      const provider = fireworks({ apiKey: "test" });
      const invalid = provider.inference.v1.workflows.kontext.schema.safeParse(
        {}
      );
      expect(invalid.success).toBe(false);
      expect(invalid.success).toBe(false);
    });

    it("should validate kontext payload with all options", () => {
      const provider = fireworks({ apiKey: "test" });
      const valid = provider.inference.v1.workflows.kontext.schema.safeParse({
        prompt: "A beautiful landscape",
        seed: 42,
        output_format: "png",
        width: 1024,
        height: 768,
        stream: false,
      });
      expect(valid.success).toBe(true);
    });

    it("should expose kontext payload schema", () => {
      const provider = fireworks({ apiKey: "test" });
      const schema = provider.inference.v1.workflows.kontext.schema;
      expect(typeof schema.safeParse).toBe("function");
      expect(typeof schema.safeParse).toBe("function");
      expect(typeof schema.safeParse).toBe("function");
    });

    it("should validate getResult payload", () => {
      const provider = fireworks({ apiKey: "test" });
      const valid = provider.inference.v1.workflows.getResult.schema.safeParse({
        id: "abc-123",
      });
      expect(valid.success).toBe(true);

      const invalid =
        provider.inference.v1.workflows.getResult.schema.safeParse({});
      expect(invalid.success).toBe(false);
      expect(invalid.success).toBe(false);
    });
  });

  describe("namespace structure", () => {
    it("should expose workflows namespace with kontext and getResult", () => {
      const provider = fireworks({ apiKey: "test" });
      expect(typeof provider.inference.v1.workflows.kontext).toBe("function");
      expect(typeof provider.inference.v1.workflows.getResult).toBe("function");
      expect(typeof provider.inference.v1.workflows.textToImage).toBe(
        "function"
      );
    });

    it("should expose payload schemas on workflow methods", () => {
      const provider = fireworks({ apiKey: "test" });
      expect(provider.inference.v1.workflows.kontext.schema).toBeDefined();
      expect(provider.inference.v1.workflows.getResult.schema).toBeDefined();
      expect(provider.inference.v1.workflows.textToImage.schema).toBeDefined();
    });
  });
});
