import { describe, expect, it } from "vitest";
import { FAL_ENDPOINT_REQUEST_SCHEMAS } from "@apicity/fal/zod";
import { computeEstimate } from "../../packages/provider/cost/src/compute";
import type { CostHints } from "../../packages/provider/cost/src/types";

// The request limits and option lists that the first full fal schema-drift
// run (tests/fixtures/fal-schema-evidence/schema-drift-2026-11-27.json) found
// narrower than fal's live queue OpenAPI, widened to the live value. Each
// row was re-read from the queue OpenAPI on 2026-11-27 before the change: the
// new value is accepted, and one past the limit (or a value the live list
// does not carry) is still refused.

type EndpointId = keyof typeof FAL_ENDPOINT_REQUEST_SCHEMAS;

const IMAGE = "https://example.com/cat1.jpg";

// The smallest body each endpoint accepts, so a row tests only its field.
const BASE: Partial<Record<EndpointId, Record<string, unknown>>> = {
  "fal-ai/bytedance/seedream/v5/lite/edit": {
    prompt: "Make it rain",
    image_urls: [IMAGE],
  },
  "fal-ai/bytedance/seedream/v5/lite/text-to-image": { prompt: "A fox" },
  "fal-ai/wan/v2.7/edit": { prompt: "Watercolor", image_urls: [IMAGE] },
  "fal-ai/wan/v2.7/pro/edit": { prompt: "Watercolor", image_urls: [IMAGE] },
  "fal-ai/wan/v2.7/text-to-image": { prompt: "A fox" },
  "fal-ai/wan/v2.7/pro/text-to-image": { prompt: "A fox" },
  "meshy/v6-lite/retexture": {
    model_url: "https://example.com/model.glb",
    text_style_prompt: "red and black chest",
  },
  "meshy/v7.1/image-to-3d": { image_url: IMAGE },
  "meshy/v7.1/multi-image-to-3d": { image_urls: [IMAGE] },
  "meshy/v7.1/text-to-3d": { prompt: "A chest" },
  "meshy/v7/image-to-3d": { image_url: IMAGE },
  "xai/grok-imagine-image/v2.0/edit": { prompt: "A cat", image_urls: [IMAGE] },
  "xai/grok-imagine-image/v2.0/text-to-image": { prompt: "A cat" },
  "bytedance/seedance-2.5/reference-to-video": { prompt: "A cat waves" },
  "bytedance/seedance-2.5/us/reference-to-video": { prompt: "A cat waves" },
  "bytedance/seedream/v5/flash/edit": {
    prompt: "Recolor",
    image_urls: [IMAGE],
  },
  "bytedance/seedream/v5/flash/text-to-image": { prompt: "A fox" },
  "bytedance/seedream/v5/pro/edit": { prompt: "Recolor", image_urls: [IMAGE] },
  "bytedance/seedream/v5/pro/text-to-image": { prompt: "A fox" },
  "fal-ai/kling-video/v3/pro/image-to-video": { start_image_url: IMAGE },
  "fal-ai/nano-banana-pro": { prompt: "A fox" },
  "fal-ai/nano-banana-pro/edit": { prompt: "Recolor", image_urls: [IMAGE] },
  "ideogram/v4.5": { prompt: "A poster" },
  "ideogram/v4.5/edit": { prompt: "Recolor", image_url: IMAGE },
  "kling/v4/reference-to-video": {
    prompt: "@Image1 waves once",
    image_urls: [IMAGE],
  },
  "kling/v4/text-to-video": { prompt: "A red panda waves" },
  "krea/v3/text-to-image": { prompt: "A fox" },
  "xai/grok-imagine-image": { prompt: "A cat" },
  "xai/grok-imagine-video/v1.5/lite/text-to-video": { prompt: "A cat" },
  "xai/grok-imagine-video/v1.5/reference-to-video": {
    prompt: "<IMAGE_0> waves",
    reference_image_urls: [IMAGE],
  },
  "xai/grok-imagine-video/v1.5/text-to-video": { prompt: "A cat" },
};

const text = (length: number) => "a".repeat(length);

// endpoint | field | newly accepted values | values still refused
const ROWS: ReadonlyArray<
  readonly [EndpointId, string, readonly unknown[], readonly unknown[]]
> = [
  // Limits
  ["fal-ai/bytedance/seedream/v5/lite/edit", "max_images", [7, 15], [16]],
  [
    "fal-ai/bytedance/seedream/v5/lite/text-to-image",
    "max_images",
    [7, 15],
    [16],
  ],
  ["fal-ai/wan/v2.7/edit", "prompt", [text(2000)], [text(2001)]],
  ["fal-ai/wan/v2.7/pro/edit", "prompt", [text(2000)], [text(2001)]],
  ["fal-ai/wan/v2.7/pro/text-to-image", "prompt", [text(2000)], [text(2001)]],
  ["fal-ai/wan/v2.7/text-to-image", "prompt", [text(2000)], [text(2001)]],
  ["meshy/v6-lite/retexture", "text_style_prompt", [text(800)], [text(801)]],
  ["meshy/v7.1/image-to-3d", "texture_prompt", [text(800)], [text(801)]],
  ["meshy/v7.1/multi-image-to-3d", "texture_prompt", [text(800)], [text(801)]],
  ["meshy/v7.1/text-to-3d", "texture_prompt", [text(800)], [text(801)]],
  ["meshy/v7/image-to-3d", "texture_prompt", [text(800)], [text(801)]],
  ["xai/grok-imagine-image/v2.0/edit", "num_images", [5, 10], [11]],
  ["xai/grok-imagine-image/v2.0/text-to-image", "num_images", [5, 10], [11]],
  // Option lists
  ["bytedance/seedance-2.5/reference-to-video", "task", ["auto"], ["Auto"]],
  ["bytedance/seedance-2.5/us/reference-to-video", "task", ["auto"], ["Auto"]],
  [
    "bytedance/seedream/v5/flash/edit",
    "image_size",
    ["auto_1.5K"],
    ["auto_3K"],
  ],
  [
    "bytedance/seedream/v5/flash/text-to-image",
    "image_size",
    ["auto_1.5K"],
    ["auto_3K"],
  ],
  ["bytedance/seedream/v5/pro/edit", "image_size", ["auto_1.5K"], ["auto_3K"]],
  [
    "bytedance/seedream/v5/pro/text-to-image",
    "image_size",
    ["auto_1.5K"],
    ["auto_3K"],
  ],
  [
    "fal-ai/kling-video/v3/pro/image-to-video",
    "shot_type",
    ["intelligent"],
    ["auto"],
  ],
  [
    "fal-ai/nano-banana-pro",
    "aspect_ratio",
    ["4:1", "1:4", "8:1", "1:8"],
    ["16:1"],
  ],
  [
    "fal-ai/nano-banana-pro/edit",
    "aspect_ratio",
    ["4:1", "1:4", "8:1", "1:8"],
    ["16:1"],
  ],
  ["ideogram/v4.5", "image_size", ["auto"], ["provider_auto"]],
  ["ideogram/v4.5/edit", "image_size", ["provider_auto"], ["provider"]],
  ["kling/v4/reference-to-video", "aspect_ratio", ["4:3", "3:4"], ["2:3"]],
  ["kling/v4/text-to-video", "aspect_ratio", ["4:3", "3:4"], ["2:3"]],
  // v1 lists auto but not v2.0's 21:9 and 5:2.
  ["xai/grok-imagine-image", "aspect_ratio", ["auto"], ["21:9", "5:2"]],
  [
    "xai/grok-imagine-image/v2.0/edit",
    "aspect_ratio",
    ["21:9", "5:2"],
    ["3:1"],
  ],
  ["xai/grok-imagine-image/v2.0/edit", "quality", ["auto"], ["high"]],
  [
    "xai/grok-imagine-image/v2.0/text-to-image",
    "aspect_ratio",
    ["auto", "21:9", "5:2"],
    ["3:1"],
  ],
  ["xai/grok-imagine-image/v2.0/text-to-image", "quality", ["auto"], ["high"]],
  [
    "xai/grok-imagine-video/v1.5/lite/text-to-video",
    "aspect_ratio",
    ["21:9", "5:2"],
    ["auto", "9:21"],
  ],
  [
    "xai/grok-imagine-video/v1.5/reference-to-video",
    "aspect_ratio",
    ["21:9", "5:2"],
    ["auto", "9:21"],
  ],
  [
    "xai/grok-imagine-video/v1.5/text-to-video",
    "aspect_ratio",
    ["21:9", "5:2"],
    ["auto", "9:21"],
  ],
];

function accepts(endpoint: EndpointId, extra: Record<string, unknown> = {}) {
  const schema = FAL_ENDPOINT_REQUEST_SCHEMAS[endpoint];
  return schema.safeParse({ ...BASE[endpoint], ...extra }).success;
}

describe("fal request schemas widened to the live queue OpenAPI (2026-11-27)", () => {
  it("covers the 34 widened rows on 30 endpoints, each with a base body", () => {
    expect(ROWS).toHaveLength(34);
    expect(new Set(ROWS.map(([endpoint]) => endpoint)).size).toBe(30);
    for (const endpoint of Object.keys(BASE) as EndpointId[]) {
      expect(accepts(endpoint), endpoint).toBe(true);
    }
  });

  it.each(ROWS)(
    "%s %s accepts the live values and still refuses the rest",
    (endpoint, field, accepted, refused) => {
      for (const value of accepted) {
        expect(accepts(endpoint, { [field]: value }), String(value)).toBe(true);
      }
      for (const value of refused) {
        expect(accepts(endpoint, { [field]: value }), String(value)).toBe(
          false
        );
      }
    }
  );

  // Left out on purpose: the live list adds `high`, but neither the card
  // ("$0.025/MP") nor the field description publishes a rate for it, and the
  // edit endpoint's `high` carries a surcharge, so the estimate could not be
  // right for it.
  it("keeps krea/v3/text-to-image reasoning_level high refused", () => {
    expect(accepts("krea/v3/text-to-image", { reasoning_level: "high" })).toBe(
      false
    );
  });
});

describe("Seedream 5 Lite estimates with sequential generation", () => {
  const estimate = (
    endpoint: string,
    payload: Record<string, unknown>,
    costHints?: CostHints
  ) => computeEstimate({ provider: "fal", endpoint, payload, costHints });
  const t2i = "fal-ai/bytedance/seedream/v5/lite/text-to-image";
  const edit = "fal-ai/bytedance/seedream/v5/lite/edit";

  it("prices one image per generation at the default max_images", () => {
    for (const payload of [
      { prompt: "A fox" },
      { prompt: "A fox", max_images: 1 },
    ]) {
      const result = estimate(t2i, payload);
      expect(result.usd).toBeCloseTo(0.035, 10);
      expect(result.warnings).toEqual([]);
    }
    const two = estimate(t2i, { prompt: "A fox", num_images: 2 });
    expect(two.usd).toBeCloseTo(0.07, 10);
    expect(two.breakdown).toMatchObject({ units: 2, unit: "images" });
  });

  it("prices sequential generation at its cap and says it is an upper bound", () => {
    const result = estimate(t2i, {
      prompt: "A fox",
      num_images: 2,
      max_images: 15,
    });
    expect(result.breakdown).toMatchObject({ units: 30, unit: "images" });
    expect(result.usd).toBeCloseTo(1.05, 10);
    expect(result.warnings).toHaveLength(1);
    expect(result.warnings[0]).toContain("upper bound");
    expect(result.warnings[0]).toContain("costHints.outputImages");

    const edited = estimate(edit, {
      prompt: "Make it rain",
      image_urls: [IMAGE],
      max_images: 7,
    });
    expect(edited.breakdown).toMatchObject({ units: 7, unit: "images" });
    expect(edited.usd).toBeCloseTo(0.245, 10);
  });

  it("prices the returned count when costHints.outputImages states it", () => {
    const payload = { prompt: "A fox", num_images: 2, max_images: 15 };
    const exact = estimate(t2i, payload, { outputImages: 4 });
    expect(exact.breakdown).toMatchObject({ units: 4, unit: "images" });
    expect(exact.usd).toBeCloseTo(0.14, 10);
    expect(exact.warnings).toEqual([]);

    const over = estimate(t2i, payload, { outputImages: 31 });
    expect(over.usd).toBe(0);
    expect(over.breakdown).toEqual({});
    expect(over.warnings.join(" ")).toContain("no greater than 30");
  });

  it("counts one image per generation when sequential generation is disabled", () => {
    const result = estimate(t2i, {
      prompt: "A fox",
      num_images: 3,
      max_images: 15,
      sequential_image_generation: "disabled",
    });
    expect(result.breakdown).toMatchObject({ units: 3, unit: "images" });
    expect(result.warnings).toEqual([]);
  });

  it("fails closed on a max_images that is not a positive integer", () => {
    for (const max_images of [0, 2.5, "3"]) {
      const result = estimate(t2i, { prompt: "A fox", max_images });
      expect(result.usd, String(max_images)).toBe(0);
      expect(result.breakdown).toEqual({});
      expect(result.warnings.join(" ")).toContain("max_images");
    }
  });
});

describe("Seedance 2.5 reference-to-video task auto", () => {
  // auto lets the model pick the task, which may be editing or extension;
  // both coerce the output size to auto, so the request does not fix it.
  it.each([
    "bytedance/seedance-2.5/reference-to-video",
    "bytedance/seedance-2.5/us/reference-to-video",
  ])("%s is not priced, and the warning names the task", (endpoint) => {
    const result = computeEstimate({
      provider: "fal",
      endpoint,
      payload: {
        prompt: "A cat waves",
        task: "auto",
        resolution: "720p",
        duration: "5",
        aspect_ratio: "16:9",
      },
    });
    expect(result.usd).toBe(0);
    expect(result.breakdown).toEqual({});
    expect(result.warnings.join(" ")).toContain("task 'auto' is not priced");
  });
});
