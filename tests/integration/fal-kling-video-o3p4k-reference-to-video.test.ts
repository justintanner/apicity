import { describe, it, expect, beforeEach, afterEach } from "vitest";
import fs from "fs";
import path from "path";
import {
  setupPollyIgnoringBody,
  teardownPolly,
  type PollyContext,
} from "../harness";
import { fal } from "@apicity/fal";

describe("fal kling-video o3/4k reference-to-video integration", () => {
  let ctx: PollyContext;

  beforeEach(() => {
    ctx = setupPollyIgnoringBody("fal/kling-video-o3p4k-reference-to-video");
  });

  afterEach(async () => {
    await teardownPolly(ctx);
  });

  it("should generate a video from reference images", async () => {
    const provider = fal({
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

    const result = await provider.run.klingVideo.o3p4k.referenceToVideo({
      start_image_url: imageDataUrl,
      prompt: "the man waves at the camera as the wind blows his hair",
      duration: "5",
      generate_audio: false,
      aspect_ratio: "16:9",
    });

    expect(result).toBeDefined();
    expect(result.video).toBeDefined();
    expect(typeof result.video.url).toBe("string");
    expect(result.video.url.startsWith("http")).toBe(true);
  }, 900000);

  it("should validate a valid payload", () => {
    const provider = fal({ apiKey: "fal-test-key" });
    const v = provider.run.klingVideo.o3p4k.referenceToVideo.schema.safeParse({
      prompt: "test prompt",
      duration: "5",
      aspect_ratio: "16:9",
    });
    expect(v.success).toBe(true);
  });

  it("should reject payload with invalid duration", () => {
    const provider = fal({ apiKey: "fal-test-key" });
    const v = provider.run.klingVideo.o3p4k.referenceToVideo.schema.safeParse({
      duration: "20",
    });
    expect(v.success).toBe(false);
  });

  it("should reject payload with invalid aspect_ratio", () => {
    const provider = fal({ apiKey: "fal-test-key" });
    const v = provider.run.klingVideo.o3p4k.referenceToVideo.schema.safeParse({
      aspect_ratio: "4:3",
    });
    expect(v.success).toBe(false);
  });

  it("should expose schema", () => {
    const provider = fal({ apiKey: "fal-test-key" });
    const schema = provider.run.klingVideo.o3p4k.referenceToVideo.schema;
    expect(schema).toBeDefined();
    expect(typeof schema.safeParse).toBe("function");
  });

  it("should expose the same function via run and post.run", () => {
    const provider = fal({ apiKey: "fal-test-key" });
    expect(provider.run.klingVideo.o3p4k.referenceToVideo).toBe(
      provider.post.run.klingVideo.o3p4k.referenceToVideo
    );
  });
});
