import { describe, expect, expectTypeOf, it } from "vitest";
import { z } from "zod";
import { createFal, type FalFlux3DraftEnhanceRequest } from "@apicity/fal";
import {
  FalFlux3DraftEnhanceRequestSchema as schema,
  FAL_ENDPOINT_REQUEST_SCHEMAS,
} from "@apicity/fal/zod";
import { computeEstimate } from "../../packages/provider/cost/src/compute";
const endpoint = "blackforestlabs/flux-3/draft-enhance";
const payload = { draft_cache_url: "https://example.com/draft_cache.bin" };

describe("FLUX 3 draft enhancement", () => {
  it("exposes a sibling leaf without changing callable draft namespaces", () => {
    const provider = createFal({ apiKey: "test-key" });
    const flux3 = provider.run.blackforestlabs.flux3;
    expectTypeOf<FalFlux3DraftEnhanceRequest>().toEqualTypeOf<
      z.input<typeof schema>
    >();
    expect(flux3.draftEnhance).toBe(
      provider.post.run.blackforestlabs.flux3.draftEnhance
    );
    expect(flux3.draftEnhance.schema).toBe(schema);
    expect(FAL_ENDPOINT_REQUEST_SCHEMAS[endpoint]).toBe(schema);
    for (const namespace of [
      flux3.textToVideo,
      flux3.imageToVideo,
      flux3.firstLastFrameToVideo,
      flux3.keyframesToVideo,
      flux3.extendVideo,
    ]) {
      expect(typeof namespace).toBe("function");
      expect(typeof namespace.draft).toBe("function");
    }
    expect(flux3.klein).toBeDefined();
  });

  it("requires a cache and defaults safety without unsupported generation fields", () => {
    expect(schema.parse(payload)).toEqual({ ...payload, safety_tolerance: 2 });
    expect(schema.safeParse({}).success).toBe(false);
    expect(schema.safeParse({ draft_cache_url: 123 }).success).toBe(false);
    for (const safety_tolerance of [0, 4]) {
      expect(schema.safeParse({ ...payload, safety_tolerance }).success).toBe(
        true
      );
    }
    for (const safety_tolerance of [-1, 5, 0.5]) {
      expect(schema.safeParse({ ...payload, safety_tolerance }).success).toBe(
        false
      );
    }
    expect(Object.keys(schema.shape).sort()).toEqual([
      "draft_cache_url",
      "safety_tolerance",
    ]);
  });

  it("uses only a cost hint for duration hidden in the cache", () => {
    const estimate = computeEstimate({
      provider: "fal",
      endpoint,
      payload,
      costHints: { durationSeconds: 5 },
    });
    expect(estimate.usd).toBeCloseTo(1.45, 10);
    expect(estimate.warnings).toEqual([]);
    for (const request of [payload, { ...payload, duration: 5 }]) {
      expect(
        computeEstimate({ provider: "fal", endpoint, payload: request })
          .warnings.length
      ).toBeGreaterThan(0);
    }
  });
});
