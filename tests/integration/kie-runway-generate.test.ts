import { describe, it, expect, afterEach } from "vitest";
import { setupPolly, teardownPolly, type PollyContext } from "../harness";
import { createKie } from "@apicity/kie";
import { mintKieRunwayOtp, TEST_PAYGATE_SECRET } from "../harness";

describe("kie runway generate integration", () => {
  let ctx: PollyContext;

  afterEach(async () => {
    await teardownPolly(ctx);
  });

  it(
    "should create a Runway video-generation task",
    { timeout: 600_000 },
    async () => {
      ctx = setupPolly("kie/runway-generate");

      const provider = createKie({
        paygate: { secret: TEST_PAYGATE_SECRET },
        apiKey: process.env.KIE_API_KEY ?? "test-key",
      });

      const request = {
        prompt: "A serene drone shot flying over a misty pine forest at dawn.",
        duration: 5,
        quality: "720p",
        aspectRatio: "16:9",
        callBackUrl: "https://example.com/runway-callback",
      };

      const task = await provider.post.api.v1.runway.generate(
        request,
        mintKieRunwayOtp("api.v1.runway.generate", request)
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

    const generate = provider.post.api.v1.runway.generate;

    // Text-only generation supplies an aspect ratio.
    const textOnly = generate.schema.safeParse({
      prompt: "A neon city street in the rain.",
      duration: 5,
      quality: "1080p",
      aspectRatio: "16:9",
    });
    expect(textOnly.success).toBe(true);

    // Image-driven generation derives the aspect ratio from the image.
    const imageDriven = generate.schema.safeParse({
      prompt: "Animate the reference photo with a gentle parallax.",
      duration: 10,
      quality: "720p",
      imageUrl: "https://example.com/reference.png",
    });
    expect(imageDriven.success).toBe(true);

    // Missing the required prompt.
    const noPrompt = generate.schema.safeParse({
      duration: 5,
      quality: "720p",
    });
    expect(noPrompt.success).toBe(false);

    // Duration must be exactly 5 or 10.
    const badDuration = generate.schema.safeParse({
      prompt: "hello world",
      duration: 7,
      quality: "720p",
    });
    expect(badDuration.success).toBe(false);

    // Quality must be 720p or 1080p.
    const badQuality = generate.schema.safeParse({
      prompt: "hello world",
      duration: 5,
      quality: "4k",
    });
    expect(badQuality.success).toBe(false);

    // Aspect ratio must be one of the supported presets.
    const badAspect = generate.schema.safeParse({
      prompt: "hello world",
      duration: 5,
      quality: "720p",
      aspectRatio: "21:9",
    });
    expect(badAspect.success).toBe(false);
  });
});
