import { describe, it, expect } from "vitest";

import { XaiVideoGenerateRequestSchema } from "../../packages/provider/xai/src/zod";

// The reference-image cap is sourced in packages/provider/xai/src/zod.ts:
// xAI's docs are silent, so the 1-7 bound comes from WaveSpeedAI's hosted
// grok-imagine-video reference-to-video API.
const REFERENCE_IMAGE_MAX = 7;

const reference = (index: number) => ({
  url: `https://example.com/reference-${index}.png`,
});

const fileId = (index: number) => `file-${index}`;

describe("XaiVideoGenerateRequestSchema reference array caps", () => {
  describe("reference_images", () => {
    it("accepts the documented maximum reference images", () => {
      const result = XaiVideoGenerateRequestSchema.safeParse({
        prompt: "a cat riding a skateboard",
        reference_images: Array.from({ length: REFERENCE_IMAGE_MAX }, (_, i) =>
          reference(i)
        ),
      });

      expect(result.success).toBe(true);
    });

    it("rejects eight reference images", () => {
      const result = XaiVideoGenerateRequestSchema.safeParse({
        prompt: "a cat riding a skateboard",
        reference_images: Array.from({ length: 8 }, (_, i) => reference(i)),
      });

      expect(result.success).toBe(false);
      expect(
        result.error?.issues.some((issue) =>
          issue.path.includes("reference_images")
        )
      ).toBe(true);
    });
  });

  describe("reference_image_file_ids", () => {
    it("accepts the documented maximum reference image file ids", () => {
      const result = XaiVideoGenerateRequestSchema.safeParse({
        prompt: "a cat riding a skateboard",
        reference_image_file_ids: Array.from(
          { length: REFERENCE_IMAGE_MAX },
          (_, i) => fileId(i)
        ),
      });

      expect(result.success).toBe(true);
    });

    it("rejects eight reference image file ids", () => {
      const result = XaiVideoGenerateRequestSchema.safeParse({
        prompt: "a cat riding a skateboard",
        reference_image_file_ids: Array.from({ length: 8 }, (_, i) =>
          fileId(i)
        ),
      });

      expect(result.success).toBe(false);
      expect(
        result.error?.issues.some((issue) =>
          issue.path.includes("reference_image_file_ids")
        )
      ).toBe(true);
    });
  });

  describe("duration", () => {
    // REQ-011's duration clause was dropped for this item: the schema has no
    // "referenced video duration" field, and `duration` is the generation
    // length, which xAI documents as 1-15 seconds. These pins record that the
    // generate duration range is intentionally left untouched here.
    it("accepts a 12-second generation duration", () => {
      const result = XaiVideoGenerateRequestSchema.safeParse({
        prompt: "a cat riding a skateboard",
        duration: 12,
      });

      expect(result.success).toBe(true);
    });

    it("rejects a duration above the documented 15-second range", () => {
      const result = XaiVideoGenerateRequestSchema.safeParse({
        prompt: "a cat riding a skateboard",
        duration: 16,
      });

      expect(result.success).toBe(false);
    });
  });
});
