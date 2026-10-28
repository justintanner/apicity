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

const endpoint = "blackforestlabs/flux-3/klein/base/trainer/edit";
const recorded = {
  images_data_url:
    "https://v3b.fal.media/files/b/0ab02abb/NLzYeb182HMm7bICeqXbw_klein-trainer-edit-pairs.zip",
  trigger_phrase: "Make the photo black and white.",
  steps: 100,
  resolution: 512,
} satisfies FalFlux3KleinTrainerRequest;

describe("FLUX 3 Klein base edit trainer", () => {
  it("adds edit while preserving the callable trainer on both aliases", () => {
    const provider = createFal({ apiKey: "test-key" });
    const klein = provider.run.blackforestlabs.flux3.klein;
    expectTypeOf(klein).toEqualTypeOf<FalRunFlux3KleinNamespace>();
    expectTypeOf(klein.base).toEqualTypeOf<FalRunFlux3KleinBaseNamespace>();
    expectTypeOf(
      klein.base.trainer
    ).toEqualTypeOf<FalRunFlux3KleinBaseTrainerNamespace>();
    expect(klein.base.trainer.edit).toBe(
      provider.post.run.blackforestlabs.flux3.klein.base.trainer.edit
    );
    expect(typeof klein.base.trainer).toBe("function");
    expect(klein.base.trainer.schema).toBe(schema);
    expect(klein.base.trainer.edit.schema).toBe(schema);
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
      await provider.run.blackforestlabs.flux3.klein.base.trainer.edit(recorded)
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
  it("warns that the ZIP contents determine the bill", () => {
    const estimate = computeEstimate({
      provider: "fal",
      endpoint,
      payload: recorded,
    });
    expect(estimate.usd).toBe(0);
    expect(estimate.warnings.join(" ")).toContain("images_data_url zip");
    expect(FAL_DYNAMIC_PRICING_ENDPOINTS).toContain(endpoint);
    expect(MODEL_SLUGS.fal).not.toHaveProperty(endpoint);
    expect(MODEL_DISPLAY.fal[endpoint]).toBe("FLUX 3 Klein Base Edit Trainer");
  });
});
