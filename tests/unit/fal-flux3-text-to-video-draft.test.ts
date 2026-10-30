import { describe, expect, expectTypeOf, it } from "vitest";
import { z } from "zod";
import {
  createFal,
  type FalFlux3TextToVideoDraftRequest,
  type FalRunFlux3TextToVideoNamespace,
} from "@apicity/fal";
import {
  FalFlux3TextToVideoDraftRequestSchema as schema,
  FAL_ENDPOINT_REQUEST_SCHEMAS,
} from "@apicity/fal/zod";
import { computeEstimate } from "../../packages/provider/cost/src/compute";

const endpoint = "blackforestlabs/flux-3/text-to-video/draft";

describe("FLUX 3 text-to-video draft", () => {
  it("preserves textToVideo and exposes the draft child", () => {
    const provider = createFal({ apiKey: "test-key" });
    const flux3 = provider.run.blackforestlabs.flux3;
    expectTypeOf(
      flux3.textToVideo
    ).toEqualTypeOf<FalRunFlux3TextToVideoNamespace>();
    expectTypeOf<FalFlux3TextToVideoDraftRequest>().toEqualTypeOf<
      z.input<typeof schema>
    >();
    expect(typeof flux3.textToVideo).toBe("function");
    expect(flux3.textToVideo).toBe(
      provider.post.run.blackforestlabs.flux3.textToVideo
    );
    expect(flux3.textToVideo.draft.schema).toBe(schema);
    expect(flux3.textToVideo.schema).not.toBe(schema);
    expect(typeof flux3.imageToVideo).toBe("function");
    expect(flux3.klein).toBeDefined();
    expect(FAL_ENDPOINT_REQUEST_SCHEMAS[endpoint]).toBe(schema);
  });

  it("uses auto defaults and validates numeric duration boundaries", () => {
    expect(schema.parse({ prompt: "A paper boat" })).toEqual({
      prompt: "A paper boat",
      duration: "auto",
      aspect_ratio: "auto",
      generate_audio: true,
      safety_tolerance: 2,
    });
    for (const duration of [5, 20, "auto"]) {
      expect(schema.safeParse({ prompt: "boat", duration }).success).toBe(true);
    }
    for (const duration of [4, 21, 5.5, "5"]) {
      expect(schema.safeParse({ prompt: "boat", duration }).success).toBe(
        false
      );
    }
    expect(
      schema.safeParse({ prompt: "boat", safety_tolerance: 5 }).success
    ).toBe(false);
    expect(schema.safeParse({}).success).toBe(false);
    expect(Object.keys(schema.shape)).not.toContain("resolution");
  });

  it("prices explicit duration and requires a hint for auto", () => {
    const estimate = (payload: Record<string, unknown>) =>
      computeEstimate({ provider: "fal", endpoint, payload });
    expect(estimate({ duration: 5, generate_audio: false }).usd).toBeCloseTo(
      0.3,
      10
    );
    expect(estimate({ duration: 20, generate_audio: true }).usd).toBeCloseTo(
      1.2,
      10
    );
    expect(estimate({ duration: "auto" }).warnings.length).toBeGreaterThan(0);
    expect(estimate({}).warnings.length).toBeGreaterThan(0);
    expect(
      computeEstimate({
        provider: "fal",
        endpoint,
        payload: { duration: "auto" },
        costHints: { durationSeconds: 5 },
      }).usd
    ).toBeCloseTo(0.3, 10);
  });
});
