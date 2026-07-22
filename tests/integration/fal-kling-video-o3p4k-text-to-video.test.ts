import { describe, it, expect, beforeEach, afterEach } from "vitest";
import {
  setupPollyIgnoringBody,
  teardownPolly,
  type PollyContext,
} from "../harness";
import { createFal } from "@apicity/fal";
import { FalKlingVideoO3p4kTextToVideoRequestSchema } from "@apicity/fal/zod";

describe("fal kling-video o3/4k text-to-video integration", () => {
  let ctx: PollyContext;

  beforeEach(() => {
    ctx = setupPollyIgnoringBody("fal/kling-video-o3p4k-text-to-video");
  });

  afterEach(async () => {
    await teardownPolly(ctx);
  });

  it("should generate a video from a text prompt", async () => {
    const provider = createFal({
      apiKey: process.env.FAL_API_KEY ?? "fal-test-key",
      timeout: 900000,
    });

    const result = await provider.run.klingVideo.o3p4k.textToVideo({
      prompt:
        'A mecha lands on the ground to save the city, and says "I\'m here", in anime style',
      aspect_ratio: "16:9",
      duration: "5",
      generate_audio: false,
    });

    expect(result).toBeDefined();
    expect(result.video).toBeDefined();
    expect(typeof result.video.url).toBe("string");
    expect(result.video.url.startsWith("http")).toBe(true);
  }, 900000);

  it("should validate a valid payload", () => {
    const provider = createFal({ apiKey: "fal-test-key" });
    const v = provider.run.klingVideo.o3p4k.textToVideo.schema.safeParse({
      prompt: "a serene landscape",
    });
    expect(v.success).toBe(true);
  });

  it("should accept an empty payload (all fields optional)", () => {
    const provider = createFal({ apiKey: "fal-test-key" });
    const v = provider.run.klingVideo.o3p4k.textToVideo.schema.safeParse({});
    expect(v.success).toBe(true);
  });

  it("should reject payload with invalid duration", () => {
    const provider = createFal({ apiKey: "fal-test-key" });
    const v = provider.run.klingVideo.o3p4k.textToVideo.schema.safeParse({
      prompt: "a cat",
      duration: "20",
    });
    expect(v.success).toBe(false);
  });

  it("should reject payload with invalid aspect_ratio", () => {
    const provider = createFal({ apiKey: "fal-test-key" });
    const v = provider.run.klingVideo.o3p4k.textToVideo.schema.safeParse({
      prompt: "a cat",
      aspect_ratio: "4:3",
    });
    expect(v.success).toBe(false);
  });

  it("should expose schema", () => {
    const provider = createFal({ apiKey: "fal-test-key" });
    const schema = provider.run.klingVideo.o3p4k.textToVideo.schema;
    // Bind the identity, not just presence: the MCP server derives this
    // endpoint's tool input JSON Schema from `.schema`, so attaching a
    // sibling's schema here would ship a wrong tool contract silently.
    expect(schema).toBe(FalKlingVideoO3p4kTextToVideoRequestSchema);
    expect(typeof schema.safeParse).toBe("function");
  });

  it("should expose the same function via run and post.run", () => {
    const provider = createFal({ apiKey: "fal-test-key" });
    expect(provider.run.klingVideo.o3p4k.textToVideo).toBe(
      provider.post.run.klingVideo.o3p4k.textToVideo
    );
  });
});
