import { describe, expect, expectTypeOf, it } from "vitest";
import { z } from "zod";
import {
  createFal,
  type FalMinimaxH3ReferenceToVideoLoraRequest,
  type FalMinimaxH3ReferenceToVideoLoraParsedRequest,
  type FalRunMinimaxH3ReferenceToVideoNamespace,
} from "@apicity/fal";
import {
  FalMinimaxH3ReferenceToVideoLoraRequestSchema as schema,
  FAL_ENDPOINT_REQUEST_SCHEMAS,
} from "@apicity/fal/zod";
import { computeEstimate } from "../../packages/provider/cost/src/compute";

const endpoint = "minimax/h3/reference-to-video/lora";
const minimal = {
  prompt: "Image 1 is the cat. The cat blinks.",
  loras: [{ path: "https://example.com/lora.safetensors" }],
} satisfies FalMinimaxH3ReferenceToVideoLoraRequest;

describe("MiniMax H3 reference-to-video LoRA", () => {
  it("preserves the callable and sibling methods while exposing the LoRA schema", () => {
    const provider = createFal({ apiKey: "test-key" });
    const h3 = provider.run.minimax.h3;
    expectTypeOf(
      h3.referenceToVideo
    ).toEqualTypeOf<FalRunMinimaxH3ReferenceToVideoNamespace>();
    expect(typeof h3.referenceToVideo).toBe("function");
    expect(h3.referenceToVideo).toBe(
      provider.post.run.minimax.h3.referenceToVideo
    );
    expect(h3.referenceToVideo.lora.schema).toBe(schema);
    expect(h3.referenceToVideo.schema).not.toBe(schema);
    expect(typeof h3.imageToVideo).toBe("function");
    expect(typeof h3.imageToVideo.lora).toBe("function");
    expect(typeof h3.textToVideo.lora).toBe("function");
    expect(FAL_ENDPOINT_REQUEST_SCHEMAS[endpoint]).toBe(schema);
    expectTypeOf<FalMinimaxH3ReferenceToVideoLoraRequest>().toEqualTypeOf<
      z.input<typeof schema>
    >();
    expectTypeOf<FalMinimaxH3ReferenceToVideoLoraParsedRequest>().toEqualTypeOf<
      z.output<typeof schema>
    >();
  });

  it("accepts optional modalities and enforces the combined reference cap", () => {
    expect(schema.parse(minimal)).toMatchObject({
      duration: 5,
      resolution: "2K",
      aspect_ratio: "adaptive",
      loras: [{ scale: 1 }],
    });
    expect(
      schema.safeParse({
        ...minimal,
        reference_audio_urls: ["https://example.com/audio.wav"],
      }).success
    ).toBe(true);
    expect(
      schema.safeParse({
        ...minimal,
        reference_image_urls: ["data:image/jpeg;base64,aaaa"],
      }).success
    ).toBe(true);
    const references = {
      ...minimal,
      reference_image_urls: Array<string>(9).fill(
        "https://example.com/cat.jpg"
      ),
      reference_video_urls: Array<string>(3).fill(
        "https://example.com/video.mp4"
      ),
    };
    expect(schema.safeParse(references).success).toBe(true);
    expect(
      schema.safeParse({
        ...references,
        reference_audio_urls: ["https://example.com/audio.wav"],
      }).success
    ).toBe(false);
    expect(
      schema.safeParse({
        ...minimal,
        reference_image_urls: Array<string>(10).fill(
          "https://example.com/cat.jpg"
        ),
      }).success
    ).toBe(false);
    expect(schema.safeParse({ ...minimal, loras: [] }).success).toBe(false);
    expect(schema.safeParse({ ...minimal, duration: 4 }).success).toBe(false);
    expect(schema.safeParse({ ...minimal, duration: 15 }).success).toBe(true);
    expect(schema.safeParse({ ...minimal, resolution: "480p" }).success).toBe(
      false
    );
  });

  it("prices the recording pin and the higher default resolution", () => {
    const pinned = computeEstimate({
      provider: "fal",
      endpoint,
      payload: { ...minimal, duration: 5, resolution: "480P" },
    });
    expect(pinned.usd).toBeCloseTo(0.3125, 10);
    expect(pinned.warnings).toEqual([]);
    expect(
      computeEstimate({ provider: "fal", endpoint, payload: minimal }).usd
    ).toBeCloseTo(0.8125, 10);
  });
});
