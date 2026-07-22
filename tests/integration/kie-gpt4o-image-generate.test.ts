import { describe, it, expect, afterEach } from "vitest";
import { setupPolly, teardownPolly, type PollyContext } from "../harness";
import { createKie, type Gpt4oImageGenerateRequest } from "@apicity/kie";
import { mintKieGpt4oImageOtp, TEST_PAYGATE_SECRET } from "../harness";

describe("kie gpt4o-image generate integration", () => {
  let ctx: PollyContext;

  afterEach(async () => {
    await teardownPolly(ctx);
  });

  it(
    "should create a 4o Image generation task",
    { timeout: 600_000 },
    async () => {
      ctx = setupPolly("kie/gpt4o-image-generate");

      const provider = createKie({
        paygate: { secret: TEST_PAYGATE_SECRET },
        apiKey: process.env.KIE_API_KEY ?? "test-key",
      });

      const request = {
        prompt:
          "A cinematic night city poster with neon reflections on a rainy street.",
        size: "3:2",
        isEnhance: true,
      } satisfies Gpt4oImageGenerateRequest;

      const task = await provider.post.api.v1.gpt4oImage.generate(
        request,
        mintKieGpt4oImageOtp(request)
      );

      expect(task.code).toBe(200);
      expect(task.data?.taskId).toBeTruthy();
      expect(typeof task.data?.taskId).toBe("string");
    }
  );

  it("should validate payload via schema", () => {
    const provider = createKie({
      paygate: { secret: TEST_PAYGATE_SECRET },
      apiKey: "test-key",
    });

    const generate = provider.post.api.v1.gpt4oImage.generate;

    // Text-to-image with a prompt.
    const ok = generate.schema.safeParse({
      prompt: "A serene mountain lake at sunrise.",
      size: "1:1",
      enableFallback: true,
      fallbackModel: "GPT_IMAGE_1",
    });
    expect(ok.success).toBe(true);

    // Image-editing mode using reference files only (no prompt).
    const edit = generate.schema.safeParse({
      filesUrl: ["https://example.com/lake.jpg"],
      maskUrl: "https://example.com/mask.png",
      size: "2:3",
    });
    expect(edit.success).toBe(true);

    // Missing the required size.
    const noSize = generate.schema.safeParse({
      prompt: "hello world",
    });
    expect(noSize.success).toBe(false);

    // Neither prompt nor filesUrl provided.
    const noInput = generate.schema.safeParse({
      size: "1:1",
    });
    expect(noInput.success).toBe(false);

    // Out-of-range size.
    const badSize = generate.schema.safeParse({
      prompt: "hello world",
      size: "16:9",
    });
    expect(badSize.success).toBe(false);

    // Too many reference files (max 5).
    const tooManyFiles = generate.schema.safeParse({
      size: "1:1",
      filesUrl: [
        "https://example.com/1.jpg",
        "https://example.com/2.jpg",
        "https://example.com/3.jpg",
        "https://example.com/4.jpg",
        "https://example.com/5.jpg",
        "https://example.com/6.jpg",
      ],
    });
    expect(tooManyFiles.success).toBe(false);

    // Unknown fallback model.
    const badFallback = generate.schema.safeParse({
      prompt: "hello world",
      size: "1:1",
      fallbackModel: "DALLE_3",
    });
    expect(badFallback.success).toBe(false);
  });
});
