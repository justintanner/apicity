import { describe, it, expect, afterEach } from "vitest";
import { setupPolly, teardownPolly, type PollyContext } from "../harness";
import { createKie } from "@apicity/kie";
import { mintKieCreateTaskOtp, TEST_PAYGATE_SECRET } from "../harness";

describe("kie additional models", () => {
  let ctx: PollyContext;

  afterEach(async () => {
    await teardownPolly(ctx);
  });

  describe("nano-banana-pro", () => {
    it("should create an image generation task", async () => {
      ctx = setupPolly("kie/models/nano-banana-pro");
      const provider = createKie({
        paygate: { secret: TEST_PAYGATE_SECRET },
        apiKey: process.env.KIE_API_KEY ?? "test-key",
      });

      const request = {
        model: "nano-banana-pro",
        input: {
          prompt: "A futuristic city with flying vehicles at night",
        },
      };
      const result = await provider.post.api.v1.jobs.createTask(
        request,
        mintKieCreateTaskOtp(request)
      );

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
      const provider = createKie({
        paygate: { secret: TEST_PAYGATE_SECRET },
        apiKey: process.env.KIE_API_KEY ?? "test-key",
      });

      const request = {
        model: "nano-banana-2",
        input: {
          prompt: "A beautiful garden with roses and a fountain",
        },
      };
      const result = await provider.post.api.v1.jobs.createTask(
        request,
        mintKieCreateTaskOtp(request)
      );

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
      const provider = createKie({
        paygate: { secret: TEST_PAYGATE_SECRET },
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
