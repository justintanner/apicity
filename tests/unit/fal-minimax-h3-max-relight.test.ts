import { describe, expect, expectTypeOf, it, vi } from "vitest";
import { z } from "zod";
import {
  createFal,
  type FalMinimaxH3MaxRelightParsedRequest,
  type FalMinimaxH3MaxRelightRequest,
  type FalMinimaxH3MaxRelightRequestInput,
  type FalMinimaxH3MaxRelightResponse,
  type FalRunMinimaxH3MaxNamespace,
} from "@apicity/fal";
import {
  FalMinimaxH3MaxRelightRequestSchema as schema,
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

// Pinned against the live queue OpenAPI read on 2026-10-15
// (sha256 64357740e7d598378b8e14a81afc273e34c1456f9a2da4974a758e9460eeff2e)
// and the free 422 probes of the same day.
const endpoint = "minimax/h3-max/relight";
// The recorded call. The integration test sends tests/fixtures/seedance-ref.mp4
// and tests/fixtures/studio-bg.jpg as data URLs; short URLs stand in here.
const recorded = {
  video_url: "https://example.com/seedance-ref.mp4",
  reference_image_url: "https://example.com/studio-bg.jpg",
  resolution: "480P",
  aspect_ratio: "adaptive",
} satisfies FalMinimaxH3MaxRelightRequest;

function accepts(body: Record<string, unknown>): boolean {
  return schema.safeParse({ ...recorded, ...body }).success;
}

function jsonResponse(body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}

describe("MiniMax H3 Max relight contract", () => {
  it("exposes the leaf on both run aliases and the queue registry", () => {
    const provider = createFal({ apiKey: "test-key" });
    const leaf = provider.run.minimax.h3Max.relight;
    expect(leaf).toBe(provider.post.run.minimax.h3Max.relight);
    expect(provider.run.minimax.h3Max).toHaveProperty("relight", leaf);
    expect(leaf.schema).toBe(schema);
    expect(FAL_ENDPOINT_REQUEST_SCHEMAS[endpoint]).toBe(schema);
    expectTypeOf(leaf).toEqualTypeOf<FalRunMinimaxH3MaxNamespace["relight"]>();
    expectTypeOf(leaf)
      .parameter(0)
      .toEqualTypeOf<FalMinimaxH3MaxRelightRequest>();
    expectTypeOf(
      leaf
    ).returns.resolves.toEqualTypeOf<FalMinimaxH3MaxRelightResponse>();
    expectTypeOf<FalMinimaxH3MaxRelightRequest>().toEqualTypeOf<
      z.input<typeof schema>
    >();
    expectTypeOf<FalMinimaxH3MaxRelightRequestInput>().toEqualTypeOf<FalMinimaxH3MaxRelightRequest>();
    expectTypeOf<FalMinimaxH3MaxRelightParsedRequest>().toEqualTypeOf<
      z.output<typeof schema>
    >();
    expectTypeOf<FalMinimaxH3MaxRelightResponse>().toEqualTypeOf<{
      video: {
        url: string;
        content_type?: string | null;
        file_name?: string | null;
        file_size?: number | null;
      };
      seed: number;
      timings?: Record<string, number> | null;
    }>();
  });

  it("posts the body unchanged to fal.run with the key header", async () => {
    const mockFetch = vi.fn().mockResolvedValue(
      jsonResponse({
        video: { url: "https://example.com/relit.mp4" },
        seed: 7,
        timings: { inference: 12.5 },
      })
    );
    const provider = createFal({
      apiKey: "fal-test-key",
      fetch: mockFetch as unknown as typeof fetch,
    });
    const result = await provider.run.minimax.h3Max.relight(recorded);
    expect(result.video.url).toBe("https://example.com/relit.mp4");
    expect(result.seed).toBe(7);
    expect(result.timings).toEqual({ inference: 12.5 });
    expect(mockFetch).toHaveBeenCalledTimes(1);
    const [url, init] = mockFetch.mock.calls[0] as [
      RequestInfo | URL,
      RequestInit,
    ];
    expect(String(url)).toBe("https://fal.run/minimax/h3-max/relight");
    expect(init.method).toBe("POST");
    expect(init.headers).toMatchObject({
      Authorization: "Key fal-test-key",
      "Content-Type": "application/json",
    });
    expect(JSON.parse(String(init.body))).toEqual(recorded);
  });

  it("requires both URLs and fills the documented defaults", () => {
    expect(Object.keys(schema.shape)).toEqual([
      "video_url",
      "reference_image_url",
      "resolution",
      "aspect_ratio",
      "seed",
      "enable_safety_checker",
      "sync_mode",
    ]);
    const urls = {
      video_url: recorded.video_url,
      reference_image_url: recorded.reference_image_url,
    };
    expect(schema.parse(urls)).toEqual({
      ...urls,
      resolution: "768P",
      aspect_ratio: "16:9",
      enable_safety_checker: true,
      sync_mode: false,
    });
    // fal's validator answered a body without them with one "missing" error
    // for each URL (free 422 probe, 2026-10-15).
    const missing = schema.safeParse({});
    expect(missing.success).toBe(false);
    expect(missing.error?.issues.map((issue) => issue.path)).toEqual([
      ["video_url"],
      ["reference_image_url"],
    ]);
  });

  it("refuses undocumented fields, as the strict upstream input does", () => {
    // fal's validator answered an unknown field with extra_forbidden on
    // 2026-10-15; the OpenAPI sets additionalProperties to false.
    expect(accepts({ unknown_field: true })).toBe(false);
  });

  it.each(["video_url", "reference_image_url"])(
    "takes %s as a non-empty string",
    (field) => {
      // fal's validator refused "" and passed "   " on 2026-10-15.
      for (const value of ["   ", "https://example.com/a", "data:x"])
        expect(accepts({ [field]: value })).toBe(true);
      for (const value of ["", null, 1, []])
        expect(accepts({ [field]: value })).toBe(false);
    }
  );

  it("accepts only the documented resolutions, case-sensitively", () => {
    for (const resolution of ["480P", "768P", "1080P", "2K"])
      expect(accepts({ resolution })).toBe(true);
    // "1440P" and "480p" are the values fal's validator refused on 2026-10-15.
    for (const resolution of ["1440P", "480p", "4K", null])
      expect(accepts({ resolution })).toBe(false);
  });

  it("accepts only the documented aspect ratios", () => {
    for (const ratio of [
      "adaptive",
      "21:9",
      "16:9",
      "4:3",
      "1:1",
      "3:4",
      "9:16",
    ])
      expect(accepts({ aspect_ratio: ratio })).toBe(true);
    // "2:1" and "auto" are the values fal's validator refused on 2026-10-15.
    for (const ratio of ["2:1", "auto", "", null])
      expect(accepts({ aspect_ratio: ratio })).toBe(false);
  });

  it("takes an integer or null seed", () => {
    for (const seed of [0, 42, null]) expect(accepts({ seed })).toBe(true);
    expect(schema.parse(recorded).seed).toBeUndefined();
    for (const seed of [1.5, "42", {}]) expect(accepts({ seed })).toBe(false);
  });

  it.each(["enable_safety_checker", "sync_mode"])(
    "takes %s as a boolean",
    (field) => {
      for (const value of [true, false])
        expect(accepts({ [field]: value })).toBe(true);
      for (const value of ["true", 1, null, {}])
        expect(accepts({ [field]: value })).toBe(false);
    }
  );

  it("prices the recorded call from its generated length", () => {
    // The 4 s, 96-frame source came back as 90 frames (3.75 s) and billed
    // 3.75 units of $0.05 at 480P.
    const estimate = computeEstimate({
      provider: "fal",
      endpoint,
      payload: recorded,
      costHints: { durationSeconds: 3.75 },
    });
    expect(estimate.usd).toBeCloseTo(0.1875, 10);
    expect(estimate.warnings).toEqual([]);
  });

  it.each([
    ["480P", 0.05],
    ["768P", 0.08],
    ["1080P", 0.16],
    ["2K", 0.32],
  ])("bills %s at $%s per generated second", (resolution, rate) => {
    const estimate = computeEstimate({
      provider: "fal",
      endpoint,
      payload: { ...recorded, resolution },
      costHints: { durationSeconds: 5 },
    });
    expect(estimate.usd).toBeCloseTo(rate * 5, 10);
    expect(estimate.warnings).toEqual([]);
  });

  it("prices the default 768P", () => {
    expect(
      computeEstimate({
        provider: "fal",
        endpoint,
        payload: {
          video_url: recorded.video_url,
          reference_image_url: recorded.reference_image_url,
        },
        costHints: { durationSeconds: 5 },
      }).usd
    ).toBeCloseTo(0.4, 10);
  });

  it("requires a duration hint instead of guessing from the URL", () => {
    const estimate = computeEstimate({
      provider: "fal",
      endpoint,
      payload: recorded,
    });
    expect(estimate.usd).toBe(0);
    expect(estimate.warnings.join(" ")).toContain("costHints.durationSeconds");
  });

  it("is statically priced, with a slug and a display name", () => {
    expect(FAL_DYNAMIC_PRICING_ENDPOINTS).not.toContain(endpoint);
    expect(falPricing[endpoint]?.source).toEqual({
      url: "https://fal.ai/models/minimax/h3-max/relight",
      asOf: "2026-10-15",
    });
    expect((MODEL_SLUGS.fal as Record<string, string>)[endpoint]).toBe("h3mrl");
    expect((MODEL_DISPLAY.fal as Record<string, string>)[endpoint]).toBe(
      "H3 Max Relight"
    );
  });
});
