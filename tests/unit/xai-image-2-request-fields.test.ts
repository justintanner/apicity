import { describe, expect, it } from "vitest";

import {
  XaiImageEditRequestSchema as edit,
  XaiImageGenerateRequestSchema as generate,
  XaiVideoGenerateRequestSchema,
} from "../../packages/provider/xai/src/zod";

// grok-imagine-image-2.0's request fields, as docs.x.ai documents them and as
// xAI's request parser listed them in free 422 probes on 2026-10-31.
const model = "grok-imagine-image-2.0";
const source = { url: "https://example.com/cat1.jpg" };
const generation = { model, prompt: "a cat" };
const editing = { model, prompt: "add a hat", image: source };

const schemas = [
  ["generations", generate, generation],
  ["edits", edit, editing],
] as const;

describe("xAI image request fields for grok-imagine-image-2.0", () => {
  it.each(schemas)(
    "takes the documented quality values on %s",
    (_, s, base) => {
      for (const quality of ["low", "medium", "auto"])
        expect(s.safeParse({ ...base, quality }).success, quality).toBe(true);
      // The parser also takes "high", which the docs do not list.
      for (const quality of ["high", "bogus", "LOW", 1])
        expect(s.safeParse({ ...base, quality }).success, String(quality)).toBe(
          false
        );
    }
  );

  it.each(schemas)("takes 1k, 1.5k and 2k on %s", (_, s, base) => {
    for (const resolution of ["1k", "1.5k", "2k"])
      expect(s.safeParse({ ...base, resolution }).success, resolution).toBe(
        true
      );
    for (const resolution of ["4k", "1.5K", "3k"])
      expect(s.safeParse({ ...base, resolution }).success, resolution).toBe(
        false
      );
  });

  it.each(schemas)(
    "takes the 21:9 and 5:2 aspect ratios on %s",
    (_, s, base) => {
      for (const aspect_ratio of ["21:9", "5:2", "16:9", "auto"])
        expect(
          s.safeParse({ ...base, aspect_ratio }).success,
          aspect_ratio
        ).toBe(true);
      for (const aspect_ratio of ["2:5", "9:21", "32:9"])
        expect(
          s.safeParse({ ...base, aspect_ratio }).success,
          aspect_ratio
        ).toBe(false);
    }
  );

  // The video parser lists nine ratios, 21:9 and 5:2 among them (free 422
  // probe, 2026-11-01); the image-only ratios stay off video.
  it("keeps the image-only aspect ratios off video", () => {
    for (const aspect_ratio of ["2:1", "20:9", "auto"])
      expect(
        XaiVideoGenerateRequestSchema.safeParse({
          prompt: "a cat",
          aspect_ratio,
        }).success,
        aspect_ratio
      ).toBe(false);
  });

  it("edits up to five sources, as images or stored file ids", () => {
    const base = { model, prompt: editing.prompt };
    for (const count of [1, 5]) {
      expect(
        edit.safeParse({ ...base, images: Array(count).fill(source) }).success,
        `images ${count}`
      ).toBe(true);
      expect(
        edit.safeParse({
          ...base,
          image_file_ids: Array.from({ length: count }, (_, i) => `file_${i}`),
        }).success,
        `image_file_ids ${count}`
      ).toBe(true);
    }
    expect(
      edit.safeParse({ ...base, images: Array(6).fill(source) }).success
    ).toBe(false);
    expect(
      edit.safeParse({
        ...base,
        image_file_ids: Array.from({ length: 6 }, (_, i) => `file_${i}`),
      }).success
    ).toBe(false);
  });

  it("documents quality as a grok-imagine-image-2.0 field", () => {
    expect(generate.shape.quality.unwrap().description).toContain(
      "grok-imagine-image-2.0 only"
    );
  });
});
