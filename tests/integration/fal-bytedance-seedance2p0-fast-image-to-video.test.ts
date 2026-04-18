import { describe, it, expect, beforeEach, afterEach } from "vitest";
import fs from "fs";
import path from "path";
import { setupPolly, teardownPolly, type PollyContext } from "../harness";
import { fal } from "@apicity/fal";

describe("fal bytedance seedance2p0 fast image-to-video integration", () => {
  let ctx: PollyContext;

  beforeEach(() => {
    ctx = setupPolly("fal/bytedance-seedance2p0-fast-image-to-video");
  });

  afterEach(async () => {
    await teardownPolly(ctx);
  });

  it("should generate a short 480p video from cat1.jpg", async () => {
    const provider = fal({
      apiKey: process.env.FAL_API_KEY ?? "fal-test-key",
      timeout: 300000,
    });

    const fixturePath = path.resolve(
      import.meta.dirname,
      "..",
      "fixtures",
      "cat1.jpg"
    );
    const b64 = fs.readFileSync(fixturePath).toString("base64");
    const imageDataUrl = `data:image/jpeg;base64,${b64}`;

    const result = await provider.run.bytedance.seedance2p0.fast.imageToVideo({
      prompt:
        "A white odd-eyed cat blinks slowly and tilts its head, soft breeze through fur, cinematic close-up.",
      image_url: imageDataUrl,
      resolution: "480p",
      duration: "4",
      aspect_ratio: "1:1",
      generate_audio: false,
    });

    expect(result).toBeDefined();
    expect(result.video).toBeDefined();
    expect(typeof result.video.url).toBe("string");
    expect(result.video.url.startsWith("http")).toBe(true);
    expect(typeof result.seed).toBe("number");
  }, 300000);

  it("should validate a valid payload", () => {
    const provider = fal({ apiKey: "fal-test-key" });
    const v =
      provider.run.bytedance.seedance2p0.fast.imageToVideo.schema.safeParse({
        prompt: "a cat",
        image_url: "https://example.com/cat.jpg",
      });
    expect(v.success).toBe(true);
  });

  it("should reject payload missing required fields", () => {
    const provider = fal({ apiKey: "fal-test-key" });
    const v =
      provider.run.bytedance.seedance2p0.fast.imageToVideo.schema.safeParse({});
    expect(v.success).toBe(false);
    expect(v.error?.issues.some((i) => i.path.includes("prompt"))).toBe(true);
    expect(v.error?.issues.some((i) => i.path.includes("image_url"))).toBe(
      true
    );
  });

  it("should reject payload with wrong enum value", () => {
    const provider = fal({ apiKey: "fal-test-key" });
    const v =
      provider.run.bytedance.seedance2p0.fast.imageToVideo.schema.safeParse({
        prompt: "a cat",
        image_url: "https://example.com/cat.jpg",
        resolution: "1080p",
      });
    expect(v.success).toBe(false);
  });

  it("should expose schema", () => {
    const provider = fal({ apiKey: "fal-test-key" });
    const schema = provider.run.bytedance.seedance2p0.fast.imageToVideo.schema;
    expect(schema).toBeDefined();
    expect(typeof schema.safeParse).toBe("function");
  });

  it("should expose the same function via run and post.run", () => {
    const provider = fal({ apiKey: "fal-test-key" });
    expect(provider.run.bytedance.seedance2p0.fast.imageToVideo).toBe(
      provider.post.run.bytedance.seedance2p0.fast.imageToVideo
    );
  });
});
