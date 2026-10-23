import { describe, expect, it, vi } from "vitest";

import { createFal } from "../../packages/provider/fal/src/fal";
import { FAL_ENDPOINT_REQUEST_SCHEMAS } from "../../packages/provider/fal/src/zod";
import { computeEstimate } from "../../packages/provider/cost/src/compute";
import {
  fal as falPricing,
  FAL_DYNAMIC_PRICING_ENDPOINTS,
} from "../../packages/provider/cost/src/pricing/fal";
import {
  MODEL_DISPLAY,
  MODEL_SLUGS,
} from "../../packages/provider/cost/src/slugs";
import type { CostHints } from "../../packages/provider/cost/src/types";

function jsonResponse(body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}

describe("fal pricing estimate verb surface", () => {
  it("keeps pricing lookup on the GET namespace without estimate", async () => {
    const mockFetch = vi.fn(async () =>
      jsonResponse({
        prices: [],
        next_cursor: null,
        has_more: false,
      })
    );

    const provider = createFal({
      apiKey: "fal-test-key",
      fetch: mockFetch as unknown as typeof fetch,
    });

    await provider.get.v1.models.pricing({
      endpoint_id: "fal-ai/flux/dev",
    });

    expect(
      Object.prototype.hasOwnProperty.call(
        provider.get.v1.models.pricing,
        "estimate"
      )
    ).toBe(false);
    expect(mockFetch).toHaveBeenCalledTimes(1);

    const [url, init] = mockFetch.mock.calls[0] as unknown as [
      RequestInfo | URL,
      RequestInit,
    ];
    expect(String(url)).toBe(
      "https://api.fal.ai/v1/models/pricing?endpoint_id=fal-ai%2Fflux%2Fdev"
    );
    expect(init.method).toBe("GET");
  });

  it("keeps pricing estimate on the POST namespace", async () => {
    const mockFetch = vi.fn(async () =>
      jsonResponse({
        estimate_type: "unit_price",
        total_cost: 2.5,
        currency: "USD",
      })
    );

    const provider = createFal({
      apiKey: "fal-test-key",
      fetch: mockFetch as unknown as typeof fetch,
    });

    const result = await provider.post.v1.models.pricing.estimate({
      estimate_type: "unit_price",
      endpoints: {
        "fal-ai/flux/dev": { unit_quantity: 100 },
      },
    });

    expect(result.total_cost).toBe(2.5);
    expect(provider.post.v1.models.pricing.estimate.schema).toBeDefined();
    expect(mockFetch).toHaveBeenCalledTimes(1);

    const [url, init] = mockFetch.mock.calls[0] as unknown as [
      RequestInfo | URL,
      RequestInit,
    ];
    expect(String(url)).toBe("https://api.fal.ai/v1/models/pricing/estimate");
    expect(init.method).toBe("POST");
    expect(JSON.parse(String(init.body))).toEqual({
      estimate_type: "unit_price",
      endpoints: {
        "fal-ai/flux/dev": { unit_quantity: 100 },
      },
    });
  });
});

const est = (endpoint: string, payload: Record<string, unknown>) =>
  computeEstimate({ provider: "fal", endpoint, payload });

describe("fal video pricing estimates", () => {
  // Every REQ-001 endpoint id must be a registered fal endpoint and either a
  // PRICING.fal key or on the documented dynamic-path list — never silently
  // absent, and never both (AC-1).
  const REQ_001_ENDPOINTS = [
    "bytedance/seedance-2.0/text-to-video",
    "bytedance/seedance-2.0/image-to-video",
    "bytedance/seedance-2.0/reference-to-video",
    "bytedance/seedance-2.0/fast/text-to-video",
    "bytedance/seedance-2.0/fast/image-to-video",
    "bytedance/seedance-2.0/fast/reference-to-video",
    "bytedance/seedance-2.5/text-to-video",
    "bytedance/seedance-2.5/image-to-video",
    "bytedance/seedance-2.5/reference-to-video",
    "alibaba/wan-3.0/text-to-video",
    "alibaba/wan-3.0/image-to-video",
    "alibaba/wan-3.0/reference-to-video",
    "alibaba/wan-3.0-prime/text-to-video",
    "alibaba/wan-3.0-prime/image-to-video",
    "alibaba/wan-3.0-prime/reference-to-video",
    "fal-ai/wan/v2.7/text-to-video",
    "fal-ai/wan/v2.7/image-to-video",
    "fal-ai/wan/v2.7/reference-to-video",
    "fal-ai/wan/v2.7/edit-video",
    "fal-ai/kling-video/v3/pro/text-to-video",
    "fal-ai/kling-video/v3/pro/image-to-video",
    "fal-ai/kling-video/v3/standard/text-to-video",
    "fal-ai/kling-video/v3/standard/image-to-video",
    "fal-ai/kling-video/o3/4k/text-to-video",
    "fal-ai/kling-video/o3/4k/image-to-video",
    "fal-ai/kling-video/o3/4k/reference-to-video",
    "fal-ai/veo3.1",
    "fal-ai/veo3.1/image-to-video",
    "fal-ai/sora-2/text-to-video",
    "fal-ai/sora-2/image-to-video",
    "lightricks/ltx-2.5/image-to-video/pro",
    "lightricks/ltx-2.5/image-to-video/fast",
    "xai/grok-imagine-video/image-to-video",
    "xai/grok-imagine-video/reference-to-video",
    "xai/grok-imagine-video/v1.5/reference-to-video",
    "xai/grok-imagine-video/extend-video",
    "xai/grok-imagine-video/edit-video",
    "minimax/music-3",
    "topaz/upscale/image/precision",
    "topaz/upscale/video/precision",
    "meshy/v7/image-to-3d",
    "bytedance/seedream/v5/pro/layerize",
    "minimax/h3/text-to-video",
    "minimax/h3/image-to-video",
    "minimax/h3/reference-to-video",
    "bytedance/seedream/v5/pro/text-to-image",
    "bytedance/seedream/v5/pro/edit",
    "google/gemini-omni-flash",
    "google/gemini-omni-flash/edit",
    "google/gemini-omni-flash/image-to-video",
    "google/gemini-omni-flash/reference-to-video",
  ];

  it("covers every REQ-001 endpoint statically or on the dynamic list", () => {
    const dynamic: readonly string[] = FAL_DYNAMIC_PRICING_ENDPOINTS;
    expect(REQ_001_ENDPOINTS).toHaveLength(51);
    for (const endpoint of REQ_001_ENDPOINTS) {
      expect(endpoint in FAL_ENDPOINT_REQUEST_SCHEMAS, endpoint).toBe(true);
      const priced = endpoint in falPricing;
      const isDynamic = dynamic.includes(endpoint);
      expect(priced || isDynamic, endpoint).toBe(true);
      expect(priced && isDynamic, endpoint).toBe(false);
    }
  });

  it("leaves no registered fal endpoint silently unpriced", () => {
    const dynamic: readonly string[] = FAL_DYNAMIC_PRICING_ENDPOINTS;
    const unpriced = Object.keys(FAL_ENDPOINT_REQUEST_SCHEMAS).filter(
      (endpoint) => !(endpoint in falPricing) && !dynamic.includes(endpoint)
    );
    expect(unpriced).toEqual([]);
  });

  it("prices Seed Speech from exact input characters", () => {
    const result = est("fal-ai/bytedance/seed-speech/tts/v2", {
      text: "a".repeat(1_000),
    });

    expect(result.usd).toBeCloseTo(0.03, 10);
    expect(result.breakdown).toMatchObject({
      units: 1_000,
      unit: "characters",
    });
    expect(result.breakdown.perUnitUsd).toBeCloseTo(0.00003, 12);
    expect(result.warnings).toEqual([]);
  });

  it.each([
    { keyterms: undefined, usd: 0.008, rate: 0.008 / 60 },
    { keyterms: ["ApiCity"], usd: 0.0104, rate: (0.008 * 1.3) / 60 },
  ])(
    "prices one minute of Scribe V2 with keyterms=$keyterms",
    ({ keyterms, usd, rate }) => {
      const result = computeEstimate({
        provider: "fal",
        endpoint: "fal-ai/elevenlabs/speech-to-text/scribe-v2",
        payload: {
          audio_url: "https://example.com/audio.mp3",
          ...(keyterms ? { keyterms } : {}),
        },
        costHints: { durationSeconds: 60 },
      });

      expect(result.usd).toBeCloseTo(usd, 10);
      expect(result.breakdown).toEqual({
        units: 60,
        unit: "seconds",
        perUnitUsd: rate,
      });
      expect(result.warnings).toEqual([]);
    }
  );

  it("fails Scribe V2 closed without an input-audio duration hint", () => {
    const result = est("fal-ai/elevenlabs/speech-to-text/scribe-v2", {
      audio_url: "https://example.com/audio.mp3",
    });

    expect(result.usd).toBe(0);
    expect(result.warnings).toHaveLength(1);
    expect(result.warnings[0]).toContain("costHints.durationSeconds");
  });

  it("prices flat per-second families (sora 2, kling o3 4k, wan r2v)", () => {
    const sora = est("fal-ai/sora-2/text-to-video", {
      prompt: "p",
      duration: 8,
    });
    expect(sora.usd).toBeCloseTo(0.8, 10);
    expect(sora.warnings).toEqual([]);
    expect(sora.breakdown).toMatchObject({
      units: 8,
      unit: "seconds",
      perUnitUsd: 0.1,
    });

    // Omitted duration falls back to the schema default (4).
    expect(
      est("fal-ai/sora-2/image-to-video", { prompt: "p", image_url: "u" }).usd
    ).toBeCloseTo(0.4, 10);

    const kling = est("fal-ai/kling-video/o3/4k/text-to-video", {
      prompt: "p",
      duration: "10",
    });
    expect(kling.usd).toBeCloseTo(4.2, 10);

    // The o3 4k image-to-video twin bills the same flat rate.
    expect(
      est("fal-ai/kling-video/o3/4k/image-to-video", {
        prompt: "p",
        image_url: "u",
        duration: "10",
      }).usd
    ).toBeCloseTo(4.2, 10);

    // Kling duration defaults to "5".
    expect(
      est("fal-ai/kling-video/o3/4k/reference-to-video", {
        image_urls: ["u"],
      }).usd
    ).toBeCloseTo(2.1, 10);

    expect(
      est("fal-ai/wan/v2.7/reference-to-video", {
        prompt: "p",
        reference_image_urls: ["u"],
        duration: 7,
      }).usd
    ).toBeCloseTo(0.7, 10);
  });

  it("prices resolution-tiered per-second families (wan, grok imagine)", () => {
    expect(
      est("fal-ai/wan/v2.7/text-to-video", {
        prompt: "p",
        duration: 5,
        resolution: "720p",
      }).usd
    ).toBeCloseTo(0.5, 10);

    // Omitted resolution → wan's schema default 1080p; omitted duration → 5.
    expect(
      est("fal-ai/wan/v2.7/image-to-video", { prompt: "p", image_url: "u" }).usd
    ).toBeCloseTo(0.75, 10);

    // Grok i2v defaults: 6 s at 720p.
    expect(
      est("xai/grok-imagine-video/image-to-video", {
        prompt: "p",
        image_url: "u",
      }).usd
    ).toBeCloseTo(0.42, 10);

    // Grok r2v defaults: 8 s at 480p.
    expect(
      est("xai/grok-imagine-video/reference-to-video", {
        prompt: "p",
        reference_image_urls: ["u"],
      }).usd
    ).toBeCloseTo(0.4, 10);

    // extend-video bills the extension seconds.
    expect(
      est("xai/grok-imagine-video/extend-video", {
        prompt: "p",
        video_url: "u",
        duration: 4,
      }).usd
    ).toBeCloseTo(0.2, 10);
  });

  it.each([
    { resolution: "480p", usd: 0.36, rate: 0.06 },
    { resolution: "720p", usd: 0.48, rate: 0.08 },
  ])(
    "prices Grok video edit at the $resolution total input/output rate",
    ({ resolution, usd, rate }) => {
      const result = computeEstimate({
        provider: "fal",
        endpoint: "xai/grok-imagine-video/edit-video",
        payload: {
          prompt: "make it warmer",
          video_url: "https://example.com/source.mp4",
          resolution,
        },
        costHints: { durationSeconds: 6 },
      });

      expect(result.usd).toBeCloseTo(usd, 10);
      expect(result.breakdown).toEqual({
        units: 6,
        unit: "seconds",
        perUnitUsd: rate,
      });
      expect(result.rateAsOf).toBe("2026-08-22");
      expect(result.warnings).toEqual([]);
    }
  );

  it.each([
    { resolution: "auto", hint: 6, warning: "no rate for variant 'auto'" },
    {
      resolution: "480p",
      hint: undefined,
      warning: "costHints.durationSeconds",
    },
  ])(
    "fails Grok video edit closed for resolution=$resolution hint=$hint",
    ({ resolution, hint, warning }) => {
      const result = computeEstimate({
        provider: "fal",
        endpoint: "xai/grok-imagine-video/edit-video",
        payload: {
          prompt: "make it warmer",
          video_url: "https://example.com/source.mp4",
          resolution,
        },
        ...(hint === undefined ? {} : { costHints: { durationSeconds: hint } }),
      });

      expect(result.usd).toBe(0);
      expect(result.warnings.join(" ")).toContain(warning);
    }
  );

  it("prices audio-tiered families (kling v3, veo 3.1)", () => {
    expect(
      est("fal-ai/kling-video/v3/pro/text-to-video", {
        prompt: "p",
        duration: "5",
        generate_audio: false,
      }).usd
    ).toBeCloseTo(0.56, 10);

    // generate_audio defaults to true (the audio-on rate).
    expect(
      est("fal-ai/kling-video/v3/pro/image-to-video", {
        prompt: "p",
        start_image_url: "u",
        duration: "5",
      }).usd
    ).toBeCloseTo(0.84, 10);

    expect(
      est("fal-ai/kling-video/v3/standard/text-to-video", {
        prompt: "p",
        duration: "10",
        generate_audio: true,
      }).usd
    ).toBeCloseTo(1.26, 10);

    // Standard image-to-video, audio left at its default: $0.126/s.
    expect(
      est("fal-ai/kling-video/v3/standard/image-to-video", {
        prompt: "p",
        start_image_url: "u",
        duration: "5",
      }).usd
    ).toBeCloseTo(0.63, 10);

    expect(
      est("fal-ai/veo3.1", {
        prompt: "p",
        duration: "6s",
        resolution: "4k",
        generate_audio: true,
      }).usd
    ).toBeCloseTo(3.6, 10);

    // Veo defaults: "8s", 720p, audio on.
    expect(
      est("fal-ai/veo3.1/image-to-video", { prompt: "p", image_url: "u" }).usd
    ).toBeCloseTo(3.2, 10);

    expect(
      est("fal-ai/veo3.1", {
        prompt: "p",
        duration: "4s",
        resolution: "1080p",
        generate_audio: false,
      }).usd
    ).toBeCloseTo(0.8, 10);
  });

  // Seedance 2.0, 2.0 Fast and 2.5 bill tokens of the delivered video:
  // ByteDance's published width x height for the resolution and aspect
  // ratio, times 24 x duration + 1 frames, / 1024. Reference clips add their
  // own frames at the output size, x 0.6. Twelve ids price locally; four stay
  // dynamic (planning ac-0ay3v4 for ac-j3d6ki.3). Every expected number is a
  // literal worked from that formula, never through the code under test.
  const seedanceRecorded = {
    prompt: "p",
    resolution: "480p",
    duration: "4",
    aspect_ratio: "1:1",
    generate_audio: false,
  };
  const seedanceReference = {
    ...seedanceRecorded,
    image_urls: ["u"],
    video_urls: ["u"],
  };
  const seedance = (
    endpoint: string,
    payload: Record<string, unknown>,
    costHints?: CostHints
  ) =>
    computeEstimate({
      provider: "fal",
      endpoint,
      payload,
      ...(costHints ? { costHints } : {}),
    });

  it("reproduces every recorded Seedance bill (ac-j3d6ki.3)", () => {
    // Each recorded call was 480p, 1:1, "4" s, audio off: 640x640 at 97
    // frames. Reference-to-video sent a 4.000 s, 96-frame clip.
    const cases: Array<
      [string, Record<string, unknown>, number, number, number]
    > = [
      // endpoint, payload, tokens, USD per token, USD
      ["bytedance/seedance-2.0/text-to-video", {}, 38800, 0.000014, 0.5432],
      [
        "bytedance/seedance-2.0/image-to-video",
        { image_url: "u" },
        38800,
        0.000014,
        0.5432,
      ],
      [
        "bytedance/seedance-2.0/fast/text-to-video",
        {},
        38800,
        0.0000112,
        0.43456,
      ],
      [
        "bytedance/seedance-2.0/fast/image-to-video",
        { image_url: "u" },
        38800,
        0.0000112,
        0.43456,
      ],
      [
        "bytedance/seedance-2.0/us/text-to-video",
        {},
        38800,
        0.0000168,
        0.65184,
      ],
      [
        "bytedance/seedance-2.0/us/image-to-video",
        { image_url: "u" },
        38800,
        0.0000168,
        0.65184,
      ],
      ["bytedance/seedance-2.5/text-to-video", {}, 38800, 0.0000214, 0.83032],
      [
        "bytedance/seedance-2.5/us/text-to-video",
        {},
        38800,
        0.00002568,
        0.996384,
      ],
    ];
    for (const [endpoint, extra, tokens, perUnitUsd, usd] of cases) {
      const result = seedance(endpoint, { ...seedanceRecorded, ...extra });
      expect(result.usd, endpoint).toBeCloseTo(usd, 10);
      expect(result.warnings, endpoint).toEqual([]);
      expect(result.breakdown.unit, endpoint).toBe("tokens");
      expect(result.breakdown.units, endpoint).toBeCloseTo(tokens, 6);
      expect(result.breakdown.perUnitUsd, endpoint).toBeCloseTo(perUnitUsd, 15);
    }

    // 47.43168 units: 0.6 x 640 x 640 x (96 + 97) / 1000. 2.0 US is the one
    // reference endpoint measured dividing by 1000.
    const usReference = seedance(
      "bytedance/seedance-2.0/us/reference-to-video",
      seedanceReference,
      { inputDurationSeconds: 4 }
    );
    expect(usReference.usd).toBeCloseTo(0.796852224, 10);
    expect(usReference.breakdown.units).toBeCloseTo(47431.68, 6);
    expect(usReference.warnings).toEqual([]);

    // 46.32 units: 0.6 x 640 x 640 x (96 + 97) / 1024.
    for (const [endpoint, usd] of [
      ["bytedance/seedance-2.5/reference-to-video", 0.991248],
      ["bytedance/seedance-2.5/us/reference-to-video", 1.1894976],
    ] as const) {
      const result = seedance(endpoint, seedanceReference, {
        inputDurationSeconds: 4,
      });
      expect(result.usd, endpoint).toBeCloseTo(usd, 10);
      expect(result.breakdown.units, endpoint).toBeCloseTo(46320, 6);
      expect(result.warnings, endpoint).toEqual([]);
    }
  });

  it("prices other Seedance sizes and lengths from the same formula", () => {
    const at = (
      endpoint: string,
      resolution: string,
      aspect_ratio: string,
      duration: string
    ) =>
      seedance(endpoint, {
        ...seedanceRecorded,
        resolution,
        aspect_ratio,
        duration,
      });
    const cases: Array<[string, string, string, string, number]> = [
      // 1280 x 720 x 121 / 1024 = 108,900 tokens at $0.014.
      ["bytedance/seedance-2.0/text-to-video", "720p", "16:9", "5", 1.5246],
      // 1920 x 1080 x 121 / 1024 = 245,025 tokens at $0.014.
      ["bytedance/seedance-2.0/text-to-video", "1080p", "16:9", "5", 3.43035],
      // 3840 x 2160 x 121 / 1024 = 980,100 tokens at $0.008.
      ["bytedance/seedance-2.0/text-to-video", "4k", "16:9", "5", 7.8408],
      // 720 x 1280 x 121 / 1024 = 108,900 tokens at $0.0112.
      [
        "bytedance/seedance-2.0/fast/text-to-video",
        "720p",
        "9:16",
        "5",
        1.21968,
      ],
      // 864 x 496 x 361 / 1024 = 151,078.5 tokens at $0.0112.
      [
        "bytedance/seedance-2.0/fast/text-to-video",
        "480p",
        "16:9",
        "15",
        1.6920792,
      ],
      // 2.5's own 480p 16:9 cell, 854 x 480: 48,437.8125 tokens at $0.0214.
      [
        "bytedance/seedance-2.5/text-to-video",
        "480p",
        "16:9",
        "5",
        1.0365691875,
      ],
      // 245,025 tokens at 2.5's billed 1080p $0.0234116 (0.0214 x 1.094).
      [
        "bytedance/seedance-2.5/text-to-video",
        "1080p",
        "16:9",
        "5",
        5.73642729,
      ],
      // 1112 x 834 x 721 / 1024 = 652,989.421875 tokens at $0.0214.
      [
        "bytedance/seedance-2.5/text-to-video",
        "720p",
        "4:3",
        "30",
        13.973973628125,
      ],
      // 2206 x 946 x 97 / 1024 = 197,682.58984375 tokens at $0.02808.
      [
        "bytedance/seedance-2.5/us/text-to-video",
        "1080p",
        "21:9",
        "4",
        5.5509271228125,
      ],
    ];
    for (const [endpoint, resolution, aspect, duration, usd] of cases) {
      const result = at(endpoint, resolution, aspect, duration);
      const label = `${endpoint} ${resolution} ${aspect} ${duration}`;
      expect(result.usd, label).toBeCloseTo(usd, 10);
      expect(result.warnings, label).toEqual([]);
    }

    // An omitted resolution is the documented default, 720p.
    expect(
      seedance("bytedance/seedance-2.0/text-to-video", {
        prompt: "p",
        duration: "5",
        aspect_ratio: "16:9",
        generate_audio: false,
      }).usd
    ).toBeCloseTo(1.5246, 10);

    // duration "auto" prices through costHints.durationSeconds.
    const auto = seedance(
      "bytedance/seedance-2.0/text-to-video",
      {
        ...seedanceRecorded,
        resolution: "720p",
        aspect_ratio: "16:9",
        duration: "auto",
      },
      { durationSeconds: 5 }
    );
    expect(auto.usd).toBeCloseTo(1.5246, 10);
    expect(auto.warnings).toEqual([]);

    // A 2.5 draft renders at 480p whatever resolution says.
    const draft = seedance("bytedance/seedance-2.5/text-to-video", {
      ...seedanceRecorded,
      resolution: "1080p",
      draft: true,
      aspect_ratio: "16:9",
      duration: "5",
    });
    expect(draft.usd).toBeCloseTo(1.0365691875, 10);
    expect(draft.warnings).toEqual([]);

    // An images-only reference bills the output alone, without the 0.6.
    const imagesOnly = seedance("bytedance/seedance-2.5/reference-to-video", {
      ...seedanceRecorded,
      image_urls: ["u"],
    });
    expect(imagesOnly.usd).toBeCloseTo(0.83032, 10);
    expect(imagesOnly.warnings).toEqual([]);

    // Audio, bitrate, codec and an end frame never change the price.
    const base = seedance("bytedance/seedance-2.0/image-to-video", {
      ...seedanceRecorded,
      image_url: "u",
    }).usd;
    for (const extra of [
      { generate_audio: true },
      { generate_audio: undefined },
      { bitrate_mode: "high" },
      { bitrate_mode: "standard" },
      { codec: "H265" },
      { end_image_url: "u" },
    ]) {
      expect(
        seedance("bytedance/seedance-2.0/image-to-video", {
          ...seedanceRecorded,
          image_url: "u",
          ...extra,
        }).usd,
        JSON.stringify(extra)
      ).toBe(base);
    }
  });

  it("prices a completed Seedance 2.5 draft from its hints", () => {
    const endpoint = "bytedance/seedance-2.5/draft/complete";
    // 1920 x 1080 x 121 / 1024 = 245,025 tokens at the billed 1080p
    // $0.0234116 (0.0214 x 1.094).
    const plain = seedance(
      endpoint,
      { draft_id: "d" },
      { durationSeconds: 5, aspectRatio: "16:9" }
    );
    expect(plain.usd).toBeCloseTo(5.73642729, 10);
    expect(plain.warnings).toEqual([]);
    // A draft with a 4 s video input: 0.6 x 1920 x 1080 x (96 + 121) / 1024
    // = 263,655 tokens.
    const withVideo = seedance(
      endpoint,
      { draft_id: "d" },
      { durationSeconds: 5, aspectRatio: "16:9", inputDurationSeconds: 4 }
    );
    expect(withVideo.usd).toBeCloseTo(6.172585398, 10);
    expect(withVideo.warnings).toEqual([]);
  });

  // ac-i5zo6h: the first billed 1080p 2.5 call. A 1:1 4 s draft completed to
  // 1440x1440 at 97 frames, 196,425 formula tokens, and fal billed 214.88895
  // units = 196.425 x 1.094 at $0.0214: $4.59862353, the usage API's
  // cost_total. The card's rounded $0.0234 would put it at $4.596345.
  it("reproduces the recorded 1080p draft completion bill", () => {
    const result = seedance(
      "bytedance/seedance-2.5/draft/complete",
      { draft_id: "d" },
      { durationSeconds: 4, aspectRatio: "1:1" }
    );
    expect(result.usd).toBeCloseTo(4.59862353, 10);
    expect(result.breakdown.units).toBeCloseTo(196425, 6);
    expect(result.breakdown.perUnitUsd).toBeCloseTo(0.0000234116, 15);
    expect(result.warnings).toEqual([]);
  });

  it("fails closed when a Seedance request does not fix the output", () => {
    const failsWith = (
      label: string,
      result: ReturnType<typeof computeEstimate>,
      ...fragments: string[]
    ) => {
      expect(result.usd, label).toBe(0);
      expect(result.warnings, label).toHaveLength(1);
      for (const fragment of fragments) {
        expect(result.warnings[0], label).toContain(fragment);
      }
    };
    const t2v = "bytedance/seedance-2.0/text-to-video";

    failsWith(
      "aspect auto",
      seedance(t2v, { ...seedanceRecorded, aspect_ratio: "auto" }),
      'aspect_ratio "auto"'
    );
    failsWith(
      "aspect omitted",
      seedance(t2v, {
        prompt: "p",
        resolution: "480p",
        duration: "4",
        generate_audio: false,
      }),
      'aspect_ratio "auto"'
    );
    failsWith(
      "duration auto, no hint",
      seedance(t2v, { ...seedanceRecorded, duration: "auto" }),
      'duration "auto"',
      "costHints.durationSeconds"
    );
    failsWith(
      "duration auto, fractional hint",
      seedance(
        t2v,
        { ...seedanceRecorded, duration: "auto" },
        { durationSeconds: 4.5 }
      ),
      "costHints.durationSeconds"
    );
    failsWith(
      "reference clip, no hint",
      seedance("bytedance/seedance-2.5/reference-to-video", seedanceReference),
      "costHints.inputDurationSeconds"
    );
    failsWith(
      "reference clip under 4 s",
      seedance("bytedance/seedance-2.5/reference-to-video", seedanceReference, {
        inputDurationSeconds: 3,
      }),
      "costHints.inputDurationSeconds",
      "under 4 s"
    );
    for (const task of ["editing", "extension"]) {
      failsWith(
        `task ${task}`,
        seedance(
          "bytedance/seedance-2.5/reference-to-video",
          { ...seedanceReference, task },
          { inputDurationSeconds: 4 }
        ),
        `task '${task}'`
      );
    }
    for (const resolution of ["1080p", "4k"]) {
      failsWith(
        `2.0 US ${resolution}`,
        seedance("bytedance/seedance-2.0/us/text-to-video", {
          ...seedanceRecorded,
          resolution,
        }),
        `resolution '${resolution}' has no published rate`
      );
    }
    failsWith(
      "2.0 US reference without video",
      seedance("bytedance/seedance-2.0/us/reference-to-video", {
        ...seedanceRecorded,
        image_urls: ["u"],
      }),
      "only a request with video_urls"
    );
    failsWith(
      "draft completion, no aspect",
      seedance(
        "bytedance/seedance-2.5/draft/complete",
        { draft_id: "d" },
        { durationSeconds: 5 }
      ),
      "costHints.aspectRatio"
    );
    failsWith(
      "draft completion, auto aspect",
      seedance(
        "bytedance/seedance-2.5/draft/complete",
        { draft_id: "d" },
        { durationSeconds: 5, aspectRatio: "auto" }
      ),
      "costHints.aspectRatio"
    );
    failsWith(
      "draft completion, no duration",
      seedance(
        "bytedance/seedance-2.5/draft/complete",
        { draft_id: "d" },
        { aspectRatio: "16:9" }
      ),
      "costHints.durationSeconds"
    );
  });

  it("keeps four Seedance ids dynamic and slugs the twelve priced ones", () => {
    const dynamic: readonly string[] = FAL_DYNAMIC_PRICING_ENDPOINTS;
    const slugs = MODEL_SLUGS.fal as Record<string, string>;
    const names = MODEL_DISPLAY.fal as Record<string, string>;
    // No 2.0 or 2.0 Fast reference call is recorded, and the 2.0 US one
    // divides by 1000; 2.5 image-to-video follows the input image's aspect.
    // Dynamic ids carry a display-only name (ac-j3d6ki.6), never a slug.
    for (const [endpoint, name] of [
      ["bytedance/seedance-2.0/fast/reference-to-video", "Seedance 2 Fast"],
      ["bytedance/seedance-2.0/reference-to-video", "Seedance 2"],
      ["bytedance/seedance-2.5/image-to-video", "Seedance 2.5"],
      ["bytedance/seedance-2.5/us/image-to-video", "Seedance 2.5 US"],
    ]) {
      expect(dynamic, endpoint).toContain(endpoint);
      expect(falPricing[endpoint], endpoint).toBeUndefined();
      expect(slugs[endpoint], endpoint).toBeUndefined();
      expect(names[endpoint], endpoint).toBe(name);
      const result = seedance(endpoint, seedanceReference, {
        inputDurationSeconds: 4,
      });
      expect(result.usd, endpoint).toBe(0);
      expect(result.warnings[0], endpoint).toContain("models/pricing/estimate");
    }
    const priced: Array<[string, string, string]> = [
      ["bytedance/seedance-2.0/text-to-video", "sd2", "Seedance 2"],
      ["bytedance/seedance-2.0/image-to-video", "sd2", "Seedance 2"],
      ["bytedance/seedance-2.0/fast/text-to-video", "sd2f", "Seedance 2 Fast"],
      ["bytedance/seedance-2.0/fast/image-to-video", "sd2f", "Seedance 2 Fast"],
      ["bytedance/seedance-2.0/us/text-to-video", "sd2", "Seedance 2 US"],
      ["bytedance/seedance-2.0/us/image-to-video", "sd2", "Seedance 2 US"],
      ["bytedance/seedance-2.0/us/reference-to-video", "sd2", "Seedance 2 US"],
      ["bytedance/seedance-2.5/text-to-video", "sd2p5", "Seedance 2.5"],
      ["bytedance/seedance-2.5/reference-to-video", "sd2p5", "Seedance 2.5"],
      ["bytedance/seedance-2.5/us/text-to-video", "sd2p5", "Seedance 2.5 US"],
      [
        "bytedance/seedance-2.5/us/reference-to-video",
        "sd2p5",
        "Seedance 2.5 US",
      ],
      ["bytedance/seedance-2.5/draft/complete", "sd2p5", "Seedance 2.5"],
    ];
    for (const [endpoint, slug, name] of priced) {
      expect(dynamic, endpoint).not.toContain(endpoint);
      expect(falPricing[endpoint], endpoint).toBeDefined();
      expect(falPricing[endpoint].source.asOf, endpoint).toBe("2026-10-17");
      expect(slugs[endpoint], endpoint).toBe(slug);
      expect(names[endpoint], endpoint).toBe(name);
    }
    // The same models kie resells keep the same slugs.
    expect(MODEL_SLUGS.kie["bytedance/seedance-2"]).toBe("sd2");
    expect(MODEL_SLUGS.kie["bytedance/seedance-2-fast"]).toBe("sd2f");
    expect(MODEL_SLUGS.kie["bytedance/seedance-2-5"]).toBe("sd2p5");
  });

  it("prices Wan 3.0 Prime per output second", () => {
    // Wan 3.0 Prime bills a flat $0.05 per OUTPUT second, with no resolution
    // tier — fal's pricing API reports one unit_price for all three operations
    // (pulled 2026-08-25). `duration` is an integer defaulting to 5.
    expect(
      est("alibaba/wan-3.0-prime/text-to-video", { prompt: "p", duration: 2 })
        .usd
    ).toBeCloseTo(0.1, 10);

    expect(
      est("alibaba/wan-3.0-prime/image-to-video", {
        start_image_url: "https://example.com/cat.jpg",
        duration: 30,
      }).usd
    ).toBeCloseTo(1.5, 10);

    // Omitted duration takes the documented schema default of 5 seconds.
    expect(
      est("alibaba/wan-3.0-prime/reference-to-video", {
        reference_image_urls: ["https://example.com/cat.jpg"],
      }).usd
    ).toBeCloseTo(0.25, 10);

    // Resolution does not tier the rate.
    expect(
      est("alibaba/wan-3.0-prime/text-to-video", {
        prompt: "p",
        duration: 5,
        resolution: "480p",
      }).usd
    ).toBeCloseTo(
      est("alibaba/wan-3.0-prime/text-to-video", {
        prompt: "p",
        duration: 5,
        resolution: "1080p",
      }).usd,
      10
    );
  });

  it("fails closed on Wan 3.0 Prime smart duration", () => {
    // `duration: null` asks the model to pick the length from the prompt and
    // reference media. Nothing in the payload determines it, so the estimate
    // must warn rather than fall back to the 5-second default.
    const result = est("alibaba/wan-3.0-prime/text-to-video", {
      prompt: "p",
      duration: null,
    });
    expect(result.usd).toBe(0);
    expect(result.warnings.length).toBeGreaterThan(0);
  });

  it("warns instead of guessing when seconds are not derivable", () => {
    // Kling duration is a bare string upstream; non-digit strings warn.
    const kling = est("fal-ai/kling-video/v3/pro/text-to-video", {
      prompt: "p",
      duration: "5s",
    });
    expect(kling.usd).toBe(0);
    expect(kling.warnings.join(" ")).toMatch(/could not derive units/);

    // wan edit-video duration defaults to 0 = "match the source video",
    // whose length is not in the payload.
    const wanEdit = est("fal-ai/wan/v2.7/edit-video", {
      prompt: "p",
      video_url: "u",
    });
    expect(wanEdit.usd).toBe(0);
    expect(wanEdit.warnings.join(" ")).toMatch(/could not derive units/);
    expect(
      est("fal-ai/wan/v2.7/edit-video", {
        prompt: "p",
        video_url: "u",
        duration: 8,
      }).usd
    ).toBeCloseTo(0.8, 10);
  });

  it("warns on an unrecognized selector value instead of guessing", () => {
    const wan = est("fal-ai/wan/v2.7/image-to-video", {
      prompt: "p",
      image_url: "u",
      duration: 5,
      resolution: "480p",
    });
    expect(wan.usd).toBe(0);
    expect(wan.warnings.join(" ")).toMatch(/no rate for variant '480p'/);

    const veo = est("fal-ai/veo3.1", {
      prompt: "p",
      duration: "8s",
      resolution: "8k",
    });
    expect(veo.usd).toBe(0);
    expect(veo.warnings.join(" ")).toMatch(/no rate for variant/);
  });
});

// Static estimates for the REQ-002 edit/image endpoints (ac-h7kvm.7 WI-3).
// Rates were sourced from each endpoint's fal.ai page on 2026-07-22; the
// evidence table lives on bead ac-rx647.
describe("fal edit/image pricing estimates", () => {
  const estimate = (endpoint: string, payload: Record<string, unknown> = {}) =>
    computeEstimate({ provider: "fal" as const, endpoint, payload });

  // Every REQ-002 endpoint id must be a PRICING.fal key or on the documented
  // dynamic-path list — never silently absent, and never both.
  const REQ_002_ENDPOINTS = [
    "fal-ai/nano-banana-pro/edit",
    "fal-ai/nano-banana-2/edit",
    "google/nano-banana-2-lite",
    "google/nano-banana-lite/edit",
    "fal-ai/bytedance/seedream/v5/lite/edit",
    "fal-ai/wan/v2.7/text-to-image",
    "fal-ai/wan/v2.7/edit",
    "fal-ai/wan/v2.7/pro/text-to-image",
    "fal-ai/wan/v2.7/pro/edit",
    "xai/grok-imagine-image",
    "xai/grok-imagine-image/edit",
    "fal-ai/hunyuan-image/v3/instruct/edit",
    "fal-ai/qwen-image-edit",
    "fal-ai/gpt-image-1.5",
    "fal-ai/gpt-image-1.5/edit",
    "xai/grok-imagine-image/v2.0/edit",
    "xai/grok-imagine-image/v2.0/text-to-image",
  ];

  it("covers every REQ-002 endpoint statically or on the dynamic list", () => {
    const dynamic: readonly string[] = FAL_DYNAMIC_PRICING_ENDPOINTS;
    expect(REQ_002_ENDPOINTS).toHaveLength(17);
    for (const endpoint of REQ_002_ENDPOINTS) {
      const priced = endpoint in falPricing;
      const isDynamic = dynamic.includes(endpoint);
      expect(priced || isDynamic, endpoint).toBe(true);
      expect(priced && isDynamic, endpoint).toBe(false);
    }
  });

  it("estimates the flat per-image edit endpoints", () => {
    const seedream = estimate("fal-ai/bytedance/seedream/v5/lite/edit", {
      prompt: "recolor",
      image_urls: ["https://example.com/a.png"],
    });
    expect(seedream.usd).toBe(0.035);
    expect(seedream.breakdown).toEqual({
      units: 1,
      unit: "images",
      perUnitUsd: 0.035,
    });
    expect(seedream.rateAsOf).toBe("2026-07-22");
    expect(seedream.warnings).toEqual([]);

    expect(estimate("fal-ai/wan/v2.7/edit", { num_images: 2 }).usd).toBe(0.06);
    expect(estimate("fal-ai/wan/v2.7/pro/edit", { num_images: 2 }).usd).toBe(
      0.15
    );
    expect(estimate("xai/grok-imagine-image").usd).toBe(0.02);
    // Both v1 Grok Imagine operations bill one flat $0.02 per image. The edit
    // rate used to fold in a $0.002 input component; a 2026-08-25 pull of
    // fal's pricing API reports no such component and one flat unit_price for
    // both endpoints (ac-i25ewx).
    expect(estimate("xai/grok-imagine-image/edit").usd).toBe(0.02);
    expect(estimate("xai/grok-imagine-image").usd).toBe(
      estimate("xai/grok-imagine-image/edit").usd
    );
  });

  it("prices google virtual try-on per generated image", () => {
    // fal's pricing API reports one flat unit_price of USD 0.075 per image
    // with no tier and no selector
    // (GET /v1/models/pricing?endpoint_id=google/virtual-try-on, 2026-08-27).
    const one = estimate("google/virtual-try-on", {
      person_image_url: "https://example.com/person.jpg",
      product_image_url: "https://example.com/tshirt.jpg",
    });
    expect(one.usd).toBe(0.075); // num_images defaults to 1
    expect(one.breakdown).toEqual({
      units: 1,
      unit: "images",
      perUnitUsd: 0.075,
    });
    expect(one.rateAsOf).toBe("2026-08-27");
    expect(one.warnings).toEqual([]);

    // num_images is the exact billed image count, bounded 1-4 upstream.
    expect(
      estimate("google/virtual-try-on", {
        person_image_url: "https://example.com/person.jpg",
        product_image_url: "https://example.com/tshirt.jpg",
        num_images: 4,
      }).usd
    ).toBeCloseTo(0.3, 10);
  });

  it("routes seedream 5 pro text-to-image to the dynamic path", () => {
    // The model page's card is explicitly "tentative": $0.0675 per image at
    // or below 1536x1536 and $0.135 above it. The recorded 1024x1024
    // (`square_hd`) call with num_images 1 sits well inside the low tier, yet
    // GET /v1/models/usage reports quantity 2, unit_price 0.0675,
    // cost_total 0.135 for it, matching the response's own
    // `x-fal-billable-units: 2.0`. No request field yields that 2, so the
    // endpoint is unpriced here rather than carrying a per-image table that
    // the observed charge contradicts.
    const endpoint = "bytedance/seedream/v5/pro/text-to-image";
    const dynamic: readonly string[] = FAL_DYNAMIC_PRICING_ENDPOINTS;

    expect(dynamic).toContain(endpoint);
    expect(endpoint in falPricing).toBe(false);

    const result = estimate(endpoint, {
      prompt: "a red fox in the snow",
      image_size: "square_hd",
      num_images: 1,
    });
    expect(result.usd).toBe(0);
    expect(result.warnings.length).toBeGreaterThan(0);
    expect(
      result.warnings.some((w) => w.includes("models/pricing/estimate"))
    ).toBe(true);
  });

  it("routes seedream 5 pro edit to the dynamic path", () => {
    // The model page's card is explicitly "tentative": $0.0675 per output
    // image at or below 1536x1536 and $0.135 above it, plus $0.0045 for each
    // input image after the first. The recorded 1024x1024 (`square_hd`) call
    // with num_images 1 and a single (free) input image sits well inside the
    // low tier, yet GET /v1/models/usage reports quantity 2, unit_price
    // 0.0675, cost_total 0.135 for it, matching the response's own
    // `x-fal-billable-units: 2.0`. No request field yields that 2, so the
    // endpoint is unpriced here rather than carrying a per-image table that
    // the observed charge contradicts.
    const endpoint = "bytedance/seedream/v5/pro/edit";
    const dynamic: readonly string[] = FAL_DYNAMIC_PRICING_ENDPOINTS;

    expect(dynamic).toContain(endpoint);
    expect(endpoint in falPricing).toBe(false);

    const result = estimate(endpoint, {
      prompt: "a red fox in the snow",
      image_urls: ["https://example.com/a.png"],
      image_size: "square_hd",
      num_images: 1,
    });
    expect(result.usd).toBe(0);
    expect(result.warnings.length).toBeGreaterThan(0);
    expect(
      result.warnings.some((w) => w.includes("models/pricing/estimate"))
    ).toBe(true);
  });

  it("counts wan text-to-image output from max_images", () => {
    // The Wan 2.7 t2i schemas define max_images, not num_images.
    const result = estimate("fal-ai/wan/v2.7/text-to-image", {
      prompt: "a cat",
      max_images: 3,
    });
    expect(result.usd).toBeCloseTo(0.09, 10); // 3 * 0.03
    expect(result.breakdown.units).toBe(3);

    const pro = estimate("fal-ai/wan/v2.7/pro/text-to-image", {
      prompt: "a cat",
    });
    expect(pro.usd).toBe(0.075); // defaults to 1 image
  });

  it("prices nano-banana edits as their generation counterparts", () => {
    // nano-banana-2/edit mirrors the nano-banana-2 resolution tiers.
    expect(estimate("fal-ai/nano-banana-2/edit").usd).toBe(0.08); // 1K default
    expect(
      estimate("fal-ai/nano-banana-2/edit", { resolution: "2K" }).usd
    ).toBe(0.12);
    // nano-banana-pro/edit is flat until 4K, which bills double.
    expect(estimate("fal-ai/nano-banana-pro/edit").usd).toBe(0.15);
    expect(
      estimate("fal-ai/nano-banana-pro/edit", { resolution: "4K" }).usd
    ).toBe(0.3);
  });

  it("estimates the per-megapixel edit endpoints", () => {
    const hunyuan = estimate("fal-ai/hunyuan-image/v3/instruct/edit", {
      image_size: { width: 2048, height: 2048 },
    });
    // 2048*2048 = 4,194,304 px = exactly 4 megapixels of 1024x1024 px
    expect(hunyuan.usd).toBeCloseTo(0.36, 10);
    expect(hunyuan.breakdown).toEqual({
      units: 4,
      unit: "megapixels",
      perUnitUsd: 0.09,
    });

    const qwen = estimate("fal-ai/qwen-image-edit", {
      image_size: "square_hd",
      num_images: 2,
    });
    // 1024x1024 is exactly 1 megapixel per image, 2 images.
    expect(qwen.usd).toBeCloseTo(0.06, 10);
    expect(qwen.breakdown.units).toBe(2);
  });

  // ac-hntqm6: fal counts a megapixel as 1024x1024 = 1,048,576 px. The three
  // card-stated endpoints round each image up; usd = units x the card rate.
  it.each([
    ["square_hd", "square_hd", 1, 1],
    ["1024x1024", { width: 1024, height: 1024 }, 1, 1],
    ["1000x1000", { width: 1000, height: 1000 }, 1, 1],
    ["1024x1040", { width: 1024, height: 1040 }, 1, 2],
    ["1920x1080", { width: 1920, height: 1080 }, 1, 2],
    ["1448x1448", { width: 1448, height: 1448 }, 1, 2],
    ["2048x2048", { width: 2048, height: 2048 }, 1, 4],
    ["2048x2064", { width: 2048, height: 2064 }, 1, 5],
    ["square_hd x2", "square_hd", 2, 2],
    ["1920x1080 x4", { width: 1920, height: 1080 }, 4, 8],
  ] as const)(
    "rounds %s up to whole 1024x1024 megapixels per image",
    (_label, image_size, num_images, units) => {
      for (const [endpoint, rate] of [
        ["fal-ai/flux/dev", 0.025],
        ["fal-ai/flux/schnell", 0.003],
        ["fal-ai/qwen-image", 0.02],
      ] as const) {
        const result = estimate(endpoint, {
          prompt: "x",
          image_size,
          num_images,
        });
        expect(result.breakdown, endpoint).toEqual({
          units,
          unit: "megapixels",
          perUnitUsd: rate,
        });
        expect(result.usd, endpoint).toBeCloseTo(units * rate, 10);
        expect(result.rateAsOf, endpoint).toBe("2026-10-15");
        expect(result.warnings, endpoint).toEqual([]);
      }
    }
  );

  it("prices the recorded qwen-image square_hd call as one megapixel", () => {
    // tests/recordings/fal_2801268556/qwen-image_1996519734 returned one
    // 1024x1024 image and billed x-fal-billable-units 1. fal's usage API
    // reads 1 megapixel at $0.02 for that minute (2026-04-18T10:35Z).
    const result = estimate("fal-ai/qwen-image", {
      prompt:
        "An action shot of a black lab swimming in an inground suburban swimming pool.",
      num_images: 1,
      image_size: "square_hd",
      output_format: "png",
      num_inference_steps: 30,
    });
    expect(result.breakdown.units).toBe(1);
    expect(result.usd).toBeCloseTo(0.02, 10);
  });

  it.each([
    ["square_hd", "square_hd", 1, 1],
    ["1024x2048", { width: 1024, height: 2048 }, 1, 2],
    ["2048x2048", { width: 2048, height: 2048 }, 1, 4],
    ["square_hd x2", "square_hd", 2, 2],
  ] as const)(
    "prices %s on the whole-megapixel edit endpoints",
    (_label, image_size, num_images, units) => {
      for (const [endpoint, rate] of [
        ["fal-ai/hunyuan-image/v3/instruct/edit", 0.09],
        ["fal-ai/qwen-image-edit", 0.03],
      ] as const) {
        const result = estimate(endpoint, { image_size, num_images });
        expect(result.breakdown, endpoint).toEqual({
          units,
          unit: "megapixels",
          perUnitUsd: rate,
        });
        expect(result.usd, endpoint).toBeCloseTo(units * rate, 10);
        expect(result.warnings, endpoint).toEqual([]);
      }
    }
  );

  it.each([
    ["square", "square", "0.2500"],
    ["landscape_4_3", "landscape_4_3", "0.7500"],
    ["1000x1000", { width: 1000, height: 1000 }, "0.9537"],
    ["1024x1040", { width: 1024, height: 1040 }, "1.0156"],
    ["1920x1080", { width: 1920, height: 1080 }, "1.9775"],
  ] as const)(
    "warns on the partial-megapixel %s edit size instead of rounding",
    (_label, image_size, perImage) => {
      for (const endpoint of [
        "fal-ai/hunyuan-image/v3/instruct/edit",
        "fal-ai/qwen-image-edit",
      ]) {
        const result = estimate(endpoint, { image_size });
        expect(result.usd, endpoint).toBe(0);
        expect(result.warnings, endpoint).toEqual([
          `fal '${endpoint}': image_size is ${perImage} megapixels per image; fal publishes no rounding rule for this endpoint, so only whole-megapixel sizes are priced`,
        ]);
      }
    }
  );

  it("warns when qwen image edit omits its undocumented size", () => {
    const result = estimate("fal-ai/qwen-image-edit", {
      prompt: "recolor",
      image_url: "https://example.com/a.png",
    });

    expect(result.usd).toBe(0);
    expect(result.warnings).toContain(
      "fal 'fal-ai/qwen-image-edit': could not derive units from payload (check duration / text)"
    );
  });

  it("warns on hunyuan image_size omitted or 'auto' instead of guessing", () => {
    // image_size defaults to "auto" upstream, which has no fixed dimensions,
    // so the minimal valid payload — no image_size at all — must warn exactly
    // like the explicit spelling rather than fall back to 1 MP/image.
    for (const payload of [
      { prompt: "recolor", image_urls: ["https://example.com/a.png"] },
      { image_size: "auto" },
    ]) {
      const result = estimate("fal-ai/hunyuan-image/v3/instruct/edit", payload);
      expect(result.usd).toBe(0);
      expect(result.warnings).toContain(
        "fal 'fal-ai/hunyuan-image/v3/instruct/edit': could not derive units from payload (check duration / text)"
      );
    }
  });

  it("selects gpt-image-1.5 rates on the quality × size grid", () => {
    // fal defaults quality to high and generation image_size to 1024x1024.
    expect(estimate("fal-ai/gpt-image-1.5").usd).toBe(0.133);
    expect(
      estimate("fal-ai/gpt-image-1.5", {
        quality: "low",
        image_size: "1536x1024",
      }).usd
    ).toBe(0.013);
    expect(
      estimate("fal-ai/gpt-image-1.5", {
        quality: "medium",
        image_size: "1024x1536",
      }).usd
    ).toBe(0.051);
    expect(estimate("fal-ai/gpt-image-1.5", { num_images: 2 }).usd).toBeCloseTo(
      0.266,
      10
    );
    expect(
      estimate("fal-ai/gpt-image-1.5/edit", {
        quality: "low",
        image_size: "1024x1024",
      }).usd
    ).toBe(0.009);
  });

  it("warns on gpt-image-1.5/edit when image_size is omitted or auto", () => {
    // The edit endpoint defaults image_size to "auto", which has no fixed
    // row in fal's price grid — warn rather than guess a square rate.
    for (const payload of [{}, { image_size: "auto" }]) {
      const result = estimate("fal-ai/gpt-image-1.5/edit", payload);
      expect(result.usd).toBe(0);
      expect(result.warnings).toContain(
        "fal 'fal-ai/gpt-image-1.5/edit': no rate for variant 'high|auto' (selectors: quality, image_size)"
      );
    }
  });

  it("warns on an unrecognized gpt-image-1.5 quality selector", () => {
    const result = estimate("fal-ai/gpt-image-1.5", { quality: "ultra" });
    expect(result.usd).toBe(0);
    expect(result.warnings).toContain(
      "fal 'fal-ai/gpt-image-1.5': no rate for variant 'ultra|1024x1024' (selectors: quality, image_size)"
    );
  });

  it("points dynamic-priced endpoints at fal's own estimate API", () => {
    // "not found in pricing table" cannot distinguish a deliberately unpriced
    // endpoint from an unknown one, so a caller had no way to learn that a
    // real number is one call away (ac-nz65nc). @apicity/cost still makes no
    // network call — it only names the one to make.
    for (const endpoint of FAL_DYNAMIC_PRICING_ENDPOINTS) {
      const result = est(endpoint, { prompt: "a cat" });
      expect(result.usd, endpoint).toBe(0);
      expect(result.warnings, endpoint).toHaveLength(1);
      expect(result.warnings[0], endpoint).toContain(endpoint);
      expect(result.warnings[0], endpoint).toContain(
        "POST https://api.fal.ai/v1/models/pricing/estimate"
      );
      expect(result.warnings[0], endpoint).toContain(
        "fal.v1.models.pricing.estimate"
      );
      expect(result.warnings[0], endpoint).toContain("FAL_ADMIN_API_KEY");
      // fal's estimate API prices a quantity, not a payload, so the warning
      // says where the quantity comes from and which option takes it
      // (ac-ytg1l1).
      expect(result.warnings[0], endpoint).toContain("x-fal-billable-units");
      expect(result.warnings[0], endpoint).toContain("unitQuantity");
      // The generic lookup-miss wording must NOT be what a caller sees here.
      expect(result.warnings[0], endpoint).not.toContain(
        "not found in pricing table"
      );
    }
  });

  it("still reports a genuinely unknown fal endpoint as a lookup miss", () => {
    const result = est("fal-ai/not-a-real-endpoint", { prompt: "a cat" });
    expect(result.usd).toBe(0);
    expect(result.warnings[0]).toContain("not found in pricing table");
    expect(result.warnings[0]).not.toContain("pricing/estimate");
  });

  it("keeps every dynamic-priced endpoint out of both registries", () => {
    // alibaba/qwen-image-3/text-to-image and its /edit sibling are
    // compute-second-metered — the model page states 1K/2K tier rates but
    // publishes no image_size-to-tier selector, and the pricing API reports one
    // flat compute-second price with no tier at all (ac-kjdp0j); the three
    // alibaba/wan-3.0 video operations are compute-second-metered too — their
    // payload `duration` is OUTPUT seconds, a different unit from the
    // wall-clock GPU seconds they bill, so it cannot derive the price (the
    // alibaba/wan-3.0-prime siblings bill per output second and ARE priced);
    // blackforestlabs/flux-video-upscale depends on delivered output metadata;
    // google/nano-banana-2-lite and google/nano-banana-lite/edit are
    // token-metered without a published tokens-per-image constant;
    // xai/grok-imagine-image/v2.0/edit and text-to-image are
    // compute-second-metered; bytedance/seedream/v5/pro/edit bills a bare
    // "units" unit whose quantity no request field determines — a recorded
    // 1024x1024 `square_hd` call with num_images 1 and one (free) input image
    // was billed 2 units (USD 0.135), not the 1 unit every statically priced
    // per-image fal endpoint bills; bytedance/seedream/v5/pro/layerize is
    // compute-second-metered too, and the layer count it returns is the model's
    // choice rather than a request field;
    // bytedance/seedream/v5/pro/text-to-image bills a bare "units" unit whose
    // quantity no request field determines — a recorded 1024x1024 `square_hd`
    // call with num_images 1 was billed 2 units (USD 0.135), not the 1 unit
    // every statically priced per-image fal endpoint bills;
    // google/gemini-omni-flash is token-metered, and its page's "approximately
    // $0.125 per second" 720p figure predicts USD 0.375 for the recorded
    // duration-3 call that actually billed USD 0.382914;
    // google/gemini-omni-flash/edit is token-metered on a source video whose
    // length no request field carries; google/gemini-omni-flash/image-to-video
    // is token-metered over an input image and prompt whose token counts no
    // request field carries; google/gemini-omni-flash/reference-to-video is
    // token-metered over reference images and a prompt whose token counts no
    // request field carries; lightricks/ltx-2.5/image-to-video/fast is
    // compute-second-metered too, and its payload `duration` may be "auto", so
    // it does not even fix the OUTPUT length at request time;
    // lightricks/ltx-2.5/image-to-video/pro is compute-second-metered too, and
    // its payload `duration` may be "auto", so it does not even fix the OUTPUT
    // length at request time; meshy/v7/image-to-3d is compute-second-metered
    // too — its request only sizes the mesh and toggles generation stages, and
    // upstream publishes no seconds-per-unit constant for any of them
    // (ac-yhn0aq); minimax/h3/image-to-video is compute-second-metered too, and
    // neither its output `duration` nor its `resolution` tier fixes the
    // wall-clock GPU time it bills; minimax/h3/reference-to-video is
    // compute-second-metered too, and neither its output `duration` nor its
    // `resolution` tier fixes the wall-clock GPU time it bills;
    // minimax/h3/text-to-video is compute-second-metered too, and neither its
    // output `duration` nor its `resolution` tier fixes the wall-clock GPU time
    // it bills; minimax/music-3 is compute-second-metered too — its `duration`
    // is an upper bound on OUTPUT seconds the model may undershoot, not the
    // wall-clock GPU seconds fal bills; topaz/upscale/image/precision bills on
    // OUTPUT area ($0.08 per 24 megapixels of output) and the request carries
    // only `image_url`, so the source dimensions the area depends on are not a
    // request field; topaz/upscale/video/precision bills on the DELIVERED video
    // ($0.10 per 10 seconds of output at 720p, more at 1080p and 4K), and
    // output resolution, duration and frame rate are all properties of the
    // source clip rather than request fields;
    // xai/grok-imagine-video/v1.5/reference-to-video is compute-second-metered
    // too, unlike its unversioned sibling, which bills per output second and
    // stays statically priced. Mirelo SFX 2.0 text-to-audio, video-to-audio
    // and video-to-video each bill 2 units for a 1.5-second sample,
    // contradicting the card's seconds formula. Mureka instrumental billed 2
    // units ($0.015) for a mureka-7.6 request its card prices at $0.045.
    // Mureka podcast bills output minutes that no request field fixes. Nano
    // Banana 2.1 bills prompt, thinking and image tokens that no request field
    // fixes. Kandinsky 6.0 VSR bills output megapixels per output frame, set by
    // the source clip and the model rather than a request field. Kandinsky
    // 6.0 Lite text-to-video and image-to-video each billed 0.5011 units
    // ($0.0802 and $0.0852) for a four-step clip their cards price at half a
    // unit ($0.08 and $0.085), and Kandinsky 6.0 Pro text-to-video and
    // image-to-video each billed 0.1756 units ($0.2371 and $0.2458) for an
    // eight-step clip their cards price at $0.24 and $0.25. FLUX.2 Flex billed
    // 0.834 processed megapixels ($0.0417) for a 1024x768 image its card
    // rounds up to one megapixel ($0.05). FLUX 3 Action SO-101 bills compute
    // seconds that no request field fixes. Grok Voice bills seconds whose
    // meaning is unpublished and which differ from input/reply duration.
    // Four Seedance ids stay. 2.0 and 2.0 Fast reference-to-video are
    // unrecorded, and the one 2.0-series reference recording (2.0 US)
    // divides by 1000 where the card says 1024. 2.5 and 2.5 US
    // image-to-video follow the input image's aspect, which no request field
    // sizes (ac-j3d6ki.3). Reframe-video also bills generated overlap. HeyGen
    // digital twins bill whole output seconds that the spoken script sets
    // (ac-7wb7u7). All use fal's pricing-estimate API.
    expect(FAL_DYNAMIC_PRICING_ENDPOINTS).toEqual([
      "alibaba/qwen-image-3/edit",
      "alibaba/qwen-image-3/text-to-image",
      "alibaba/wan-3.0/image-to-video",
      "alibaba/wan-3.0/reference-to-video",
      "alibaba/wan-3.0/text-to-video",
      "blackforestlabs/flux-3/edit-image",
      "blackforestlabs/flux-3/text-to-image",
      "blackforestlabs/flux-video-upscale",
      "bytedance/seedance-2.0/fast/reference-to-video",
      "bytedance/seedance-2.0/reference-to-video",
      "bytedance/seedance-2.5/image-to-video",
      "bytedance/seedance-2.5/us/image-to-video",
      "bytedance/seedream/v5/pro/edit",
      "bytedance/seedream/v5/pro/layerize",
      "bytedance/seedream/v5/pro/text-to-image",
      "fal-ai/flux-2-flex",
      "fal-ai/flux-3-action/so101",
      "fal-ai/heygen/avatar3/digital-twin",
      "fal-ai/heygen/avatar4/digital-twin",
      "fal-ai/heygen/avatar4/image-to-video",
      "fal-ai/heygen/avatar5/digital-twin",
      "fal-ai/heygen/v2/translate/precision",
      "fal-ai/heygen/v2/translate/speed",
      "fal-ai/heygen/v2/video-agent",
      "fal-ai/heygen/v3/filler-word-removal",
      "fal-ai/heygen/v3/lipsync/precision",
      "fal-ai/heygen/v3/lipsync/speed",
      "fal-ai/kandinsky6-lite/image-to-video",
      "fal-ai/kandinsky6-lite/text-to-video",
      "fal-ai/kandinsky6-pro/image-to-video",
      "fal-ai/kandinsky6-pro/text-to-video",
      "fal-ai/kandinsky6-vsr",
      "fal-ai/kandinsky6-vsr/lite",
      "google/gemini-omni-flash",
      "google/gemini-omni-flash/edit",
      "google/gemini-omni-flash/image-to-video",
      "google/gemini-omni-flash/reference-to-video",
      "google/gemini-omni-flash/v1.1/edit",
      "google/gemini-omni-flash/v1.1/image-to-video",
      "google/gemini-omni-flash/v1.1/reference-to-video",
      "google/gemini-omni-flash/v1.1/text-to-video",
      "google/nano-banana-2-lite",
      "google/nano-banana-2.1",
      "google/nano-banana-2.1/edit",
      "google/nano-banana-lite/edit",
      "kling/v4/video-to-video/edit",
      "lightricks/ltx-2.5/image-to-video/fast",
      "lightricks/ltx-2.5/image-to-video/pro",
      "luma/agent/ray/v3.2/reframe",
      "luma/agent/ray/v3.2/text-to-video",
      "meshy/v7/image-to-3d",
      "microsoft/mai-image-2.5-pro",
      "microsoft/mai-image-2.5-pro/edit",
      "minimax/h3-max/3d-to-video",
      "minimax/h3-max/extend-video",
      "minimax/h3-max/insert-video",
      "minimax/h3-max/lip-sync/image-to-video",
      "minimax/h3-max/reference-to-video",
      "minimax/h3-max/reframe-video",
      "minimax/h3/image-to-video",
      "minimax/h3/reference-to-video",
      "minimax/h3/text-to-video",
      "minimax/music-3",
      "mirelo-ai/sfx2.0/text-to-audio",
      "mirelo-ai/sfx2.0/video-to-audio",
      "mirelo-ai/sfx2.0/video-to-video",
      "mureka/api/generate/instrumental",
      "mureka/api/generate/podcast",
      "openai/gpt-image-2.5/flare/edit",
      "openai/gpt-image-2.5/flare/text-to-image",
      "openai/gpt-image-2.5/sunburst/edit",
      "openai/gpt-image-2.5/sunburst/text-to-image",
      "openrouter/router/decisions",
      "topaz/upscale/image/precision",
      "topaz/upscale/video/precision",
      "xai/grok-imagine-image/v2.0/edit",
      "xai/grok-imagine-image/v2.0/text-to-image",
      "xai/grok-imagine-video/v1.5/reference-to-video",
      "xai/grok-voice",
    ]);
    for (const endpoint of FAL_DYNAMIC_PRICING_ENDPOINTS) {
      expect(falPricing[endpoint], endpoint).toBeUndefined();
      expect(
        (MODEL_SLUGS.fal as Record<string, string>)[endpoint],
        endpoint
      ).toBeUndefined();
      const result = estimate(endpoint, { prompt: "a cat" });
      expect(result.usd).toBe(0);
      // The warning names fal's estimate API rather than reporting a lookup
      // miss; the wording itself is pinned by the case above (ac-nz65nc).
      expect(result.warnings[0], endpoint).toContain("models/pricing/estimate");
    }
  });
});
