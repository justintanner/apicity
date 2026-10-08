import { describe, expect, expectTypeOf, it, vi } from "vitest";
import { z } from "zod";
import {
  createFal,
  type FalLightricksLtx2p5AudioToVideoFastParsedRequest,
  type FalLightricksLtx2p5AudioToVideoFastRequest,
  type FalLightricksLtx2p5AudioToVideoFastRequestInput,
  type FalLightricksLtx2p5AudioToVideoFastResponse,
  type FalRunLightricksLtx2p5AudioToVideoNamespace,
} from "@apicity/fal";
import {
  FalLightricksLtx2p5AudioToVideoFastRequestSchema as schema,
  FAL_ENDPOINT_REQUEST_SCHEMAS,
} from "@apicity/fal/zod";
import { computeEstimate } from "../../packages/provider/cost/src/compute";
import {
  fal as falPricing,
  FAL_DYNAMIC_PRICING_ENDPOINTS,
} from "../../packages/provider/cost/src/pricing/fal";
import {
  MODEL_DISPLAY,
  MODEL_SLUGS,
} from "../../packages/provider/cost/src/slugs";

// Pinned against the live queue OpenAPI read on 2026-10-08 (sha256
// 1e29cb39e37936b085bb840c3e25328c728630b04669f2a981eb128ac2543f25, equal to
// the 2026-10-05 capture, and the pro tier's Input and Output field for field)
// and the seventeen unbilled 422 probes of the same day, which answered as
// they do for the pro tier: upstream requires only `audio_url`, bounds the
// prompt at 1 to 5,000 characters and `guidance_scale` at 1 to 50, closes
// `aspect_ratio` to the documented values, takes null for `image_url`,
// `prompt` and `guidance_scale`, accepts unknown fields, and checks neither
// media URL's form before generation.
const endpoint = "lightricks/ltx-2.5/audio-to-video/fast";
const audio = { audio_url: "https://example.com/speech.wav" };
const input = { ...audio, prompt: "A woman whispering to the microphone" };
const recorded = {
  audio_url:
    "https://v3b.fal.media/files/b/0aad2527/MgFeC76hf4IYXYdYTcAbM_gemini_tts_output.wav",
  image_url:
    "https://v3b.fal.media/files/b/0a90dfd2/G1zBOgd-17yqZ-2S5TN4j_M3nzt3Sp.png",
  prompt: "A woman whispering to the microphone",
};

function accepts(body: Record<string, unknown>): boolean {
  return schema.safeParse({ ...input, ...body }).success;
}

function jsonResponse(body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}

describe("Lightricks LTX-2.5 audio-to-video fast contract", () => {
  it("exposes the schema on both run aliases and the queue registry", () => {
    const provider = createFal({ apiKey: "test-key" });
    const leaf = provider.run.lightricks.ltx2p5.audioToVideo.fast;
    expect(leaf).toBe(provider.post.run.lightricks.ltx2p5.audioToVideo.fast);
    expect(leaf.schema).toBe(schema);
    expect(FAL_ENDPOINT_REQUEST_SCHEMAS[endpoint]).toBe(schema);
    // A leaf under the existing audioToVideo object, beside the pro leaf;
    // each tier, and the text-to-video fast leaf, keeps its own function and
    // schema.
    expect(provider.run.lightricks.ltx2p5.audioToVideo).toHaveProperty(
      "fast",
      leaf
    );
    expect(provider.run.lightricks.ltx2p5.audioToVideo.pro).not.toBe(leaf);
    expect(provider.run.lightricks.ltx2p5.audioToVideo.pro.schema).not.toBe(
      schema
    );
    expect(provider.run.lightricks.ltx2p5.textToVideo.fast).not.toBe(leaf);
    expect(provider.run.lightricks.ltx2p5.textToVideo.fast.schema).not.toBe(
      schema
    );
    // Compile-time only: the public namespace and request types, and the
    // documented Output with its VideoFile shape, optionality included.
    expectTypeOf(
      provider.run.lightricks.ltx2p5.audioToVideo
    ).toEqualTypeOf<FalRunLightricksLtx2p5AudioToVideoNamespace>();
    expectTypeOf<FalLightricksLtx2p5AudioToVideoFastRequest>().toEqualTypeOf<
      z.input<typeof schema>
    >();
    expectTypeOf<FalLightricksLtx2p5AudioToVideoFastRequestInput>().toEqualTypeOf<FalLightricksLtx2p5AudioToVideoFastRequest>();
    expectTypeOf<FalLightricksLtx2p5AudioToVideoFastParsedRequest>().toEqualTypeOf<
      z.output<typeof schema>
    >();
    expectTypeOf<FalLightricksLtx2p5AudioToVideoFastResponse>().toEqualTypeOf<{
      video: {
        url: string;
        content_type?: string | null;
        file_name?: string | null;
        file_size?: number | null;
        width?: number | null;
        height?: number | null;
        fps?: number | null;
        duration?: number | null;
        num_frames?: number | null;
      };
    }>();
  });

  it("posts the body unchanged to fal.run with the key header", async () => {
    const mockFetch = vi
      .fn()
      .mockResolvedValue(
        jsonResponse({ video: { url: "https://example.com/out.mp4" } })
      );
    const provider = createFal({
      apiKey: "fal-test-key",
      fetch: mockFetch as unknown as typeof fetch,
    });
    const result =
      await provider.run.lightricks.ltx2p5.audioToVideo.fast(recorded);
    expect(result.video.url).toBe("https://example.com/out.mp4");
    expect(mockFetch).toHaveBeenCalledTimes(1);
    const [url, init] = mockFetch.mock.calls[0] as [
      RequestInfo | URL,
      RequestInit,
    ];
    expect(String(url)).toBe(
      "https://fal.run/lightricks/ltx-2.5/audio-to-video/fast"
    );
    expect(init.method).toBe("POST");
    expect(init.headers).toMatchObject({
      Authorization: "Key fal-test-key",
      "Content-Type": "application/json",
    });
    expect(JSON.parse(String(init.body))).toEqual(recorded);
  });

  it("requires the audio and applies the documented aspect-ratio default", () => {
    expect(schema.parse(recorded)).toStrictEqual({
      ...recorded,
      aspect_ratio: "auto",
    });
    expect(schema.parse(input)).toStrictEqual({
      ...input,
      aspect_ratio: "auto",
    });
    expect(schema.safeParse({}).success).toBe(false);
    expect(
      schema.safeParse({ image_url: recorded.image_url, prompt: input.prompt })
        .success
    ).toBe(false);
  });

  // Both media descriptions publish the rule: without an image, the prompt
  // is required. A body that fails field validation never reaches it, so the
  // probes could not, and the schema restates it as a refinement.
  it("requires a prompt when no image is given", () => {
    const missing = schema.safeParse(audio);
    expect(missing.success).toBe(false);
    expect(missing.error?.issues).toEqual([
      expect.objectContaining({
        path: ["prompt"],
        message:
          "lightricks/ltx-2.5/audio-to-video/fast requires prompt when image_url is not provided",
      }),
    ]);
    expect(
      schema.safeParse({ ...audio, image_url: null, prompt: null }).success
    ).toBe(false);
    expect(schema.safeParse(input).success).toBe(true);
    expect(
      schema.safeParse({ ...audio, image_url: recorded.image_url }).success
    ).toBe(true);
    expect(
      schema.safeParse({
        ...audio,
        image_url: recorded.image_url,
        prompt: null,
      }).success
    ).toBe(true);
  });

  it("leaves the input open, as upstream does", () => {
    expect(accepts({ unknown_field: 1 })).toBe(true);
  });

  it.each([
    "https://example.com/speech.wav",
    "data:audio/wav;base64,UklGRg==",
    "not a url",
    "",
  ])("passes the media URL %s through to upstream", (url) => {
    expect(accepts({ audio_url: url })).toBe(true);
    expect(accepts({ image_url: url })).toBe(true);
  });

  it.each([[["x"]], [5]])("refuses the non-string media URL %j", (url) => {
    expect(accepts({ audio_url: url })).toBe(false);
    expect(accepts({ image_url: url })).toBe(false);
  });

  it("takes a null image but not a null audio", () => {
    expect(accepts({ image_url: null })).toBe(true);
    expect(accepts({ audio_url: null })).toBe(false);
  });

  it("bounds the prompt at 1 to 5,000 characters", () => {
    expect(accepts({ prompt: "" })).toBe(false);
    expect(accepts({ prompt: "   " })).toBe(true);
    expect(accepts({ prompt: "p".repeat(5000) })).toBe(true);
    expect(accepts({ prompt: "p".repeat(5001) })).toBe(false);
    expect(accepts({ prompt: 123 })).toBe(false);
  });

  it.each([1, 5, 5.5, 9, 50, null])("accepts guidance scale %s", (scale) =>
    expect(accepts({ guidance_scale: scale })).toBe(true)
  );

  it.each([0, 0.99, 50.5, "5"])("rejects guidance scale %s", (scale) =>
    expect(accepts({ guidance_scale: scale })).toBe(false)
  );

  it.each(["auto", "16:9", "9:16"])("accepts aspect ratio %s", (ratio) =>
    expect(accepts({ aspect_ratio: ratio })).toBe(true)
  );

  it.each(["1:1", "4:3", "AUTO", "", null])(
    "rejects aspect ratio %s",
    (ratio) => expect(accepts({ aspect_ratio: ratio })).toBe(false)
  );

  it("describes every documented field in order, without billing claims", () => {
    expect(Object.keys(schema.shape)).toEqual([
      "audio_url",
      "image_url",
      "prompt",
      "guidance_scale",
      "aspect_ratio",
    ]);
    for (const [key, field] of Object.entries(schema.shape)) {
      expect(field.description, key).toBeTruthy();
      expect(field.description ?? "", key).not.toMatch(/bill|price|\$|USD/i);
    }
  });

  // Static branch (P-7 rules 2 and 3): fal's pricing API quotes $0.01 per
  // unit where the card quotes $0.13 per second of input audio, because fal
  // counts the charge in cents. The recorded call sent 3.28 s of audio and
  // billed x-fal-billable-units 42.64, which its usage API priced at $0.01
  // each, $0.4264: the card's price for 3.28 seconds. The returned clip ran
  // 3.04 s, so the bill follows the input audio, not the output. The payload
  // carries the audio only as a URL, so its length comes from the cost-only
  // hint.
  it("prices the recorded payload at the billed $0.4264 from its audio length", () => {
    const estimate = computeEstimate({
      provider: "fal",
      endpoint,
      payload: recorded,
      costHints: { durationSeconds: 3.28 },
    });
    expect(estimate.usd).toBeCloseTo(0.4264);
    expect(estimate.warnings).toEqual([]);
  });

  it.each([2, 20])(
    "prices %s s of input audio at the card's $0.13 per second",
    (seconds) => {
      const estimate = computeEstimate({
        provider: "fal",
        endpoint,
        payload: input,
        costHints: { durationSeconds: seconds },
      });
      expect(estimate.usd).toBeCloseTo(0.13 * seconds);
      expect(estimate.warnings).toEqual([]);
    }
  );

  it("prices by the audio's length alone, as the card does", () =>
    expect(
      computeEstimate({
        provider: "fal",
        endpoint,
        payload: { ...input, guidance_scale: 50, aspect_ratio: "9:16" },
        costHints: { durationSeconds: 3.28 },
      }).usd
    ).toBeCloseTo(0.4264));

  it.each([
    ["minimal", input, undefined],
    ["recorded", recorded, undefined],
    ["zero-hinted", recorded, { durationSeconds: 0 }],
  ])(
    "prices the %s payload only through a positive length hint",
    (_label, payload, costHints) => {
      const estimate = computeEstimate({
        provider: "fal",
        endpoint,
        payload,
        costHints,
      });
      expect(estimate.usd).toBe(0);
      expect(estimate.warnings.join(" ")).toMatch(/could not derive units/);
      expect(estimate.warnings.join(" ")).toContain(
        "costHints.durationSeconds"
      );
    }
  );

  it("is statically priced, with a slug and a display name", () => {
    expect(FAL_DYNAMIC_PRICING_ENDPOINTS).not.toContain(endpoint);
    expect(falPricing[endpoint]?.source).toEqual({
      url: "https://fal.ai/models/lightricks/ltx-2.5/audio-to-video/fast",
      asOf: "2026-10-08",
    });
    expect((MODEL_SLUGS.fal as Record<string, string>)[endpoint]).toBe(
      "ltx2p5f"
    );
    expect((MODEL_DISPLAY.fal as Record<string, string>)[endpoint]).toBe(
      "LTX 2.5 Fast"
    );
  });
});
