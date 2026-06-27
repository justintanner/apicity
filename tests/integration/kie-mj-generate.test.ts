import { describe, it, expect, afterEach } from "vitest";
import { setupPolly, teardownPolly, type PollyContext } from "../harness";
import { createKie } from "@apicity/kie";
import { mintKieMjOtp, TEST_PAYGATE_SECRET } from "../harness";

describe("kie mj generate integration", () => {
  let ctx: PollyContext;

  afterEach(async () => {
    await teardownPolly(ctx);
  });

  it(
    "should create a Midjourney image-generation task",
    { timeout: 600_000 },
    async () => {
      ctx = setupPolly("kie/mj-generate");

      const provider = createKie({
        paygate: { secret: TEST_PAYGATE_SECRET },
        apiKey: process.env.KIE_API_KEY ?? "test-key",
      });

      const request = {
        taskType: "mj_txt2img" as const,
        prompt:
          "A sci-fi themed fighter jet in a beautiful sky, computer wallpaper",
        speed: "relaxed" as const,
        aspectRatio: "16:9" as const,
        version: "7" as const,
        stylization: 100,
        weirdness: 0,
      };

      const task = await provider.post.api.v1.mj.generate(
        request,
        mintKieMjOtp(request)
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

    const generate = provider.post.api.v1.mj.generate;

    // Text-to-image with speed/version/style tuning.
    const ok = generate.schema.safeParse({
      taskType: "mj_txt2img",
      prompt: "A serene mountain lake at sunrise.",
      speed: "fast",
      aspectRatio: "1:1",
      version: "6.1",
      stylization: 250,
      weirdness: 100,
    });
    expect(ok.success).toBe(true);

    // Image-to-image mode with fileUrls.
    const img2img = generate.schema.safeParse({
      taskType: "mj_img2img",
      prompt: "Make it a watercolor painting.",
      fileUrls: ["https://example.com/lake.jpg"],
      aspectRatio: "3:4",
    });
    expect(img2img.success).toBe(true);

    // Video mode with motion + batch size.
    const video = generate.schema.safeParse({
      taskType: "mj_video",
      prompt: "Animate gentle ripples across the lake.",
      fileUrls: ["https://example.com/lake.jpg"],
      motion: "high",
      videoBatchSize: 2,
    });
    expect(video.success).toBe(true);

    // Missing the required prompt.
    const noPrompt = generate.schema.safeParse({
      taskType: "mj_txt2img",
      aspectRatio: "16:9",
    });
    expect(noPrompt.success).toBe(false);

    // Missing the required taskType.
    const noTaskType = generate.schema.safeParse({
      prompt: "hello world",
    });
    expect(noTaskType.success).toBe(false);

    // Unsupported version.
    const badVersion = generate.schema.safeParse({
      taskType: "mj_txt2img",
      prompt: "hello world",
      version: "4",
    });
    expect(badVersion.success).toBe(false);

    // Out-of-range stylization.
    const badStyle = generate.schema.safeParse({
      taskType: "mj_txt2img",
      prompt: "hello world",
      stylization: 5000,
    });
    expect(badStyle.success).toBe(false);

    // Unsupported videoBatchSize.
    const badBatch = generate.schema.safeParse({
      taskType: "mj_video",
      prompt: "hello world",
      videoBatchSize: 3,
    });
    expect(badBatch.success).toBe(false);
  });
});
