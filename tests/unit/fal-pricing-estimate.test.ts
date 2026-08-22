import { describe, expect, it, vi } from "vitest";

import { createFal } from "../../packages/provider/fal/src/fal";
import { FAL_ENDPOINT_REQUEST_SCHEMAS } from "../../packages/provider/fal/src/zod";
import { computeEstimate } from "../../packages/provider/cost/src/compute";
import {
  fal as falPricing,
  FAL_DYNAMIC_PRICING_ENDPOINTS,
} from "../../packages/provider/cost/src/pricing/fal";
import { MODEL_SLUGS } from "../../packages/provider/cost/src/slugs";

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
    "xai/grok-imagine-video/image-to-video",
    "xai/grok-imagine-video/reference-to-video",
    "xai/grok-imagine-video/extend-video",
    "xai/grok-imagine-video/edit-video",
  ];

  it("covers every REQ-001 endpoint statically or on the dynamic list", () => {
    const dynamic: readonly string[] = FAL_DYNAMIC_PRICING_ENDPOINTS;
    expect(REQ_001_ENDPOINTS).toHaveLength(25);
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

  it("prices seedance's token-derived per-second rates", () => {
    // 720p → 21600 tokens/s × $0.014/1000 = $0.3024/s.
    expect(
      est("bytedance/seedance-2.0/text-to-video", {
        prompt: "p",
        duration: "5",
        resolution: "720p",
      }).usd
    ).toBeCloseTo(1.512, 10);

    // image-to-video shares the text-to-video token rates.
    expect(
      est("bytedance/seedance-2.0/image-to-video", {
        prompt: "p",
        image_url: "u",
        duration: "5",
        resolution: "720p",
      }).usd
    ).toBeCloseTo(1.512, 10);

    // Omitted resolution defaults to 720p; fast bills $0.0112/1000 tokens.
    expect(
      est("bytedance/seedance-2.0/fast/image-to-video", {
        prompt: "p",
        image_url: "u",
        duration: "10",
      }).usd
    ).toBeCloseTo(2.4192, 10);

    // 480p → 9720 tokens/s.
    expect(
      est("bytedance/seedance-2.0/fast/text-to-video", {
        prompt: "p",
        duration: "10",
        resolution: "480p",
      }).usd
    ).toBeCloseTo(1.08864, 10);

    // Reference-to-video with video inputs bills at ×0.6.
    expect(
      est("bytedance/seedance-2.0/reference-to-video", {
        prompt: "p",
        video_urls: ["u"],
        duration: "5",
        resolution: "720p",
      }).usd
    ).toBeCloseTo(0.9072, 10);

    // The fast reference-to-video twin: $0.24192/s × 0.6 with video inputs.
    expect(
      est("bytedance/seedance-2.0/fast/reference-to-video", {
        prompt: "p",
        video_urls: ["u"],
        duration: "5",
        resolution: "720p",
      }).usd
    ).toBeCloseTo(0.72576, 10);

    // Image references only: full price.
    expect(
      est("bytedance/seedance-2.0/reference-to-video", {
        prompt: "p",
        image_urls: ["u"],
        duration: "5",
        resolution: "720p",
      }).usd
    ).toBeCloseTo(1.512, 10);
  });

  it("warns instead of guessing when seconds are not derivable", () => {
    // Seedance duration defaults to "auto" — model-chosen output length,
    // no billed default to assume, whether omitted or explicit.
    for (const payload of [
      { prompt: "p" },
      { prompt: "p", duration: "auto" },
    ]) {
      const res = est("bytedance/seedance-2.0/text-to-video", payload);
      expect(res.usd).toBe(0);
      expect(res.warnings.join(" ")).toMatch(/could not derive units/);
    }

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
  ];

  it("covers every REQ-002 endpoint statically or on the dynamic list", () => {
    const dynamic: readonly string[] = FAL_DYNAMIC_PRICING_ENDPOINTS;
    expect(REQ_002_ENDPOINTS).toHaveLength(15);
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
    // Edit folds fal's stated $0.002 image-input component into the rate.
    expect(estimate("xai/grok-imagine-image/edit").usd).toBe(0.022);
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
    // 2048*2048 = 4.19 MP, rounded up to 5 whole megapixels
    expect(hunyuan.usd).toBeCloseTo(0.45, 10);
    expect(hunyuan.breakdown).toEqual({
      units: 5,
      unit: "megapixels",
      perUnitUsd: 0.09,
    });

    const qwen = estimate("fal-ai/qwen-image-edit", {
      image_size: "square_hd",
      num_images: 2,
    });
    // 1024x1024 = 1.049 MP, rounded up to 2 MP per image.
    expect(qwen.usd).toBeCloseTo(0.12, 10);
    expect(qwen.breakdown.units).toBe(4);
  });

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

  it("keeps every dynamic-priced endpoint out of both registries", () => {
    // blackforestlabs/flux-video-upscale depends on delivered output metadata;
    // google/nano-banana-2-lite and google/nano-banana-lite/edit are
    // token-metered without a published tokens-per-image constant. All three
    // therefore use fal's pricing-estimate API.
    expect(FAL_DYNAMIC_PRICING_ENDPOINTS).toEqual([
      "blackforestlabs/flux-video-upscale",
      "google/nano-banana-2-lite",
      "google/nano-banana-lite/edit",
    ]);
    for (const endpoint of FAL_DYNAMIC_PRICING_ENDPOINTS) {
      expect(falPricing[endpoint], endpoint).toBeUndefined();
      expect(
        (MODEL_SLUGS.fal as Record<string, string>)[endpoint],
        endpoint
      ).toBeUndefined();
      const result = estimate(endpoint, { prompt: "a cat" });
      expect(result.usd).toBe(0);
      expect(result.warnings).toContain(
        `model '${endpoint}' not found in pricing table for provider 'fal'`
      );
    }
  });
});
