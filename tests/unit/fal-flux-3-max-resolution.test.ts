import { describe, expect, expectTypeOf, it } from "vitest";
import type { FalFlux3MaxResolution } from "@apicity/fal";
import {
  FalFlux3MaxImageToVideoRequestSchema,
  FalFlux3MaxKeyframesToVideoRequestSchema,
  FalFlux3MaxTextToVideoRequestSchema,
} from "@apicity/fal/zod";

// The live queue OpenAPI for all three FLUX 3 Max endpoints, re-read
// 2026-11-25, lists resolution ["720p", "1080p", "2K", "4K"] (default 720p);
// "2K" and "4K" are upscaled from the 720p generation (ac-eeqbqb).
const cases = [
  ["text-to-video", FalFlux3MaxTextToVideoRequestSchema, {}],
  [
    "image-to-video",
    FalFlux3MaxImageToVideoRequestSchema,
    { image_url: "https://example.com/image.jpg" },
  ],
  [
    "keyframes-to-video",
    FalFlux3MaxKeyframesToVideoRequestSchema,
    { keyframes: [{ image_url: "https://example.com/f.jpg", frame_index: 0 }] },
  ],
] as const;

describe("fal FLUX 3 Max resolution", () => {
  it("types the four live resolutions", () => {
    expectTypeOf<FalFlux3MaxResolution>().toEqualTypeOf<
      "720p" | "1080p" | "2K" | "4K"
    >();
  });

  for (const [name, schema, extra] of cases) {
    it(`${name} accepts every live resolution`, () => {
      for (const resolution of ["720p", "1080p", "2K", "4K"]) {
        const parsed = schema.safeParse({ prompt: "p", ...extra, resolution });
        expect(parsed.success, resolution).toBe(true);
      }
    });

    // FLUX 3's spellings and lowercase forms are not Max's enum values.
    it(`${name} rejects other spellings`, () => {
      for (const resolution of ["2k", "4k", "1440p", "2160p"]) {
        const parsed = schema.safeParse({ prompt: "p", ...extra, resolution });
        expect(parsed.success, resolution).toBe(false);
      }
    });
  }
});
