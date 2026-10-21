import { describe, it, expect } from "vitest";
import {
  Flux3KleinTextToImageRequestSchema,
  Flux3KleinEditImageRequestSchema,
  CreateTaskRequestSchema,
} from "../../packages/provider/kie/src/zod";
import { CREATE_TASK_GUARDS } from "../../packages/provider/kie/src/kie";
import { computeEstimate } from "../../packages/provider/cost/src/compute";

describe("FLUX 3 Klein", () => {
  it.each(["flux-3/klein-text-to-image", "flux-3/klein-edit-image"] as const)(
    "%s accepts defaults and all resolution tiers",
    (model) => {
      for (const resolution of [undefined, "1K", "2K", "4K"]) {
        const request = {
          model,
          input: {
            prompt: "Cat",
            resolution,
            ...(model.endsWith("edit-image")
              ? { image_urls: ["https://example.com/cat.jpg"] }
              : {}),
          },
        };
        expect(CREATE_TASK_GUARDS[model].safeParse(request).success).toBe(true);
        expect(CreateTaskRequestSchema.safeParse(request).success).toBe(true);
      }
    }
  );
  it.each([
    { width: 512 },
    { height: 512 },
    { width: 255, height: 512 },
    { width: 4097, height: 4096 },
    { width: 512.5, height: 512 },
    { width: 256, height: 1024 },
    { width: 1024, height: 256 },
    { num_images: 0 },
    { num_images: 5 },
    { num_images: 1.5 },
    { seed: -1 },
    { seed: 2147483648 },
    { resolution: "8K" },
    { aspect_ratio: "auto" },
    { prompt: "" },
    { prompt: "x".repeat(5001) },
  ])("rejects invalid text-to-image input %#", (input) => {
    expect(
      Flux3KleinTextToImageRequestSchema.safeParse({
        model: "flux-3/klein-text-to-image",
        input: { prompt: "Cat", ...input },
      }).success
    ).toBe(false);
  });
  it("accepts custom dimensions on the inclusive ratio boundaries", () => {
    for (const [width, height] of [
      [640, 256],
      [256, 640],
      [4096, 4096],
    ]) {
      expect(
        Flux3KleinTextToImageRequestSchema.safeParse({
          model: "flux-3/klein-text-to-image",
          input: { prompt: "Cat", width, height },
        }).success
      ).toBe(true);
    }
  });
  it.each([
    undefined,
    [],
    ["data:image/png;base64,eA=="],
    ["ftp://example.com/cat.jpg"],
    Array(11).fill("https://example.com/cat.jpg"),
  ])("rejects invalid references %#", (image_urls) => {
    expect(
      Flux3KleinEditImageRequestSchema.safeParse({
        model: "flux-3/klein-edit-image",
        input: { prompt: "Add a bow", image_urls },
      }).success
    ).toBe(false);
  });
  it("preserves edit defaults", () => {
    const parsed = Flux3KleinEditImageRequestSchema.parse({
      model: "flux-3/klein-edit-image",
      input: {
        prompt: "Add a bow",
        image_urls: ["https://example.com/cat.jpg"],
      },
    });
    expect(parsed.input).toMatchObject({
      aspect_ratio: "auto",
      resolution: "1K",
      num_images: 1,
      output_format: "png",
      enhance_prompt: true,
      nsfw_checker: false,
    });
  });
});

describe("FLUX 3 Klein pricing", () => {
  it.each(["flux-3/klein-text-to-image", "flux-3/klein-edit-image"])(
    "%s prices each resolution and image count",
    (model) => {
      for (const [resolution, rate] of [
        ["1K", 0.008],
        ["2K", 0.0125],
        ["4K", 0.0325],
      ] as const) {
        const estimate = computeEstimate({
          provider: "kie",
          payload: { model, input: { resolution, num_images: 4 } },
        });
        expect(estimate.usd).toBeCloseTo(rate * 4, 10);
      }
      expect(
        computeEstimate({ provider: "kie", payload: { model, input: {} } }).usd
      ).toBe(0.008);
      const custom = computeEstimate({
        provider: "kie",
        payload: {
          model,
          input: { width: 4096, height: 4096, resolution: "1K" },
        },
      });
      expect(custom.usd).toBe(0);
      expect(custom.warnings.join(" ")).toContain("missing required selector");
    }
  );
});
