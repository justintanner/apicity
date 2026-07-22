import { describe, it, expect, beforeEach, afterEach } from "vitest";
import fs from "fs";
import path from "path";
import {
  setupPollyIgnoringBody,
  teardownPolly,
  type PollyContext,
} from "../harness";
import { createFal } from "@apicity/fal";
import { FalVeo3p1ImageToVideoRequestSchema } from "@apicity/fal/zod";

describe("fal veo3.1 image-to-video integration", () => {
  let ctx: PollyContext;

  beforeEach(() => {
    ctx = setupPollyIgnoringBody("fal/veo3-1-image-to-video");
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

    const result = await provider.run.veo3p1.imageToVideo({
      prompt: "the man waves at the camera as the wind blows his hair",
      image_url: imageDataUrl,
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
    const v = provider.run.veo3p1.imageToVideo.schema.safeParse({
      prompt: "wave",
      image_url: "https://example.com/img.png",
    });
    expect(v.success).toBe(true);
  });

  it("should reject payload missing required fields", () => {
    const provider = createFal({ apiKey: "fal-test-key" });
    const v = provider.run.veo3p1.imageToVideo.schema.safeParse({});
    expect(v.success).toBe(false);
    if (v.success) throw new Error("expected failure");
    expect(v.error.issues.some((i) => i.path.includes("prompt"))).toBe(true);
    expect(v.error.issues.some((i) => i.path.includes("image_url"))).toBe(true);
  });

  it("should reject payload with invalid aspect ratio", () => {
    const provider = createFal({ apiKey: "fal-test-key" });
    const v = provider.run.veo3p1.imageToVideo.schema.safeParse({
      prompt: "wave",
      image_url: "https://example.com/img.png",
      aspect_ratio: "1:1",
    });
    expect(v.success).toBe(false);
  });

  it("should expose schema", () => {
    const provider = createFal({ apiKey: "fal-test-key" });
    const schema = provider.run.veo3p1.imageToVideo.schema;
    // Bind the identity, not just presence: the MCP server derives this
    // endpoint's tool input JSON Schema from `.schema`, so attaching a
    // sibling's schema here would ship a wrong tool contract silently.
    expect(schema).toBe(FalVeo3p1ImageToVideoRequestSchema);
    expect(typeof schema.safeParse).toBe("function");
  });

  it("should expose the same function via run and post.run", () => {
    const provider = createFal({ apiKey: "fal-test-key" });
    expect(provider.run.veo3p1.imageToVideo).toBe(
      provider.post.run.veo3p1.imageToVideo
    );
  });
});
