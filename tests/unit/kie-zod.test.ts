import { describe, expect, it } from "vitest";

import {
  Seedance2FastInputSchema,
  Seedance2InputSchema,
  Seedance2MiniInputSchema,
} from "@apicity/kie/zod";

const HTTPS_URL = "https://example.com/image.png";
const LOCAL_PATH = "@asset/photo.png";

function urlIssueMessages(
  result: ReturnType<typeof Seedance2MiniInputSchema.safeParse>
): string[] {
  return (result.error?.issues ?? [])
    .filter((issue) => issue.path.includes("reference_image_urls"))
    .map((issue) => issue.message);
}

// The three seedance variants share one reference-image URL element schema, so
// the cap, the URL check, and the actionable message are asserted identically
// across the family. Only the presence axis differs: mini defaults to `[]`,
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
  describe.each(VARIANTS)("$name reference_image_urls", ({ schema, base }) => {
    it("rejects a local @asset path", () => {
      const result = schema.safeParse({
        ...base,
        reference_image_urls: [LOCAL_PATH],
      });
      expect(result.success).toBe(false);
    });

    it("names the HTTPS URL requirement when rejecting a local path", () => {
      const result = schema.safeParse({
        ...base,
        reference_image_urls: [LOCAL_PATH],
      });
      const messages = urlIssueMessages(result);
      expect(messages.length).toBeGreaterThan(0);
      expect(messages.join(" ")).toMatch(/HTTPS URL/);
      // The generic zod message would not tell the caller what to supply.
      expect(messages.join(" ")).not.toBe("Invalid url");
    });

    it("accepts a valid HTTPS URL", () => {
      const result = schema.safeParse({
        ...base,
        reference_image_urls: [HTTPS_URL],
      });
      expect(result.success).toBe(true);
    });

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
