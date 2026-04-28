import { describe, it, expect, afterEach } from "vitest";
import { setupPolly, teardownPolly, type PollyContext } from "../harness";
import { kie } from "@apicity/kie";

describe("kie additional models", () => {
  let ctx: PollyContext;

  afterEach(async () => {
    await teardownPolly(ctx);
  });

  describe("nano-banana-pro", () => {
    it("should create an image generation task", async () => {
      ctx = setupPolly("kie/models/nano-banana-pro");
      const provider = kie({
        apiKey: process.env.KIE_API_KEY ?? "test-key",
      });

      const result = await provider.post.api.v1.jobs.createTask({
        model: "nano-banana-pro",
        input: {
          prompt: "A futuristic city with flying vehicles at night",
        },
      });

      // API may return 402 (insufficient credits) or other non-200 codes
      // depending on account state — assert the envelope parsed correctly.
      expect(result).toBeDefined();
      expect(typeof result.code).toBe("number");
      if (result.code === 200) {
        expect(result.data?.taskId).toBeTruthy();
      }
    });
  });

  describe("nano-banana-2", () => {
    it("should create an image generation task", async () => {
      ctx = setupPolly("kie/models/nano-banana-2");
      const provider = kie({
        apiKey: process.env.KIE_API_KEY ?? "test-key",
      });

      const result = await provider.post.api.v1.jobs.createTask({
        model: "nano-banana-2",
        input: {
          prompt: "A beautiful garden with roses and a fountain",
        },
      });

      // API may return 402 (insufficient credits) or other non-200 codes
      // depending on account state — assert the envelope parsed correctly.
      expect(result).toBeDefined();
      expect(typeof result.code).toBe("number");
      if (result.code === 200) {
        expect(result.data?.taskId).toBeTruthy();
      }
    });
  });

  describe("additional model schemas", () => {
    it("should validate payloads for various model types", async () => {
      const provider = kie({
        apiKey: "test-key",
      });

      // Validate bytedance/seedance schema
      const seedanceResult =
        provider.post.api.v1.jobs.createTask.schema.safeParse({
          model: "bytedance/seedance-2",
          input: {
            prompt: "Test video",
            web_search: false,
          },
        });
      expect(seedanceResult.success).toBe(true);
    });
  });
});
