import { describe, expect, it } from "vitest";

import { Qwen2ImageEditRequestSchema } from "@apicity/kie/zod";

// The request schema validates the construction boundary: media fields may
// still hold not-yet-uploaded local slugs (kie.ai enforces URL reachability
// server-side at task-creation time). `.min(1)` keeps the empty string
// rejected and the field required.
describe("qwen2/image-edit request schema", () => {
  it("accepts a local slug in input.image_url", () => {
    const result = Qwen2ImageEditRequestSchema.safeParse({
      model: "qwen2/image-edit",
      input: {
        prompt: "replace the sky with a sunset",
        image_url: "@asset/photo.png",
      },
    });
    expect(result.success).toBe(true);
  });

  it("rejects an empty input.image_url", () => {
    const result = Qwen2ImageEditRequestSchema.safeParse({
      model: "qwen2/image-edit",
      input: {
        prompt: "replace the sky with a sunset",
        image_url: "",
      },
    });
    expect(result.success).toBe(false);
  });

  it("rejects a missing input.image_url", () => {
    const result = Qwen2ImageEditRequestSchema.safeParse({
      model: "qwen2/image-edit",
      input: {
        prompt: "replace the sky with a sunset",
      },
    });
    expect(result.success).toBe(false);
  });
});
