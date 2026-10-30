import { describe, expect, expectTypeOf, it } from "vitest";
import { z } from "zod";
import {
  createFal,
  type FalFlux3KeyframesToVideoDraftRequest,
  type FalRunFlux3KeyframesToVideoNamespace,
} from "@apicity/fal";
import {
  FalFlux3KeyframesToVideoDraftRequestSchema as schema,
  FAL_ENDPOINT_REQUEST_SCHEMAS,
} from "@apicity/fal/zod";
import { computeEstimate } from "../../packages/provider/cost/src/compute";

const endpoint = "blackforestlabs/flux-3/keyframes-to-video/draft";
const frame = (frame_index: number) => ({
  image_url: "https://example.com/cat.jpg",
  frame_index,
});
const request = {
  prompt: "A cat stretches",
  keyframes: [frame(0), frame(120)],
};

describe("FLUX 3 keyframes-to-video draft", () => {
  it("preserves the callable namespace and its siblings", () => {
    const provider = createFal({ apiKey: "test-key" });
    const flux3 = provider.run.blackforestlabs.flux3;
    expectTypeOf(
      flux3.keyframesToVideo
    ).toEqualTypeOf<FalRunFlux3KeyframesToVideoNamespace>();
    expectTypeOf<FalFlux3KeyframesToVideoDraftRequest>().toEqualTypeOf<
      z.input<typeof schema>
    >();
    expect(typeof flux3.keyframesToVideo).toBe("function");
    expect(flux3.keyframesToVideo).toBe(
      provider.post.run.blackforestlabs.flux3.keyframesToVideo
    );
    expect(flux3.keyframesToVideo.draft.schema).toBe(schema);
    expect(flux3.keyframesToVideo.schema).not.toBe(schema);
    expect(typeof flux3.firstLastFrameToVideo.draft).toBe("function");
    expect(typeof flux3.imageToVideo.draft).toBe("function");
    expect(typeof flux3.textToVideo.draft).toBe("function");
    expect(flux3.klein).toBeDefined();
    expect(FAL_ENDPOINT_REQUEST_SCHEMAS[endpoint]).toBe(schema);
  });

  it("applies upstream defaults and validates duration", () => {
    expect(schema.parse(request)).toEqual({
      ...request,
      duration: 5,
      aspect_ratio: "auto",
      generate_audio: true,
      safety_tolerance: 2,
    });
    for (const duration of [5, 20]) {
      expect(schema.safeParse({ ...request, duration }).success).toBe(true);
    }
    for (const duration of [4, 21, 5.5, "5", "auto"]) {
      expect(schema.safeParse({ ...request, duration }).success).toBe(false);
    }
    expect(schema.safeParse({ ...request, safety_tolerance: 5 }).success).toBe(
      false
    );
    expect(schema.safeParse({ keyframes: [frame(0)] }).success).toBe(false);
    expect(schema.safeParse({ prompt: "cat" }).success).toBe(false);
  });

  it("validates keyframe counts, unique positions and the duration boundary", () => {
    for (const keyframes of [
      [frame(0)],
      Array.from({ length: 10 }, (_, i) => frame(i)),
      [frame(120)],
    ]) {
      expect(schema.safeParse({ ...request, keyframes }).success).toBe(true);
    }
    for (const keyframes of [
      [],
      Array.from({ length: 11 }, (_, i) => frame(i)),
      [frame(-1)],
      [frame(0.5)],
      [frame(0), frame(0)],
      [frame(121)],
    ]) {
      expect(schema.safeParse({ ...request, keyframes }).success).toBe(false);
    }
    expect(
      schema.safeParse({ ...request, duration: 20, keyframes: [frame(480)] })
        .success
    ).toBe(true);
    expect(
      schema.safeParse({ ...request, duration: 20, keyframes: [frame(481)] })
        .success
    ).toBe(false);
  });

  it("prices the five-second default and explicit duration", () => {
    const estimate = (payload: Record<string, unknown>) =>
      computeEstimate({ provider: "fal", endpoint, payload });
    expect(estimate({}).usd).toBeCloseTo(0.3, 10);
    expect(estimate({ duration: 5, generate_audio: false }).usd).toBeCloseTo(
      0.3,
      10
    );
    expect(estimate({ duration: 20, generate_audio: true }).usd).toBeCloseTo(
      1.2,
      10
    );
  });
});
