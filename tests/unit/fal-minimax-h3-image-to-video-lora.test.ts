import { describe, expect, expectTypeOf, it } from "vitest";
import { z } from "zod";
import {
  createFal,
  type FalMinimaxH3ImageToVideoLoraParsedRequest,
  type FalMinimaxH3ImageToVideoLoraRequest,
  type FalMinimaxH3ImageToVideoLoraRequestInput,
  type FalRunMinimaxH3ImageToVideoNamespace,
  type FalRunMinimaxH3Namespace,
} from "@apicity/fal";
import {
  FalMinimaxH3ImageToVideoLoraRequestSchema as schema,
  FAL_ENDPOINT_REQUEST_SCHEMAS,
} from "@apicity/fal/zod";
import { computeEstimate } from "../../packages/provider/cost/src/compute";
import { FAL_DYNAMIC_PRICING_ENDPOINTS } from "../../packages/provider/cost/src/pricing/fal";
import {
  MODEL_DISPLAY,
  MODEL_SLUGS,
} from "../../packages/provider/cost/src/slugs";

const endpoint = "minimax/h3/image-to-video/lora";
const loraUrl =
  "https://v3b.fal.media/files/b/0ab058f9/aofDUIQaypkDoDSR5qbeD_lora_weights_step_00001.safetensors";
const recorded = {
  prompt: "apct cat blinks slowly and tilts its head.",
  image_url: "data:image/jpeg;base64,aaaa",
  duration: 5,
  resolution: "480P" as const,
  prompt_expansion_mode: "disabled" as const,
  loras: [{ path: loraUrl, scale: 1 }],
} satisfies FalMinimaxH3ImageToVideoLoraRequest;

function accepts(body: Record<string, unknown>): boolean {
  return schema.safeParse({ ...recorded, ...body }).success;
}

describe("MiniMax H3 image-to-video LoRA", () => {
  it("promotes imageToVideo and adds lora", () => {
    const provider = createFal({ apiKey: "test-key" });
    const h3 = provider.run.minimax.h3;
    expectTypeOf(h3).toEqualTypeOf<FalRunMinimaxH3Namespace>();
    expectTypeOf(
      h3.imageToVideo
    ).toEqualTypeOf<FalRunMinimaxH3ImageToVideoNamespace>();
    expect(h3.imageToVideo).toBe(provider.post.run.minimax.h3.imageToVideo);
    expect(typeof h3.imageToVideo).toBe("function");
    expect(h3.imageToVideo.lora).toBe(
      provider.post.run.minimax.h3.imageToVideo.lora
    );
    expect(h3.imageToVideo.lora.schema).toBe(schema);
    expect(typeof h3.textToVideo).toBe("function");
    expect(h3.textToVideo.lora.schema).toBeDefined();
    expect(h3.referenceToVideo).toBe(
      provider.post.run.minimax.h3.referenceToVideo
    );
    expect(FAL_ENDPOINT_REQUEST_SCHEMAS[endpoint]).toBe(schema);
    expectTypeOf<FalMinimaxH3ImageToVideoLoraRequest>().toEqualTypeOf<
      z.input<typeof schema>
    >();
    expectTypeOf<FalMinimaxH3ImageToVideoLoraRequestInput>().toEqualTypeOf<FalMinimaxH3ImageToVideoLoraRequest>();
    expectTypeOf<FalMinimaxH3ImageToVideoLoraParsedRequest>().toEqualTypeOf<
      z.output<typeof schema>
    >();
  });

  it("follows the OpenAPI field order and the published defaults", () => {
    expect(Object.keys(schema.shape)).toEqual([
      "prompt",
      "duration",
      "resolution",
      "seed",
      "enable_safety_checker",
      "sync_mode",
      "prompt_expansion_mode",
      "target_audio_url",
      "image_url",
      "end_image_url",
      "loras",
    ]);
    const parsed = schema.safeParse({
      prompt: "apct cat",
      loras: [{ path: loraUrl }],
    });
    expect(parsed.success).toBe(true);
    if (!parsed.success) return;
    expect(parsed.data.duration).toBe(5);
    expect(parsed.data.resolution).toBe("2K");
    expect(parsed.data.image_url).toBeUndefined();
    expect(parsed.data.end_image_url).toBeUndefined();
    expect(parsed.data.loras[0]?.scale).toBe(1);
    expect(schema.safeParse({ prompt: "apct cat" }).success).toBe(false);
    expect(accepts({ loras: [] })).toBe(false);
    expect(accepts({ duration: 4 })).toBe(false);
    expect(accepts({ duration: 15 })).toBe(true);
    expect(accepts({ resolution: "480p" })).toBe(false);
    expect(accepts({ image_url: null })).toBe(true);
    expect(accepts({ image_url: "" })).toBe(false);
    expect(accepts({ image_url: "https://example.com/cat.jpg" })).toBe(true);
    expect(accepts({ end_image_url: "data:image/jpeg;base64,bbbb" })).toBe(
      true
    );
    expect(accepts({ loras: [{ path: loraUrl, scale: 4.1 }] })).toBe(false);
    expect(accepts({ unknown_field: 1 })).toBe(true);
  });

  it("prices 480P seconds and the 2K default", () => {
    const estimate = computeEstimate({
      provider: "fal",
      endpoint,
      payload: recorded,
    });
    expect(estimate.usd).toBeCloseTo(0.3125, 10);
    expect(estimate.breakdown).toMatchObject({
      units: 5,
      unit: "seconds",
    });
    expect(estimate.warnings).toEqual([]);
    expect(
      computeEstimate({
        provider: "fal",
        endpoint,
        payload: { prompt: "apct cat", loras: [{ path: loraUrl }] },
      }).usd
    ).toBeCloseTo(0.8125, 10);
    expect(FAL_DYNAMIC_PRICING_ENDPOINTS).not.toContain(endpoint);
    expect(MODEL_SLUGS.fal[endpoint]).toBe("h3i2vl");
    expect(MODEL_DISPLAY.fal[endpoint]).toBe("MiniMax H3 Image-to-Video LoRA");
  });
});
