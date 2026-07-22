import { describe, it, expect, beforeEach, afterEach } from "vitest";
import {
  setupPollyIgnoringBody,
  teardownPolly,
  type PollyContext,
} from "../harness";
import { createFal } from "@apicity/fal";
import { FalVeo3p1TextToVideoRequestSchema } from "@apicity/fal/zod";

describe("fal veo3.1 text-to-video integration", () => {
  let ctx: PollyContext;

  beforeEach(() => {
    ctx = setupPollyIgnoringBody("fal/veo3-1");
  });

  afterEach(async () => {
    await teardownPolly(ctx);
  });

  it("should generate a video from a text prompt", async () => {
    const provider = createFal({
      apiKey: process.env.FAL_API_KEY ?? "fal-test-key",
      timeout: 900000,
    });

    const result = await provider.run.veo3p1.textToVideo({
      prompt:
        "A black lab swimming in an inground suburban swimming pool at sunset.",
      aspect_ratio: "16:9",
      duration: "4s",
      resolution: "720p",
      generate_audio: false,
    });

    expect(result).toBeDefined();
    expect(result.video).toBeDefined();
    expect(typeof result.video.url).toBe("string");
    expect(result.video.url.startsWith("http")).toBe(true);
  }, 900000);

  it("should validate a valid payload", () => {
    const provider = createFal({ apiKey: "fal-test-key" });
    const v = provider.run.veo3p1.textToVideo.schema.safeParse({
      prompt: "wave",
    });
    expect(v.success).toBe(true);
  });

  it("should reject payload missing prompt", () => {
    const provider = createFal({ apiKey: "fal-test-key" });
    const v = provider.run.veo3p1.textToVideo.schema.safeParse({});
    expect(v.success).toBe(false);
    if (v.success) throw new Error("expected failure");
    expect(v.error.issues.some((i) => i.path.includes("prompt"))).toBe(true);
  });

  it("should reject payload with invalid aspect ratio", () => {
    const provider = createFal({ apiKey: "fal-test-key" });
    const v = provider.run.veo3p1.textToVideo.schema.safeParse({
      prompt: "wave",
      aspect_ratio: "1:1",
    });
    expect(v.success).toBe(false);
  });

  it("should reject payload with invalid duration", () => {
    const provider = createFal({ apiKey: "fal-test-key" });
    const v = provider.run.veo3p1.textToVideo.schema.safeParse({
      prompt: "wave",
      duration: "10s",
    });
    expect(v.success).toBe(false);
  });

  it("should expose schema", () => {
    const provider = createFal({ apiKey: "fal-test-key" });
    const schema = provider.run.veo3p1.textToVideo.schema;
    // Bind the identity, not just presence: the MCP server derives this
    // endpoint's tool input JSON Schema from `.schema`, so attaching a
    // sibling's schema here would ship a wrong tool contract silently.
    expect(schema).toBe(FalVeo3p1TextToVideoRequestSchema);
    expect(typeof schema.safeParse).toBe("function");
  });

  it("should expose the same function via run and post.run", () => {
    const provider = createFal({ apiKey: "fal-test-key" });
    expect(provider.run.veo3p1.textToVideo).toBe(
      provider.post.run.veo3p1.textToVideo
    );
  });
});
