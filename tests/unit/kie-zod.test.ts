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
// across the family. The URL *element* check is mini-only: REQ-002 is scoped
// to mini, and applying `.url()` to the siblings would reject payloads their
// callers can send today (review finding R-2). The presence axis also differs:
// mini defaults to `[]`, the siblings stay `.optional()`.
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

const SIBLINGS = VARIANTS.filter((v) => v.schema !== Seedance2MiniInputSchema);

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

  // REQ-002's actual scope. `.url()` already existed on mini before this
  // change, so only the message is new here -- nothing that parsed before
  // stops parsing.
  describe("bytedance/seedance-2-mini reference_image_urls element", () => {
    it("rejects a local @asset path", () => {
      const result = Seedance2MiniInputSchema.safeParse({
        reference_image_urls: [LOCAL_PATH],
      });
      expect(result.success).toBe(false);
    });

    it("names what the caller must supply when rejecting a local path", () => {
      const result = Seedance2MiniInputSchema.safeParse({
        reference_image_urls: [LOCAL_PATH],
      });
      const messages = urlIssueMessages(result);
      expect(messages.length).toBeGreaterThan(0);
      const joined = messages.join(" ");
      expect(joined).toMatch(/publicly reachable URL/);
      // The message must not promise an HTTPS-only constraint the schema does
      // not enforce -- zod's `.url()` accepts `http://` too.
      expect(joined).not.toMatch(/HTTPS URL/);
      // The generic zod message would not tell the caller what to supply.
      expect(joined).not.toBe("Invalid url");
    });

    it("accepts a valid HTTPS URL", () => {
      const result = Seedance2MiniInputSchema.safeParse({
        reference_image_urls: [HTTPS_URL],
      });
      expect(result.success).toBe(true);
    });
  });

  // Review finding R-2: an earlier revision tightened `.url()` onto the two
  // siblings, which is breaking for callers currently passing non-URL strings.
  // Pinned so the tightening cannot return without its own requirement.
  describe.each(SIBLINGS)(
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
