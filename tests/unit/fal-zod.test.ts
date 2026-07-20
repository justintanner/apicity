import { describe, expect, it } from "vitest";

import {
  FalNanoBanana2EditRequestSchema,
  FalNanoBanana2LiteEditRequestSchema,
  FalNanoBanana2LiteTextToImageRequestSchema,
  FalNanoBanana2TextToImageRequestSchema,
  FalNanoBananaEditRequestSchema,
  FalNanoBananaProEditRequestSchema,
  FalNanoBananaProTextToImageRequestSchema,
  FalNanoBananaTextToImageRequestSchema,
} from "@apicity/fal/zod";
import {
  FalSeedreamV5LiteEditRequestSchema,
  FalSeedreamV5LiteTextToImageRequestSchema,
} from "../../packages/provider/fal/src/zod";

const PROMPT = "a cinematic drone shot over a canyon";
const IMAGE_URL = "https://example.com/image.png";

// The whole Nano Banana family, with the base payload each schema needs to
// parse. `image_urls` records whether the schema carries the field at all, so
// the cap assertions can skip the text-to-image variants that do not.
const FAMILY = [
  {
    name: "FalNanoBanana2TextToImageRequestSchema",
    schema: FalNanoBanana2TextToImageRequestSchema,
    base: { prompt: PROMPT },
    hasImageUrls: false,
  },
  {
    name: "FalNanoBanana2EditRequestSchema",
    schema: FalNanoBanana2EditRequestSchema,
    base: { prompt: PROMPT, image_urls: [IMAGE_URL] },
    hasImageUrls: true,
  },
  {
    name: "FalNanoBanana2LiteTextToImageRequestSchema",
    schema: FalNanoBanana2LiteTextToImageRequestSchema,
    base: { prompt: PROMPT },
    hasImageUrls: false,
  },
  {
    name: "FalNanoBanana2LiteEditRequestSchema",
    schema: FalNanoBanana2LiteEditRequestSchema,
    base: { prompt: PROMPT },
    hasImageUrls: true,
  },
  {
    name: "FalNanoBananaTextToImageRequestSchema",
    schema: FalNanoBananaTextToImageRequestSchema,
    base: { prompt: PROMPT },
    hasImageUrls: false,
  },
  {
    name: "FalNanoBananaEditRequestSchema",
    schema: FalNanoBananaEditRequestSchema,
    base: { prompt: PROMPT, image_urls: [IMAGE_URL] },
    hasImageUrls: true,
  },
  {
    name: "FalNanoBananaProTextToImageRequestSchema",
    schema: FalNanoBananaProTextToImageRequestSchema,
    base: { prompt: PROMPT },
    hasImageUrls: false,
  },
  {
    name: "FalNanoBananaProEditRequestSchema",
    schema: FalNanoBananaProEditRequestSchema,
    base: { prompt: PROMPT, image_urls: [IMAGE_URL] },
    hasImageUrls: true,
  },
] as const;

const WITH_IMAGE_URLS = FAMILY.filter((entry) => entry.hasImageUrls);

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

describe("fal Nano Banana family request schemas", () => {
  describe.each(FAMILY)("$name num_images", ({ schema, base }) => {
    it("rejects a non-integer count", () => {
      const result = schema.safeParse({ ...base, num_images: 2.5 });
      expect(result.success).toBe(false);
    });

    it("accepts an in-range integer count", () => {
      const result = schema.safeParse({ ...base, num_images: 2 });
      expect(result.success).toBe(true);
    });

    it("accepts the boundary counts 1 and 4", () => {
      expect(schema.safeParse({ ...base, num_images: 1 }).success).toBe(true);
      expect(schema.safeParse({ ...base, num_images: 4 }).success).toBe(true);
    });

    it("rejects counts outside 1..4", () => {
      expect(schema.safeParse({ ...base, num_images: 0 }).success).toBe(false);
      expect(schema.safeParse({ ...base, num_images: 5 }).success).toBe(false);
    });
  });

  describe.each(FAMILY)("$name seed", ({ schema, base }) => {
    it("rejects a non-integer seed", () => {
      const result = schema.safeParse({ ...base, seed: 2.5 });
      expect(result.success).toBe(false);
    });

    it("accepts an integer seed", () => {
      const result = schema.safeParse({ ...base, seed: 2 });
      expect(result.success).toBe(true);
    });
  });

  // Review finding R-1: an earlier revision capped these at 9, citing "caps
  // already established elsewhere in the file". The only base `.max(9)` on
  // `image_urls` is on the Seedance 2.0 reference-to-video schemas — a video
  // modality — and image `image_urls` caps at base range over 3, 4, and 10.
  // There is no documented Nano Banana bound, so rejecting a 10-URL edit would
  // be the client inventing a limit the API never stated. Pinned so the cap is
  // not reintroduced without a citation.
  describe.each(WITH_IMAGE_URLS)("$name image_urls", ({ schema, base }) => {
    it("accepts arrays past the removed 9-URL ceiling", () => {
      const result = schema.safeParse({
        ...base,
        image_urls: Array(10).fill(IMAGE_URL),
      });
      expect(result.success).toBe(true);
    });
  });

  // Review finding S1: these two `seed` fields were absent from the plan's line
  // list, so AC-013's "across the family" claim was unmet without them. Pinned
  // separately from the table above so a regression names the right schema.
  describe("seed sites added by review finding S1", () => {
    it("rejects a non-integer seed on Nano Banana text-to-image", () => {
      const result = FalNanoBananaTextToImageRequestSchema.safeParse({
        prompt: PROMPT,
        seed: 1.5,
      });
      expect(result.success).toBe(false);
    });

    it("rejects a non-integer seed on Nano Banana edit", () => {
      const result = FalNanoBananaEditRequestSchema.safeParse({
        prompt: PROMPT,
        image_urls: [IMAGE_URL],
        seed: 1.5,
      });
      expect(result.success).toBe(false);
    });
  });
});
