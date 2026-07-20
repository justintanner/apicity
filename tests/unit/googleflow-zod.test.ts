import { describe, it, expect } from "vitest";

import {
  GoogleFlowVideosRequestSchema,
  GoogleFlowVideosExtendRequestSchema,
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
