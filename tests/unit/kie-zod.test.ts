import { describe, expect, it } from "vitest";

import {
  Seedance2FastInputSchema,
  Seedance2InputSchema,
  Seedance2MiniInputSchema,
} from "@apicity/kie/zod";

const HTTPS_URL = "https://example.com/image.png";
const LOCAL_PATH = "@asset/photo.png";

function urlIssueMessages(
  result:
    | ReturnType<typeof Seedance2MiniInputSchema.safeParse>
    | ReturnType<typeof Seedance2InputSchema.safeParse>
    | ReturnType<typeof Seedance2FastInputSchema.safeParse>
): string[] {
  return (result.error?.issues ?? [])
    .filter((issue) => issue.path.includes("reference_image_urls"))
    .map((issue) => issue.message);
}

// All three seedance variants share the `.max(9)` cap, so that is asserted
// across the family. Media elements are plain strings family-wide: schemas
// validate the construction boundary, where fields may still hold local
// slugs such as `@asset/photo.png` (URL reachability is kie.ai's job at
// task-creation time). The presence axis differs: mini defaults to `[]`,
// the siblings stay `.optional()`.
const VARIANTS = [
  {
    name: "bytedance/seedance-2-mini",
    schema: Seedance2MiniInputSchema,
    base: {},
  },
  {
    name: "bytedance/seedance-2",
    schema: Seedance2InputSchema,
    base: { prompt: "a cinematic drone shot over a canyon" },
  },
  {
    name: "bytedance/seedance-2-fast",
    schema: Seedance2FastInputSchema,
    base: { prompt: "a cinematic drone shot over a canyon" },
  },
] as const;

describe("KIE Zod schema validation", () => {
  describe.each(VARIANTS)(
    "$name reference_image_urls cap",
    ({ schema, base }) => {
      it("accepts an at-cap array of 9 URLs", () => {
        const result = schema.safeParse({
          ...base,
          reference_image_urls: Array(9).fill(HTTPS_URL),
        });
        expect(result.success).toBe(true);
      });

      it("rejects an over-cap array of 10 URLs", () => {
        const result = schema.safeParse({
          ...base,
          reference_image_urls: Array(10).fill(HTTPS_URL),
        });
        expect(result.success).toBe(false);
        expect(urlIssueMessages(result).length).toBeGreaterThan(0);
      });
    }
  );

  // Review finding R-2: an earlier revision tightened `.url()` onto reference
  // elements, which is breaking for callers currently passing non-URL strings
  // (e.g. not-yet-uploaded local slugs). Pinned family-wide so the tightening
  // cannot return without its own requirement.
  describe.each(VARIANTS)(
    "$name accepts non-URL strings",
    ({ schema, base }) => {
      it("does not enforce a URL shape on reference_image_urls", () => {
        const result = schema.safeParse({
          ...base,
          reference_image_urls: [LOCAL_PATH],
        });
        expect(result.success).toBe(true);
      });
    }
  );

  describe("bytedance/seedance-2-mini local slug acceptance", () => {
    it("accepts local slugs in all three reference arrays", () => {
      const result = Seedance2MiniInputSchema.safeParse({
        reference_image_urls: ["@img-ref-1"],
        reference_video_urls: ["@vid-ref-1"],
        reference_audio_urls: ["not-a-url"],
      });
      expect(result.success).toBe(true);
    });

    it("accepts a valid HTTPS URL", () => {
      const result = Seedance2MiniInputSchema.safeParse({
        reference_image_urls: [HTTPS_URL],
      });
      expect(result.success).toBe(true);
    });
  });

  describe("seedance reference_image_urls presence semantics", () => {
    it("defaults mini's reference_image_urls to an empty array", () => {
      const result = Seedance2MiniInputSchema.safeParse({});
      expect(result.success).toBe(true);
      expect(result.data?.reference_image_urls).toEqual([]);
    });

    it("leaves the siblings' reference_image_urls absent when omitted", () => {
      const result = Seedance2InputSchema.safeParse({
        prompt: "a cinematic drone shot over a canyon",
      });
      expect(result.success).toBe(true);
      expect(result.data?.reference_image_urls).toBeUndefined();
    });
  });
});
