import { describe, expect, it, vi } from "vitest";

import { createFal } from "../../packages/provider/fal/src/fal";
import { computeEstimate } from "../../packages/provider/cost/src/compute";
import { PRICING } from "../../packages/provider/cost/src/pricing/index";
import { FAL_DYNAMIC_PRICED_ENDPOINTS } from "../../packages/provider/cost/src/pricing/fal";
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

  it("keeps dynamic-priced endpoints out of both registries", () => {
    expect(FAL_DYNAMIC_PRICED_ENDPOINTS).toContain(
      "xai/grok-imagine-video/edit-video"
    );
    for (const endpoint of FAL_DYNAMIC_PRICED_ENDPOINTS) {
      expect(PRICING.fal[endpoint], endpoint).toBeUndefined();
      expect(
        (MODEL_SLUGS.fal as Record<string, string>)[endpoint],
        endpoint
      ).toBeUndefined();
      const res = est(endpoint, { prompt: "p", video_url: "u" });
      expect(res.usd).toBe(0);
      expect(res.warnings.join(" ")).toMatch(/not found in pricing table/);
    }
  });
});
