import { describe, it, expect } from "vitest";

import {
  GoogleFlowAssetUploadRequestSchema,
  GoogleFlowCharactersListRequestSchema,
  GoogleFlowEmailRequestSchema,
  GoogleFlowImagesRequestSchema,
  GoogleFlowVideosExtendRequestSchema,
  GoogleFlowVideosRequestSchema,
  GoogleFlowVoicesCreateRequestSchema,
  GoogleFlowVoicesListRequestSchema,
} from "../../packages/provider/googleflow/src/zod";

// The model union on POST /videos and POST /videos/extend used to end in
// `.or(z.string())`, which accepted every string and defeated the enum. The
// escape hatch is now narrowed to versioned Veo aliases, so typos are
// rejected while deprecated/newer Veo point releases still validate.

const videosBase = { prompt: "a cat riding a bicycle" };
const extendBase = { mediaGenerationId: "media-1", prompt: "keep going" };

const videosModels = [
  "veo-3.1-quality",
  "veo-3.1-fast",
  "veo-3.1-lite",
  "veo-3.1-lite-low-priority",
  "omni-flash",
];

const extendModels = [
  "veo-3.1-fast",
  "veo-3.1-quality",
  "veo-3.1-lite",
  "veo-3.1-lite-low-priority",
];

// Deprecated and forward-looking Veo identifiers the narrowed hatch keeps
// accepting, so an upstream point release does not break callers.
const veoAliases = ["veo-2", "veo-3.0", "veo-3.0-fast", "veo-3.2-quality"];

const rejectedModels = [
  "veo-typo",
  "veo",
  "veo-",
  "nano-banana-2",
  "omni-flesh",
  "VEO-3.1-FAST",
  "veo-3.1-Fast",
  "sora-2",
  "",
];

describe("googleflow video model schemas", () => {
  describe("GoogleFlowVideosRequestSchema", () => {
    it.each(videosModels)("should accept the listed model %s", (model) => {
      const result = GoogleFlowVideosRequestSchema.safeParse({
        ...videosBase,
        model,
      });
      expect(result.success).toBe(true);
    });

    it.each(veoAliases)("should accept the Veo alias %s", (model) => {
      const result = GoogleFlowVideosRequestSchema.safeParse({
        ...videosBase,
        model,
      });
      expect(result.success).toBe(true);
    });

    it.each(rejectedModels)("should reject the model %j", (model) => {
      const result = GoogleFlowVideosRequestSchema.safeParse({
        ...videosBase,
        model,
      });
      expect(result.success).toBe(false);
      expect(result.error?.issues.length).toBeGreaterThan(0);
    });

    it("should still allow model to be omitted", () => {
      const result = GoogleFlowVideosRequestSchema.safeParse(videosBase);
      expect(result.success).toBe(true);
    });

    it("should reject a non-string model", () => {
      const result = GoogleFlowVideosRequestSchema.safeParse({
        ...videosBase,
        model: 31,
      });
      expect(result.success).toBe(false);
    });
  });

  describe("GoogleFlowVideosExtendRequestSchema", () => {
    it.each(extendModels)("should accept the listed model %s", (model) => {
      const result = GoogleFlowVideosExtendRequestSchema.safeParse({
        ...extendBase,
        model,
      });
      expect(result.success).toBe(true);
    });

    it.each(veoAliases)("should accept the Veo alias %s", (model) => {
      const result = GoogleFlowVideosExtendRequestSchema.safeParse({
        ...extendBase,
        model,
      });
      expect(result.success).toBe(true);
    });

    it.each(rejectedModels)("should reject the model %j", (model) => {
      const result = GoogleFlowVideosExtendRequestSchema.safeParse({
        ...extendBase,
        model,
      });
      expect(result.success).toBe(false);
      expect(result.error?.issues.length).toBeGreaterThan(0);
    });

    // Extend is Veo-only upstream, and the narrowed hatch no longer lets
    // omni-flash slip through as a bare string.
    it("should reject omni-flash", () => {
      const result = GoogleFlowVideosExtendRequestSchema.safeParse({
        ...extendBase,
        model: "omni-flash",
      });
      expect(result.success).toBe(false);
    });
  });

  // duration was already closed to 4/6/8/10 before this change; these pin
  // that it stayed that way.
  describe("GoogleFlowVideosRequestSchema duration", () => {
    it.each([4, 6, 8, 10])("should accept duration %i", (duration) => {
      const result = GoogleFlowVideosRequestSchema.safeParse({
        ...videosBase,
        duration,
      });
      expect(result.success).toBe(true);
    });

    it.each([0, 5, 12, 8.5])("should reject duration %s", (duration) => {
      const result = GoogleFlowVideosRequestSchema.safeParse({
        ...videosBase,
        duration,
      });
      expect(result.success).toBe(false);
    });
  });
});

// GF-S2 tightens GoogleFlowImagesRequestSchema: `model` now uses the open-enum
// + nano-banana family-alias hatch (a typo like "nano-banna-2" no longer slips
// through a bare `.or(z.string())`, and foreign families like "gpt-image-1" /
// "veo-3.1-fast" are rejected), `seed` carries the documented `>= 0` bound, and
// `aspectRatio: "auto"` is rejected unless an image-to-image reference input
// (reference_* or character_*) is present.
const imagesCases: Array<[Record<string, unknown>, boolean]> = [
  // model: listed ids, a well-formed unlisted alias, and deprecated aliases
  [{ prompt: "x", model: "nano-banana-pro" }, true],
  [{ prompt: "x", model: "nano-banana-3" }, true],
  [{ prompt: "x", model: "nano-banana" }, true],
  [{ prompt: "x", model: "imagen-4" }, true],
  // model: a misspelled stem and foreign families are rejected
  [{ prompt: "x", model: "nano-banna-2" }, false],
  [{ prompt: "x", model: "gpt-image-1" }, false],
  [{ prompt: "x", model: "veo-3.1-fast" }, false],
  // seed: documented lower bound of 0
  [{ prompt: "x", seed: 0 }, true],
  [{ prompt: "x", seed: 5 }, true],
  [{ prompt: "x", seed: -1 }, false],
  // aspectRatio "auto" requires a reference_* or character_* input
  [{ prompt: "x", aspectRatio: "auto" }, false],
  [{ prompt: "x", aspectRatio: "auto", reference_1: "m" }, true],
  [{ prompt: "x", aspectRatio: "auto", character_1: "c" }, true],
];

describe("GoogleFlowImagesRequestSchema strictness (GF-S2)", () => {
  it.each(imagesCases)("safeParse(%j) success === %s", (input, expected) => {
    const result = GoogleFlowImagesRequestSchema.safeParse(input);
    expect(result.success).toBe(expected);
  });
});

const EMAIL = "user@example.com";

describe("googleflow email requirement split", () => {
  describe("required: email names the resource, not an account preference", () => {
    it("rejects a missing email on the account path schema", () => {
      const result = GoogleFlowEmailRequestSchema.safeParse({});
      expect(result.success).toBe(false);
    });

    it("accepts a present email on the account path schema", () => {
      const result = GoogleFlowEmailRequestSchema.safeParse({ email: EMAIL });
      expect(result.success).toBe(true);
    });

    it("rejects an empty email on the account path schema", () => {
      const result = GoogleFlowEmailRequestSchema.safeParse({ email: "" });
      expect(result.success).toBe(false);
    });

    it("rejects a missing email when listing characters", () => {
      const result = GoogleFlowCharactersListRequestSchema.safeParse({});
      expect(result.success).toBe(false);
    });

    it("accepts a present email when listing characters", () => {
      const result = GoogleFlowCharactersListRequestSchema.safeParse({
        email: EMAIL,
      });
      expect(result.success).toBe(true);
    });

    it("rejects a missing email when creating a voice", () => {
      const result = GoogleFlowVoicesCreateRequestSchema.safeParse({
        voice: "Achernar",
        displayName: "Cheerful Narrator",
        dialog: "Hello, this is a test voice.",
        voicePerformance: "Cheerful, energetic delivery",
      });
      expect(result.success).toBe(false);
    });

    it("accepts a present email when creating a voice", () => {
      const result = GoogleFlowVoicesCreateRequestSchema.safeParse({
        email: EMAIL,
        voice: "Achernar",
        displayName: "Cheerful Narrator",
        dialog: "Hello, this is a test voice.",
        voicePerformance: "Cheerful, energetic delivery",
      });
      expect(result.success).toBe(true);
    });

    // Upstream documents GET /voices email as "required" and returns
    // 400 "Parameter email is required" when it is absent, so listing voices
    // stays required even though the generation endpoints do not.
    it("rejects a missing email when listing voices", () => {
      const result = GoogleFlowVoicesListRequestSchema.safeParse({
        source: "user",
      });
      expect(result.success).toBe(false);
    });

    it("accepts a present email when listing voices", () => {
      const result = GoogleFlowVoicesListRequestSchema.safeParse({
        email: EMAIL,
        source: "user",
      });
      expect(result.success).toBe(true);
    });
  });

  describe("optional: the API selects an account when email is omitted", () => {
    it("accepts an asset upload without an email", () => {
      const result = GoogleFlowAssetUploadRequestSchema.safeParse({
        body: "raw-bytes",
        contentType: "image/png",
      });
      expect(result.success).toBe(true);
    });

    it("accepts an asset upload with an email", () => {
      const result = GoogleFlowAssetUploadRequestSchema.safeParse({
        body: "raw-bytes",
        contentType: "image/png",
        email: EMAIL,
      });
      expect(result.success).toBe(true);
    });

    it("accepts an image generation without an email", () => {
      const result = GoogleFlowImagesRequestSchema.safeParse({
        prompt: "a cat",
      });
      expect(result.success).toBe(true);
    });

    it("accepts an image generation with an email", () => {
      const result = GoogleFlowImagesRequestSchema.safeParse({
        prompt: "a cat",
        email: EMAIL,
      });
      expect(result.success).toBe(true);
    });

    it("accepts a video generation without an email", () => {
      const result = GoogleFlowVideosRequestSchema.safeParse({
        prompt: "a cat",
      });
      expect(result.success).toBe(true);
    });

    it("accepts a video generation with an email", () => {
      const result = GoogleFlowVideosRequestSchema.safeParse({
        prompt: "a cat",
        email: EMAIL,
      });
      expect(result.success).toBe(true);
    });
  });
});
