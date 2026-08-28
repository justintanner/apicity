import { describe, it, expect, beforeEach, afterEach } from "vitest";
import {
  setupPollyIgnoringBody,
  teardownPolly,
  type PollyContext,
} from "../harness";
import { createFal } from "@apicity/fal";

describe("fal meshy v7 image-to-3d integration", () => {
  let ctx: PollyContext;

  beforeEach(() => {
    ctx = setupPollyIgnoringBody("fal/meshy-v7-image-to-3d");
  });

  afterEach(async () => {
    await teardownPolly(ctx);
  });

  it("should convert an image into a 3D model", async () => {
    const provider = createFal({
      apiKey: process.env.FAL_API_KEY ?? "fal-test-key",
      timeout: 300000,
    });

    // Upstream's own sample image, from the endpoint's OpenAPI examples.
    // Billing is per compute second, so texturing — the expensive second
    // phase — plus PBR, rigging and animation are all left off.
    const result = await provider.run.meshy.v7.imageTo3d({
      image_url:
        "https://v3b.fal.media/files/b/zebra/3osHJDI8IZ2wl6sGtEUeB_image.png",
      model_type: "standard",
      should_texture: false,
    });

    expect(result).toBeDefined();
    expect(typeof result.model_glb.url).toBe("string");
    expect(result.model_glb.url.startsWith("http")).toBe(true);
    expect(result.model_urls).toBeDefined();
    expect(typeof result.model_urls.glb?.url).toBe("string");
  }, 300000);

  it("should reject a payload missing image_url", () => {
    const provider = createFal({ apiKey: "fal-test-key" });
    const v = provider.run.meshy.v7.imageTo3d.schema.safeParse({
      model_type: "lowpoly",
    });
    expect(v.success).toBe(false);
    if (v.success) throw new Error("expected failure");
    expect(v.error.issues.some((i) => i.path.includes("image_url"))).toBe(true);
  });

  it("should accept the full documented option surface", () => {
    const provider = createFal({ apiKey: "fal-test-key" });
    const v = provider.run.meshy.v7.imageTo3d.schema.safeParse({
      image_url: "https://example.com/person.png",
      model_type: "smart-topology",
      topology: "quad",
      target_polycount: 15000,
      symmetry_mode: "on",
      should_remesh: true,
      should_texture: true,
      enable_pbr: true,
      is_a_t_pose: false,
      pose_mode: "a-pose",
      texture_prompt: "matte ceramic glaze",
      texture_image_url: "https://example.com/texture.png",
      enable_rigging: true,
      rigging_height_meters: 1.7,
      enable_animation: true,
      animation_action_id: 92,
      enable_safety_checker: true,
      ultra_mode: false,
    });
    expect(v.success).toBe(true);
  });

  // Upstream bounds target_polycount to 100..300000 inclusive.
  it("should reject target_polycount below the documented minimum", () => {
    const provider = createFal({ apiKey: "fal-test-key" });
    const v = provider.run.meshy.v7.imageTo3d.schema.safeParse({
      image_url: "https://example.com/person.png",
      target_polycount: 99,
    });
    expect(v.success).toBe(false);
  });

  it("should reject target_polycount above the documented maximum", () => {
    const provider = createFal({ apiKey: "fal-test-key" });
    const v = provider.run.meshy.v7.imageTo3d.schema.safeParse({
      image_url: "https://example.com/person.png",
      target_polycount: 300001,
    });
    expect(v.success).toBe(false);
  });

  it("should accept target_polycount at both documented bounds", () => {
    const provider = createFal({ apiKey: "fal-test-key" });
    for (const target_polycount of [100, 300000]) {
      const v = provider.run.meshy.v7.imageTo3d.schema.safeParse({
        image_url: "https://example.com/person.png",
        target_polycount,
      });
      expect(v.success, String(target_polycount)).toBe(true);
    }
  });

  // Upstream rejects an animation_action_id outside 0..696 with a 422.
  it("should reject an animation_action_id outside the preset library", () => {
    const provider = createFal({ apiKey: "fal-test-key" });
    for (const animation_action_id of [-1, 697]) {
      const v = provider.run.meshy.v7.imageTo3d.schema.safeParse({
        image_url: "https://example.com/person.png",
        enable_animation: true,
        animation_action_id,
      });
      expect(v.success, String(animation_action_id)).toBe(false);
    }
  });

  it("should reject a texture_prompt over the documented length", () => {
    const provider = createFal({ apiKey: "fal-test-key" });
    const v = provider.run.meshy.v7.imageTo3d.schema.safeParse({
      image_url: "https://example.com/person.png",
      texture_prompt: "a".repeat(601),
    });
    expect(v.success).toBe(false);
  });

  it("should reject vocabularies outside the documented enums", () => {
    const provider = createFal({ apiKey: "fal-test-key" });
    const base = { image_url: "https://example.com/person.png" };
    expect(
      provider.run.meshy.v7.imageTo3d.schema.safeParse({
        ...base,
        model_type: "ultra",
      }).success
    ).toBe(false);
    // "lowpoly" is in upstream's published OpenAPI enum but the endpoint
    // itself rejects it with 422 `model_type: lowpoly is not supported for
    // meshy-7` (live read 2026-08-28), so the schema rejects it locally
    // instead of forwarding a request that cannot succeed.
    expect(
      provider.run.meshy.v7.imageTo3d.schema.safeParse({
        ...base,
        model_type: "lowpoly",
      }).success
    ).toBe(false);
    expect(
      provider.run.meshy.v7.imageTo3d.schema.safeParse({
        ...base,
        topology: "ngon",
      }).success
    ).toBe(false);
    expect(
      provider.run.meshy.v7.imageTo3d.schema.safeParse({
        ...base,
        symmetry_mode: "mirror",
      }).success
    ).toBe(false);
    expect(
      provider.run.meshy.v7.imageTo3d.schema.safeParse({
        ...base,
        pose_mode: "s-pose",
      }).success
    ).toBe(false);
  });

  // pose_mode's empty string is upstream's own "no specific pose" default.
  it("should accept the empty pose_mode upstream defaults to", () => {
    const provider = createFal({ apiKey: "fal-test-key" });
    const v = provider.run.meshy.v7.imageTo3d.schema.safeParse({
      image_url: "https://example.com/person.png",
      pose_mode: "",
    });
    expect(v.success).toBe(true);
  });
});
