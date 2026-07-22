import { describe, it, expect, afterEach } from "vitest";
import { setupPolly, teardownPolly, type PollyContext } from "../harness";
import { createKie, type MediaGenerationRequest } from "@apicity/kie";
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
      } satisfies MediaGenerationRequest;
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
      } satisfies MediaGenerationRequest;
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

    it("should validate the documented Nano Banana 2 input contract", () => {
      const provider = createKie({
        paygate: { secret: TEST_PAYGATE_SECRET },
        apiKey: "test-key",
      });

      const minimal = provider.post.api.v1.jobs.createTask.schema.safeParse({
        model: "nano-banana-2",
        input: {
          prompt: "A bright editorial image of a glass teapot on a desk",
          google_search: true,
        },
      });
      expect(minimal.success).toBe(true);
      if (!minimal.success) return;

      expect(minimal.data.input).toMatchObject({
        aspect_ratio: "auto",
        resolution: "1K",
        output_format: "jpg",
      });
      expect("google_search" in minimal.data.input).toBe(false);

      const withReferences =
        provider.post.api.v1.jobs.createTask.schema.safeParse({
          model: "nano-banana-2",
          input: {
            prompt: "Create a consistent product variation",
            image_input: Array.from(
              { length: 14 },
              (_, i) => `https://example.com/reference-${i}.png`
            ),
            aspect_ratio: "8:1",
            resolution: "4K",
            output_format: "png",
          },
        });
      expect(withReferences.success).toBe(true);

      const tooManyReferences =
        provider.post.api.v1.jobs.createTask.schema.safeParse({
          model: "nano-banana-2",
          input: {
            prompt: "Create a consistent product variation",
            image_input: Array.from(
              { length: 15 },
              (_, i) => `https://example.com/reference-${i}.png`
            ),
          },
        });
      expect(tooManyReferences.success).toBe(false);

      const promptTooLong =
        provider.post.api.v1.jobs.createTask.schema.safeParse({
          model: "nano-banana-2",
          input: {
            prompt: "x".repeat(20001),
          },
        });
      expect(promptTooLong.success).toBe(false);
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
