import { describe, it, expect, afterEach } from "vitest";
import { setupPolly, teardownPolly, type PollyContext } from "../harness";
import { createKie, KieError, type AlephGenerateRequest } from "@apicity/kie";
import { mintKieRunwayOtp, TEST_PAYGATE_SECRET } from "../harness";

// Free/error path: deliberate unreachable videoUrl so upstream rejects without
// a paid Aleph generation. Exercises the pay-gate + POST shape end to end.
const RECORDING_NAME = "kie/aleph/generate-invalid-video";

describe("kie aleph generate (invalid video)", () => {
  let ctx: PollyContext;

  afterEach(async () => {
    await teardownPolly(ctx);
  });

  it(
    "submits through the pay-gate and returns an envelope or KieError",
    { timeout: 600_000 },
    async () => {
      ctx = setupPolly(RECORDING_NAME);

      const provider = createKie({
        paygate: { secret: TEST_PAYGATE_SECRET },
        apiKey: process.env.KIE_API_KEY ?? "kie-test-key",
      });

      const request = {
        prompt: "A slow cinematic pan across misty mountains at dawn.",
        videoUrl:
          "https://example.com/apicity-test-nonexistent-video-do-not-record-real.mp4",
        callBackUrl: "https://example.com/aleph-callback",
      } satisfies AlephGenerateRequest;

      try {
        const result = await provider.post.api.v1.aleph.generate(
          request,
          mintKieRunwayOtp("api.v1.aleph.generate", request)
        );
        // Standard kie envelope: numeric code + string msg (+ optional taskId).
        expect(typeof result.code).toBe("number");
        expect(typeof result.msg).toBe("string");
      } catch (error) {
        // Or upstream may answer with an HTTP error, surfaced as KieError.
        expect(error).toBeInstanceOf(KieError);
      }
    }
  );

  it("should validate payload via schema", () => {
    const provider = createKie({
      paygate: { secret: TEST_PAYGATE_SECRET },
      apiKey: "test-key",
    });

    const generate = provider.post.api.v1.aleph.generate;

    const ok = generate.schema.safeParse({
      prompt: "Transform the clip into a watercolor painting style.",
      videoUrl: "https://example.com/input-video.mp4",
      aspectRatio: "16:9",
      seed: 123456,
      waterMark: "kie.ai",
      uploadCn: false,
      referenceImage: "https://example.com/reference.jpg",
      callBackUrl: "https://example.com/callback",
    });
    expect(ok.success).toBe(true);

    // 21:9 is valid for Aleph (wider than base Runway generate).
    const wide = generate.schema.safeParse({
      prompt: "Ultra-wide landscape transform.",
      videoUrl: "https://example.com/input-video.mp4",
      aspectRatio: "21:9",
    });
    expect(wide.success).toBe(true);

    // Missing required prompt.
    const noPrompt = generate.schema.safeParse({
      videoUrl: "https://example.com/input-video.mp4",
    });
    expect(noPrompt.success).toBe(false);

    // Missing required videoUrl.
    const noVideo = generate.schema.safeParse({
      prompt: "hello world",
    });
    expect(noVideo.success).toBe(false);

    // videoUrl must be a URL.
    const badVideo = generate.schema.safeParse({
      prompt: "hello world",
      videoUrl: "not-a-url",
    });
    expect(badVideo.success).toBe(false);

    // aspectRatio must be one of the supported presets.
    const badAspect = generate.schema.safeParse({
      prompt: "hello world",
      videoUrl: "https://example.com/input-video.mp4",
      aspectRatio: "2:1",
    });
    expect(badAspect.success).toBe(false);
  });
});
