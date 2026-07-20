import { describe, it, expect } from "vitest";

import {
  XaiResponseRequestSchema,
  XaiVideoGenerateRequestSchema,
} from "../../packages/provider/xai/src/zod";

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

// xAI retired Live Search. Probed live on 2026-07-20 with a valid key:
// `search_parameters` returns HTTP 410 ("Live search is deprecated. Please
// switch to the Agent Tools API") from both POST /v1/chat/completions and
// POST /v1/responses, while the same requests without it return 200. The
// field is therefore rejected outright rather than having its members
// tightened. See packages/provider/xai/src/zod.ts.

const base = {
  model: "grok-4-fast",
  input: "What is AI?",
};

describe("XaiResponseRequestSchema search contract", () => {
  describe("search_parameters is retired", () => {
    it("accepts a request that omits search_parameters", () => {
      const result = XaiResponseRequestSchema.safeParse(base);

      expect(result.success).toBe(true);
    });

    it("accepts an explicit undefined search_parameters", () => {
      const result = XaiResponseRequestSchema.safeParse({
        ...base,
        search_parameters: undefined,
      });

      expect(result.success).toBe(true);
    });

    it("rejects a previously valid search_parameters object", () => {
      const result = XaiResponseRequestSchema.safeParse({
        ...base,
        search_parameters: { mode: "auto", max_search_results: 5 },
      });

      expect(result.success).toBe(false);
      expect(
        result.error?.issues.some((issue) =>
          issue.path.includes("search_parameters")
        )
      ).toBe(true);
    });

    it("names the Agent Tools API replacement in the error message", () => {
      const result = XaiResponseRequestSchema.safeParse({
        ...base,
        search_parameters: { mode: "auto" },
      });

      const message = result.error?.issues.find((issue) =>
        issue.path.includes("search_parameters")
      )?.message;

      expect(message).toContain("410");
      expect(message).toContain("web_search");
    });

    // The previously loose members are the reason WI-18 existed. Each is now
    // rejected by the parent field rather than validated individually, which
    // is strictly stronger than the enum/date tightening the plan proposed.
    it.each([
      ["sources as bare strings", { sources: ["web", "x"] }],
      ["sources as objects", { sources: [{ type: "web" }] }],
      ["from_date", { from_date: "2026-01-01" }],
      ["to_date", { to_date: "not-a-date" }],
      ["return_citations", { return_citations: true }],
    ])("rejects search_parameters carrying %s", (_label, value) => {
      const result = XaiResponseRequestSchema.safeParse({
        ...base,
        search_parameters: value,
      });

      expect(result.success).toBe(false);
    });
  });

  describe("the replacement contract still validates", () => {
    it("accepts tools: [{ type: 'web_search' }]", () => {
      const result = XaiResponseRequestSchema.safeParse({
        ...base,
        tools: [{ type: "web_search" }],
      });

      expect(result.success).toBe(true);
    });

    it("accepts tools: [{ type: 'web_search_preview' }]", () => {
      const result = XaiResponseRequestSchema.safeParse({
        ...base,
        tools: [{ type: "web_search_preview" }],
      });

      expect(result.success).toBe(true);
    });

    it("rejects an unknown tool type", () => {
      const result = XaiResponseRequestSchema.safeParse({
        ...base,
        tools: [{ type: "live_search" }],
      });

      expect(result.success).toBe(false);
    });
  });
});
