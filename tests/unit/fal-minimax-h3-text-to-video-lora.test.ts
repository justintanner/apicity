import { describe, expect, expectTypeOf, it } from "vitest";
import { z } from "zod";
import {
  createFal,
  type FalMinimaxH3TextToVideoLoraParsedRequest,
  type FalMinimaxH3TextToVideoLoraRequest,
  type FalMinimaxH3TextToVideoLoraRequestInput,
  type FalRunMinimaxH3Namespace,
  type FalRunMinimaxH3TextToVideoNamespace,
} from "@apicity/fal";
import {
  FalMinimaxH3TextToVideoLoraRequestSchema as schema,
  FAL_ENDPOINT_REQUEST_SCHEMAS,
} from "@apicity/fal/zod";
import { computeEstimate } from "../../packages/provider/cost/src/compute";
import { FAL_DYNAMIC_PRICING_ENDPOINTS } from "../../packages/provider/cost/src/pricing/fal";
import {
  MODEL_DISPLAY,
  MODEL_SLUGS,
} from "../../packages/provider/cost/src/slugs";

const endpoint = "minimax/h3/text-to-video/lora";
const loraUrl =
  "https://v3b.fal.media/files/b/0ab058f9/aofDUIQaypkDoDSR5qbeD_lora_weights_step_00001.safetensors";
const recorded = {
  prompt: "apct cat walks across a sunlit garden.",
  duration: 5,
  resolution: "480P" as const,
  prompt_expansion_mode: "disabled" as const,
  loras: [{ path: loraUrl, scale: 1 }],
} satisfies FalMinimaxH3TextToVideoLoraRequest;

function accepts(body: Record<string, unknown>): boolean {
  return schema.safeParse({ ...recorded, ...body }).success;
}

describe("MiniMax H3 text-to-video LoRA", () => {
  it("promotes textToVideo and adds lora", () => {
    const provider = createFal({ apiKey: "test-key" });
    const h3 = provider.run.minimax.h3;
    expectTypeOf(h3).toEqualTypeOf<FalRunMinimaxH3Namespace>();
    expectTypeOf(
      h3.textToVideo
    ).toEqualTypeOf<FalRunMinimaxH3TextToVideoNamespace>();
    expect(h3.textToVideo).toBe(provider.post.run.minimax.h3.textToVideo);
    expect(typeof h3.textToVideo).toBe("function");
    expect(h3.textToVideo.lora).toBe(
      provider.post.run.minimax.h3.textToVideo.lora
    );
    expect(h3.textToVideo.lora.schema).toBe(schema);
    expect(h3.imageToVideo).toBe(provider.post.run.minimax.h3.imageToVideo);
    expect(h3.referenceToVideo).toBe(
      provider.post.run.minimax.h3.referenceToVideo
    );
    expect(h3.t2v.trainer.schema).toBeDefined();
    expect(FAL_ENDPOINT_REQUEST_SCHEMAS[endpoint]).toBe(schema);
    expectTypeOf<FalMinimaxH3TextToVideoLoraRequest>().toEqualTypeOf<
      z.input<typeof schema>
    >();
    expectTypeOf<FalMinimaxH3TextToVideoLoraRequestInput>().toEqualTypeOf<FalMinimaxH3TextToVideoLoraRequest>();
    expectTypeOf<FalMinimaxH3TextToVideoLoraParsedRequest>().toEqualTypeOf<
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
      "aspect_ratio",
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
    expect(parsed.data.prompt_expansion_mode).toBe("balanced");
    expect(parsed.data.aspect_ratio).toBe("16:9");
    expect(parsed.data.enable_safety_checker).toBe(true);
    expect(parsed.data.sync_mode).toBe(false);
    expect(parsed.data.loras[0]?.scale).toBe(1);
    expect(parsed.data.seed).toBeUndefined();
    expect(parsed.data.target_audio_url).toBeUndefined();
    expect(schema.safeParse({ prompt: "apct cat" }).success).toBe(false);
    expect(schema.safeParse({ loras: [{ path: loraUrl }] }).success).toBe(
      false
    );
    expect(accepts({ loras: [] })).toBe(false);
    expect(accepts({ duration: 5 })).toBe(true);
    expect(accepts({ duration: 15 })).toBe(true);
    expect(accepts({ duration: 4 })).toBe(false);
    expect(accepts({ duration: 16 })).toBe(false);
    expect(accepts({ resolution: "480P" })).toBe(true);
    expect(accepts({ resolution: "480p" })).toBe(false);
    expect(accepts({ prompt_expansion_mode: "disabled" })).toBe(true);
    expect(accepts({ prompt_expansion_mode: null })).toBe(true);
    expect(accepts({ prompt_expansion_mode: "max" })).toBe(false);
    expect(accepts({ loras: [{ path: loraUrl, scale: 0 }] })).toBe(true);
    expect(accepts({ loras: [{ path: loraUrl, scale: 4 }] })).toBe(true);
    expect(accepts({ loras: [{ path: loraUrl, scale: 4.1 }] })).toBe(false);
    expect(accepts({ loras: [{ path: "" }] })).toBe(false);
    expect(accepts({ target_audio_url: null })).toBe(true);
    expect(accepts({ target_audio_url: "" })).toBe(false);
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
    expect(
      computeEstimate({
        provider: "fal",
        endpoint,
        payload: { ...recorded, duration: 15 },
      }).usd
    ).toBeCloseTo(0.9375, 10);
    expect(FAL_DYNAMIC_PRICING_ENDPOINTS).not.toContain(endpoint);
    expect(MODEL_SLUGS.fal[endpoint]).toBe("h3t2vl");
    expect(MODEL_DISPLAY.fal[endpoint]).toBe("MiniMax H3 Text-to-Video LoRA");
  });
});
