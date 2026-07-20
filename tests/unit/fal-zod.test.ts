import { describe, it, expect } from "vitest";

import {
  FalSeedreamV5LiteEditRequestSchema,
  FalSeedreamV5LiteTextToImageRequestSchema,
} from "../../packages/provider/fal/src/zod";

describe("Fal Zod schema validation", () => {
  describe("Seedream v5 Lite text-to-image schema", () => {
    it("should validate with required prompt field only", () => {
      const result = FalSeedreamV5LiteTextToImageRequestSchema.safeParse({
        prompt: "A lighthouse at dusk",
      });
      expect(result.success).toBe(true);
    });

    it("should accept auto_4K", () => {
      const result = FalSeedreamV5LiteTextToImageRequestSchema.safeParse({
        prompt: "A lighthouse at dusk",
        auto_4K: true,
      });
      expect(result.success).toBe(true);
    });

    it("should reject a non-boolean auto_4K", () => {
      const result = FalSeedreamV5LiteTextToImageRequestSchema.safeParse({
        prompt: "A lighthouse at dusk",
        auto_4K: "yes",
      });
      expect(result.success).toBe(false);
      expect(result.error?.issues.some((i) => i.path.includes("auto_4K"))).toBe(
        true
      );
    });

    it("should accept an integer num_images", () => {
      const result = FalSeedreamV5LiteTextToImageRequestSchema.safeParse({
        prompt: "A lighthouse at dusk",
        num_images: 1,
      });
      expect(result.success).toBe(true);
    });

    it("should reject a non-integer num_images", () => {
      const result = FalSeedreamV5LiteTextToImageRequestSchema.safeParse({
        prompt: "A lighthouse at dusk",
        num_images: 1.5,
      });
      expect(result.success).toBe(false);
      expect(
        result.error?.issues.some((i) => i.path.includes("num_images"))
      ).toBe(true);
    });

    // Review finding R-1: Fal documents no upper bound for these counts and
    // Seedream has no same-family precedent, so no maximum is enforced. Pinned
    // so a borrowed ceiling cannot return without a doc citation.
    it("should accept num_images above the removed ceiling", () => {
      const result = FalSeedreamV5LiteTextToImageRequestSchema.safeParse({
        prompt: "A lighthouse at dusk",
        num_images: 5,
      });
      expect(result.success).toBe(true);
    });

    it("should reject num_images below the lower bound", () => {
      const result = FalSeedreamV5LiteTextToImageRequestSchema.safeParse({
        prompt: "A lighthouse at dusk",
        num_images: 0,
      });
      expect(result.success).toBe(false);
      expect(
        result.error?.issues.some((i) => i.path.includes("num_images"))
      ).toBe(true);
    });

    it("should accept max_images above the removed ceiling", () => {
      const result = FalSeedreamV5LiteTextToImageRequestSchema.safeParse({
        prompt: "A lighthouse at dusk",
        max_images: 6,
      });
      expect(result.success).toBe(true);
    });

    it("should reject a non-integer max_images", () => {
      const result = FalSeedreamV5LiteTextToImageRequestSchema.safeParse({
        prompt: "A lighthouse at dusk",
        max_images: 2.5,
      });
      expect(result.success).toBe(false);
      expect(
        result.error?.issues.some((i) => i.path.includes("max_images"))
      ).toBe(true);
    });

    it("should reject max_images below the lower bound", () => {
      const result = FalSeedreamV5LiteTextToImageRequestSchema.safeParse({
        prompt: "A lighthouse at dusk",
        max_images: 0,
      });
      expect(result.success).toBe(false);
      expect(
        result.error?.issues.some((i) => i.path.includes("max_images"))
      ).toBe(true);
    });
  });

  describe("Seedream v5 Lite edit schema", () => {
    const image_urls = ["https://example.com/a.png"];

    it("should validate with required fields only", () => {
      const result = FalSeedreamV5LiteEditRequestSchema.safeParse({
        prompt: "Make it rain",
        image_urls,
      });
      expect(result.success).toBe(true);
    });

    it("should accept auto_4K", () => {
      const result = FalSeedreamV5LiteEditRequestSchema.safeParse({
        prompt: "Make it rain",
        image_urls,
        auto_4K: true,
      });
      expect(result.success).toBe(true);
    });

    it("should accept an integer num_images", () => {
      const result = FalSeedreamV5LiteEditRequestSchema.safeParse({
        prompt: "Make it rain",
        image_urls,
        num_images: 1,
      });
      expect(result.success).toBe(true);
    });

    it("should reject a non-integer num_images", () => {
      const result = FalSeedreamV5LiteEditRequestSchema.safeParse({
        prompt: "Make it rain",
        image_urls,
        num_images: 1.5,
      });
      expect(result.success).toBe(false);
      expect(
        result.error?.issues.some((i) => i.path.includes("num_images"))
      ).toBe(true);
    });

    // Review finding R-1: no documented ceiling; see the note above. This
    // schema already accepts 10 `image_urls`, so a 4-image output cap was very
    // likely wrong on its own terms.
    it("should accept num_images above the removed ceiling", () => {
      const result = FalSeedreamV5LiteEditRequestSchema.safeParse({
        prompt: "Make it rain",
        image_urls,
        num_images: 5,
      });
      expect(result.success).toBe(true);
    });

    it("should accept max_images above the removed ceiling", () => {
      const result = FalSeedreamV5LiteEditRequestSchema.safeParse({
        prompt: "Make it rain",
        image_urls,
        max_images: 6,
      });
      expect(result.success).toBe(true);
    });

    it("should reject a non-integer max_images", () => {
      const result = FalSeedreamV5LiteEditRequestSchema.safeParse({
        prompt: "Make it rain",
        image_urls,
        max_images: 2.5,
      });
      expect(result.success).toBe(false);
      expect(
        result.error?.issues.some((i) => i.path.includes("max_images"))
      ).toBe(true);
    });
  });
});
