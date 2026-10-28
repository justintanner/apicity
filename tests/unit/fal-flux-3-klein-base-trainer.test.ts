import { describe, expect, expectTypeOf, it, vi } from "vitest";
import {
  createFal,
  type FalFlux3KleinTrainerRequest,
  type FalRunFlux3KleinNamespace,
  type FalRunFlux3KleinBaseNamespace,
  type FalRunFlux3KleinBaseTrainerNamespace,
} from "@apicity/fal";
import {
  FalFlux3KleinTrainerRequestSchema as schema,
  FAL_ENDPOINT_REQUEST_SCHEMAS,
} from "@apicity/fal/zod";

import { computeEstimate } from "../../packages/provider/cost/src/compute";
import { FAL_DYNAMIC_PRICING_ENDPOINTS } from "../../packages/provider/cost/src/pricing/fal";
import {
  MODEL_DISPLAY,
  MODEL_SLUGS,
} from "../../packages/provider/cost/src/slugs";

const endpoint = "blackforestlabs/flux-3/klein/base/trainer";
const recorded = {
  images_data_url:
    "https://v3b.fal.media/files/b/0ab0295f/cWH8_IX00IlRACO7t0eIL_klein-trainer-images.zip",
  trigger_phrase: "apct cat",
  steps: 100,
  resolution: 512,
} satisfies FalFlux3KleinTrainerRequest;

describe("FLUX 3 Klein base trainer", () => {
  it("owns klein and base with a bare callable trainer on both aliases", () => {
    const provider = createFal({ apiKey: "test-key" });
    const klein = provider.run.blackforestlabs.flux3.klein;
    expectTypeOf(klein).toEqualTypeOf<FalRunFlux3KleinNamespace>();
    expectTypeOf(klein.base).toEqualTypeOf<FalRunFlux3KleinBaseNamespace>();
    expectTypeOf(
      klein.base.trainer
    ).toEqualTypeOf<FalRunFlux3KleinBaseTrainerNamespace>();
    expect(klein.base.trainer).toBe(
      provider.post.run.blackforestlabs.flux3.klein.base.trainer
    );
    expect(typeof klein.base.trainer).toBe("function");
    expect(klein.base.trainer.schema).toBe(schema);
    expect(FAL_ENDPOINT_REQUEST_SCHEMAS[endpoint]).toBe(schema);
    expect(schema.safeParse(recorded).success).toBe(true);
    expect(schema.safeParse({ ...recorded, steps: 99 }).success).toBe(false);
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
    expect(
      await provider.run.blackforestlabs.flux3.klein.base.trainer(recorded)
    ).toEqual(response);
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
  it("prices billed training steps and the documented default", () => {
    const estimate = computeEstimate({
      provider: "fal",
      endpoint,
      payload: recorded,
    });
    expect(estimate.usd).toBeCloseTo(0.43, 10);
    expect(estimate.breakdown).toMatchObject({
      units: 100,
      unit: "generations",
    });
    expect(estimate.warnings).toEqual([]);
    expect(
      computeEstimate({
        provider: "fal",
        endpoint,
        payload: { images_data_url: recorded.images_data_url },
      }).usd
    ).toBeCloseTo(4.3, 10);
    expect(
      computeEstimate({
        provider: "fal",
        endpoint,
        payload: { ...recorded, steps: 200 },
      }).usd
    ).toBeCloseTo(0.86, 10);
    expect(FAL_DYNAMIC_PRICING_ENDPOINTS).not.toContain(endpoint);
    expect(MODEL_SLUGS.fal[endpoint]).toBe("flux3kbt");
    expect(MODEL_DISPLAY.fal[endpoint]).toBe("FLUX 3 Klein Base Trainer");
  });
});
