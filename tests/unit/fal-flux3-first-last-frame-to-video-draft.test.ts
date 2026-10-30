import { describe, expect, expectTypeOf, it } from "vitest";
import { z } from "zod";
import {
  createFal,
  type FalFlux3FirstLastFrameToVideoDraftRequest,
  type FalRunFlux3FirstLastFrameToVideoNamespace,
} from "@apicity/fal";
import {
  FalFlux3FirstLastFrameToVideoDraftRequestSchema as schema,
  FAL_ENDPOINT_REQUEST_SCHEMAS,
} from "@apicity/fal/zod";
import { computeEstimate } from "../../packages/provider/cost/src/compute";

const endpoint = "blackforestlabs/flux-3/first-last-frame-to-video/draft";

describe("FLUX 3 first-last-frame-to-video draft", () => {
  it("preserves firstLastFrameToVideo and exposes the draft child", () => {
    const provider = createFal({ apiKey: "test-key" });
    const flux3 = provider.run.blackforestlabs.flux3;
    expectTypeOf(
      flux3.firstLastFrameToVideo
    ).toEqualTypeOf<FalRunFlux3FirstLastFrameToVideoNamespace>();
    expectTypeOf<FalFlux3FirstLastFrameToVideoDraftRequest>().toEqualTypeOf<
      z.input<typeof schema>
    >();
    expect(typeof flux3.firstLastFrameToVideo).toBe("function");
    expect(flux3.firstLastFrameToVideo).toBe(
      provider.post.run.blackforestlabs.flux3.firstLastFrameToVideo
    );
    expect(flux3.firstLastFrameToVideo.draft.schema).toBe(schema);
    expect(flux3.firstLastFrameToVideo.schema).not.toBe(schema);
    expect(typeof flux3.textToVideo.draft).toBe("function");
    expect(typeof flux3.imageToVideo.draft).toBe("function");
    expect(flux3.klein).toBeDefined();
    expect(FAL_ENDPOINT_REQUEST_SCHEMAS[endpoint]).toBe(schema);
  });

  it("uses five-second defaults and validates numeric duration boundaries", () => {
    expect(
      schema.parse({
        prompt: "A paper boat",
        end_image_url: "https://example.com/man.jpg",
        start_image_url: "data:image/jpeg;base64,aaaa",
      })
    ).toEqual({
      prompt: "A paper boat",
      end_image_url: "https://example.com/man.jpg",
      start_image_url: "data:image/jpeg;base64,aaaa",
      duration: 5,
      aspect_ratio: "auto",
      generate_audio: true,
      safety_tolerance: 2,
    });
    for (const duration of [5, 20]) {
      expect(
        schema.safeParse({
          prompt: "boat",
          end_image_url: "https://example.com/man.jpg",
          start_image_url: "https://example.com/cat.jpg",
          duration,
        }).success
      ).toBe(true);
    }
    for (const duration of [4, 21, 5.5, "5", "auto"]) {
      expect(
        schema.safeParse({
          prompt: "boat",
          end_image_url: "https://example.com/man.jpg",
          start_image_url: "https://example.com/cat.jpg",
          duration,
        }).success
      ).toBe(false);
    }
    expect(
      schema.safeParse({
        prompt: "boat",
        end_image_url: "https://example.com/man.jpg",
        start_image_url: "https://example.com/cat.jpg",
        safety_tolerance: 5,
      }).success
    ).toBe(false);
    expect(schema.safeParse({}).success).toBe(false);
    expect(schema.safeParse({ prompt: "cat" }).success).toBe(false);
    for (const imageField of ["start_image_url", "end_image_url"]) {
      expect(
        schema.safeParse({
          prompt: "cat",
          [imageField]: "https://example.com/frame.jpg",
        }).success
      ).toBe(false);
    }
    expect(Object.keys(schema.shape)).not.toContain("resolution");
  });

  it("prices explicit duration and the five-second default", () => {
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
    expect(estimate({}).usd).toBeCloseTo(0.3, 10);
  });
});
