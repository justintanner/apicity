import { describe, it, expect } from "vitest";

import {
  XaiResponseRequestSchema,
  XaiVideoGenerateRequestSchema,
  XaiVideoReferenceAudioSchema,
} from "../../packages/provider/xai/src/zod";

// xAI's reference-to-video contract caps each request at 7 reference images;
// legacy grok-imagine-video references retain a 10-second duration cap.
const REFERENCE_IMAGE_MAX = 7;
const REFERENCE_AUDIO_MAX = 3;

const reference = (index: number) => ({
  url: `https://example.com/reference-${index}.png`,
});

const fileId = (index: number) => `file-${index}`;

describe("XaiVideoGenerateRequestSchema reference constraints", () => {
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

    it("accepts ordered mixed URL, data-URI, and file-ID references", () => {
      const reference_images = [
        { url: "https://example.com/reference.png" },
        { url: "data:image/png;base64,AAAA" },
        { file_id: "file_reference" },
      ];
      const result = XaiVideoGenerateRequestSchema.safeParse({
        prompt: "a cat riding a skateboard",
        reference_images,
      });

      expect(result.success).toBe(true);
      expect(result.success && result.data.reference_images).toEqual(
        reference_images
      );
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
    it("accepts a 12-second generation duration without references", () => {
      const result = XaiVideoGenerateRequestSchema.safeParse({
        prompt: "a cat riding a skateboard",
        duration: 12,
      });

      expect(result.success).toBe(true);
    });

    it("accepts the 10-second reference-image maximum", () => {
      const urlResult = XaiVideoGenerateRequestSchema.safeParse({
        prompt: "a cat riding a skateboard",
        duration: 10,
        reference_images: [reference(0)],
      });
      const fileResult = XaiVideoGenerateRequestSchema.safeParse({
        prompt: "a cat riding a skateboard",
        duration: 10,
        reference_image_file_ids: [fileId(0)],
      });

      expect(urlResult.success).toBe(true);
      expect(fileResult.success).toBe(true);
    });

    it("accepts 15 seconds with model-less 1.5 reference images", () => {
      const result = XaiVideoGenerateRequestSchema.safeParse({
        prompt: "a cat riding a skateboard",
        duration: 15,
        reference_images: [reference(0)],
      });

      expect(result.success).toBe(true);
    });

    it("retains the 10-second cap for legacy reference images", () => {
      const result = XaiVideoGenerateRequestSchema.safeParse({
        prompt: "a cat riding a skateboard",
        duration: 11,
        model: "grok-imagine-video",
        reference_image_file_ids: [fileId(0)],
      });

      expect(result.success).toBe(false);
      expect(
        result.error?.issues.some((issue) => issue.path.includes("duration"))
      ).toBe(true);
    });

    it("rejects a duration above the documented 15-second range", () => {
      const result = XaiVideoGenerateRequestSchema.safeParse({
        prompt: "a cat riding a skateboard",
        duration: 16,
      });

      expect(result.success).toBe(false);
    });
  });

  describe("reference_audios", () => {
    it("accepts zero through three open, mixed-case voice identifiers", () => {
      for (let count = 0; count <= REFERENCE_AUDIO_MAX; count++) {
        const result = XaiVideoGenerateRequestSchema.safeParse({
          prompt: "a singer walks onto a stage",
          reference_audios: Array.from({ length: count }, (_, index) => ({
            voice_id: index === 0 ? "Eve" : `voice-${index}`,
          })),
        });
        expect(result.success).toBe(true);
      }
    });

    it("rejects four voice references", () => {
      const result = XaiVideoGenerateRequestSchema.safeParse({
        prompt: "a singer walks onto a stage",
        reference_audios: Array.from({ length: 4 }, (_, index) => ({
          voice_id: `voice-${index}`,
        })),
      });

      expect(result.success).toBe(false);
      expect(
        result.error?.issues.some((issue) =>
          issue.path.includes("reference_audios")
        )
      ).toBe(true);
    });

    it.each(["", "   ", "\n\t"])(
      "rejects a blank voice identifier %j",
      (voice_id) => {
        const result = XaiVideoGenerateRequestSchema.safeParse({
          prompt: "a singer walks onto a stage",
          reference_audios: [{ voice_id }],
        });

        expect(result.success).toBe(false);
        expect(
          result.error?.issues.some(
            (issue) =>
              issue.path.includes("reference_audios") &&
              issue.path.includes("voice_id")
          )
        ).toBe(true);
      }
    );

    it("exposes the standalone public voice-reference schema", () => {
      expect(
        XaiVideoReferenceAudioSchema.safeParse({ voice_id: "EVE" }).success
      ).toBe(true);
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
