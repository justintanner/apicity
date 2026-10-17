import { describe, expect, expectTypeOf, it, vi } from "vitest";
import { z } from "zod";
import {
  createFal,
  type FalMireloAiSfx2p0VideoToVideoRequest,
  type FalMireloAiSfx2p0VideoToVideoParsedRequest,
  type FalMireloAiSfx2p0VideoToVideoResponse,
  type FalRunMireloAiNamespace,
  type FalRunMireloAiSfx2p0Namespace,
} from "@apicity/fal";
import {
  FalMireloAiSfx2p0VideoToVideoRequestSchema as schema,
  FAL_ENDPOINT_REQUEST_SCHEMAS,
} from "@apicity/fal/zod";
import {
  FAL_DYNAMIC_PRICING_ENDPOINTS,
  fal as pricing,
} from "../../packages/provider/cost/src/pricing/fal";
import {
  MODEL_DISPLAY,
  MODEL_SLUGS,
} from "../../packages/provider/cost/src/slugs";

// Live OpenAPI 2026-10-15 sha256 28313a0b07d4d651d6e3a8330aab3d88bd22eab23f1327772ee07d89bc175406.
const endpoint = "mirelo-ai/sfx2.0/video-to-video";
const recorded = {
  video_url:
    "https://v3b.fal.media/files/b/0aae75bd/Y4B2Ki-9zZ5gWeEpfw42T_mirelo-sfx2-source.mp4",
  duration: 1.5,
  num_samples: 1,
} satisfies FalMireloAiSfx2p0VideoToVideoRequest;
const accepts = (body: Record<string, unknown>) =>
  schema.safeParse({ ...recorded, ...body }).success;

describe("Mirelo SFX 2.0 video-to-video", () => {
  it("exports both namespaces, aliases and the queue schema", () => {
    const provider = createFal({ apiKey: "test-key" });
    const leaf = provider.run.mireloAi.sfx2p0.videoToVideo;
    expect(leaf).toBe(provider.post.run.mireloAi.sfx2p0.videoToVideo);
    expect(leaf.schema).toBe(schema);
    expect(FAL_ENDPOINT_REQUEST_SCHEMAS[endpoint]).toBe(schema);
    expectTypeOf(
      provider.run.mireloAi
    ).toEqualTypeOf<FalRunMireloAiNamespace>();
    expectTypeOf(
      provider.run.mireloAi.sfx2p0
    ).toEqualTypeOf<FalRunMireloAiSfx2p0Namespace>();
    expectTypeOf(leaf)
      .parameter(0)
      .toEqualTypeOf<FalMireloAiSfx2p0VideoToVideoRequest>();
    expectTypeOf(
      leaf
    ).returns.resolves.toEqualTypeOf<FalMireloAiSfx2p0VideoToVideoResponse>();
    expectTypeOf<FalMireloAiSfx2p0VideoToVideoRequest>().toEqualTypeOf<
      z.input<typeof schema>
    >();
    expectTypeOf<FalMireloAiSfx2p0VideoToVideoParsedRequest>().toEqualTypeOf<
      z.output<typeof schema>
    >();
  });
  it("posts the unchanged body to the exact endpoint", async () => {
    const response = {
      model: "sfx-2.0",
      video: [{ url: "https://example.com/video.mp4" }],
    };
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(
      new Response(JSON.stringify(response), {
        headers: { "Content-Type": "application/json" },
      })
    );
    const provider = createFal({ apiKey: "fal-test-key", fetch: fetcher });
    expect(await provider.run.mireloAi.sfx2p0.videoToVideo(recorded)).toEqual(
      response
    );
    expect(fetcher).toHaveBeenCalledTimes(1);
    const [url, init] = fetcher.mock.calls[0];
    expect(String(url)).toBe("https://fal.run/" + endpoint);
    expect(init?.method).toBe("POST");
    expect(JSON.parse(String(init?.body))).toEqual(recorded);
  });
  it("mirrors the live Input's fields, without the upload audio pair", () => {
    expect(Object.keys(schema.shape).sort()).toEqual([
      "duration",
      "negative_prompt",
      "num_samples",
      "preserve_speech",
      "seed",
      "text_prompt",
      "video_url",
    ]);
  });
  it("requires video_url and applies only documented defaults", () => {
    expect(schema.safeParse({}).success).toBe(false);
    expect(schema.parse({ video_url: "video.mp4" })).toEqual({
      video_url: "video.mp4",
      preserve_speech: true,
      duration: 10,
      num_samples: 2,
    });
    expect(accepts({ unknown_field: true })).toBe(true);
    expect(
      accepts({
        text_prompt: "a".repeat(2000),
        negative_prompt: "a".repeat(1000),
      })
    ).toBe(true);
    expect(
      accepts({ text_prompt: null, negative_prompt: null, seed: null })
    ).toBe(true);
    expect(accepts({ text_prompt: "", preserve_speech: false })).toBe(true);
  });
  it.each([
    { video_url: null },
    { video_url: {} },
    { video_url: 42 },
    { text_prompt: "a".repeat(2001) },
    { text_prompt: 42 },
    { preserve_speech: null },
    { preserve_speech: "false" },
    { negative_prompt: "a".repeat(1001) },
    { negative_prompt: 3 },
    { duration: 0.9 },
    { duration: 601 },
    { duration: null },
    { duration: "1.5" },
    { num_samples: 0 },
    { num_samples: 5 },
    { num_samples: 1.5 },
    { num_samples: null },
    { seed: -2 },
    { seed: 1.5 },
    { seed: "1" },
    { seed: 2e19 },
  ])("rejects invalid input %j", (body) => {
    expect(accepts(body)).toBe(false);
  });
  it("accepts inclusive numeric boundaries and fractional duration", () => {
    expect(accepts({ duration: 1, num_samples: 1, seed: -1 })).toBe(true);
    expect(
      accepts({ duration: 600, num_samples: 4, seed: 18446744073709552000 })
    ).toBe(true);
    expect(accepts({ duration: 1.5, seed: 42 })).toBe(true);
  });
  it("stays dynamic because the recording bills 2 units for 1.5 seconds", () => {
    // Card says seconds across samples; the 1.5 s output (36 frames at 24 fps)
    // came with x-fal-billable-units: 2. P-7 rule 4: do not infer a rounding
    // rule from the observations.
    expect(FAL_DYNAMIC_PRICING_ENDPOINTS as readonly string[]).toContain(
      endpoint
    );
    expect(pricing[endpoint]).toBeUndefined();
    expect(
      (MODEL_SLUGS.fal as Record<string, string>)[endpoint]
    ).toBeUndefined();
    expect((MODEL_DISPLAY.fal as Record<string, string>)[endpoint]).toBe(
      "Mirelo SFX 2.0"
    );
  });
});
