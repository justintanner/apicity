import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { setupPolly, teardownPolly, type PollyContext } from "../harness";
import { createFal } from "@apicity/fal";
import { FalWan3p0TextToVideoRequestSchema } from "@apicity/fal/zod";

describe("fal alibaba wan3p0-prime text-to-video integration", () => {
  let ctx: PollyContext;

  beforeEach(() => {
    ctx = setupPolly("fal/wan3p0-prime-text-to-video");
  });

  afterEach(async () => {
    await teardownPolly(ctx);
  });

  it("should generate a short 480p video from a text prompt", async () => {
    const provider = createFal({
      apiKey: process.env.FAL_API_KEY ?? "fal-test-key",
      timeout: 900000,
    });

    const result = await provider.run.alibaba.wan3p0Prime.textToVideo({
      prompt:
        "A red panda walks slowly through a bamboo forest at sunrise, cinematic close-up.",
      resolution: "480p",
      aspect_ratio: "1:1",
      duration: 2,
      audio: false,
    });

    expect(result.video.url.startsWith("http")).toBe(true);
    expect(typeof result.seed).toBe("number");
    expect(typeof result.duration).toBe("number");
  }, 900000);

  it("should validate a minimal payload", () => {
    const provider = createFal({ apiKey: "fal-test-key" });
    const result =
      provider.run.alibaba.wan3p0Prime.textToVideo.schema.safeParse({
        prompt: "a serene mountain sunset",
      });
    expect(result.success).toBe(true);
  });

  it("should reject a payload missing prompt", () => {
    const provider = createFal({ apiKey: "fal-test-key" });
    const result =
      provider.run.alibaba.wan3p0Prime.textToVideo.schema.safeParse({});
    expect(result.success).toBe(false);
    if (result.success) throw new Error("expected failure");
    expect(
      result.error.issues.some((issue) => issue.path.includes("prompt"))
    ).toBe(true);
  });

  it("should reject an unknown resolution", () => {
    const provider = createFal({ apiKey: "fal-test-key" });
    const result =
      provider.run.alibaba.wan3p0Prime.textToVideo.schema.safeParse({
        prompt: "a red panda",
        resolution: "4k",
      });
    expect(result.success).toBe(false);
  });

  it("should bound duration to the published 2-30 second range", () => {
    const provider = createFal({ apiKey: "fal-test-key" });
    const schema = provider.run.alibaba.wan3p0Prime.textToVideo.schema;
    expect(
      schema.safeParse({ prompt: "a red panda", duration: 2 }).success
    ).toBe(true);
    expect(
      schema.safeParse({ prompt: "a red panda", duration: 30 }).success
    ).toBe(true);
    expect(
      schema.safeParse({ prompt: "a red panda", duration: 1 }).success
    ).toBe(false);
    expect(
      schema.safeParse({ prompt: "a red panda", duration: 31 }).success
    ).toBe(false);
  });

  it("should accept a null duration for smart duration", () => {
    const provider = createFal({ apiKey: "fal-test-key" });
    const result =
      provider.run.alibaba.wan3p0Prime.textToVideo.schema.safeParse({
        prompt: "a red panda",
        duration: null,
      });
    expect(result.success).toBe(true);
  });

  it("should accept the adaptive aspect ratio", () => {
    const provider = createFal({ apiKey: "fal-test-key" });
    const result =
      provider.run.alibaba.wan3p0Prime.textToVideo.schema.safeParse({
        prompt: "a red panda",
        aspect_ratio: "adaptive",
      });
    expect(result.success).toBe(true);
  });

  it("should expose the endpoint-specific schema", () => {
    const provider = createFal({ apiKey: "fal-test-key" });
    const schema = provider.run.alibaba.wan3p0Prime.textToVideo.schema;
    expect(schema).toBe(FalWan3p0TextToVideoRequestSchema);
    expect(typeof schema.safeParse).toBe("function");
  });

  it("should expose the same function via run and post.run", () => {
    const provider = createFal({ apiKey: "fal-test-key" });
    expect(provider.run.alibaba.wan3p0Prime.textToVideo).toBe(
      provider.post.run.alibaba.wan3p0Prime.textToVideo
    );
  });
});
