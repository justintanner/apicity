import { describe, expect, expectTypeOf, it, vi } from "vitest";
import { z } from "zod";
import {
  createFal,
  type FalMinimaxH3I2vTrainerParsedRequest,
  type FalMinimaxH3I2vTrainerRequest,
  type FalMinimaxH3I2vTrainerRequestInput,
  type FalMinimaxH3I2vTrainerResponse,
  type FalRunMinimaxH3I2vNamespace,
  type FalRunMinimaxH3Namespace,
} from "@apicity/fal";
import {
  FalMinimaxH3I2vTrainerRequestSchema as schema,
  FAL_ENDPOINT_REQUEST_SCHEMAS,
} from "@apicity/fal/zod";
import { computeEstimate } from "../../packages/provider/cost/src/compute";
import { FAL_DYNAMIC_PRICING_ENDPOINTS } from "../../packages/provider/cost/src/pricing/fal";
import {
  MODEL_DISPLAY,
  MODEL_SLUGS,
} from "../../packages/provider/cost/src/slugs";

const endpoint = "minimax/h3/i2v/trainer";
const recorded = {
  training_data_url:
    "https://v3b.fal.media/files/b/0ab058c4/3llAgREfXZoh36mMnJYKX_h3-t2v-trainer.zip",
  number_of_steps: 1,
  auto_scale_input: true,
  trigger_phrase: "apct cat",
} satisfies FalMinimaxH3I2vTrainerRequest;

function accepts(body: Record<string, unknown>): boolean {
  return schema.safeParse({ ...recorded, ...body }).success;
}

describe("MiniMax H3 image-to-video trainer", () => {
  it("owns i2v.trainer on the existing h3 object", () => {
    const provider = createFal({ apiKey: "test-key" });
    const h3 = provider.run.minimax.h3;
    expectTypeOf(h3).toEqualTypeOf<FalRunMinimaxH3Namespace>();
    expectTypeOf(h3.i2v).toEqualTypeOf<FalRunMinimaxH3I2vNamespace>();
    expect(h3.i2v.trainer).toBe(provider.post.run.minimax.h3.i2v.trainer);
    expect(typeof h3.i2v.trainer).toBe("function");
    expect(h3.i2v.trainer.schema).toBe(schema);
    expect(h3.textToVideo).toBe(provider.post.run.minimax.h3.textToVideo);
    expect(h3.t2v.trainer).toBe(provider.post.run.minimax.h3.t2v.trainer);
    expect(FAL_ENDPOINT_REQUEST_SCHEMAS[endpoint]).toBe(schema);
    expectTypeOf<FalMinimaxH3I2vTrainerRequest>().toEqualTypeOf<
      z.input<typeof schema>
    >();
    expectTypeOf<FalMinimaxH3I2vTrainerRequestInput>().toEqualTypeOf<FalMinimaxH3I2vTrainerRequest>();
    expectTypeOf<FalMinimaxH3I2vTrainerParsedRequest>().toEqualTypeOf<
      z.output<typeof schema>
    >();
    expectTypeOf<FalMinimaxH3I2vTrainerResponse>().toEqualTypeOf<{
      lora_file: {
        url: string;
        content_type?: string | null;
        file_name?: string | null;
        file_size?: number | null;
      };
      config_file: {
        url: string;
        content_type?: string | null;
        file_name?: string | null;
        file_size?: number | null;
      };
      debug_dataset?: {
        url: string;
        content_type?: string | null;
        file_name?: string | null;
        file_size?: number | null;
      } | null;
    }>();
  });

  it("posts the recorded body unchanged to the trainer URL", async () => {
    const response = {
      lora_file: { url: "https://example.com/lora.safetensors" },
      config_file: { url: "https://example.com/config.json" },
    };
    const mockFetch = vi.fn().mockResolvedValue(
      new Response(JSON.stringify(response), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      })
    );
    const provider = createFal({
      apiKey: "fal-test-key",
      fetch: mockFetch as unknown as typeof fetch,
    });
    expect(await provider.run.minimax.h3.i2v.trainer(recorded)).toEqual(
      response
    );
    const [url, init] = mockFetch.mock.calls[0] as [
      RequestInfo | URL,
      RequestInit,
    ];
    expect(String(url)).toBe(`https://fal.run/${endpoint}`);
    expect(init.method).toBe("POST");
    expect(JSON.parse(String(init.body))).toEqual(recorded);
    expect(init.headers).toMatchObject({
      Authorization: "Key fal-test-key",
      "Content-Type": "application/json",
    });
  });

  it("describes the documented fields in order", () => {
    expect(Object.keys(schema.shape)).toEqual([
      "training_data_url",
      "rank",
      "number_of_steps",
      "learning_rate",
      "number_of_frames",
      "frame_rate",
      "resolution",
      "aspect_ratio",
      "trigger_phrase",
      "first_frame_conditioning_p",
      "auto_scale_input",
      "split_input_into_scenes",
      "split_input_duration_threshold",
      "debug_dataset",
      "strict_dataset",
    ]);
  });

  it("requires only the archive URL and keeps upstream defaults", () => {
    expect(schema.safeParse(recorded).success).toBe(true);
    const parsed = schema.safeParse({
      training_data_url: recorded.training_data_url,
    });
    expect(parsed.success).toBe(true);
    if (!parsed.success) return;
    expect(parsed.data.number_of_steps).toBe(2000);
    expect(parsed.data.rank).toBe(32);
    expect(parsed.data.number_of_frames).toBe(73);
    expect(parsed.data.resolution).toBe("medium");
    expect(parsed.data.aspect_ratio).toBe("16:9");
    expect(parsed.data.first_frame_conditioning_p).toBe(0.5);
    expect(parsed.data.auto_scale_input).toBe(false);
    expect(schema.safeParse({}).success).toBe(false);
    expect(accepts({ number_of_steps: 1 })).toBe(true);
    expect(accepts({ number_of_steps: 15000 })).toBe(true);
    expect(accepts({ number_of_steps: 0 })).toBe(false);
    expect(accepts({ number_of_steps: 15001 })).toBe(false);
    expect(accepts({ number_of_steps: 1.5 })).toBe(false);
    expect(accepts({ rank: 32 })).toBe(true);
    expect(accepts({ rank: 24 })).toBe(false);
    expect(accepts({ number_of_frames: 73 })).toBe(true);
    expect(accepts({ number_of_frames: 24 })).toBe(false);
    expect(accepts({ resolution: "low" })).toBe(true);
    expect(accepts({ resolution: "480P" })).toBe(false);
    expect(accepts({ aspect_ratio: "9:16" })).toBe(true);
    expect(accepts({ first_frame_conditioning_p: 0 })).toBe(true);
    expect(accepts({ first_frame_conditioning_p: 1 })).toBe(true);
    expect(accepts({ first_frame_conditioning_p: 1.1 })).toBe(false);
    expect(accepts({ unknown_field: 1 })).toBe(true);
  });

  it("prices requested training steps and the documented default", () => {
    const estimate = computeEstimate({
      provider: "fal",
      endpoint,
      payload: recorded,
    });
    // steps=1 still bills the 100-step trainer floor observed on t2v.
    expect(estimate.usd).toBeCloseTo(1, 10);
    expect(estimate.breakdown).toMatchObject({
      units: 100,
      unit: "generations",
    });
    expect(estimate.warnings).toEqual([]);
    expect(
      computeEstimate({
        provider: "fal",
        endpoint,
        payload: { training_data_url: recorded.training_data_url },
      }).usd
    ).toBeCloseTo(20, 10);
    expect(
      computeEstimate({
        provider: "fal",
        endpoint,
        payload: { ...recorded, number_of_steps: 2 },
      }).usd
    ).toBeCloseTo(1, 10);
    expect(FAL_DYNAMIC_PRICING_ENDPOINTS).not.toContain(endpoint);
    expect(MODEL_SLUGS.fal[endpoint]).toBe("h3i2vt");
    expect(MODEL_DISPLAY.fal[endpoint]).toBe("MiniMax H3 I2V Trainer");
  });
});
