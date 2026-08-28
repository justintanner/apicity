import { describe, it, expect, beforeEach, afterEach } from "vitest";
import fs from "fs";
import path from "path";
import {
  setupPollyIgnoringBody,
  teardownPolly,
  type PollyContext,
} from "../harness";
import { createFal } from "@apicity/fal";
import { FalLtx2p5ImageToVideoFastRequestSchema } from "@apicity/fal/zod";

describe("fal lightricks ltx-2.5 image-to-video fast integration", () => {
  let ctx: PollyContext;

  beforeEach(() => {
    ctx = setupPollyIgnoringBody("fal/lightricks-ltx2p5-image-to-video-fast");
  });

  afterEach(async () => {
    await teardownPolly(ctx);
  });

  it("should generate a video from a start image", async () => {
    const provider = createFal({
      apiKey: process.env.FAL_API_KEY ?? "fal-test-key",
      timeout: 300000,
    });

    const fixturePath = path.resolve(
      import.meta.dirname,
      "..",
      "fixtures",
      "man.jpg"
    );
    const b64 = fs.readFileSync(fixturePath).toString("base64");
    const imageDataUrl = `data:image/jpeg;base64,${b64}`;

    // Cheapest shape upstream offers: the shortest duration, the lowest
    // resolution tier, the lowest frame rate, and no audio track.
    const result = await provider.run.lightricks.ltx2p5.imageToVideo.fast({
      image_url: imageDataUrl,
      prompt: "the man smiles and turns his head slowly toward the camera",
      duration: 6,
      resolution: "720p",
      fps: 24,
      generate_audio: false,
    });

    expect(result).toBeDefined();
    expect(result.video).toBeDefined();
    expect(typeof result.video.url).toBe("string");
    expect(result.video.url.startsWith("http")).toBe(true);
  }, 300000);

  it("should validate a minimal payload", () => {
    const provider = createFal({ apiKey: "fal-test-key" });
    const v = provider.run.lightricks.ltx2p5.imageToVideo.fast.schema.safeParse(
      {
        image_url: "https://example.com/img.png",
        prompt: "a slow dolly in",
      }
    );
    expect(v.success).toBe(true);
  });

  it("should reject a payload missing image_url", () => {
    const provider = createFal({ apiKey: "fal-test-key" });
    const v = provider.run.lightricks.ltx2p5.imageToVideo.fast.schema.safeParse(
      {
        prompt: "a slow dolly in",
      }
    );
    expect(v.success).toBe(false);
    if (v.success) throw new Error("expected failure");
    expect(v.error.issues.some((i) => i.path.includes("image_url"))).toBe(true);
  });

  it("should reject a payload missing prompt", () => {
    const provider = createFal({ apiKey: "fal-test-key" });
    const v = provider.run.lightricks.ltx2p5.imageToVideo.fast.schema.safeParse(
      {
        image_url: "https://example.com/img.png",
      }
    );
    expect(v.success).toBe(false);
    if (v.success) throw new Error("expected failure");
    expect(v.error.issues.some((i) => i.path.includes("prompt"))).toBe(true);
  });

  it("should reject an empty prompt and one over 5000 characters", () => {
    const provider = createFal({ apiKey: "fal-test-key" });
    const schema = provider.run.lightricks.ltx2p5.imageToVideo.fast.schema;
    expect(
      schema.safeParse({
        image_url: "https://example.com/img.png",
        prompt: "",
      }).success
    ).toBe(false);
    expect(
      schema.safeParse({
        image_url: "https://example.com/img.png",
        prompt: "a".repeat(5001),
      }).success
    ).toBe(false);
    expect(
      schema.safeParse({
        image_url: "https://example.com/img.png",
        prompt: "a".repeat(5000),
      }).success
    ).toBe(true);
  });

  it("should accept every documented duration and reject others", () => {
    const provider = createFal({ apiKey: "fal-test-key" });
    const schema = provider.run.lightricks.ltx2p5.imageToVideo.fast.schema;
    const base = {
      image_url: "https://example.com/img.png",
      prompt: "a slow dolly in",
    };
    // The fast tier reaches 20s in even steps; the pro tier stops at 10.
    for (const duration of [6, 8, 10, 12, 14, 16, 18, 20, "auto"]) {
      expect(
        schema.safeParse({ ...base, duration }).success,
        `${duration}`
      ).toBe(true);
    }
    // 5 and 7 are neighbours upstream does not offer, and 22 is past the
    // ceiling; the enum is closed.
    expect(schema.safeParse({ ...base, duration: 5 }).success).toBe(false);
    expect(schema.safeParse({ ...base, duration: 7 }).success).toBe(false);
    expect(schema.safeParse({ ...base, duration: 22 }).success).toBe(false);
  });

  it("should bound resolution, aspect ratio, fps and camera motion", () => {
    const provider = createFal({ apiKey: "fal-test-key" });
    const schema = provider.run.lightricks.ltx2p5.imageToVideo.fast.schema;
    const base = {
      image_url: "https://example.com/img.png",
      prompt: "a slow dolly in",
    };
    // The fast tier adds the 1440p and 2160p tiers the pro tier lacks.
    for (const resolution of ["720p", "1080p", "1440p", "2160p"]) {
      expect(
        schema.safeParse({ ...base, resolution }).success,
        resolution
      ).toBe(true);
    }
    expect(schema.safeParse({ ...base, resolution: "4k" }).success).toBe(false);
    expect(schema.safeParse({ ...base, aspect_ratio: "auto" }).success).toBe(
      true
    );
    expect(schema.safeParse({ ...base, aspect_ratio: "1:1" }).success).toBe(
      false
    );
    // 48 is a fast-tier addition; 30 is not offered at any tier.
    expect(schema.safeParse({ ...base, fps: 48 }).success).toBe(true);
    expect(schema.safeParse({ ...base, fps: 50 }).success).toBe(true);
    expect(schema.safeParse({ ...base, fps: 30 }).success).toBe(false);
    expect(
      schema.safeParse({ ...base, camera_motion: "focus_shift" }).success
    ).toBe(true);
    // Explicit null is upstream's own "no camera motion" value.
    expect(schema.safeParse({ ...base, camera_motion: null }).success).toBe(
      true
    );
    expect(
      schema.safeParse({ ...base, camera_motion: "zoom_in" }).success
    ).toBe(false);
  });

  it("should accept an end image for a transition render", () => {
    const provider = createFal({ apiKey: "fal-test-key" });
    const v = provider.run.lightricks.ltx2p5.imageToVideo.fast.schema.safeParse(
      {
        image_url: "https://example.com/start.png",
        end_image_url: "https://example.com/end.png",
        prompt: "a smooth transition between the two frames",
      }
    );
    expect(v.success).toBe(true);
  });

  it("should expose schema", () => {
    const provider = createFal({ apiKey: "fal-test-key" });
    const schema = provider.run.lightricks.ltx2p5.imageToVideo.fast.schema;
    // Bind the identity, not just presence: the MCP server derives this
    // endpoint's tool input JSON Schema from `.schema`, so attaching a
    // sibling's schema here would ship a wrong tool contract silently.
    expect(schema).toBe(FalLtx2p5ImageToVideoFastRequestSchema);
    expect(typeof schema.safeParse).toBe("function");
  });

  it("should expose the same function via run and post.run", () => {
    const provider = createFal({ apiKey: "fal-test-key" });
    expect(provider.run.lightricks.ltx2p5.imageToVideo.fast).toBe(
      provider.post.run.lightricks.ltx2p5.imageToVideo.fast
    );
  });
});
