import { describe, it, expect, beforeEach, afterEach } from "vitest";
import fs from "fs";
import path from "path";
import {
  setupPollyIgnoringBody,
  teardownPolly,
  type PollyContext,
} from "../harness";
import { createFal } from "@apicity/fal";
import { FalKlingVideoO3p4kImageToVideoRequestSchema } from "@apicity/fal/zod";

describe("fal kling-video o3/4k image-to-video integration", () => {
  let ctx: PollyContext;

  beforeEach(() => {
    ctx = setupPollyIgnoringBody("fal/kling-video-o3p4k-image-to-video");
  });

  afterEach(async () => {
    await teardownPolly(ctx);
  });

  it("should generate a video from an image", async () => {
    const provider = createFal({
      apiKey: process.env.FAL_API_KEY ?? "fal-test-key",
      timeout: 900000,
    });

    const fixturePath = path.resolve(
      import.meta.dirname,
      "..",
      "fixtures",
      "man.jpg"
    );
    const b64 = fs.readFileSync(fixturePath).toString("base64");
    const imageDataUrl = `data:image/jpeg;base64,${b64}`;

    const result = await provider.run.klingVideo.o3p4k.imageToVideo({
      image_url: imageDataUrl,
      prompt: "the man waves at the camera as the wind blows his hair",
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
    const v = provider.run.klingVideo.o3p4k.imageToVideo.schema.safeParse({
      image_url: "https://example.com/img.png",
    });
    expect(v.success).toBe(true);
  });

  it("should reject payload missing required image_url", () => {
    const provider = createFal({ apiKey: "fal-test-key" });
    const v = provider.run.klingVideo.o3p4k.imageToVideo.schema.safeParse({});
    expect(v.success).toBe(false);
    if (v.success) throw new Error("expected failure");
    expect(v.error.issues.some((i) => i.path.includes("image_url"))).toBe(true);
  });

  it("should reject payload with invalid duration", () => {
    const provider = createFal({ apiKey: "fal-test-key" });
    const v = provider.run.klingVideo.o3p4k.imageToVideo.schema.safeParse({
      image_url: "https://example.com/img.png",
      duration: "20",
    });
    expect(v.success).toBe(false);
  });

  it("should expose schema", () => {
    const provider = createFal({ apiKey: "fal-test-key" });
    const schema = provider.run.klingVideo.o3p4k.imageToVideo.schema;
    // Bind the identity, not just presence: the MCP server derives this
    // endpoint's tool input JSON Schema from `.schema`, so attaching a
    // sibling's schema here would ship a wrong tool contract silently.
    expect(schema).toBe(FalKlingVideoO3p4kImageToVideoRequestSchema);
    expect(typeof schema.safeParse).toBe("function");
  });

  it("should expose the same function via run and post.run", () => {
    const provider = createFal({ apiKey: "fal-test-key" });
    expect(provider.run.klingVideo.o3p4k.imageToVideo).toBe(
      provider.post.run.klingVideo.o3p4k.imageToVideo
    );
  });
});
